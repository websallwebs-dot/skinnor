import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight, RotateCcw } from 'lucide-react';
import { get, post, del, getUser } from '@/lib/api';
import { toast } from 'sonner';

interface Alerta {
  key: string;
  tipo: string;
  riesgo: 'alto' | 'medio' | 'bajo';
  paciente_id: number;
  paciente_usuario_id?: number;
  paciente_nombre: string;
  lesion_id: number | null;
  lesion_nombre: string | null;
  mensaje: string;
  fecha: string;
  descartada: boolean;
}

interface Resumen {
  total: number;
  alto: number;
  medio: number;
  bajo: number;
  descartadas: number;
}

const RIESGO_STYLE: Record<string, { border: string; label: string; chip: string }> = {
  alto: { border: 'border-l-[#d64533]', label: 'text-[#c0392b]', chip: 'bg-[#fdecea] text-[#c0392b]' },
  medio: { border: 'border-l-[#e6a817]', label: 'text-[#a06e00]', chip: 'bg-[#fdf4dc] text-[#a06e00]' },
  bajo: { border: 'border-l-[#3e8e5f]', label: 'text-[#2e7d4f]', chip: 'bg-[#e8f4ec] text-[#2e7d4f]' },
};

const RIESGO_LABEL: Record<string, string> = { alto: 'Riesgo alto', medio: 'Riesgo medio', bajo: 'Atención' };

export default function Alertas() {
  const navigate = useNavigate();
  const profesionalId = getUser()?.id;
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [resumen, setResumen] = useState<Resumen>({ total: 0, alto: 0, medio: 0, bajo: 0, descartadas: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'alto' | 'medio' | 'bajo'>('all');
  const [showDescartadas, setShowDescartadas] = useState(false);

  const load = useCallback(async (incluirDescartadas = false) => {
    setLoading(true);
    try {
      const data = await get(`/profesionales/${profesionalId}/alertas`, {
        incluir_descartadas: incluirDescartadas ? '1' : '0',
      });
      setAlertas(data?.alertas || []);
      setResumen(data?.resumen || { total: 0, alto: 0, medio: 0, bajo: 0, descartadas: 0 });
    } catch {
      toast.error('No se pudieron cargar las alertas');
    } finally {
      setLoading(false);
    }
  }, [profesionalId]);

  useEffect(() => { load(showDescartadas); }, [load, showDescartadas]);

  const filtered = alertas.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.paciente_nombre?.toLowerCase().includes(q) ||
      a.mensaje?.toLowerCase().includes(q) ||
      a.lesion_nombre?.toLowerCase().includes(q) ||
      a.tipo?.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' || a.riesgo === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDescartar = async (key: string) => {
    try {
      await post(`/profesionales/${profesionalId}/alertas/descartar`, { key });
      toast.success('Alerta descartada');
      load(showDescartadas);
    } catch {
      toast.error('No se pudo descartar la alerta');
    }
  };

  const handleRestaurar = async (key: string) => {
    try {
      await del(`/profesionales/${profesionalId}/alertas/descartar/${encodeURIComponent(key)}`);
      toast.success('Alerta restaurada');
      load(showDescartadas);
    } catch {
      toast.error('No se pudo restaurar la alerta');
    }
  };

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const diffH = Math.floor((Date.now() - d.getTime()) / 3600000);
    if (diffH < 24) return `Hace ${Math.max(1, diffH)} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `Hace ${diffD} d`;
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512] flex items-center gap-3">
          Alertas clínicas
          {resumen.total > 0 && (
            <span className="text-[11px] font-medium uppercase tracking-widest text-[#8a3b28] border border-[#e4d5cd] px-2.5 py-1 rounded-sm mt-1">
              {resumen.total} pendientes
            </span>
          )}
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
          Alertas generadas desde datos reales: cambios y síntomas reportados por pacientes, consultas sin responder y lesiones sin seguimiento.
        </p>
      </div>

      <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[#d8e0dc] bg-[#fafcfa] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f7b6f]" />
            <Input
              placeholder="Buscar alertas por paciente, lesión o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#d8e0dc] bg-white shadow-none focus-visible:ring-[#0d7a63] h-9"
            />
          </div>
          <div className="flex bg-[#f4f6f5] p-1 rounded-lg border border-[#d8e0dc] w-full sm:w-auto">
            {([
              ['all', 'Todas', resumen.total, ''],
              ['alto', 'Riesgo alto', resumen.alto, 'bg-[#d64533]'],
              ['medio', 'Riesgo medio', resumen.medio, 'bg-[#e6a817]'],
              ['bajo', 'Atención', resumen.bajo, 'bg-[#3e8e5f]'],
            ] as const).map(([key, label, count, dot]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  filter === key ? 'bg-white text-[#0c1512] shadow-sm' : 'text-[#5f7b6f] hover:text-[#0c1512]'
                }`}
              >
                {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
                {label}{count > 0 ? ` (${count})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-b border-[#d8e0dc] bg-white flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-[#5f7b6f] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDescartadas}
              onChange={(e) => setShowDescartadas(e.target.checked)}
              className="rounded border-[#d8e0dc]"
            />
            Mostrar descartadas ({resumen.descartadas})
          </label>
        </div>

        <div className="divide-y divide-[#d8e0dc]">
          {loading ? (
            <div className="text-center py-16 text-sm text-[#5f7b6f]">Cargando alertas...</div>
          ) : filtered.length > 0 ? filtered.map((alert) => {
            const style = RIESGO_STYLE[alert.riesgo] || RIESGO_STYLE.bajo;
            return (
              <div
                key={alert.key}
                className={`pl-5 border-l-[3px] ${style.border} py-5 pr-6 hover:bg-[#fafcfa] transition-colors flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between ${alert.descartada ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                    <span className="font-semibold text-[#0c1512] text-[15px]">{alert.paciente_nombre}</span>
                    <span className="text-[11px] font-mono text-[#5f7b6f]">PAC-{String(alert.paciente_id).padStart(4, '0')}</span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm ${style.chip}`}>
                      {RIESGO_LABEL[alert.riesgo] || alert.riesgo}
                    </span>
                    <span className="text-[11px] text-[#5f7b6f]">{alert.tipo}</span>
                    {alert.descartada && (
                      <span className="text-[11px] text-[#8a5a0a] uppercase tracking-wide">Descartada</span>
                    )}
                  </div>
                  <p className="text-sm text-[#3f4f49] leading-relaxed max-w-3xl">
                    {alert.mensaje}
                    {alert.lesion_nombre && (
                      <span className="text-[#5f7b6f]"> — Lesión: {alert.lesion_nombre}</span>
                    )}
                  </p>
                  <div className="mt-1.5 text-xs text-[#5f7b6f]">
                    Registrada {formatFecha(alert.fecha)}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
                  <Button
                    variant="outline"
                    className="flex-1 lg:w-full border-[#d8e0dc] text-[#0c1512] hover:bg-[#eef2f0] hover:border-[#b9c6c0] shadow-none text-xs h-9 font-medium"
                    onClick={() => navigate(`/pro/pacientes/${alert.paciente_id}`)}
                  >
                    Ver paciente <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                  {alert.descartada ? (
                    <Button
                      variant="ghost"
                      className="flex-1 lg:w-full text-[#5f7b6f] hover:text-[#0c1512] shadow-none text-xs h-9"
                      onClick={() => handleRestaurar(alert.key)}
                    >
                      Restaurar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="flex-1 lg:w-full text-[#5f7b6f] hover:text-[#8a3b28] shadow-none text-xs h-9"
                      onClick={() => handleDescartar(alert.key)}
                    >
                      Descartar
                    </Button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-16 px-4">
              <h3 className="text-base font-semibold text-[#0c1512] mb-2">Sin alertas pendientes</h3>
              <p className="text-sm text-[#5f7b6f] max-w-md mx-auto">
                {showDescartadas
                  ? 'No hay alertas descartadas.'
                  : 'No hay alertas pendientes. Los pacientes sin novedades recientes no generarán ruido aquí.'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
