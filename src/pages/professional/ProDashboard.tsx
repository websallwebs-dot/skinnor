import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, MessageSquare, ArrowRight, Clock, Activity } from 'lucide-react';
import { get, getUser } from '@/lib/api';
import { toast } from 'sonner';

interface Alerta {
  key: string;
  tipo: string;
  riesgo: string;
  paciente_id: number;
  paciente_nombre: string;
  lesion_nombre: string | null;
  mensaje: string;
  fecha: string;
}

interface Consulta {
  id: number;
  tema: string;
  estado: string;
  paciente_id: number;
  paciente_nombre?: string;
  creado_en: string;
  actualizado_en?: string;
}

interface Vinculacion {
  id: number;
  paciente_id: number;
  creado_en?: string;
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diffH = Math.floor((Date.now() - d.getTime()) / 3600000);
  if (diffH < 1) return 'Ahora';
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `Hace ${diffD} d`;
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

export default function ProDashboard() {
  const navigate = useNavigate();
  const profesionalId = getUser()?.id;
  const profesionalNombre = getUser()?.nombre || 'Doctor';

  const [vinculaciones, setVinculaciones] = useState<Vinculacion[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [resumenAlertas, setResumenAlertas] = useState({ total: 0, alto: 0, medio: 0, bajo: 0 });
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [ultimosMensajes, setUltimosMensajes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vinc, alertData, cons] = await Promise.all([
        get('/vinculaciones', { profesional_id: String(profesionalId) }),
        get(`/profesionales/${profesionalId}/alertas`),
        get('/consultas', { profesional_id: String(profesionalId) }),
      ]);
      setVinculaciones(vinc || []);
      setAlertas((alertData?.alertas || []).filter((a: Alerta & { descartada: boolean }) => !a.descartada));
      setResumenAlertas(alertData?.resumen || { total: 0, alto: 0, medio: 0, bajo: 0 });
      const consList: Consulta[] = cons || [];
      setConsultas(consList);

      // Preview del último mensaje de las 4 consultas más recientes
      const recientes = consList.slice(0, 4);
      const msgs: Record<number, string> = {};
      await Promise.all(recientes.map(async (c) => {
        try {
          const m = await get(`/consultas/${c.id}/mensajes`);
          if (Array.isArray(m) && m.length > 0) {
            msgs[c.id] = m[m.length - 1].contenido;
          }
        } catch { /* sin mensajes */ }
      }));
      setUltimosMensajes(msgs);
    } catch {
      toast.error('No se pudo cargar el escritorio');
    } finally {
      setLoading(false);
    }
  }, [profesionalId]);

  useEffect(() => { load(); }, [load]);

  const pacientesActivos = new Set(vinculaciones.map(v => v.paciente_id)).size;
  const nuevosEsteMes = vinculaciones.filter(v => {
    if (!v.creado_en) return false;
    const d = new Date(v.creado_en);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const consultasPendientes = consultas.filter(c => c.estado === 'pendiente').length;
  const topAlertas = [...alertas]
    .sort((a, b) => {
      const orden = { alto: 0, medio: 1, bajo: 2 };
      return (orden[a.riesgo as keyof typeof orden] ?? 3) - (orden[b.riesgo as keyof typeof orden] ?? 3);
    })
    .slice(0, 5);

  const riesgoBadge = (riesgo: string) =>
    riesgo === 'alto'
      ? 'bg-[#f9ecd4] text-[#c77a0b]'
      : riesgo === 'medio'
      ? 'bg-[#fdf8e9] text-[#8a5a0a]'
      : 'bg-[#e9efec] text-[#5f7b6f]';

  const riesgoLabel = (riesgo: string) =>
    riesgo === 'alto' ? 'Riesgo Alto' : riesgo === 'medio' ? 'Riesgo Medio' : 'Atención';

  if (loading) {
    return <div className="max-w-6xl pb-12 text-center py-20 text-[#5f7b6f] text-sm">Cargando escritorio...</div>;
  }

  return (
    <div className="max-w-6xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
          Escritorio Clínico
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hola, {profesionalNombre}. Resumen de actividad, alertas y estado de tus pacientes.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 bg-[#e9efec] rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-[#5f7b6f]" />
              </div>
              {nuevosEsteMes > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[#cfe6dd] text-[#0d7a63] rounded-md text-xs font-semibold">
                  +{nuevosEsteMes} este mes
                </div>
              )}
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#5f7b6f] mb-1">Pacientes Vinculados</p>
              <h3 className="text-3xl font-semibold text-[#0c1512]">{pacientesActivos}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 bg-[#f9ecd4] rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-[#c77a0b]" />
              </div>
              {resumenAlertas.alto > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[#f9ecd4] text-[#c77a0b] rounded-md text-xs font-semibold">
                  {resumenAlertas.alto} alto riesgo
                </div>
              )}
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#5f7b6f] mb-1">Alertas de Riesgo</p>
              <h3 className="text-3xl font-semibold text-[#0c1512]">{resumenAlertas.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 bg-[#e9efec] rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#5f7b6f]" />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#5f7b6f] mb-1">Consultas Pendientes</p>
              <h3 className="text-3xl font-semibold text-[#0c1512]">{consultasPendientes}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Alertas y Pacientes Prioritarios */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden flex flex-col">
          <div className="border-b border-[#d8e0dc] px-6 py-4 bg-[#fafcfa] flex justify-between items-center">
            <h2 className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
              <Activity className="h-4 w-4" /> Alertas Prioritarias
            </h2>
            <span className="text-xs text-[#5f7b6f]">{topAlertas.length} de {alertas.length}</span>
          </div>
          <CardContent className="p-0 flex-1">
            {topAlertas.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#5f7b6f]">
                Sin alertas pendientes. Los pacientes reportan sus controles desde la app.
              </div>
            ) : (
              <div className="divide-y divide-[#d8e0dc]">
                {topAlertas.map((alert) => (
                  <div key={alert.key} className="p-5 hover:bg-[#fafcfa] transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-[#0c1512] flex items-center gap-2">
                        {alert.paciente_nombre}
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${riesgoBadge(alert.riesgo)}`}>
                          {riesgoLabel(alert.riesgo)}
                        </span>
                      </div>
                      <span className="text-xs text-[#5f7b6f] font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(alert.fecha)}
                      </span>
                    </div>
                    <p className="text-sm text-[#3f4f49] mb-3 line-clamp-2">{alert.mensaje}</p>
                    <Button variant="outline" size="sm" className="h-8 border-[#d8e0dc] text-[#0c1512] hover:bg-white" onClick={() => navigate(`/pro/pacientes/${alert.paciente_id}`)}>
                      Ver paciente <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="border-t border-[#d8e0dc] p-3 bg-[#fafcfa] text-center">
            <Button variant="ghost" size="sm" className="text-[#5f7b6f] text-xs font-medium hover:text-[#0c1512]" onClick={() => navigate('/pro/alertas')}>
              Ver todas las alertas
            </Button>
          </div>
        </Card>

        {/* Inbox Preview */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden flex flex-col">
          <div className="border-b border-[#d8e0dc] px-6 py-4 bg-[#fafcfa] flex justify-between items-center">
            <h2 className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Consultas Recientes
            </h2>
            <span className="text-xs text-[#5f7b6f]">{consultas.length} totales</span>
          </div>
          <CardContent className="p-0 flex-1">
            {consultas.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#5f7b6f]">
                No hay consultas registradas todavía.
              </div>
            ) : (
              <div className="divide-y divide-[#d8e0dc]">
                {consultas.slice(0, 5).map((c) => (
                  <div key={c.id} className="p-5 hover:bg-[#fafcfa] transition-colors cursor-pointer" onClick={() => navigate('/pro/consultas')}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-[#0c1512] flex items-center gap-2">
                        {c.paciente_nombre || 'Paciente'}
                        {c.estado === 'pendiente' && <span className="h-2 w-2 rounded-full bg-[#c77a0b]"></span>}
                      </span>
                      <span className="text-[11px] text-[#5f7b6f] font-medium">{timeAgo(c.actualizado_en || c.creado_en)}</span>
                    </div>
                    <div className="text-[12px] font-medium text-[#5f7b6f] mb-1">{c.tema}</div>
                    <div className="text-[13px] text-[#3f4f49] line-clamp-1">
                      {ultimosMensajes[c.id] || (c.estado === 'pendiente' ? 'Sin mensajes aún' : '—')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="border-t border-[#d8e0dc] p-3 bg-[#fafcfa] text-center">
            <Button variant="ghost" size="sm" className="text-[#0d7a63] text-xs font-medium" onClick={() => navigate('/pro/consultas')}>
              Ir a la Bandeja de Consultas
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
