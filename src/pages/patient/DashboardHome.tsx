import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Camera, Activity, CalendarDays } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { usePatientLesiones, seguimientoFotoUrl, type Lesion, type Seguimiento } from './usePatientLesiones';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface ActivityItem {
  lesion: Lesion;
  seg: Seguimiento;
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (sameDay(d, hoy)) return `Hoy, ${time}`;
  if (sameDay(d, ayer)) return `Ayer, ${time}`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { lesiones, loading, error } = usePatientLesiones();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const lesionesActivas = lesiones.length;

  const diasMonitoreo = (() => {
    if (lesiones.length === 0) return 0;
    const fechas = lesiones.map((l) => new Date(l.creado_en).getTime()).filter((t) => !isNaN(t));
    if (fechas.length === 0) return 0;
    const min = Math.min(...fechas);
    return Math.max(0, Math.floor((Date.now() - min) / 86400000));
  })();

  const hoyStr = new Date().toISOString().slice(0, 10);
  const pendientesHoy = lesiones.filter((l) => {
    const segs = l.seguimientos;
    if (segs.length === 0) return true;
    const ultima = segs.reduce((a, b) => (new Date(a.fecha) > new Date(b.fecha) ? a : b));
    return !ultima.fecha.startsWith(hoyStr);
  });

  const actividad: ActivityItem[] = lesiones
    .flatMap((lesion) => lesion.seguimientos.map((seg) => ({ lesion, seg })))
    .sort((a, b) => new Date(b.seg.fecha).getTime() - new Date(a.seg.fecha).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
          Hola, {user?.nombre?.split(' ')[0] || 'Paciente'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen de tu monitoreo dermatológico.
        </p>
      </div>

      {/* Recordatorio / Alerta de Acción Sobria */}
      {pendientesHoy.length > 0 && (
        <div className="bg-[#f4f6f5] border border-[#d8e0dc] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8">
          <div className="flex-1">
            <h3 className="font-semibold text-[#0c1512] text-lg">Registro diario pendiente</h3>
            <p className="text-[#3f4f49] text-sm mt-1">
              {pendientesHoy.length === 1
                ? `Tienes 1 lesión pendiente de actualización fotográfica hoy.`
                : `Tienes ${pendientesHoy.length} lesiones pendientes de actualización fotográfica hoy.`}
            </p>
          </div>
          <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <Link to="/dashboard/seguimientos/crear" className="block w-full">
              <Button className="w-full sm:w-auto bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none rounded-md">
                Completar registro
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions Sobrias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="border-[#d8e0dc] shadow-none rounded-xl overflow-hidden bg-white cursor-pointer hover:border-[#0c1512] transition-colors group">
          <Link to="/dashboard/seguimientos/crear" className="block p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-[#f4f6f5] border border-[#d8e0dc] flex items-center justify-center shrink-0">
                <Camera className="h-5 w-5 text-[#0c1512]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0c1512] text-lg mb-1 group-hover:underline">Nuevo registro fotográfico</h3>
                <p className="text-[#5f7b6f] text-sm">Sube una actualización visual de tu lesión.</p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="border-[#d8e0dc] shadow-none rounded-xl overflow-hidden bg-white cursor-pointer hover:border-[#0c1512] transition-colors group">
          <Link to="/dashboard/lesiones/crear" className="block p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-[#f4f6f5] border border-[#d8e0dc] flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5 text-[#0c1512]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0c1512] text-lg mb-1 group-hover:underline">Registrar nueva lesión</h3>
                <p className="text-[#5f7b6f] text-sm">Añade una mancha o lunar a tu historial.</p>
              </div>
            </div>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-[11.5px] uppercase tracking-widest text-[#5f7b6f] mb-4">Métricas</div>

          <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-md bg-[#f4f6f5] border border-[#d8e0dc] flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5 text-[#0c1512]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#5f7b6f] mb-0.5">Lesiones activas</p>
                <p className="text-3xl font-semibold text-[#0c1512]">{loading ? '—' : lesionesActivas}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-md bg-[#f4f6f5] border border-[#d8e0dc] flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-[#0c1512]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#5f7b6f] mb-0.5">Días en monitoreo</p>
                <p className="text-3xl font-semibold text-[#0c1512]">{loading ? '—' : diasMonitoreo}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11.5px] uppercase tracking-widest text-[#5f7b6f]">Actividad Reciente</div>
            <Link to="/dashboard/lesiones" className="text-sm font-medium text-[#0c1512] hover:underline flex items-center gap-1">
              Ver catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white overflow-hidden">
            <div className="divide-y divide-[#d8e0dc]">
              {loading ? (
                <div className="p-8 text-center text-sm text-[#5f7b6f]">Cargando actividad...</div>
              ) : actividad.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-semibold text-[#0c1512]">Sin actividad todavía</p>
                  <p className="text-xs text-[#5f7b6f] mt-1">
                    Registra una lesión y crea tu primer seguimiento para ver tu evolución aquí.
                  </p>
                </div>
              ) : (
                actividad.map(({ lesion, seg }) => {
                  const thumb = seg.fotos.length > 0
                    ? seguimientoFotoUrl(lesion.id, seg.id, seg.fotos[0].id)
                    : null;
                  return (
                    <Link
                      key={seg.id}
                      to={`/dashboard/lesiones/${lesion.id}`}
                      className="p-4 sm:p-5 flex items-start gap-4 hover:bg-[#f4f6f5] transition-colors cursor-pointer block"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-md bg-[#e9efec] border border-[#d8e0dc] flex items-center justify-center shrink-0 overflow-hidden relative">
                          {thumb ? (
                            <img src={thumb} alt={`Registro de ${lesion.nombre}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-[#5f7b6f] uppercase">Sin foto</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-[#0c1512] truncate">{lesion.nombre}</h4>
                            <span className="text-xs text-[#5f7b6f] whitespace-nowrap">{formatFecha(seg.fecha)}</span>
                          </div>
                          <p className="text-sm text-[#3f4f49] truncate">
                            {seg.notas || `Cambios: ${seg.cambios}`}
                          </p>
                          <div className="mt-2 text-xs font-medium text-[#5f7b6f]">
                            Registro #{seg.id} • {seg.foto_count} foto{seg.foto_count === 1 ? '' : 's'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
