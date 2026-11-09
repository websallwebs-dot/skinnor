import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, DatabaseBackup, Plus, Download, Calendar, ArchiveRestore, Trash2, Users, ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { get, del, getUser, API_BASE } from '@/lib/api';
import { toast } from 'sonner';

interface Dataset {
  id: number;
  nombre: string;
  descripcion?: string;
  etiqueta?: string;
  criterios?: any;
  incluir_imagenes: number;
  registros_count: number;
  pacientes_count: number;
  creado_en: string;
}

export default function MyDatasets() {
  const navigate = useNavigate();
  const profesionalId = getUser()?.id;
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get('/datasets', { profesional_id: String(profesionalId) });
      setDatasets(data || []);
    } catch {
      toast.error('No se pudieron cargar los datasets');
    } finally {
      setLoading(false);
    }
  }, [profesionalId]);

  useEffect(() => { load(); }, [load]);

  const filtered = datasets.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.nombre?.toLowerCase().includes(q) || d.descripcion?.toLowerCase().includes(q);
  });

  const handleDelete = async (id: number) => {
    try {
      await del(`/datasets/${id}?profesional_id=${profesionalId}`);
      toast.success('Dataset eliminado');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo eliminar');
    }
  };

  const exportUrl = (d: Dataset) =>
    `${API_BASE}/datasets/${d.id}/export?profesional_id=${profesionalId}&format=zip`;

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
            Mis Datasets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crea conjuntos de datos anonimizados a partir de los casos de tus pacientes vinculados para investigación y entrenamiento de modelos.
          </p>
        </div>
        <Button
          className="bg-[#0c1512] hover:bg-[#3f4f49] text-white rounded-md shadow-none font-medium"
          onClick={() => navigate('/pro/mis-datasets/crear')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Nuevo Dataset
        </Button>
      </div>

      <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[#d8e0dc] bg-[#fafcfa] flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f7b6f]" />
            <Input
              placeholder="Buscar dataset por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#d8e0dc] bg-white shadow-none focus-visible:ring-[#0d7a63]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#5f7b6f]">Cargando datasets...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <DatabaseBackup className="mx-auto h-10 w-10 text-[#b9c6c0] mb-3" />
            <p className="text-sm text-[#5f7b6f]">
              {datasets.length === 0
                ? 'Aún no tienes datasets. Crea el primero con el botón "Crear Nuevo Dataset".'
                : 'Sin resultados para la búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f4f6f5] border-b border-[#d8e0dc] text-[#5f7b6f] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Nombre y Descripción</th>
                  <th className="px-6 py-4 font-medium">Volumen</th>
                  <th className="px-6 py-4 font-medium">Fecha de Creación</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8e0dc]">
                {filtered.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-[#fafcfa] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#0c1512] flex items-center gap-2">
                        <ArchiveRestore className="h-4 w-4 text-[#0d7a63]" />
                        {dataset.nombre}
                        {dataset.etiqueta && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide bg-[#e9efec] text-[#0d7a63] px-2 py-0.5 rounded">
                            {dataset.etiqueta}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#5f7b6f] mt-1 max-w-md line-clamp-1">
                        {dataset.descripcion || 'Sin descripción.'}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-[#5f7b6f] mt-2 font-medium">
                        ID: DS{dataset.id} • Anonimizado
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[#0c1512]">{dataset.registros_count} registros</span>
                        <span className="text-xs text-[#5f7b6f] flex items-center gap-3">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {dataset.pacientes_count} pacientes</span>
                          <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {dataset.registros_count} imágenes</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#3f4f49]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#5f7b6f]" />
                        {new Date(dataset.creado_en).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <a href={exportUrl(dataset)} download>
                        <Button
                          size="sm"
                          className="bg-[#0d7a63] hover:bg-[#0a4539] text-white shadow-none font-medium h-8"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          ZIP
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(dataset.id)}
                        className="border-[#d8e0dc] text-[#c77a0b] hover:bg-[#f9ecd4] shadow-none font-medium h-8"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-[#5f7b6f]">
        Los datasets se exportan de forma anonimizada: no incluyen nombres, correos, documentos ni notas del paciente — solo datos clínicos y un identificador de cohorte seudónimo.
      </p>
    </div>
  );
}
