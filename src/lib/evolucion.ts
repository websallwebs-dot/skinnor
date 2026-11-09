import { API_BASE } from '@/lib/api';

export interface EvolucionLesion {
  id: number;
  nombre: string;
  zona: string;
  ubicacion?: string | null;
  tamaño?: string | null;
  colores?: string[] | string | null;
  sintomas?: string[] | string | null;
  creado_en: string;
}

export interface EvolucionSeguimiento {
  id: number;
  fecha: string;
  cambios: string;
  color: string;
  sintomas: string;
  tamano_mm?: number | null;
  notas?: string | null;
  fotos?: { id: number; orden: number }[];
  foto_count?: number;
}

export interface EvolucionEntry {
  key: string;
  tag: string;
  fecha: string;
  iso: string;
  diasDesdeBase: number;
  intervalosDesdeAnterior: number | null;
  imageUrl: string;
  fotoCount: number;
  tamanoMm: number | null;
  cambios: string | null;
  color: string | null;
  sintomas: string | null;
  notas: string | null;
  esBase: boolean;
}

export interface DiameterPoint {
  iso: string;
  fecha: string;
  mm: number;
  tag: string;
}

export interface CambioPoint {
  tag: string;
  fecha: string;
  pct: number;
  diametroMmEst: number | null;
}

export interface AnalisisItem {
  seguimiento_id: number;
  fecha: string;
  fuente: string;
  base?: {
    area_px?: number;
    diametro_px?: number;
    asimetria?: number;
    borde_irregularidad?: number;
    colores_detectados?: number;
    variegacion?: number;
  };
  follow?: {
    area_px?: number;
    diametro_px?: number;
    asimetria?: number;
    borde_irregularidad?: number;
    colores_detectados?: number;
    variegacion?: number;
    registro_ok?: boolean;
  };
  par?: {
    registro_inliers?: number;
    registro_confianza?: number;
    cambio_pct?: number;
    diametro_delta_px?: number;
    diametro_delta_pct?: number;
    color_nuevo_pct?: number;
  };
  diametro_mm_est?: number | null;
  heatmap_id?: number | null;
  tds_estimado?: number | null;
}

/**
 * TDS (Stolz & Kittler): 1.3*A + 0.1*B + 0.1*C + 0.1*D_mm, umbral 5.45.
 * A binario por umbral del indice de asimetria; B = irregularidad*5 (0-5);
 * C = colores detectados (1-6); D = diametro estimado en mm. Es una
 * estimacion computacional de apoyo, no un diagnostico.
 */
function calcTds(it: AnalisisItem): number | null {
  const a = it.follow?.asimetria;
  const b = it.follow?.borde_irregularidad;
  const c = it.follow?.colores_detectados;
  const d = it.diametro_mm_est;
  if (a == null || b == null || c == null || d == null) return null;
  const A = a >= 0.25 ? 1 : 0;
  const B = Math.max(0, Math.min(5, Math.round(b * 5)));
  const C = Math.max(1, Math.min(6, c));
  return Math.round((1.3 * A + 0.1 * B + 0.1 * C + 0.1 * d) * 100) / 100;
}

export interface LesionEvolucion {
  lesion: EvolucionLesion;
  entries: EvolucionEntry[];
  diameterSeries: DiameterPoint[];
  analisis?: AnalisisItem[];
  cambioSeries?: CambioPoint[];
  stats: {
    controles: number;
    reportesCambios: number;
    reportesColor: number;
    reportesSintomas: number;
    diasUltimoControl: number | null;
    intervaloPromedioDias: number | null;
    primeraFecha: string;
    ultimaFecha: string;
  };
  abcd: {
    A: { estado: 'pendiente' | 'dato'; detalle: string };
    B: { estado: 'pendiente' | 'dato'; detalle: string };
    C: { estado: 'dato'; detalle: string };
    D: { estado: 'dato' | 'parcial'; detalle: string; actualMm: number | null; basalMm: number | null };
    E: { estado: 'dato'; detalle: string };
  };
}

function parseMm(v?: string | number | null): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0.5 && v <= 50 ? v : null;
  const m = String(v).match(/\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(',', '.'));
  return Number.isFinite(n) && n >= 0.5 && n <= 50 ? n : null;
}

function parseList(v?: string[] | string | null): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const p = JSON.parse(v);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round(Math.abs(b - a) / 86400000);
}

/**
 * Construye la evolución clínica de una lesión a partir de datos reales:
 * foto basal + cada seguimiento (con todas sus fotos), diámetros declarados,
 * reportes del paciente y cálculo de intervalos.
 */
export function buildLesionEvolucion(
  lesion: EvolucionLesion,
  seguimientos: EvolucionSeguimiento[]
): LesionEvolucion {
  const baseIso = lesion.creado_en;
  const segs = [...(seguimientos || [])].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const entries: EvolucionEntry[] = [];
  const basalMm = parseMm(lesion.tamaño);

  entries.push({
    key: `base-${lesion.id}`,
    tag: 'BASE',
    fecha: new Date(baseIso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }),
    iso: baseIso,
    diasDesdeBase: 0,
    intervalosDesdeAnterior: null,
    imageUrl: `${API_BASE}/lesiones/${lesion.id}/foto`,
    fotoCount: 1,
    tamanoMm: basalMm,
    cambios: null,
    color: null,
    sintomas: null,
    notas: 'Registro inicial de la lesión',
    esBase: true,
  });

  let anteriorIso = baseIso;
  segs.forEach((seg, idx) => {
    const tag = `T${idx + 1}`;
    const fotos = [...(seg.fotos || [])].sort((a, b) => a.orden - b.orden);
    const fotoCount = seg.foto_count ?? fotos.length;
    const primera = fotos[0]?.id;
    const imageUrl = fotoCount > 0 && primera
      ? `${API_BASE}/lesiones/${lesion.id}/seguimientos/${seg.id}/fotos/${primera}`
      : `${API_BASE}/lesiones/${lesion.id}/seguimientos/${seg.id}/foto`;

    entries.push({
      key: `seg-${seg.id}`,
      tag,
      fecha: new Date(seg.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }),
      iso: seg.fecha,
      diasDesdeBase: daysBetween(baseIso, seg.fecha),
      intervalosDesdeAnterior: daysBetween(anteriorIso, seg.fecha),
      imageUrl,
      fotoCount,
      tamanoMm: parseMm(seg.tamano_mm),
      cambios: seg.cambios,
      color: seg.color,
      sintomas: seg.sintomas,
      notas: seg.notas || null,
      esBase: false,
    });
    anteriorIso = seg.fecha;
  });

  // Serie de diámetro: basal + seguimientos con medición
  const diameterSeries: DiameterPoint[] = [];
  if (basalMm !== null) {
    diameterSeries.push({
      iso: baseIso,
      fecha: entries[0].fecha,
      mm: basalMm,
      tag: 'BASE',
    });
  }
  segs.forEach((seg, idx) => {
    const mm = parseMm(seg.tamano_mm);
    if (mm !== null) {
      diameterSeries.push({
        iso: seg.fecha,
        fecha: new Date(seg.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
        mm,
        tag: `T${idx + 1}`,
      });
    }
  });

  const intervalos = entries.slice(1).map((e) => e.intervalosDesdeAnterior).filter((d): d is number => d !== null);
  const reportesCambios = segs.filter((s) => s.cambios === 'si').length;
  const reportesColor = segs.filter((s) => s.color === 'si').length;
  const reportesSintomas = segs.filter((s) => s.sintomas === 'si').length;
  const ultimaIso = segs.length ? segs[segs.length - 1].fecha : baseIso;

  const colores = parseList(lesion.colores);
  const ultimoMm = [...diameterSeries].reverse()[0]?.mm ?? null;
  const deltaMm = basalMm !== null && ultimoMm !== null ? ultimoMm - basalMm : null;

  const abcd = {
    A: {
      estado: 'pendiente' as const,
      detalle: 'Requiere análisis de imagen (registro de control en desarrollo)',
    },
    B: {
      estado: 'pendiente' as const,
      detalle: 'Requiere análisis de imagen (registro de control en desarrollo)',
    },
    C: {
      estado: 'dato' as const,
      detalle: colores.length
        ? `${colores.length} color${colores.length > 1 ? 'es' : ''} registrado${colores.length > 1 ? 's' : ''}: ${colores.join(', ')}`
        : 'Sin colores registrados en la ficha inicial',
    },
    D: {
      estado: (basalMm !== null && ultimoMm !== null ? 'dato' : basalMm !== null || ultimoMm !== null ? 'parcial' : 'dato') as 'dato' | 'parcial',
      detalle:
        basalMm !== null && ultimoMm !== null
          ? `Basal ${basalMm} mm → actual ${ultimoMm} mm (${deltaMm! >= 0 ? '+' : ''}${deltaMm!.toFixed(1)} mm)`
          : ultimoMm !== null
          ? `Última medición: ${ultimoMm} mm (sin basal para comparar)`
          : basalMm !== null
          ? `Basal: ${basalMm} mm (sin mediciones posteriores)`
          : 'Sin mediciones de diámetro registradas',
      actualMm: ultimoMm,
      basalMm,
    },
    E: {
      estado: 'dato' as const,
      detalle:
        segs.length === 0
          ? 'Sin controles registrados aún'
          : `${segs.length} control${segs.length > 1 ? 'es' : ''}: ${reportesCambios} con cambios, ${reportesColor} con cambio de color, ${reportesSintomas} con síntomas`,
    },
  };

  return {
    lesion,
    entries,
    diameterSeries,
    analisis: [],
    cambioSeries: [],
    stats: {
      controles: segs.length,
      reportesCambios,
      reportesColor,
      reportesSintomas,
      diasUltimoControl: daysBetween(new Date().toISOString(), ultimaIso),
      intervaloPromedioDias: intervalos.length
        ? Math.round(intervalos.reduce((a, b) => a + b, 0) / intervalos.length)
        : null,
      primeraFecha: entries[0].fecha,
      ultimaFecha: new Date(ultimaIso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    abcd,
  };
}

const fmtIdx = (v?: number) => (v === undefined || v === null ? '—' : v.toFixed(2));

/**
 * Incorpora las metricas computadas por el servicio de analisis de imagen
 * (registro + differencing + ABCD) a la evolucion. Solo usa datos reales
 * devueltos por /analyze_pair; lo que falte queda en su estado honesto.
 */
export function mergeAnalisis(ev: LesionEvolucion, items: AnalisisItem[]): LesionEvolucion {
  if (!items || items.length === 0) return { ...ev, analisis: items || [] };

  const ordenados = [...items].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const ultimo = ordenados[ordenados.length - 1];
  const tagDe = (segId: number) => {
    const i = ev.entries.findIndex((e) => e.key === `seg-${segId}`);
    return i >= 0 ? ev.entries[i].tag : `T${segId}`;
  };

  const cambioSeries: CambioPoint[] = ordenados
    .filter((it) => it.par?.cambio_pct !== undefined)
    .map((it) => ({
      tag: tagDe(it.seguimiento_id),
      fecha: new Date(it.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
      pct: it.par!.cambio_pct!,
      diametroMmEst: it.diametro_mm_est ?? null,
    }));

  const conAsimetria = ordenados.filter((i) => i.follow?.asimetria !== undefined);
  const conBorde = ordenados.filter((i) => i.follow?.borde_irregularidad !== undefined);
  const maxColorNuevo = Math.max(...ordenados.map((i) => i.par?.color_nuevo_pct ?? 0));
  const coloresDet = ultimo.follow?.colores_detectados;
  const varieg = ultimo.follow?.variegacion;
  const confMedia =
    ordenados.reduce((a, i) => a + (i.par?.registro_confianza ?? 0), 0) / ordenados.length;

  const abcd = { ...ev.abcd };
  if (conAsimetria.length) {
    const v = conAsimetria[conAsimetria.length - 1].follow!.asimetria!;
    abcd.A = {
      estado: 'dato',
      detalle: `Índice de asimetría ${fmtIdx(v)} en ${tagDe(conAsimetria[conAsimetria.length - 1].seguimiento_id)} (0 = simétrico, 1 = totalmente asimétrico). Promedio serie: ${fmtIdx(conAsimetria.reduce((a, i) => a + i.follow!.asimetria!, 0) / conAsimetria.length)}.`,
    };
  }
  if (conBorde.length) {
    const v = conBorde[conBorde.length - 1].follow!.borde_irregularidad!;
    abcd.B = {
      estado: 'dato',
      detalle: `Índice de irregularidad de borde ${fmtIdx(v)} en ${tagDe(conBorde[conBorde.length - 1].seguimiento_id)} (0 = borde regular, 1 = muy irregular). Promedio serie: ${fmtIdx(conBorde.reduce((a, i) => a + i.follow!.borde_irregularidad!, 0) / conBorde.length)}.`,
    };
  }
  if (coloresDet !== undefined || varieg !== undefined || maxColorNuevo > 0) {
    const partes: string[] = [];
    if (coloresDet !== undefined) partes.push(`${coloresDet} color${coloresDet === 1 ? '' : 'es'} dominante${coloresDet === 1 ? '' : 's'} en la lesión (último control)`);
    if (varieg !== undefined) partes.push(`variegación cromática ${varieg}`);
    if (maxColorNuevo > 0) partes.push(`hasta ${maxColorNuevo}% de píxeles con color nuevo en algún control`);
    abcd.C = { estado: 'dato', detalle: partes.join('; ') + '.' };
  }
  const ultimoEst = [...ordenados].reverse().find((i) => i.diametro_mm_est != null)?.diametro_mm_est;
  if (ultimoEst != null) {
    abcd.D = {
      ...abcd.D,
      detalle: `${abcd.D.detalle} Estimación por imagen (último control): ~${ultimoEst} mm.`,
    };
  }
  const analisisConTds = ordenados.map((it) => ({ ...it, tds_estimado: calcTds(it) }));
  const tdsVals = analisisConTds.map((i) => i.tds_estimado).filter((v): v is number => v != null);
  const tdsMax = tdsVals.length ? Math.max(...tdsVals) : null;

  if (cambioSeries.length) {
    const maxC = Math.max(...cambioSeries.map((c) => c.pct));
    const enTag = cambioSeries.find((c) => c.pct === maxC)?.tag;
    const tdsTxt = tdsMax != null
      ? ` TDS estimado máximo ${tdsMax} (umbral 5.45; estimación computacional de apoyo).`
      : '';
    abcd.E = {
      estado: 'dato',
      detalle: `${ev.abcd.E.detalle} Análisis de imagen: cambio máximo ${maxC}% del área en ${enTag} (confianza de registro media ${(confMedia * 100).toFixed(0)}%).${tdsTxt}`,
    };
  }

  return { ...ev, abcd, analisis: analisisConTds, cambioSeries };
}
