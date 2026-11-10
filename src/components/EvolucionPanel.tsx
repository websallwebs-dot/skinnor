import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { LesionEvolucion, AnalisisItem } from '@/lib/evolucion';
import { mergeAnalisis } from '@/lib/evolucion';
import { lesionFotoUrl } from '@/pages/patient/usePatientLesiones';
import { API_BASE } from '@/lib/api';

const ZONA_LABELS: Record<string, string> = {
  cabeza: 'Cabeza y Rostro',
  cuello: 'Cuello',
  torso_frente: 'Torso (Frente)',
  espalda: 'Espalda',
  brazo_izq: 'Brazo Izquierdo',
  brazo_der: 'Brazo Derecho',
  pierna_izq: 'Pierna Izquierda',
  pierna_der: 'Pierna Derecha',
  manos_pies: 'Manos o Pies',
};

function siNo(v: string | null): string {
  if (v === 'si') return 'Sí';
  if (v === 'no') return 'No';
  return '—';
}

function AbcdCell({ letra, titulo, estado, detalle }: {
  letra: string; titulo: string; estado: 'dato' | 'parcial' | 'pendiente'; detalle: string;
}) {
  return (
    <div className="border border-[#d8e0dc] rounded-md p-3 bg-white">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-sm font-bold text-[#0c1512]">{letra}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5f7b6f]">{titulo}</span>
        {estado === 'pendiente' && (
          <span className="ml-auto text-[9px] font-medium uppercase tracking-wide text-[#8a5a0a]">Pendiente</span>
        )}
        {estado === 'parcial' && (
          <span className="ml-auto text-[9px] font-medium uppercase tracking-wide text-[#8a5a0a]">Parcial</span>
        )}
      </div>
      <p className="text-xs text-[#3f4f49] leading-snug">{detalle}</p>
    </div>
  );
}

interface AnalisisResponse {
  items: AnalisisItem[];
  basal_mm: number | null;
  errores?: string[];
}

export default function EvolucionPanel({
  evoluciones,
  detalleBase,
}: {
  evoluciones: LesionEvolucion[];
  detalleBase?: string;
}) {
  const [analisisMap, setAnalisisMap] = useState<Record<number, AnalisisResponse>>({});
  const [analisisLoading, setAnalisisLoading] = useState<Record<number, boolean>>({});
  const [vizSel, setVizSel] = useState<{ id: number; tag: string } | null>(null);

  const lesionIds = useMemo(() => evoluciones.map((e) => e.lesion.id).join(','), [evoluciones]);

  useEffect(() => {
    let cancelled = false;
    for (const id of lesionIds.split(',').filter(Boolean).map(Number)) {
      if (analisisMap[id]) continue;
      setAnalisisLoading((m) => ({ ...m, [id]: true }));
      fetch(`${API_BASE}/lesiones/${id}/evolucion/analisis`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data: AnalisisResponse) => {
          if (!cancelled) setAnalisisMap((m) => ({ ...m, [id]: data }));
        })
        .catch(() => {
          if (!cancelled) setAnalisisMap((m) => ({ ...m, [id]: { items: [], basal_mm: null } }));
        })
        .finally(() => {
          if (!cancelled) setAnalisisLoading((m) => ({ ...m, [id]: false }));
        });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesionIds]);

  return (
    <div className="space-y-10">
      {evoluciones.map((evRaw) => {
        const analisisResp = analisisMap[evRaw.lesion.id];
        const ev = analisisResp?.items?.length
          ? mergeAnalisis(evRaw, analisisResp.items)
          : evRaw;
        const { lesion, entries, diameterSeries, stats, abcd } = ev;
        const chartData = diameterSeries.map((p) => ({ name: p.fecha, mm: p.mm, tag: p.tag }));
        const cambioData = (ev.cambioSeries || []).map((c) => ({ name: c.fecha, pct: c.pct, tag: c.tag }));
        const hayCambios = stats.reportesCambios > 0 || stats.reportesColor > 0 || stats.reportesSintomas > 0;

        // Series de indices computados por control (solo puntos reales)
        const idxSeries = (ev.analisis || []).map((it) => {
          const tag = ev.entries.find((e) => e.key === `seg-${it.seguimiento_id}`)?.tag ?? '';
          const fecha = new Date(it.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
          return {
            name: fecha, tag,
            asimetria: it.follow?.asimetria ?? null,
            borde: it.follow?.borde_irregularidad ?? null,
            colores: it.follow?.colores_detectados ?? null,
            variegacion: it.follow?.variegacion ?? null,
            colorNuevo: it.par?.color_nuevo_pct ?? null,
            tds: it.tds_estimado ?? null,
          };
        });
        const idxCharts = [
          { key: 'asimetria' as const, label: 'A · Asimetría', domain: [0, 1] as [number, number], ref: null as number | null, hint: '0 = simétrico' },
          { key: 'borde' as const, label: 'B · Borde', domain: [0, 1] as [number, number], ref: null, hint: '0 = regular' },
          { key: 'colores' as const, label: 'C · Colores detectados', domain: [0, 'auto'] as [number, number | 'auto'], ref: null, hint: 'clusters dominantes' },
          { key: 'variegacion' as const, label: 'C · Variegación', domain: [0, 'auto'] as [number, number | 'auto'], ref: null, hint: 'desvío de tono Lab' },
          { key: 'colorNuevo' as const, label: 'C · Color nuevo', domain: [0, 'auto'] as [number, number | 'auto'], ref: null, hint: '% píxeles vs basal' },
          { key: 'tds' as const, label: 'TDS estimado', domain: [0, 'auto'] as [number, number | 'auto'], ref: 5.45, hint: 'umbral 5.45' },
        ].map((c) => ({
          ...c,
          data: idxSeries
            .filter((p) => p[c.key] !== null)
            .map((p) => ({ name: p.name, tag: p.tag, v: p[c.key] as number })),
        })).filter((c) => c.data.length >= 1);

        return (
          <section key={lesion.id}>
            {/* Encabezado de lesión */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-md bg-[#e9efec] border border-[#d8e0dc] overflow-hidden shrink-0">
                  <img
                    src={lesionFotoUrl(lesion.id)}
                    alt={lesion.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-[#0c1512] truncate">{lesion.nombre}</h2>
                  <p className="text-xs text-[#5f7b6f] truncate">
                    {ZONA_LABELS[lesion.zona] || lesion.zona}
                    {lesion.ubicacion ? ` • ${lesion.ubicacion}` : ''}
                    {' • '}{stats.controles} control{stats.controles === 1 ? '' : 'es'}
                    {stats.diasUltimoControl !== null && ` • último hace ${stats.diasUltimoControl} días`}
                  </p>
                </div>
              </div>
              {detalleBase && (
                <Link
                  to={`${detalleBase}/${lesion.id}`}
                  className="text-sm font-medium text-[#0c1512] hover:underline flex items-center gap-1 shrink-0"
                >
                  Ver detalle <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {/* Serie fotográfica cronológica */}
            <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-[#d8e0dc] bg-[#fafcfa] flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                  Serie fotográfica cronológica
                </h3>
                <span className="text-[11px] text-[#5f7b6f]">
                  {stats.primeraFecha} → {stats.ultimaFecha}
                  {stats.intervaloPromedioDias !== null && ` • intervalo prom. ${stats.intervaloPromedioDias} días`}
                </span>
              </div>
              <div className="p-5 overflow-x-auto">
                <div className="flex gap-4 min-w-max pb-1">
                  {entries.map((e, i) => (
                    <div key={e.key} className="w-40 shrink-0">
                      <div className="relative aspect-square w-full rounded-md overflow-hidden border border-[#d8e0dc] bg-[#110d0a]">
                        <img src={e.imageUrl} alt={`${lesion.nombre} ${e.tag}`} className="w-full h-full object-cover" loading="lazy" />
                        <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-white/90 text-[#0c1512]">
                          {e.tag}
                        </span>
                        {e.fotoCount > 1 && (
                          <span className="absolute bottom-1.5 right-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-[#0c1512]/80 text-white">
                            {e.fotoCount} fotos
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-xs font-semibold text-[#0c1512]">{e.fecha}</div>
                        {!e.esBase && e.diasDesdeBase > 0 && (
                          <div className="text-[10px] text-[#5f7b6f]">día {e.diasDesdeBase}</div>
                        )}
                        {e.esBase && <div className="text-[10px] text-[#5f7b6f]">basal</div>}
                        {e.cambios === 'si' && (
                          <div className="mt-1 text-[10px] font-semibold text-[#8a3b28]">Cambio reportado</div>
                        )}
                        {e.cambios === 'no' && (
                          <div className="mt-1 text-[10px] font-medium text-[#2e7d4f]">Sin cambios</div>
                        )}
                      </div>
                      {i < entries.length - 1 && (
                        <div className="hidden" aria-hidden />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid lg:grid-cols-2 gap-4 mb-4">
              {/* Diámetro en el tiempo */}
              <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
                <div className="px-5 py-3 border-b border-[#d8e0dc]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                    Diámetro en el tiempo
                  </h3>
                </div>
                <CardContent className="p-4">
                  {chartData.length >= 2 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                          <CartesianGrid stroke="#e7ece9" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5f7b6f' }} tickLine={false} axisLine={{ stroke: '#d8e0dc' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#5f7b6f' }} tickLine={false} axisLine={false} unit=" mm" />
                          <Tooltip
                            contentStyle={{ fontSize: 12, border: '1px solid #d8e0dc', borderRadius: 8, background: '#fff' }}
                            formatter={(v: any) => [`${v} mm`, 'Diámetro']}
                            labelFormatter={(l, p: any) => `${l} • ${p?.[0]?.payload?.tag ?? ''}`}
                          />
                          <ReferenceLine y={6} stroke="#c77a0b" strokeDasharray="4 4" label={{ value: '6 mm', position: 'insideTopRight', fontSize: 10, fill: '#c77a0b' }} />
                          <Line type="monotone" dataKey="mm" stroke="#0c1512" strokeWidth={1.5} dot={{ r: 3, fill: '#0c1512', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-center px-4">
                      <p className="text-sm font-medium text-[#0c1512]">
                        {chartData.length === 1 ? 'Una sola medición registrada' : 'Sin mediciones de diámetro'}
                      </p>
                      <p className="text-xs text-[#5f7b6f] mt-1 max-w-xs">
                        {chartData.length === 1
                          ? `Basal: ${chartData[0].mm} mm. Registra el diámetro en el próximo control para ver la curva de crecimiento.`
                          : 'El paciente puede ingresar el diámetro estimado en cada registro para construir la curva de evolución.'}
                      </p>
                    </div>
                  )}
                  {chartData.length >= 2 && abcd.D.actualMm !== null && abcd.D.basalMm !== null && (
                    <p className="text-[11px] text-[#5f7b6f] mt-2">
                      Variación total: {abcd.D.actualMm - abcd.D.basalMm >= 0 ? '+' : ''}{(abcd.D.actualMm - abcd.D.basalMm).toFixed(1)} mm desde el registro basal.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Evaluación ABCDE */}
              <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
                <div className="px-5 py-3 border-b border-[#d8e0dc]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                    Evaluación ABCDE
                  </h3>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <AbcdCell letra="A" titulo="Asimetría" estado={abcd.A.estado} detalle={abcd.A.detalle} />
                    <AbcdCell letra="B" titulo="Bordes" estado={abcd.B.estado} detalle={abcd.B.detalle} />
                    <AbcdCell letra="C" titulo="Color" estado={abcd.C.estado} detalle={abcd.C.detalle} />
                    <AbcdCell letra="D" titulo="Diámetro" estado={abcd.D.estado} detalle={abcd.D.detalle} />
                  </div>
                  <div className="mt-2">
                    <AbcdCell letra="E" titulo="Evolución" estado={abcd.E.estado} detalle={abcd.E.detalle} />
                  </div>
                  {hayCambios && (
                    <p className="text-[11px] text-[#8a3b28] mt-3 leading-snug">
                      Se registraron cambios reportados por el paciente. La evaluación de estos cambios corresponde al profesional tratante.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Índice de cambio + análisis de imagen */}
            {(cambioData.length > 0 || analisisLoading[lesion.id] || analisisResp?.errores) && (
              <div className="grid lg:grid-cols-2 gap-4 mb-4">
                {cambioData.length > 0 && (
                  <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
                    <div className="px-5 py-3 border-b border-[#d8e0dc]">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                        Índice de cambio por control
                      </h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={cambioData} margin={{ top: 8, right: 12, bottom: 0, left: -14 }}>
                            <CartesianGrid stroke="#e7ece9" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5f7b6f' }} tickLine={false} axisLine={{ stroke: '#d8e0dc' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#5f7b6f' }} tickLine={false} axisLine={false} unit="%" domain={[0, 'auto']} />
                            <Tooltip
                              contentStyle={{ fontSize: 12, border: '1px solid #d8e0dc', borderRadius: 8, background: '#fff' }}
                              formatter={(v: any) => [`${v}%`, 'Área modificada']}
                              labelFormatter={(l, p: any) => `${l} • ${p?.[0]?.payload?.tag ?? ''}`}
                            />
                            <Line type="monotone" dataKey="pct" stroke="#0c1512" strokeWidth={1.5} dot={{ r: 3, fill: '#0c1512', strokeWidth: 0 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[11px] text-[#5f7b6f] mt-2">
                        Porcentaje del área de la lesión que difiere del registro basal tras alinear las imágenes (registro por features + RANSAC). No es una probabilidad diagnóstica.
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
                  <div className="px-5 py-3 border-b border-[#d8e0dc] flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                      Métricas de imagen por control
                    </h3>
                    {analisisLoading[lesion.id] && (
                      <span className="text-[11px] text-[#5f7b6f]">Analizando...</span>
                    )}
                  </div>
                  <CardContent className="p-0">
                    {analisisResp?.errores?.length ? (
                      <p className="px-5 py-3 text-[11px] text-[#8a3b28]">
                        Análisis no disponible para algunos controles: {analisisResp.errores[0]}
                      </p>
                    ) : null}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-[#d8e0dc] text-left text-[#5f7b6f]">
                            <th className="px-5 py-2 font-medium">Control</th>
                            <th className="px-3 py-2 font-medium">Δ diámetro</th>
                            <th className="px-3 py-2 font-medium">Área cambio</th>
                            <th className="px-3 py-2 font-medium">Color nuevo</th>
                            <th className="px-3 py-2 font-medium">Conf. registro</th>
                            <th className="px-3 py-2 font-medium">Asimetría</th>
                            <th className="px-3 py-2 font-medium">Borde</th>
                            <th className="px-3 py-2 font-medium">Colores</th>
                            <th className="px-3 py-2 font-medium">TDS est.</th>
                            <th className="px-5 py-2 font-medium">Diff</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef1ef]">
                          {(ev.analisis || []).map((it) => {
                            const tag = ev.cambioSeries?.find((c) => c.pct === it.par?.cambio_pct)?.tag
                              ?? ev.entries.find((e) => e.key === `seg-${it.seguimiento_id}`)?.tag
                              ?? `#${it.seguimiento_id}`;
                            return (
                              <tr key={it.seguimiento_id} className="text-[#3f4f49]">
                                <td className="px-5 py-2 font-semibold text-[#0c1512]">{tag}</td>
                                <td className="px-3 py-2 tabular-nums">
                                  {it.par?.diametro_delta_px !== undefined
                                    ? `${it.par.diametro_delta_px > 0 ? '+' : ''}${it.par.diametro_delta_px} px${it.diametro_mm_est != null ? ` (~${it.diametro_mm_est} mm)` : ''}`
                                    : '—'}
                                </td>
                                <td className="px-3 py-2 tabular-nums">{it.par?.cambio_pct ?? '—'}%</td>
                                <td className="px-3 py-2 tabular-nums">{it.par?.color_nuevo_pct ?? '—'}%</td>
                                <td className="px-3 py-2 tabular-nums">{it.par?.registro_confianza != null ? `${Math.round(it.par.registro_confianza * 100)}%` : '—'}</td>
                                <td className="px-3 py-2 tabular-nums">{it.follow?.asimetria?.toFixed(2) ?? '—'}</td>
                                <td className="px-3 py-2 tabular-nums">{it.follow?.borde_irregularidad?.toFixed(2) ?? '—'}</td>
                                <td className="px-3 py-2 tabular-nums">{it.follow?.colores_detectados ?? '—'}</td>
                                <td className={`px-3 py-2 tabular-nums font-medium ${it.tds_estimado != null && it.tds_estimado > 5.45 ? 'text-[#8a3b28]' : ''}`}>
                                  {it.tds_estimado != null ? it.tds_estimado.toFixed(2) : '—'}
                                </td>
                                <td className="px-5 py-2">
                                  {it.heatmap_id ? (
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={`${API_BASE}/lesiones/heatmap/${it.heatmap_id}`}
                                        alt={`Mapa de diferencias ${tag}`}
                                        className="h-12 w-12 rounded-sm border border-[#d8e0dc] object-cover"
                                        loading="lazy"
                                      />
                                      <button
                                        onClick={() => setVizSel({ id: it.heatmap_id!, tag })}
                                        className="text-[10px] font-medium text-[#0c1512] border border-[#d8e0dc] rounded-sm px-1.5 py-1 hover:bg-[#f0f4f1]"
                                      >
                                        Ver
                                      </button>
                                    </div>
                                  ) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                          {(!ev.analisis || ev.analisis.length === 0) && !analisisLoading[lesion.id] && (
                            <tr>
                              <td colSpan={10} className="px-5 py-4 text-center text-[#5f7b6f]">
                                Sin análisis de imagen disponible.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Evidencia visual por control */}
            {(ev.analisis || []).some((it) => it.heatmap_id) && (
              <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white mb-4">
                <div className="px-5 py-3 border-b border-[#d8e0dc]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                    Evidencia visual del cambio
                  </h3>
                  <p className="text-[11px] text-[#5f7b6f] mt-0.5">
                    Mapa de diferencias respecto al registro basal (rojo = zona modificada) y panel de análisis por control.
                  </p>
                </div>
                <CardContent className="p-4">
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {(ev.analisis || []).filter((it) => it.heatmap_id).map((it) => {
                      const tag = ev.entries.find((e) => e.key === `seg-${it.seguimiento_id}`)?.tag ?? `T${it.seguimiento_id}`;
                      const fecha = new Date(it.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
                      return (
                        <button
                          key={it.seguimiento_id}
                          onClick={() => setVizSel({ id: it.heatmap_id!, tag })}
                          className="shrink-0 w-44 text-left group"
                        >
                          <div className="relative aspect-square w-full rounded-md overflow-hidden border border-[#d8e0dc] bg-[#fafcfa]">
                            <img
                              src={`${API_BASE}/lesiones/heatmap/${it.heatmap_id}`}
                              alt={`Mapa de diferencias ${tag}`}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                              loading="lazy"
                            />
                            <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-white/90 text-[#0c1512]">
                              {tag}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[11px] text-[#5f7b6f]">{fecha}</span>
                            <span className="text-[11px] font-medium text-[#0c1512] group-hover:underline">
                              {it.par?.cambio_pct != null ? `${it.par.cambio_pct}% cambió` : 'Ver análisis'} →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Índices ABCD computados en el tiempo */}
            {idxCharts.length > 0 && (
              <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white mb-4">
                <div className="px-5 py-3 border-b border-[#d8e0dc]">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                    Monitoreo cuantitativo de índices por control
                  </h3>
                  <p className="text-[11px] text-[#5f7b6f] mt-0.5">
                    Asimetría, bordes, colores y diámetro computados sobre las imágenes reales en cada control. Con un solo control se muestra el valor basal del índice; la tendencia aparece al acumular registros.
                  </p>
                </div>
                <CardContent className="p-4">
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {idxCharts.map((c) => {
                      const last = c.data[c.data.length - 1];
                      const isInt = c.key === 'colores';
                      const fmt = (v: number) => (isInt ? v.toFixed(0) : v.toFixed(2));
                      return (
                        <div key={c.key} className="border border-[#eef1ef] rounded-md p-3">
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5f7b6f]">{c.label}</span>
                            <span className="text-xs font-semibold text-[#0c1512] tabular-nums">
                              {fmt(last.v)}
                            </span>
                          </div>
                          <div className="text-[9px] text-[#8a978f] mb-1">{c.hint}</div>
                          <div className="h-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={c.data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                                <CartesianGrid stroke="#eef1ef" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#5f7b6f' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis domain={c.domain} tick={{ fontSize: 9, fill: '#5f7b6f' }} tickLine={false} axisLine={false} />
                                <Tooltip
                                  contentStyle={{ fontSize: 11, border: '1px solid #d8e0dc', borderRadius: 8, background: '#fff' }}
                                  formatter={(v: any) => [isInt ? v : Number(v).toFixed(2), c.label]}
                                  labelFormatter={(l, p: any) => `${l} • ${p?.[0]?.payload?.tag ?? ''}`}
                                />
                                {c.ref !== null && (
                                  <ReferenceLine y={c.ref} stroke="#c77a0b" strokeDasharray="4 4" />
                                )}
                                <Line type="monotone" dataKey="v" stroke="#0c1512" strokeWidth={1.5} dot={{ r: 2.5, fill: '#0c1512', strokeWidth: 0 }} connectNulls={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Registro de reportes */}
            <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#d8e0dc] bg-[#fafcfa]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                  Reportes del paciente
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#d8e0dc] text-left text-[#5f7b6f]">
                      <th className="px-5 py-2.5 font-medium">Control</th>
                      <th className="px-3 py-2.5 font-medium">Fecha</th>
                      <th className="px-3 py-2.5 font-medium">Días desde basal</th>
                      <th className="px-3 py-2.5 font-medium">Intervalo</th>
                      <th className="px-3 py-2.5 font-medium">Diámetro</th>
                      <th className="px-3 py-2.5 font-medium">Cambios</th>
                      <th className="px-3 py-2.5 font-medium">Color</th>
                      <th className="px-3 py-2.5 font-medium">Síntomas</th>
                      <th className="px-5 py-2.5 font-medium">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1ef]">
                    {entries.map((e) => (
                      <tr key={e.key} className="text-[#3f4f49]">
                        <td className="px-5 py-2.5 font-semibold text-[#0c1512]">{e.tag}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{e.fecha}</td>
                        <td className="px-3 py-2.5">{e.esBase ? '—' : e.diasDesdeBase}</td>
                        <td className="px-3 py-2.5">{e.intervalosDesdeAnterior !== null ? `${e.intervalosDesdeAnterior} d` : '—'}</td>
                        <td className="px-3 py-2.5 tabular-nums">{e.tamanoMm !== null ? `${e.tamanoMm} mm` : '—'}</td>
                        <td className={`px-3 py-2.5 font-medium ${e.cambios === 'si' ? 'text-[#8a3b28]' : ''}`}>{siNo(e.cambios)}</td>
                        <td className={`px-3 py-2.5 font-medium ${e.color === 'si' ? 'text-[#8a3b28]' : ''}`}>{siNo(e.color)}</td>
                        <td className={`px-3 py-2.5 font-medium ${e.sintomas === 'si' ? 'text-[#8a3b28]' : ''}`}>{siNo(e.sintomas)}</td>
                        <td className="px-5 py-2.5 max-w-[220px] truncate">{e.notas || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        );
      })}

      {/* Modal: panel de análisis visual */}
      {vizSel && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setVizSel(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0c1512]">
                Análisis de imagen — control {vizSel.tag}
              </h3>
              <button
                onClick={() => setVizSel(null)}
                className="text-xs text-[#5f7b6f] hover:text-[#0c1512]"
              >
                Cerrar
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <img
                src={`${API_BASE}/lesiones/viz/${vizSel.id}`}
                alt={`Panel de análisis ${vizSel.tag}`}
                className="w-full rounded-md border border-[#d8e0dc]"
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5f7b6f] mb-1.5">
                  Mapa de diferencias vs basal
                </p>
                <img
                  src={`${API_BASE}/lesiones/heatmap/${vizSel.id}`}
                  alt={`Mapa de diferencias ${vizSel.tag}`}
                  className="w-full rounded-md border border-[#d8e0dc]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-[11px] text-[#5f7b6f]">
              <p><span className="font-semibold text-[#0c1512]">Arriba-izq:</span> máscara de la lesión segmentada (contorno verde).</p>
              <p><span className="font-semibold text-[#0c1512]">Arriba-der:</span> eje principal con mitades teñidas — evidencia del índice de asimetría.</p>
              <p><span className="font-semibold text-[#0c1512]">Abajo-izq:</span> bordes detectados (Canny) — evidencia de la irregularidad de borde.</p>
              <p><span className="font-semibold text-[#0c1512]">Abajo-der:</span> clusters de color k-means — evidencia de la variegación cromática.</p>
            </div>
            <p className="text-[10px] text-[#5f7b6f] mt-3">
              Visualización del cálculo automático. Los índices son apoyo cuantitativo, no un diagnóstico.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
