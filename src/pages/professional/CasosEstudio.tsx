import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Tag, Plus, ArrowRight, Clock, Microscope, Trash2, User, Lock, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { get, del, getUser } from '@/lib/api';
import { toast } from 'sonner';

interface CasoEstudio {
  id: number;
  titulo: string;
  diagnostico?: string;
  riesgo?: string;
  etiquetas?: string;
  descripcion?: string;
  privado: number;
  creado_en: string;
  paciente_id?: number;
  lesion_id?: number;
  paciente_nombre?: string;
  paciente_email?: string;
  lesion_nombre?: string;
  lesion_zona?: string;
  seguimientos_count?: number;
  fotos_count?: number;
}

function parseEtiquetas(raw?: string): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [String(p)];
  } catch {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
}

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

export default function CasosEstudio() {
  const navigate = useNavigate();
  const profesionalId = getUser()?.id;
  const [casos, setCasos] = useState<CasoEstudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get('/casos-estudio', { profesional_id: String(profesionalId) });
      setCasos(data || []);
    } catch {
      toast.error('No se pudieron cargar los casos de estudio');
    } finally {
      setLoading(false);
    }
  }, [profesionalId]);

  useEffect(() => { load(); }, [load]);

  const allTags = Array.from(new Set(casos.flatMap(c => parseEtiquetas(c.etiquetas)))).sort();

  const filtered = casos.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.titulo?.toLowerCase().includes(q) ||
      c.paciente_nombre?.toLowerCase().includes(q) ||
      c.lesion_nombre?.toLowerCase().includes(q) ||
      c.descripcion?.toLowerCase().includes(q) ||
      c.diagnostico?.toLowerCase().includes(q);
    const matchesTag = !tagFilter || parseEtiquetas(c.etiquetas).includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  const handleDelete = async (id: number) => {
    try {
      await del(`/casos-estudio/${id}?profesional_id=${profesionalId}`);
      toast.success('Caso eliminado');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo eliminar');
    }
  };

  const riesgoBadge = (riesgo?: string) => {
    if (riesgo === 'alto') return 'bg-[#f9ecd4] text-[#c77a0b]';
    if (riesgo === 'medio') return 'bg-[#fdf8e9] text-[#8a5a0a]';
    if (riesgo === 'bajo') return 'bg-[#cfe6dd] text-[#0d7a63]';
    return 'bg-[#f4f6f5] text-[#5f7b6f]';
  };

  return (
    <div className="max-w-6xl pb-12">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
            Casos de Estudio
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Marca pacientes y lesiones de tu consulta como casos de estudio para tu biblioteca clínica personal.
          </p>
        </div>
        <Button className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none" onClick={() => navigate('/pro/casos/crear')}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Caso
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f7b6f]" />
          <Input
            placeholder="Buscar por título, paciente o lesión..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-[#d8e0dc] bg-white shadow-none focus-visible:ring-[#0d7a63]"
          />
        </div>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="h-9 border border-[#d8e0dc] rounded-md px-3 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]"
        >
          <option value="">Todas las etiquetas</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#5f7b6f] text-sm">Cargando casos...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl p-12 text-center">
          <BookOpen className="h-10 w-10 text-[#5f7b6f] opacity-40 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-[#0c1512] mb-1">
            {casos.length === 0 ? 'Aún no tienes casos de estudio' : 'Sin resultados para los filtros'}
          </h3>
          <p className="text-sm text-[#5f7b6f] mb-6">
            {casos.length === 0
              ? 'Crea tu primer caso vinculándolo a un paciente de tu consulta o documentando un caso libre.'
              : 'Prueba con otra búsqueda o etiqueta.'}
          </p>
          {casos.length === 0 && (
            <Button className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none" onClick={() => navigate('/pro/casos/crear')}>
              <Plus className="mr-2 h-4 w-4" /> Crear primer caso
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((caso) => (
            <Card key={caso.id} className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden group hover:border-[#0d7a63] transition-colors flex flex-col">
              <div className="aspect-video bg-[#fafcfa] border-b border-[#d8e0dc] relative p-4 flex items-center justify-center">
                {caso.lesion_id ? (
                  <img
                    src={`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'}/api/lesiones/${caso.lesion_id}/foto`}
                    alt={caso.lesion_nombre || 'Lesión'}
                    className="max-h-28 max-w-full rounded-md object-cover border border-[#d8e0dc]"
                  />
                ) : (
                  <div className="w-24 h-24 bg-[#e9efec] rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-[#5f7b6f] opacity-50" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${riesgoBadge(caso.riesgo)}`}>
                    {caso.riesgo || 'Caso'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm bg-white text-[#5f7b6f] border border-[#d8e0dc] flex items-center gap-1">
                    {caso.privado ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                    {caso.privado ? 'Privado' : 'Público'}
                  </span>
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="text-[15px] font-semibold text-[#0c1512] mb-2 leading-tight group-hover:text-[#0d7a63] transition-colors">
                  {caso.titulo}
                </h3>

                {caso.paciente_nombre && (
                  <div className="flex items-center gap-1.5 text-xs text-[#5f7b6f] mb-1 font-medium">
                    <User className="h-3 w-3" /> {caso.paciente_nombre}
                    {caso.lesion_nombre && ` • ${caso.lesion_nombre} (${ZONA_LABELS[caso.lesion_zona || ''] || caso.lesion_zona})`}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-[#5f7b6f] mb-4 font-medium">
                  <Clock className="h-3 w-3" /> Añadido el {new Date(caso.creado_en).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                <p className="text-sm text-[#3f4f49] line-clamp-3 mb-6 flex-1 leading-relaxed">
                  {caso.descripcion || caso.diagnostico || 'Sin descripción.'}
                </p>

                <div className="mt-auto space-y-4">
                  {parseEtiquetas(caso.etiquetas).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {parseEtiquetas(caso.etiquetas).map((tag, i) => (
                        <span key={i} className="inline-flex items-center text-[10px] font-medium text-[#5f7b6f] bg-[#f4f6f5] border border-[#d8e0dc] px-2 py-1 rounded">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t border-[#d8e0dc] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#5f7b6f] flex items-center gap-1">
                      <Microscope className="h-3.5 w-3.5" /> {caso.fotos_count || 0} fotos • {caso.seguimientos_count || 0} seguimientos
                    </span>
                    <div className="flex items-center gap-1">
                      {caso.paciente_id && (
                        <Link to={`/pro/pacientes/${caso.paciente_id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#f4f6f5] p-0 px-2 text-xs">
                            Paciente
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(caso.id)}
                        className="h-8 text-[#c77a0b] hover:text-[#a55a08] hover:bg-[#f9ecd4] p-0 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-[#0d7a63] hover:text-[#0a4539] hover:bg-[#e9efec] p-0 px-2">
                        Ver <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
