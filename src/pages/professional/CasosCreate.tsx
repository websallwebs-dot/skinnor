import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Save, Tag, Globe, Lock, Loader2 } from 'lucide-react';
import { get, post, getUser } from '@/lib/api';
import { toast } from 'sonner';

interface PacienteVinculado {
  paciente_id: number;
  paciente_usuario_id: number;
  paciente_email?: string;
  paciente_nombre?: string;
}

interface LesionOpcion {
  id: number;
  nombre: string;
  zona: string;
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

export default function CasosCreate() {
  const navigate = useNavigate();
  const profesionalId = getUser()?.id;

  const [titulo, setTitulo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [riesgo, setRiesgo] = useState('');
  const [etiquetas, setEtiquetas] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [privacy, setPrivacy] = useState<'private' | 'public'>('private');
  const [pacienteId, setPacienteId] = useState('');
  const [lesionId, setLesionId] = useState('');
  const [saving, setSaving] = useState(false);

  const [pacientes, setPacientes] = useState<PacienteVinculado[]>([]);
  const [lesiones, setLesiones] = useState<LesionOpcion[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  useEffect(() => {
    get('/vinculaciones', { profesional_id: String(profesionalId) })
      .then((rows: any[]) => {
        // Dedup por paciente_id (puede haber varios vínculos)
        const map = new Map<number, PacienteVinculado>();
        (rows || []).forEach(v => {
          if (!map.has(v.paciente_id)) {
            map.set(v.paciente_id, {
              paciente_id: v.paciente_id,
              paciente_usuario_id: v.paciente_usuario_id,
              paciente_email: v.paciente_email,
            });
          }
        });
        setPacientes(Array.from(map.values()));
      })
      .catch(() => toast.error('No se pudieron cargar los pacientes vinculados'))
      .finally(() => setLoadingPacientes(false));
  }, [profesionalId]);

  useEffect(() => {
    setLesionId('');
    setLesiones([]);
    if (!pacienteId) return;
    const vinc = pacientes.find(p => String(p.paciente_id) === pacienteId);
    const refId = vinc?.paciente_usuario_id ?? pacienteId;
    get('/lesiones', { paciente_id: String(refId) })
      .then((rows: LesionOpcion[]) => setLesiones(rows || []))
      .catch(() => setLesiones([]));
  }, [pacienteId, pacientes]);

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error('El título del caso es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const tags = etiquetas.split(',').map(t => t.trim()).filter(Boolean);
      await post('/casos-estudio', {
        profesional_id: profesionalId,
        paciente_id: pacienteId ? Number(pacienteId) : null,
        lesion_id: lesionId ? Number(lesionId) : null,
        titulo: titulo.trim(),
        diagnostico: diagnostico.trim() || null,
        riesgo: riesgo || null,
        etiquetas: tags,
        descripcion: descripcion.trim() || null,
        privado: privacy === 'private',
      });
      toast.success('Caso de estudio guardado');
      navigate('/pro/casos');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo guardar el caso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/pro/casos" className="inline-flex items-center text-sm font-medium text-[#5f7b6f] hover:text-[#0c1512] mb-4 transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a Casos
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
            Documentar Caso Clínico
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vincula el caso a un paciente de tu consulta o documéntalo de forma libre.
          </p>
        </div>
        <div className="hidden sm:flex gap-3">
          <Button variant="outline" className="border-[#d8e0dc] text-[#0c1512] shadow-none" onClick={() => navigate('/pro/casos')}>
            Cancelar
          </Button>
          <Button className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Caso
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Paciente vinculado */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-[15px] font-semibold text-[#0c1512]">0. Paciente del Caso (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Paciente vinculado</label>
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full h-9 border border-[#d8e0dc] rounded-md px-3 py-1 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]"
                disabled={loadingPacientes}
              >
                <option value="">— Caso libre (sin paciente) —</option>
                {pacientes.map(p => (
                  <option key={p.paciente_id} value={String(p.paciente_id)}>
                    {p.paciente_email || `Paciente #${p.paciente_id}`}
                  </option>
                ))}
              </select>
              {loadingPacientes && <p className="text-xs text-[#5f7b6f]">Cargando pacientes...</p>}
              {!loadingPacientes && pacientes.length === 0 && (
                <p className="text-xs text-[#5f7b6f]">No tienes pacientes vinculados todavía.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Lesión asociada</label>
              <select
                value={lesionId}
                onChange={(e) => setLesionId(e.target.value)}
                className="w-full h-9 border border-[#d8e0dc] rounded-md px-3 py-1 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]"
                disabled={!pacienteId || lesiones.length === 0}
              >
                <option value="">— Sin lesión específica —</option>
                {lesiones.map(l => (
                  <option key={l.id} value={String(l.id)}>
                    {l.nombre} ({ZONA_LABELS[l.zona] || l.zona})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Información General */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-[15px] font-semibold text-[#0c1512]">1. Información del Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Título del Caso</label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Nevo atípico con cambios reportados en seguimiento"
                className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Diagnóstico (CIE-10 / SNOMED)</label>
                <Input
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Ej. D22.9 Nevo melánico"
                  className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Nivel de Riesgo Clínico</label>
                <select
                  value={riesgo}
                  onChange={(e) => setRiesgo(e.target.value)}
                  className="w-full h-9 border border-[#d8e0dc] rounded-md px-3 py-1 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63] transition-colors"
                >
                  <option value="">Selecciona el riesgo</option>
                  <option value="bajo">Bajo (Benigno / Estable)</option>
                  <option value="medio">Medio (Sospecha / Seguimiento)</option>
                  <option value="alto">Alto (Malignidad / Extirpación)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Etiquetas (Tags)</label>
              <Input
                value={etiquetas}
                onChange={(e) => setEtiquetas(e.target.value)}
                placeholder="Ej. Nevo, Seguimiento, Cambios reportados (separados por coma)"
                className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Detalles Clínicos */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-[15px] font-semibold text-[#0c1512]">2. Detalles y Evolución</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Descripción Clínica y Notas</label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el contexto del caso: evolución de la lesión, motivos de interés y hallazgos relevantes. Si vinculaste un paciente, sus fotos y seguimientos quedan accesibles desde la ficha."
                className="min-h-[120px] border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63] resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacidad */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-[15px] font-semibold text-[#0c1512]">3. Privacidad y Acceso</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div
                className={`border rounded-xl p-4 cursor-pointer transition-all ${privacy === 'private' ? 'border-[#0d7a63] bg-[#f4f6f5]' : 'border-[#d8e0dc] bg-white hover:border-[#b9c6c0]'}`}
                onClick={() => setPrivacy('private')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lock className={`h-4 w-4 ${privacy === 'private' ? 'text-[#0d7a63]' : 'text-[#5f7b6f]'}`} />
                  <span className="font-semibold text-sm text-[#0c1512]">Caso Privado</span>
                </div>
                <p className="text-xs text-[#5f7b6f]">Solo visible para ti en tu biblioteca personal. Los datos del paciente están protegidos.</p>
              </div>

              <div
                className={`border rounded-xl p-4 cursor-pointer transition-all ${privacy === 'public' ? 'border-[#0d7a63] bg-[#f4f6f5]' : 'border-[#d8e0dc] bg-white hover:border-[#b9c6c0]'}`}
                onClick={() => setPrivacy('public')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className={`h-4 w-4 ${privacy === 'public' ? 'text-[#0d7a63]' : 'text-[#5f7b6f]'}`} />
                  <span className="font-semibold text-sm text-[#0c1512]">Compartir con la Comunidad</span>
                </div>
                <p className="text-xs text-[#5f7b6f]">Marca el caso como visible para otros colegas de la plataforma.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones Móvil */}
        <div className="flex sm:hidden gap-3 pt-4 border-t border-[#d8e0dc]">
          <Button variant="outline" className="flex-1 border-[#d8e0dc] text-[#0c1512] shadow-none" onClick={() => navigate('/pro/casos')}>
            Cancelar
          </Button>
          <Button className="flex-1 bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
