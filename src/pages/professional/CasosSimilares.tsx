import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search, ScanSearch, Loader2, AlertTriangle, User, MapPin,
  CalendarDays, Fingerprint, ArrowRight, ImageIcon, Stethoscope, Filter,
} from 'lucide-react';
import { get, post, getUser, API_BASE } from '@/lib/api';
import { FILTER_LABELS, IMAGE_FILTERS, ImageFilter } from '@/lib/imageFilters';
import { useImageFilters } from '@/lib/useImageFilters';
import { toast } from 'sonner';

interface PacienteVinculado {
  paciente_id: number;
  paciente_email: string;
  paciente_usuario_id?: number;
  creado_en: string;
}

interface ImagenPaciente {
  key: string;
  tipo: 'lesion' | 'seguimiento_foto';
  lesion_id: number;
  seguimiento_id?: number;
  foto_id?: number;
  imageUrl: string;
  label: string;
  detalle: string;
  fecha: string;
}

interface ResultadoSimilar {
  id: string;
  score: number | null;
  image_id: string;
  lesion_id: string | null;
  dx: string | null;
  dx_type: string | null;
  age: string | null;
  sex: string | null;
  localization: string | null;
  prediccion_modelo: string | null;
  image_url: string | null;
}

const DX_LABELS: Record<string, string> = {
  mel: 'Melanoma',
  nv: 'Nevo melanocítico',
  bcc: 'Carcinoma basocelular',
  akiec: 'Queratosis actínica / Enf. Bowen',
  bkl: 'Queratosis benigna',
  df: 'Dermatofibroma',
  vasc: 'Lesión vascular',
};

const LOCALIZATION_LABELS: Record<string, string> = {
  trunk: 'Tronco',
  back: 'Espalda',
  'upper extremity': 'Extremidad superior',
  'lower extremity': 'Extremidad inferior',
  head: 'Cabeza',
  neck: 'Cuello',
  abdomen: 'Abdomen',
  'oral/genital': 'Oral/Genital',
  palm: 'Palma',
  sole: 'Planta',
  'anterior torso': 'Torso anterior',
  'posterior torso': 'Torso posterior',
};

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

function dxLabel(dx?: string | null) {
  if (!dx) return 'Sin diagnóstico';
  return DX_LABELS[dx] ? `${DX_LABELS[dx]} (${dx})` : dx;
}

function locLabel(loc?: string | null) {
  if (!loc) return null;
  return LOCALIZATION_LABELS[loc.toLowerCase()] || loc;
}

function sexLabel(sex?: string | null) {
  if (!sex) return null;
  return sex === 'male' ? 'Hombre' : sex === 'female' ? 'Mujer' : sex;
}

function fmtFecha(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CasosSimilares() {
  const profesionalId = getUser()?.id;
  const [pacientes, setPacientes] = useState<PacienteVinculado[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [pacienteInfo, setPacienteInfo] = useState<any>(null);
  const [imagenes, setImagenes] = useState<ImagenPaciente[]>([]);
  const [loadingPaciente, setLoadingPaciente] = useState(false);

  const [seleccion, setSeleccion] = useState<ImagenPaciente | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoSimilar[] | null>(null);
  const [busquedaMeta, setBusquedaMeta] = useState<{ dim: number; captura: any } | null>(null);

  // Pila de filtros de preprocesamiento de imagen (se encadenan entre sí)
  const { stack: filterStack, urls: filteredUrls, processing: imagesProcessing, setItems, addFilter, removeAt, reset: resetFilters } = useImageFilters();

  useEffect(() => {
    (async () => {
      try {
        const data = await get('/vinculaciones', { profesional_id: String(profesionalId) });
        setPacientes(data || []);
      } catch {
        toast.error('No se pudieron cargar los pacientes vinculados');
      } finally {
        setLoadingPacientes(false);
      }
    })();
  }, [profesionalId]);

  const cargarPaciente = useCallback(async (pid: number) => {
    setPacienteId(pid);
    setPacienteInfo(null);
    setImagenes([]);
    setSeleccion(null);
    setResultados(null);
    setBusquedaMeta(null);
    setLoadingPaciente(true);
    try {
      const [info, lesiones] = await Promise.all([
        get(`/pacientes/${pid}`),
        get('/lesiones', { paciente_id: String(pid) }),
      ]);
      setPacienteInfo(info);

      const items: ImagenPaciente[] = [];
      const lesionList: any[] = lesiones || [];
      const segsPorLesion = await Promise.all(
        lesionList.map((l) => get(`/lesiones/${l.id}/seguimientos`).catch(() => []))
      );

      lesionList.forEach((lesion, li) => {
        const zona = ZONA_LABELS[lesion.zona] || lesion.zona || '';
        items.push({
          key: `lesion-${lesion.id}`,
          tipo: 'lesion',
          lesion_id: lesion.id,
          imageUrl: `${API_BASE}/lesiones/${lesion.id}/foto`,
          label: 'Foto inicial',
          detalle: `${lesion.nombre} • ${zona}`,
          fecha: fmtFecha(lesion.creado_en),
        });

        const segs: any[] = segsPorLesion[li] || [];
        segs.forEach((seg) => {
          const fotos: any[] = [...(seg.fotos || [])].sort((a, b) => a.orden - b.orden);
          fotos.forEach((f) => {
            items.push({
              key: `seg-${seg.id}-foto-${f.id}`,
              tipo: 'seguimiento_foto',
              lesion_id: lesion.id,
              seguimiento_id: seg.id,
              foto_id: f.id,
              imageUrl: `${API_BASE}/lesiones/${lesion.id}/seguimientos/${seg.id}/fotos/${f.id}`,
              label: 'Seguimiento',
              detalle: `${lesion.nombre} • ${zona}`,
              fecha: fmtFecha(seg.fecha),
            });
          });
        });
      });

      items.sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
      setImagenes(items);
    } catch {
      toast.error('No se pudo cargar la información del paciente');
    } finally {
      setLoadingPaciente(false);
    }
  }, []);

  const buscarSimilares = async () => {
    if (!seleccion || !pacienteId) return;
    setBuscando(true);
    setResultados(null);
    try {
      const data = await post('/similares/buscar', {
        profesional_id: profesionalId,
        paciente_id: pacienteId,
        tipo: seleccion.tipo,
        lesion_id: seleccion.lesion_id,
        seguimiento_id: seleccion.seguimiento_id,
        foto_id: seleccion.foto_id,
      });
      const items = data.resultados || [];
      setResultados(items);
      setBusquedaMeta({ dim: data.embedding_dim, captura: data.captura });
      setItems(items.map((r: ResultadoSimilar) => ({
        id: r.image_id,
        src: r.image_url ? `${API_BASE}${r.image_url}` : '',
      })));
      resetFilters();
      toast.success(`${items.length} casos similares encontrados`);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron buscar casos similares');
    } finally {
      setBuscando(false);
    }
  };

  const edad = pacienteInfo?.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(pacienteInfo.fecha_nacimiento).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="max-w-7xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
          Buscar Casos Similares
        </h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
          Selecciona un paciente vinculado y una de sus imágenes. El modelo{' '}
          <strong>Google Derm Foundation</strong> genera un embedding de 6144 dimensiones que se compara
          por similitud coseno contra el índice <strong>skin222</strong> del dataset HAM10000.
        </p>
      </div>

      {/* Paso 1: Paciente */}
      <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-[#0d7a63]" />
            <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wide">1. Selecciona un paciente</h2>
          </div>
          {loadingPacientes ? (
            <div className="flex items-center gap-2 text-sm text-[#5f7b6f]"><Loader2 className="h-4 w-4 animate-spin" /> Cargando pacientes...</div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="w-full sm:max-w-md">
                <label className="text-xs font-semibold text-[#5f7b6f] uppercase mb-1.5 block">Paciente vinculado</label>
                <select
                  value={pacienteId ?? ''}
                  onChange={(e) => cargarPaciente(Number(e.target.value))}
                  className="w-full h-10 border border-[#d8e0dc] rounded-md px-3 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]"
                >
                  <option value="">— Elige un paciente —</option>
                  {pacientes.map((p) => (
                    <option key={p.paciente_id} value={p.paciente_id}>
                      {p.paciente_email} (ID {p.paciente_id})
                    </option>
                  ))}
                </select>
              </div>
              {pacienteInfo && (
                <div className="flex items-center gap-3 text-sm text-[#3f4f49] pb-1">
                  <span className="font-medium text-[#0c1512]">{pacienteInfo.usuario_nombre || pacienteInfo.email}</span>
                  {edad !== null && <span className="text-[#5f7b6f]">• {edad} años</span>}
                  {pacienteInfo.sexo && <span className="text-[#5f7b6f]">• {pacienteInfo.sexo}</span>}
                </div>
              )}
            </div>
          )}
          {!loadingPacientes && pacientes.length === 0 && (
            <p className="text-sm text-[#c77a0b] mt-3 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> No tienes pacientes vinculados. Genera un código de acceso en "Solicitudes / Enlaces".
            </p>
          )}
        </CardContent>
      </Card>

      {/* Paso 2: Imagen */}
      {pacienteId && (
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4 text-[#0d7a63]" />
              <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wide">2. Selecciona una imagen del paciente</h2>
            </div>
            {loadingPaciente ? (
              <div className="flex items-center gap-2 text-sm text-[#5f7b6f]"><Loader2 className="h-4 w-4 animate-spin" /> Cargando imágenes...</div>
            ) : imagenes.length === 0 ? (
              <p className="text-sm text-[#5f7b6f]">Este paciente aún no tiene imágenes registradas.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto pr-1">
                  {imagenes.map((img) => (
                    <button
                      key={img.key}
                      onClick={() => setSeleccion(img)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all text-left ${
                        seleccion?.key === img.key
                          ? 'border-[#0d7a63] ring-2 ring-[#0d7a63]/30'
                          : 'border-[#d8e0dc] hover:border-[#0d7a63]/60'
                      }`}
                    >
                      <img src={img.imageUrl} alt={img.label} className="w-full aspect-square object-cover bg-[#f4f6f5]" loading="lazy" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] px-1.5 py-1 truncate">
                        {img.fecha} • {img.label}
                      </div>
                    </button>
                  ))}
                </div>

                {seleccion && (
                  <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-[#d8e0dc] bg-[#fafcfa] p-4">
                    <img src={seleccion.imageUrl} alt="Seleccionada" className="w-20 h-20 rounded-md object-cover border border-[#d8e0dc]" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-[#0c1512]">{seleccion.detalle}</div>
                      <div className="text-[#5f7b6f] text-xs mt-0.5">
                        {seleccion.label} • {seleccion.fecha}
                      </div>
                    </div>
                    <Button
                      onClick={buscarSimilares}
                      disabled={buscando}
                      className="bg-[#0d7a63] hover:bg-[#0a4539] text-white shadow-none whitespace-nowrap"
                    >
                      {buscando ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando con Derm Foundation...</>
                      ) : (
                        <><ScanSearch className="mr-2 h-4 w-4" /> Buscar casos similares en el dataset HAM10.000</>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Resultados */}
      {buscando && (
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#0d7a63] mx-auto mb-3" />
            <p className="text-sm text-[#3f4f49]">Generando embedding con Google Derm Foundation y consultando Pinecone...</p>
            <p className="text-xs text-[#5f7b6f] mt-1">La inferencia puede tardar varios segundos.</p>
          </CardContent>
        </Card>
      )}

      {resultados && !buscando && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0c1512] flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#0d7a63]" />
              12 casos más similares{busquedaMeta ? ` • embedding ${busquedaMeta.dim} dims` : ''}
              {filterStack.length > 0 && (
                <span className="text-xs font-medium text-[#0d7a63] bg-[#cfe6dd] px-2 py-0.5 rounded">
                  Cadena: {filterStack.map((f) => FILTER_LABELS[f]).join(' → ')}
                </span>
              )}
            </h2>
          </div>

          {/* Filtros de preprocesamiento de imagen (se pueden encadenar) */}
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Filter className="h-4 w-4 text-[#5f7b6f]" />
                <span className="text-xs font-medium text-[#5f7b6f]">Agregar filtro:</span>
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) addFilter(e.target.value as ImageFilter); e.target.value = ''; }}
                  disabled={imagesProcessing}
                  className="border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0c1512] cursor-pointer w-auto min-w-[220px]"
                >
                  <option value="">Selecciona un filtro…</option>
                  {IMAGE_FILTERS.filter((f) => f !== 'none').map((f) => (
                    <option key={f} value={f}>{FILTER_LABELS[f]}</option>
                  ))}
                </select>
                {imagesProcessing && (
                  <div className="ml-3 flex items-center gap-1 text-[#0c1512]">
                    <div className="h-3 w-3 border-2 border-[#0c1512] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-medium">Procesando...</span>
                  </div>
                )}
                <span className="ml-auto text-[10px] text-[#5f7b6f]">
                  Canvas API (sin servidor)
                </span>
              </div>

              {filterStack.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#d8e0dc]">
                  <span className="text-[11px] font-medium text-[#5f7b6f]">Cadena de filtros:</span>
                  {filterStack.map((f, i) => (
                    <span
                      key={`${f}-${i}`}
                      className="inline-flex items-center gap-1.5 bg-[#e9efec] border border-[#0d7a63]/30 text-[#0a4539] text-[11px] font-medium px-2.5 py-1 rounded-full"
                    >
                      <span className="text-[#5f7b6f] font-mono text-[10px]">{i + 1}.</span>
                      {FILTER_LABELS[f]}
                      <button
                        onClick={() => removeAt(i)}
                        disabled={imagesProcessing}
                        className="ml-0.5 hover:text-[#c77a0b] disabled:opacity-40"
                        title="Quitar este filtro"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={resetFilters}
                    disabled={imagesProcessing}
                    className="text-[11px] font-medium text-[#0d7a63] hover:text-[#0a4539] underline underline-offset-2 disabled:opacity-40"
                  >
                    Ver original
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {resultados.map((r, i) => {
              const imgSrc = filteredUrls[r.image_id] || (r.image_url ? `${API_BASE}${r.image_url}` : '');
              return (
              <Card key={r.id || i} className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden hover:border-[#0d7a63] transition-colors">
                <div className="aspect-square bg-[#f4f6f5] relative">
                  {imgSrc ? (
                    <>
                      <img src={imgSrc} alt={r.image_id} className="w-full h-full object-cover" loading="lazy" />
                      {imagesProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <div className="h-4 w-4 border-2 border-[#0c1512] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-[#5f7b6f] opacity-40" /></div>
                  )}
                  <span className="absolute top-2 left-2 bg-[#0c1512]/85 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {r.score != null ? `${(r.score * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
                <CardContent className="p-3">
                  <div className="text-[13px] font-semibold text-[#0c1512] leading-tight">{dxLabel(r.dx)}</div>
                  <div className="text-[11px] text-[#5f7b6f] mt-1 space-y-0.5">
                    {r.localization && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {locLabel(r.localization)}</div>}
                    {(r.age || r.sex) && (
                      <div className="flex items-center gap-1">
                        <Fingerprint className="h-3 w-3" />
                        {[r.age ? `${r.age} años` : null, sexLabel(r.sex)].filter(Boolean).join(' • ')}
                      </div>
                    )}
                    {r.dx_type && <div className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {r.dx_type === 'follow_up' ? 'Seguimiento' : r.dx_type}</div>}
                  </div>
                  <div className="text-[10px] text-[#5f7b6f] mt-2 font-mono truncate">{r.image_id}{r.lesion_id ? ` • ${r.lesion_id}` : ''}</div>
                </CardContent>
              </Card>
              );
            })}
          </div>
          <p className="text-xs text-[#5f7b6f] mt-4 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Los resultados son similitudes vectoriales sobre el dataset HAM10000 con fines de apoyo a la búsqueda de referencias. No constituyen un diagnóstico médico.
          </p>
        </div>
      )}
    </div>
  );
}
