import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Database, Filter, Loader2, CheckCircle2, Download, Users, ImageIcon, AlertTriangle } from 'lucide-react';
import { get, post, getUser, API_BASE } from '@/lib/api';
import { toast } from 'sonner';

interface Vinculado {
  paciente_id: number;
  paciente_email: string;
}

interface Criterios {
  paciente_ids: number[];
  edad_min: string;
  edad_max: string;
  sexo: string;
  solo_cambios: boolean;
}

const DEFAULT_CRITERIOS: Criterios = {
  paciente_ids: [],
  edad_min: '',
  edad_max: '',
  sexo: '',
  solo_cambios: false,
};

function criteriosPayload(c: Criterios) {
  return {
    paciente_ids: c.paciente_ids.length ? c.paciente_ids : undefined,
    edad_min: c.edad_min !== '' ? Number(c.edad_min) : null,
    edad_max: c.edad_max !== '' ? Number(c.edad_max) : null,
    sexo: c.sexo || null,
    solo_cambios: c.solo_cambios,
  };
}

export default function DatasetBuilder() {
  const navigate = useNavigate();
  const profesionalId = getUser()?.id;

  const [vinculados, setVinculados] = useState<Vinculado[]>([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [criterios, setCriterios] = useState<Criterios>(DEFAULT_CRITERIOS);

  const [preview, setPreview] = useState<{ pacientes: number; registros: number } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: number; registros: number; pacientes: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await get('/vinculaciones', { profesional_id: String(profesionalId) });
        setVinculados(data || []);
      } catch {
        toast.error('No se pudieron cargar los pacientes vinculados');
      }
    })();
  }, [profesionalId]);

  const runPreview = useCallback(async () => {
    setPreviewing(true);
    try {
      const data = await post('/datasets/preview', {
        profesional_id: profesionalId,
        criterios: criteriosPayload(criterios),
      });
      setPreview(data);
    } catch (e: any) {
      setPreview(null);
      toast.error(e?.message || 'No se pudo previsualizar');
    } finally {
      setPreviewing(false);
    }
  }, [profesionalId, criterios]);

  const togglePaciente = (id: number) => {
    setCriterios((c) => ({
      ...c,
      paciente_ids: c.paciente_ids.includes(id)
        ? c.paciente_ids.filter((p) => p !== id)
        : [...c.paciente_ids, id],
    }));
    setPreview(null);
  };

  const setCrit = (patch: Partial<Criterios>) => {
    setCriterios((c) => ({ ...c, ...patch }));
    setPreview(null);
  };

  const handleCreate = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre del dataset es obligatorio');
      return;
    }
    setCreating(true);
    try {
      const data = await post('/datasets', {
        profesional_id: profesionalId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        etiqueta: etiqueta.trim() || undefined,
        criterios: criteriosPayload(criterios),
        incluir_imagenes: true,
      });
      setCreated(data);
      toast.success('Dataset creado correctamente');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo crear el dataset');
    } finally {
      setCreating(false);
    }
  };

  const exportUrl = (format: 'zip' | 'csv') =>
    created ? `${API_BASE}/datasets/${created.id}/export?profesional_id=${profesionalId}&format=${format}` : '#';

  if (created) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#e9efec] mb-6">
          <CheckCircle2 className="h-10 w-10 text-[#0d7a63]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#0c1512] mb-4">Dataset creado</h2>
        <p className="text-[#3f4f49] mb-8">
          <strong>{created.registros}</strong> registros de imagen de{' '}
          <strong>{created.pacientes}</strong> pacientes, anonimizados.
        </p>
        <Card className="border-[#d8e0dc] shadow-none bg-[#fafcfa] text-left mb-8">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-[#d8e0dc] pb-2">
              <span className="text-[#5f7b6f]">ID del dataset</span>
              <span className="font-semibold text-[#0c1512] font-mono">DS{created.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5f7b6f]">Contenido</span>
              <span className="font-semibold text-[#0c1512]">records.csv + images/*.jpg + manifest.json (ZIP)</span>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            className="border-[#d8e0dc] text-[#0c1512] hover:bg-[#fafcfa] shadow-none"
            onClick={() => navigate('/pro/mis-datasets')}
          >
            Ver Mis Datasets
          </Button>
          <a href={exportUrl('zip')} download>
            <Button className="bg-[#0d7a63] hover:bg-[#0a4539] text-white shadow-none">
              <Download className="mr-2 h-4 w-4" /> Descargar
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-12">
      <div className="mb-6">
        <Link to="/pro/mis-datasets" className="inline-flex items-center text-sm font-medium text-[#5f7b6f] hover:text-[#0c1512] mb-4 transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a Mis Datasets
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
          Crear Dataset Clínico
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Define los criterios de extracción. El dataset se exporta anonimizado: sin nombres, correos ni identificadores del paciente.
        </p>
      </div>

      <div className="space-y-6">
        {/* Metadata */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-[15px] font-semibold text-[#0c1512]">1. Información del Dataset</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Nombre del conjunto de datos</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Nevos con cambios reportados 2026"
                className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Descripción u objetivo</label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el propósito o los criterios aplicados."
                className="min-h-[70px] border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Etiqueta de clase (para ML, opcional)</label>
              <Input
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="Ej. melanoma, nevo-atipico, queratosis"
                className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Criterios */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
              <Filter className="h-4 w-4" /> 2. Criterios de Extracción
            </CardTitle>
            <span className="text-xs font-medium text-[#5f7b6f] bg-[#e9efec] px-2 py-0.5 rounded-sm">
              Pacientes vinculados
            </span>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Pacientes */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Pacientes (vacío = todos los vinculados)
              </label>
              <div className="max-h-36 overflow-y-auto rounded-md border border-[#d8e0dc] divide-y divide-[#eef2f0]">
                {vinculados.map((v) => (
                  <label key={v.paciente_id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#fafcfa] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criterios.paciente_ids.includes(v.paciente_id)}
                      onChange={() => togglePaciente(v.paciente_id)}
                      className="accent-[#0d7a63]"
                    />
                    <span className="text-[#0c1512]">{v.paciente_email}</span>
                    <span className="text-[10px] text-[#5f7b6f] font-mono">#{v.paciente_id}</span>
                  </label>
                ))}
                {vinculados.length === 0 && (
                  <div className="px-3 py-4 text-xs text-[#5f7b6f]">No tienes pacientes vinculados.</div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Rango de edad</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={criterios.edad_min}
                    onChange={(e) => setCrit({ edad_min: e.target.value })}
                    placeholder="Min"
                    className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
                  />
                  <span className="text-[#5f7b6f] text-sm">–</span>
                  <Input
                    type="number"
                    min={0}
                    value={criterios.edad_max}
                    onChange={(e) => setCrit({ edad_max: e.target.value })}
                    placeholder="Max"
                    className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
                  />
                  <span className="text-xs text-[#5f7b6f]">años</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Sexo</label>
                <select
                  value={criterios.sexo}
                  onChange={(e) => setCrit({ sexo: e.target.value })}
                  className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]"
                >
                  <option value="">Cualquiera</option>
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                  <option value="unknown">Desconocido</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 rounded-lg border border-[#d8e0dc] p-3 cursor-pointer hover:bg-[#fafcfa]">
                <input
                  type="checkbox"
                  checked={criterios.solo_cambios}
                  onChange={(e) => setCrit({ solo_cambios: e.target.checked })}
                  className="accent-[#0d7a63] mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-[#0c1512]">Solo seguimientos con cambios reportados</div>
                  <div className="text-xs text-[#5f7b6f]">Incluye únicamente fotos de controles donde el paciente reportó cambios o síntomas.</div>
                </div>
              </label>
            </div>

            <div className="rounded-lg border border-[#d8e0dc] bg-[#fafcfa] p-3 flex items-start gap-3">
              <ImageIcon className="h-4 w-4 text-[#0d7a63] mt-0.5 shrink-0" />
              <div className="text-xs text-[#3f4f49]">
                <span className="font-semibold text-[#0c1512]">El dataset siempre incluye las imágenes.</span>{' '}
                Se exporta un ZIP con <span className="font-mono">records.csv</span> (metadata anonimizada),{' '}
                <span className="font-mono">images/*.jpg</span> (una por registro) y <span className="font-mono">manifest.json</span>.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview + acción */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-[#d8e0dc] bg-[#fafcfa] p-4">
          <div className="text-sm">
            {preview ? (
              <span className="text-[#0c1512] font-medium">
                <Users className="inline h-4 w-4 mr-1 text-[#0d7a63]" />
                {preview.pacientes} pacientes • <strong>{preview.registros}</strong> imágenes en el dataset
              </span>
            ) : (
              <span className="text-[#5f7b6f]">Previsualiza cuántos registros cumplen los criterios antes de generar.</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={runPreview}
              disabled={previewing || creating}
              className="border-[#d8e0dc] text-[#0c1512] hover:bg-white shadow-none"
            >
              {previewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
              Previsualizar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || previewing || !nombre.trim()}
              className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none px-8 font-medium h-10"
            >
              {creating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
              ) : (
                <><Database className="mr-2 h-4 w-4" /> Generar Dataset</>
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-[#5f7b6f] flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          La anonimización elimina nombres, correos, teléfonos y notas del paciente. Se conserva un identificador de cohorte seudónimo (PAC-XXXXXXXX) para agrupar imágenes del mismo paciente dentro del dataset.
        </p>
      </div>
    </div>
  );
}
