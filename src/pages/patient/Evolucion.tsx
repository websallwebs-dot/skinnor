import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Camera, ArrowRight } from 'lucide-react';
import { usePatientLesiones, seguimientoFotoUrl, lesionFotoUrl } from './usePatientLesiones';
import { toast } from 'sonner';
import { useEffect } from 'react';

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const cambiosBadge: Record<string, string> = {
  estable: 'bg-[#d1fae5] text-[#065f46]',
  'sin cambios': 'bg-[#d1fae5] text-[#065f46]',
  leve: 'bg-[#fef3c7] text-[#92400e]',
  moderado: 'bg-[#ffedd5] text-[#9a3412]',
  marcado: 'bg-[#fee2e2] text-[#991b1b]',
  'mucho': 'bg-[#fee2e2] text-[#991b1b]',
};

function badgeClass(value: string): string {
  const key = value.toLowerCase();
  for (const [k, cls] of Object.entries(cambiosBadge)) {
    if (key.includes(k)) return `text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${cls}`;
  }
  return 'text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider bg-[#f3f4f6] text-[#4b5563]';
}

export default function Evolucion() {
  const { lesiones, loading, error } = usePatientLesiones();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const totalRegistros = lesiones.reduce((acc, l) => acc + l.seguimientos.length, 0);

  return (
    <div className="max-w-5xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">Evolución Fotográfica</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Historial cronológico de todos tus seguimientos y registros fotográficos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-md bg-[#f4f6f5] border border-[#d8e0dc] flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-[#0c1512]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5f7b6f] mb-0.5">Lesiones en seguimiento</p>
              <p className="text-3xl font-semibold text-[#0c1512]">{loading ? '—' : lesiones.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-md bg-[#f4f6f5] border border-[#d8e0dc] flex items-center justify-center shrink-0">
              <Camera className="h-5 w-5 text-[#0c1512]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5f7b6f] mb-0.5">Registros realizados</p>
              <p className="text-3xl font-semibold text-[#0c1512]">{loading ? '—' : totalRegistros}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#5f7b6f]">Cargando evolución...</div>
      ) : lesiones.length === 0 ? (
        <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
          <CardContent className="p-12 text-center">
            <p className="font-semibold text-[#0c1512]">Aún no tienes lesiones registradas</p>
            <p className="text-sm text-[#5f7b6f] mt-1 mb-6">
              Registra tu primera lesión para comenzar a seguir su evolución.
            </p>
            <Link
              to="/dashboard/lesiones/crear"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0c1512] hover:underline"
            >
              Registrar lesión <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {lesiones.map((lesion) => {
            const segs = [...lesion.seguimientos].sort(
              (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            return (
              <section key={lesion.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-[#e9efec] border border-[#d8e0dc] overflow-hidden shrink-0">
                      <img
                        src={lesionFotoUrl(lesion.id)}
                        alt={lesion.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#0c1512]">{lesion.nombre}</h2>
                      <p className="text-xs text-[#5f7b6f]">
                        {lesion.zona}{lesion.ubicacion ? ` • ${lesion.ubicacion}` : ''} •{' '}
                        {segs.length} registro{segs.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/lesiones/${lesion.id}`}
                    className="text-sm font-medium text-[#0c1512] hover:underline flex items-center gap-1 shrink-0"
                  >
                    Ver detalle <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {segs.length === 0 ? (
                  <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
                    <CardContent className="p-6 text-sm text-[#5f7b6f]">
                      Esta lesión aún no tiene seguimientos.{' '}
                      <Link to={`/dashboard/lesiones/${lesion.id}`} className="text-[#0c1512] font-medium hover:underline">
                        Crear el primero
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white overflow-hidden">
                    <div className="divide-y divide-[#d8e0dc]">
                      {segs.map((seg) => (
                        <Link
                          key={seg.id}
                          to={`/dashboard/lesiones/${lesion.id}`}
                          className="p-4 sm:p-5 flex items-start gap-4 hover:bg-[#fafcfa] transition-colors cursor-pointer block"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-[#0c1512]">{formatFecha(seg.fecha)}</span>
                              <span className={badgeClass(seg.cambios)}>{seg.cambios}</span>
                              {seg.color && <span className="text-[10px] font-medium text-[#5f7b6f]">Color: {seg.color}</span>}
                              {seg.sintomas && <span className="text-[10px] font-medium text-[#5f7b6f]">Síntomas: {seg.sintomas}</span>}
                            </div>
                            {seg.notas && (
                              <p className="text-sm text-[#3f4f49] truncate">{seg.notas}</p>
                            )}
                            <div className="mt-2 flex items-center gap-3">
                              <span className="text-xs font-medium text-[#5f7b6f]">
                                Registro #{seg.id} • {seg.foto_count} foto{seg.foto_count === 1 ? '' : 's'}
                              </span>
                            </div>
                            {seg.fotos.length > 0 && (
                              <div className="mt-3 flex gap-2 overflow-x-auto">
                                {seg.fotos.slice(0, 4).map((f) => (
                                  <img
                                    key={f.id}
                                    src={seguimientoFotoUrl(lesion.id, seg.id, f.id)}
                                    alt={`Seguimiento ${seg.id}`}
                                    className="h-16 w-16 rounded-md border border-[#d8e0dc] object-cover shrink-0"
                                  />
                                ))}
                                {seg.foto_count > 4 && (
                                  <div className="h-16 w-16 rounded-md border border-[#d8e0dc] bg-[#f4f6f5] flex items-center justify-center text-xs font-medium text-[#5f7b6f] shrink-0">
                                    +{seg.foto_count - 4}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
