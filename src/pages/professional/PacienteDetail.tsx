import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, API_BASE } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AbcdeTremorAnalytics from './AbcdeTremorAnalytics';
import GaleriaImagenes4Col from './GaleriaImagenes4Col';
import { buildCapturasFromPatient } from './pacienteCapturas';
import HistorialRegistros from './HistorialRegistros';
import LaboratorioIA from './LaboratorioIA';
import { 
  ChevronLeft, 
  Mail, 
  Calendar, 
  Eye, 
  FileText, 
  FileClock,
  FlaskConical, 
  BarChart3, 
  Activity, 
  Sparkles, 
  CheckSquare, 
  Square,
  Download, 
  Copy, 
  Loader2, 
  Bot, 
  Printer, 
  Edit3, 
  Check, 
  PenTool, 
  ShieldCheck, 
  AlertTriangle,
  Upload,
  RefreshCw,
  TrendingUp,
  Camera
} from 'lucide-react';

interface PacienteReal {
  id: number;
  usuario_id: number;
  fecha_nacimiento?: string;
  sexo?: string;
  telefono?: string;
  creado_en?: string;
  email?: string;
  usuario_nombre?: string;
}

interface LesionReal {
  id: number;
  nombre: string;
  zona: string;
  ubicacion?: string;
  tamaño?: string;
  creado_en: string;
}

interface SeguimientoReal {
  id: number;
  lesion_id: number;
  fecha: string;
  cambios: 'si' | 'no';
  color: 'si' | 'no';
  sintomas: 'si' | 'no';
  notas?: string;
  fotos?: { id: number; orden: number }[];
  foto_count?: number;
}

interface ConsultaReal {
  id: number;
  tema: string;
  estado: string;
  creado_en: string;
  profesional_nombre?: string;
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

function calcEdad(fecha?: string): number | null {
  if (!fecha) return null;
  const birth = new Date(fecha);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let edad = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) edad--;
  return edad;
}

export default function PacienteDetail() {
  const { id } = useParams();
  const pacienteRowId = Number(id);

  const [paciente, setPaciente] = useState<PacienteReal | null>(null);
  const [lesiones, setLesiones] = useState<LesionReal[]>([]);
  const [seguimientosPorLesion, setSeguimientosPorLesion] = useState<Record<number, SeguimientoReal[]>>({});
  const [consultas, setConsultas] = useState<ConsultaReal[]>([]);
  const [vinculado, setVinculado] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPaciente = useCallback(async () => {
    setLoading(true);
    try {
      const p = await get(`/pacientes/${pacienteRowId}`);
      if (p?.error) {
        setPaciente(null);
        return;
      }
      setPaciente(p);

      const storedUser = localStorage.getItem('skinnor_user');
      const profesionalId = storedUser ? Number(JSON.parse(storedUser).id) : null;

      const [lesData, consData, vincData] = await Promise.all([
        get('/lesiones', { paciente_id: String(p.usuario_id) }),
        get('/consultas', { paciente_id: String(p.id) }),
        profesionalId
          ? get('/vinculaciones', { profesional_id: String(profesionalId), paciente_id: String(p.id) })
          : Promise.resolve([]),
      ]);
      const les: LesionReal[] = lesData || [];
      setLesiones(les);
      setConsultas(consData || []);
      setVinculado(Array.isArray(vincData) ? vincData.length > 0 : false);

      const segsMap: Record<number, SeguimientoReal[]> = {};
      await Promise.all(
        les.map(async (l) => {
          const segs = await get(`/lesiones/${l.id}/seguimientos`);
          segsMap[l.id] = segs || [];
        })
      );
      setSeguimientosPorLesion(segsMap);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo cargar el paciente');
      setPaciente(null);
    } finally {
      setLoading(false);
    }
  }, [pacienteRowId]);

  useEffect(() => {
    loadPaciente();
  }, [loadPaciente]);

  // Capturas fotográficas reales: foto base de cada lesión + todas las fotos de seguimiento
  const capturas = useMemo(
    () => buildCapturasFromPatient(lesiones, seguimientosPorLesion),
    [lesiones, seguimientosPorLesion]
  );

  const [activeTab, setActiveTab] = useState<'resumen' | 'historial' | 'metricas' | 'laboratorio' | 'informe'>('resumen');
  
  // Report generation state
  const [purposeType, setPurposeType] = useState<string>('escrito');
  const [customPurpose, setCustomPurpose] = useState<string>(
    'Derivación urgente a Cirugía Oncológica para biopsia excisional con margen de 2mm por sospecha clínica y teledermatoscópica de melanoma en etapa inicial.'
  );
  const [doctorNotes, setDoctorNotes] = useState<string>(
    'Paciente refiere leve prurito en la lesión en las últimas 3 semanas. Sin sangrado ni ulceración macroscópica visible.'
  );
  const [includeProfile, setIncludeProfile] = useState<boolean>(true);
  const [includeAbcd, setIncludeAbcd] = useState<boolean>(true);
  const [includeHistory, setIncludeHistory] = useState<boolean>(true);
  const [includeDigitalSignature, setIncludeDigitalSignature] = useState<boolean>(true);
  
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);
  const [isEditingReport, setIsEditingReport] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  
  // Generated content editable text
  const [reportTitle, setReportTitle] = useState<string>('Informe Clínico y Propuesta Terapéutica');
  const [reportContent, setReportContent] = useState<string>('');

  const pacienteNombre = paciente?.usuario_nombre || 'Paciente';
  const edad = calcEdad(paciente?.fecha_nacimiento);
  const sexoLabel = paciente?.sexo === 'Femenino' ? 'Femenino' : paciente?.sexo === 'Masculino' ? 'Masculino' : paciente?.sexo || '—';

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="flex items-center justify-center h-64 text-[#5f7b6f]">Cargando expediente del paciente...</div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="max-w-6xl">
        <Link to="/pro/pacientes" className="inline-flex items-center text-sm font-medium text-[#5f7b6f] hover:text-[#0c1512] mb-4 transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a Pacientes
        </Link>
        <div className="text-center py-20 text-[#5f7b6f]">Paciente no encontrado o sin acceso.</div>
      </div>
    );
  }

  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      setReportGenerated(true);

      const purposeName = purposeType === 'derivacion' 
        ? 'Derivación a Especialidad (Oncología)'
        : purposeType === 'interconsulta'
        ? 'Interconsulta Médica Dermatológica'
        : purposeType === 'epicrisis'
        ? 'Epicrisis y Resumen de Evolución Clínica'
        : purposeType === 'paciente'
        ? 'Informe Explicativo para el Paciente'
        : purposeType === 'seguro'
        ? 'Informe para Cobertura Médica / Aseguradora'
        : 'Informe con Propósito Específico';

      setReportTitle(purposeName);

      const generatedDraft = `INSTITUTO DE TELEDERMATOLOGÍA SKINNOR - CENTRO DERMATOLÓGICO SAN CRISTÓBAL
========================================================================
DOCUMENTO CLÍNICO OFICIAL DE EVALUACIÓN TELEDERMATOSCÓPICA

1. IDENTIFICACIÓN DEL PACIENTE
------------------------------------------------------------------------
- Paciente: ${pacienteNombre}
- Edad: ${edad ?? '—'} años${paciente.fecha_nacimiento ? ` (Fecha Nac: ${new Date(paciente.fecha_nacimiento).toLocaleDateString('es-CL')})` : ''}
- Email: ${paciente.email || '—'}
- ID Expediente: PAC-${String(paciente.id).padStart(4, '0')}
- Fecha de Emisión: 16 de Agosto de 2026
- Médico Tratante: Dr. Alejandro Morales Rivera (RNPI-849201)

2. PROPÓSITO DEL INFORME
------------------------------------------------------------------------
${customPurpose.trim() || 'Evaluación integral y conducta clínica sobre lesión melanocítica en extremidad superior izquierda.'}

${doctorNotes.trim() ? `OBSERVACIONES ADICIONALES DEL MÉDICO:\n${doctorNotes.trim()}\n` : ''}
${includeProfile ? `3. ANTECEDENTES Y FACTORES DE RIESGO
------------------------------------------------------------------------
- Fototipo cutáneo: Tipo II (Fitzpatrick: piel clara, eritema solar frecuente, pigmentación escasa).
- Conteo aproximado de nevos corporales: 50 a 100 lesiones pigmentadas.
- Antecedentes mórbidos familiares: Familiar de 1er grado con antecedente de melanoma cutáneo.
` : ''}
${includeAbcd ? `4. ANÁLISIS DE EVOLUCIÓN DIGITAL SECUENCIAL (REGLA ABCD)
------------------------------------------------------------------------
- Lesión evaluada: Nevo Brazo Izquierdo (ID: LES-0042)
- Variación temporal longitudinal (T1 -> T2 en intervalo de 6 meses):
  * Asimetría estructural: +14.2% (Incremento significativo en eje transversal)
  * Bordes: Irregularidad focal en cuadrante supero-externo
  * Colorimetría: Patrón policromático (marrón oscuro, marrón claro y velo gris-azulado periférico)
  * Diámetro mayor medido: 6.8 mm (Crecimiento de +1.1 mm respecto a basal)
` : ''}
${includeHistory ? `5. SÍNTESIS DIAGNÓSTICA Y PLAN TERAPÉUTICO SUGERIDO
------------------------------------------------------------------------
- Impresión Diagnóstica: Lesión melanocítica atípica con signos de transformación arquitectural y cinética de cambio acelerada.
- Plan / Recomendación Clínica:
  1. Derivación preferente a Cirugía Oncológica / Dermatología Quirúrgica.
  2. Programar biopsia excisional completa con margen de seguridad oncológico de 2 mm.
  3. Envío de muestra a estudio histopatológico con inmunohistoquímica (Melan-A, S100, HMB-45).
  4. Mantener registro fotográfico de mapeo corporal total de control cada 6 meses.
` : ''}
========================================================================
Firmado electrónicamente por:
Dr. Alejandro Morales Rivera
Médico Cirujano - Especialista en Dermatología
RNPI: 849201 • Centro Dermatológico San Cristóbal`;

      setReportContent(generatedDraft);
    }, 2000);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportContent);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <Link to="/pro/pacientes" className="inline-flex items-center text-sm font-medium text-[#5f7b6f] hover:text-[#0c1512] mb-4 transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a Pacientes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
                {pacienteNombre}
              </h1>
              {vinculado === true && (
                <span className="text-[11px] font-medium uppercase tracking-widest text-[#0d7a63] bg-[#e9efec] px-2.5 py-1 rounded-sm border border-[#d8e0dc]">
                  Vinculado
                </span>
              )}
              {vinculado === false && (
                <span className="text-[11px] font-medium uppercase tracking-widest text-[#c77a0b] bg-[#f9ecd4] px-2.5 py-1 rounded-sm">
                  Sin vinculación
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              ID: PAC-{String(paciente.id).padStart(4, '0')}
              {edad !== null && ` • ${edad} años`}
              {` • ${sexoLabel}`}
              {paciente.email && ` • ${paciente.email}`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-[#d8e0dc] shadow-none text-[#0c1512]">
              <Mail className="mr-2 h-4 w-4" /> Enviar Mensaje
            </Button>
            <Button className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none">
              <Calendar className="mr-2 h-4 w-4" /> Agendar Consulta
            </Button>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex gap-6 border-b border-[#d8e0dc] mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'resumen' ? 'text-[#0c1512]' : 'text-[#5f7b6f] hover:text-[#0c1512]'}`}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Resumen Clínico
          </div>
          {activeTab === 'resumen' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c1512] rounded-t-full"></div>}
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'historial' ? 'text-[#0c1512]' : 'text-[#5f7b6f] hover:text-[#0c1512]'}`}
        >
          <div className="flex items-center gap-2">
            <FileClock className="h-4 w-4" /> Historial de Registros
          </div>
          {activeTab === 'historial' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c1512] rounded-t-full"></div>}
        </button>

        <button
          onClick={() => setActiveTab('metricas')}
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'metricas' ? 'text-[#0c1512]' : 'text-[#5f7b6f] hover:text-[#0c1512]'}`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Métricas ABCDE
          </div>
          {activeTab === 'metricas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c1512] rounded-t-full"></div>}
        </button>

        <button
          onClick={() => setActiveTab('laboratorio')}
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'laboratorio' ? 'text-[#0c1512]' : 'text-[#5f7b6f] hover:text-[#0c1512]'}`}
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Laboratorio IA
            <span className="text-[10px] font-mono text-[#5f7b6f] bg-[#f4f6f5] px-1.5 py-0.2 rounded border border-[#d8e0dc]">
              En Desarrollo
            </span>
          </div>
          {activeTab === 'laboratorio' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c1512] rounded-t-full"></div>}
        </button>

        <button
          onClick={() => setActiveTab('informe')}
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'informe' ? 'text-[#0c1512]' : 'text-[#5f7b6f] hover:text-[#0c1512]'}`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0d7a63]" /> Síntesis Clínica & Informe IA
          </div>
          {activeTab === 'informe' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c1512] rounded-t-full"></div>}
        </button>
      </div>

      {/* Tab 1: Resumen Clínico */}
      {activeTab === 'resumen' && (
        <div className="space-y-8">
          {/* Top Row: Perfil Médico + Factores de Riesgo + Lesiones */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
                <div className="border-b border-[#d8e0dc] px-5 py-4 bg-[#fafcfa]">
                  <h2 className="text-[15px] font-semibold text-[#0c1512]">Perfil Médico</h2>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <div className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide mb-1">Email</div>
                    <div className="text-sm text-[#0c1512]">{paciente.email || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide mb-1">Teléfono</div>
                    <div className="text-sm text-[#0c1512]">{paciente.telefono || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide mb-1">Fecha de nacimiento</div>
                    <div className="text-sm text-[#0c1512]">
                      {paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-CL') : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide mb-1">Sexo</div>
                    <div className="text-sm text-[#0c1512]">{sexoLabel}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide mb-1">Paciente desde</div>
                    <div className="text-sm text-[#0c1512]">
                      {paciente.creado_en ? new Date(paciente.creado_en).toLocaleDateString('es-CL') : '—'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
                <div className="border-b border-[#d8e0dc] px-5 py-4 bg-[#fafcfa]">
                  <h2 className="text-[15px] font-semibold text-[#0c1512]">Factores de Riesgo</h2>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <div className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide mb-1">Fototipo de Piel</div>
                    <div className="text-sm text-[#0c1512]">Tipo II (Clara, se quema fácil, broncea poco)</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide mb-1">Cantidad de Lunares</div>
                    <div className="text-sm text-[#0c1512]">Entre 50 y 100</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide mb-1">Antecedentes Familiares</div>
                    <div className="text-sm text-[#0c1512]">Sí (Madre/Padre con melanoma)</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
                <div className="border-b border-[#d8e0dc] px-5 py-4 flex justify-between items-center bg-[#fafcfa]">
                  <h2 className="text-[15px] font-semibold text-[#0c1512]">Lesiones en Seguimiento</h2>
                  <span className="text-xs font-medium text-[#5f7b6f]">{lesiones.length} registrada{lesiones.length === 1 ? '' : 's'}</span>
                </div>
                <CardContent className="p-0">
                  {lesiones.length === 0 ? (
                    <div className="p-6 text-sm text-[#5f7b6f] text-center">
                      Este paciente aún no tiene lesiones registradas.
                    </div>
                  ) : (
                  <div className="divide-y divide-[#d8e0dc]">
                    {lesiones.map((l) => {
                      const segs = seguimientosPorLesion[l.id] || [];
                      const ultimo = segs[0];
                      const hayCambios = segs.some((s) => s.cambios === 'si' || s.color === 'si' || s.sintomas === 'si');
                      return (
                        <div key={l.id} className="p-5 flex items-center justify-between hover:bg-[#fafcfa] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded overflow-hidden bg-[#e9efec] border border-[#d8e0dc] shrink-0">
                              <img
                                src={`${API_BASE}/lesiones/${l.id}/foto`}
                                alt={l.nombre}
                                className="w-full h-full object-cover opacity-90 mix-blend-multiply"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-[#0c1512]">{l.nombre}</span>
                                {hayCambios ? (
                                  <span className="text-[10px] bg-[#c77a0b] text-white font-medium px-2 py-0.5 rounded">
                                    Cambios reportados
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-[#e9efec] text-[#5f7b6f] font-medium px-2 py-0.5 rounded border border-[#d8e0dc]">
                                    Estable
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#5f7b6f]">
                                {ZONA_LABELS[l.zona] || l.zona}
                                {ultimo && ` • Último registro: ${new Date(ultimo.fecha).toLocaleDateString('es-CL')}`}
                                {' • '}{segs.length} seguimiento{segs.length === 1 ? '' : 's'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
                <div className="border-b border-[#d8e0dc] px-5 py-4 flex justify-between items-center bg-[#fafcfa]">
                  <h2 className="text-[15px] font-semibold text-[#0c1512]">Historial de Consultas & Telemedicina</h2>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#0d7a63] h-7"
                    onClick={() => setActiveTab('historial')}
                  >
                    Ver Todo el Historial
                  </Button>
                </div>
                <CardContent className="p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#fafcfa] border-b border-[#d8e0dc] text-[#5f7b6f] text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 font-medium">Fecha</th>
                        <th className="px-5 py-3 font-medium">Motivo</th>
                        <th className="px-5 py-3 font-medium">Estado</th>
                        <th className="px-5 py-3 font-medium text-right">Documento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d8e0dc]">
                      {consultas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-6 text-center text-[#5f7b6f] text-sm">
                            Sin consultas registradas con este paciente.
                          </td>
                        </tr>
                      ) : (
                        consultas.map((c) => (
                          <tr key={c.id} className="hover:bg-[#fafcfa] transition-colors">
                            <td className="px-5 py-3 font-medium text-[#0c1512]">
                              {new Date(c.creado_en).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-3 text-[#3f4f49]">{c.tema}</td>
                            <td className="px-5 py-3">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                                c.estado === 'resuelto'
                                  ? 'text-[#0d7a63] bg-[#e9efec]'
                                  : c.estado === 'cerrado'
                                  ? 'text-[#5f7b6f] bg-[#f4f6f5]'
                                  : 'text-[#c77a0b] bg-[#f9ecd4]'
                              }`}>
                                {c.estado === 'pendiente' ? 'Pendiente' : c.estado === 'resuelto' ? 'Resuelto' : 'Cerrado'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right text-xs text-[#5f7b6f]">
                              {c.profesional_nombre || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Dedicated Visual Gallery of Images in 4 Columns */}
          <GaleriaImagenes4Col
            fotos={capturas}
            titulo="Secuencia Fotográfica del Paciente"
            subtitulo={`${paciente?.usuario_nombre || 'Paciente'} • Registros enviados por el paciente a través de la app.`}
            onGoToLab={() => setActiveTab('laboratorio')}
            onGoToHistory={() => setActiveTab('historial')}
          />

          {/* Evolución Fotográfica del Paciente (datos reales) */}
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
            <div className="border-b border-[#d8e0dc] px-5 py-4 bg-[#fafcfa] flex justify-between items-center">
              <div>
                <h2 className="text-[15px] font-semibold text-[#0c1512]">Evolución Fotográfica del Paciente</h2>
                <p className="text-xs text-[#5f7b6f] mt-0.5">
                  Registros de seguimiento enviados por el paciente, ordenados del más reciente al más antiguo.
                </p>
              </div>
              <span className="text-xs font-medium text-[#5f7b6f]">
                {lesiones.reduce((acc, l) => acc + (seguimientosPorLesion[l.id]?.length || 0), 0)} registros
              </span>
            </div>
            <CardContent className="p-0">
              {lesiones.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#5f7b6f]">
                  Este paciente aún no ha enviado registros fotográficos.
                </div>
              ) : (
                <div className="divide-y divide-[#d8e0dc]">
                  {lesiones.map((l) => {
                    const segs = [...(seguimientosPorLesion[l.id] || [])].sort(
                      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                    );
                    const primeraFecha = segs.length ? new Date(segs[segs.length - 1].fecha).getTime() : null;
                    return (
                      <div key={l.id} className="p-5">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-14 w-14 rounded-md overflow-hidden bg-[#e9efec] border border-[#d8e0dc] shrink-0">
                            <img
                              src={`${API_BASE}/lesiones/${l.id}/foto`}
                              alt={l.nombre}
                              className="w-full h-full object-cover opacity-90 mix-blend-multiply"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-[#0c1512]">{l.nombre}</div>
                            <div className="text-xs text-[#5f7b6f]">
                              {ZONA_LABELS[l.zona] || l.zona}
                              {l.tamaño && ` • ${l.tamaño} mm iniciales`}
                              {primeraFecha && ` • En seguimiento desde ${new Date(primeraFecha).toLocaleDateString('es-CL')}`}
                            </div>
                          </div>
                        </div>

                        {segs.length === 0 ? (
                          <p className="text-xs text-[#5f7b6f] pl-1">Sin registros de seguimiento todavía.</p>
                        ) : (
                          <div className="space-y-4">
                            {segs.map((s) => {
                              const fotos = s.fotos || [];
                              const dia = Math.max(0, Math.ceil((Date.now() - new Date(s.fecha).getTime()) / 86400000));
                              return (
                                <div key={s.id} className="rounded-lg border border-[#d8e0dc] bg-[#fafcfa] p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-[#0c1512]">
                                        {new Date(s.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                      <span className="text-[10px] font-medium bg-[#e9efec] text-[#5f7b6f] px-1.5 py-0.5 rounded-sm">
                                        DÍA {dia}
                                      </span>
                                      <span className="text-[10px] text-[#5f7b6f]">Registro #{s.id}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                      {(['cambios', 'color', 'sintomas'] as const).map((campo) => (
                                        <span
                                          key={campo}
                                          className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border ${
                                            s[campo] === 'si'
                                              ? 'bg-[#f9ecd4] text-[#8a5a0a] border-[#f2d8a7]'
                                              : 'bg-white text-[#5f7b6f] border-[#d8e0dc]'
                                          }`}
                                        >
                                          {campo === 'cambios' ? 'Tamaño/Forma' : campo === 'color' ? 'Color' : 'Síntomas'}: {s[campo] === 'si' ? 'Sí' : 'No'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  {fotos.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                      {fotos.map((f) => (
                                        <a
                                          key={f.id}
                                          href={`${API_BASE}/lesiones/${l.id}/seguimientos/${s.id}/fotos/${f.id}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="block rounded-md overflow-hidden border border-[#d8e0dc] bg-white hover:border-[#0d7a63] transition-colors"
                                        >
                                          <img
                                            src={`${API_BASE}/lesiones/${l.id}/seguimientos/${s.id}/fotos/${f.id}`}
                                            alt={`Registro ${s.id} — foto ${f.orden + 1}`}
                                            className="w-full aspect-square object-cover"
                                            loading="lazy"
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  {s.notas && (
                                    <p className="text-xs text-[#3f4f49] mt-3 bg-white border border-[#d8e0dc] rounded-md p-2.5">
                                      {s.notas}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Historial de Registros */}
      {activeTab === 'historial' && (
        <HistorialRegistros
          fotos={capturas}
          pacienteNombre={paciente?.usuario_nombre}
          onGoToLab={() => setActiveTab('laboratorio')}
          onGoToReport={() => setActiveTab('informe')}
          onGoToMetrics={() => setActiveTab('metricas')}
        />
      )}
      
      {/* Tab 2: Métricas ABCDE (Tremor Analytics) */}
      {activeTab === 'metricas' && (
        <AbcdeTremorAnalytics onTransferToReport={() => setActiveTab('informe')} />
      )}
      
      {/* Tab 3: Laboratorio IA */}
      {activeTab === 'laboratorio' && (
        <LaboratorioIA capturas={capturas} />
      )}

      {/* Tab 4: Síntesis Clínica & Informe IA */}
      {activeTab === 'informe' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Form / Parameters Column */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
              <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-5 py-4">
                <CardTitle className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#0d7a63]" /> Parámetros de Generación
                </CardTitle>
                <CardDescription className="text-xs text-[#5f7b6f]">
                  Define el objetivo y contexto clínico para que Gemini redacte la síntesis.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* Propósito del informe */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#5f7b6f] uppercase tracking-wider">
                      Propósito del Informe
                    </label>
                    <span className="text-[10px] text-[#0d7a63] font-medium bg-[#e9efec] px-1.5 py-0.5 rounded">
                      Editable & Personalizable
                    </span>
                  </div>

                  <select 
                    value={purposeType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPurposeType(val);
                      if (val === 'derivacion') {
                        setCustomPurpose('Derivación a Cirugía Oncológica para evaluación de biopsia excisional por lesión atípica en crecimiento.');
                      } else if (val === 'interconsulta') {
                        setCustomPurpose('Interconsulta médica solicitando segunda opinión dermatoscópica y evaluación de márgenes.');
                      } else if (val === 'epicrisis') {
                        setCustomPurpose('Epicrisis y resumen de evolución dermatoscópica secuencial tras 6 meses de seguimiento.');
                      } else if (val === 'paciente') {
                        setCustomPurpose('Informe explicativo con recomendaciones de fotoprotección y pautas de autoexamen para el paciente.');
                      } else if (val === 'seguro') {
                        setCustomPurpose('Informe de justificación médica de procedimiento quirúrgico para cobertura de aseguradora / Isapre.');
                      }
                    }}
                    className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-xs bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]"
                  >
                    <option value="escrito">Personalizado / Redactar propósito específico</option>
                    <option value="derivacion">Derivación a Especialidad (Oncología)</option>
                    <option value="interconsulta">Interconsulta Médica Dermatológica</option>
                    <option value="epicrisis">Epicrisis / Resumen Clínico</option>
                    <option value="paciente">Resumen Pedagógico para Paciente</option>
                    <option value="seguro">Informe para Seguro / Reembolso Médico</option>
                  </select>

                  {/* Campo de texto para escribir el propósito manualmente */}
                  <div className="pt-1">
                    <label className="text-[11px] font-medium text-[#3f4f49] block mb-1">
                      Detalle escrito del propósito / Indicación clínica:
                    </label>
                    <Textarea 
                      rows={3}
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      placeholder="Escribe aquí el motivo o solicitud clínica específica..."
                      className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] text-xs resize-none bg-white"
                    />
                  </div>
                </div>

                {/* Notas adicionales del médico */}
                <div className="space-y-1.5 pt-2 border-t border-[#d8e0dc]">
                  <label className="text-xs font-semibold text-[#5f7b6f] uppercase tracking-wider">
                    Notas y Observaciones del Médico (Opcional)
                  </label>
                  <Textarea 
                    rows={2}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Agrega síntomas reportados, hallazgos palpatorios..."
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] text-xs resize-none bg-white"
                  />
                </div>

                {/* Contexto a incluir */}
                <div className="space-y-2.5 pt-2 border-t border-[#d8e0dc]">
                  <label className="text-xs font-semibold text-[#5f7b6f] uppercase tracking-wider block">
                    Secciones a incluir en el informe
                  </label>
                  
                  <div className="space-y-2">
                    <label 
                      onClick={() => setIncludeProfile(!includeProfile)}
                      className="flex items-center gap-2.5 text-xs text-[#0c1512] cursor-pointer select-none"
                    >
                      {includeProfile ? (
                        <CheckSquare className="h-4 w-4 text-[#0d7a63]" />
                      ) : (
                        <Square className="h-4 w-4 text-[#b9c6c0]" />
                      )}
                      Perfil y Factores de Riesgo (Fototipo, Nevos)
                    </label>

                    <label 
                      onClick={() => setIncludeAbcd(!includeAbcd)}
                      className="flex items-center gap-2.5 text-xs text-[#0c1512] cursor-pointer select-none"
                    >
                      {includeAbcd ? (
                        <CheckSquare className="h-4 w-4 text-[#0d7a63]" />
                      ) : (
                        <Square className="h-4 w-4 text-[#b9c6c0]" />
                      )}
                      Evolución Cuantitativa ABCD (6 meses)
                    </label>

                    <label 
                      onClick={() => setIncludeHistory(!includeHistory)}
                      className="flex items-center gap-2.5 text-xs text-[#0c1512] cursor-pointer select-none"
                    >
                      {includeHistory ? (
                        <CheckSquare className="h-4 w-4 text-[#0d7a63]" />
                      ) : (
                        <Square className="h-4 w-4 text-[#b9c6c0]" />
                      )}
                      Síntesis Diagnóstica & Plan Terapéutico
                    </label>

                    <label 
                      onClick={() => setIncludeDigitalSignature(!includeDigitalSignature)}
                      className="flex items-center gap-2.5 text-xs text-[#0c1512] cursor-pointer select-none"
                    >
                      {includeDigitalSignature ? (
                        <CheckSquare className="h-4 w-4 text-[#0d7a63]" />
                      ) : (
                        <Square className="h-4 w-4 text-[#b9c6c0]" />
                      )}
                      Firma Digital & Timbre Profesional
                    </label>
                  </div>
                </div>

                <Button 
                  className="w-full bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none font-medium h-10 text-xs"
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando síntesis con IA...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4 text-[#cfe6dd]" /> {reportGenerated ? 'Regenerar Informe' : 'Generar Informe con Gemini'}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Document / Preview Column */}
          <div className="lg:col-span-8">
            {!reportGenerated && !isGeneratingReport ? (
              <div className="h-full min-h-[460px] border-2 border-dashed border-[#d8e0dc] rounded-xl bg-[#fafcfa] flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-12 w-12 text-[#b9c6c0] mb-4" />
                <h3 className="text-lg font-semibold text-[#0c1512] mb-2">Editor y Generador de Informe Clínico</h3>
                <p className="text-sm text-[#5f7b6f] max-w-md">
                  Personaliza el propósito del informe arriba a la izquierda y presiona "Generar" para redactar un documento médico estructurado, listo para firmar y exportar.
                </p>
              </div>
            ) : isGeneratingReport ? (
              <div className="h-full min-h-[460px] border border-[#d8e0dc] rounded-xl bg-white flex flex-col items-center justify-center p-8 text-center shadow-sm">
                <Loader2 className="h-10 w-10 text-[#0d7a63] animate-spin mb-4" />
                <h3 className="text-[15px] font-semibold text-[#0c1512] mb-1">Redactando documento clínico...</h3>
                <p className="text-sm text-[#5f7b6f]">Cruzando propósito personalizado con métricas de dermatoscopía secuencial.</p>
              </div>
            ) : (
              <Card className="border-[#d8e0dc] shadow-sm bg-white rounded-xl flex flex-col overflow-hidden">
                {/* Header toolbar */}
                <div className="border-b border-[#d8e0dc] px-6 py-3.5 bg-[#fafcfa] flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#0c1512] flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#0d7a63]" /> {reportTitle}
                    </h2>
                    <span className="text-[11px] text-[#5f7b6f]">Generado el 16 Ago 2026 • Estado: Listo para emitir</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingReport(!isEditingReport)}
                      className={`h-8 border-[#d8e0dc] text-xs ${isEditingReport ? 'bg-[#0c1512] text-white' : 'text-[#3f4f49]'}`}
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      {isEditingReport ? 'Ver Vista Previa' : 'Editar Texto'}
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyReport}
                      className="h-8 border-[#d8e0dc] text-xs text-[#3f4f49] shadow-none"
                    >
                      {copiedReport ? (
                        <><Check className="mr-1.5 h-3.5 w-3.5 text-[#0d7a63]" /> Copiado</>
                      ) : (
                        <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar</>
                      )}
                    </Button>

                    <Button 
                      size="sm" 
                      onClick={handlePrint}
                      className="h-8 bg-[#0d7a63] hover:bg-[#0a4539] text-white text-xs shadow-none"
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimir / PDF
                    </Button>
                  </div>
                </div>

                {/* Content Area */}
                <CardContent className="p-8">
                  {isEditingReport ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-[#5f7b6f] uppercase">Edición Directa del Texto</span>
                        <span className="text-[11px] text-[#0d7a63]">Los cambios se reflejarán en la impresión</span>
                      </div>
                      <Textarea 
                        rows={18}
                        value={reportContent}
                        onChange={(e) => setReportContent(e.target.value)}
                        className="font-mono text-xs border-[#d8e0dc] p-4 bg-[#fafcfa] leading-relaxed resize-y"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6 text-[#0c1512]">
                      {/* Clinic Letterhead */}
                      <div className="flex justify-between items-start border-b-2 border-[#0c1512] pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-[#0c1512] text-white flex items-center justify-center font-bold text-base">
                            SK
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#0c1512] uppercase tracking-wider">
                              Centro Dermatológico San Cristóbal
                            </h3>
                            <p className="text-xs text-[#5f7b6f]">Unidad de Teledermatología & Dermatoscopía Digital</p>
                            <p className="text-[11px] text-[#8a9e96]">Av. Nueva Providencia 1945, Of. 804 • Santiago, Chile</p>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-bold text-[#0c1512]">Dr. Alejandro Morales Rivera</p>
                          <p className="text-[#5f7b6f]">Especialista en Dermatología</p>
                          <p className="text-[#0d7a63] font-mono">RNPI: 849201</p>
                        </div>
                      </div>

                      {/* Document Body */}
                      <div className="space-y-5 text-xs leading-relaxed text-[#1a2e26]">
                        {/* Patient info bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#fafcfa] p-3.5 rounded-lg border border-[#d8e0dc]">
                          <div>
                            <span className="text-[10px] text-[#5f7b6f] uppercase font-semibold block">Paciente</span>
                            <span className="font-semibold text-[#0c1512]">{pacienteNombre}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#5f7b6f] uppercase font-semibold block">Email</span>
                            <span className="font-medium text-[#0c1512]">{paciente.email || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#5f7b6f] uppercase font-semibold block">Edad / Sexo</span>
                            <span className="font-medium text-[#0c1512]">
                              {edad !== null ? `${edad} años` : '—'} • {sexoLabel}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#5f7b6f] uppercase font-semibold block">Fecha Emisión</span>
                            <span className="font-medium text-[#0c1512]">16 Ago 2026</span>
                          </div>
                        </div>

                        {/* Propósito */}
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#0c1512] border-b border-[#d8e0dc] pb-1">
                            1. Propósito e Indicación del Informe
                          </h4>
                          <p className="text-[#3f4f49] bg-[#f0f7f4] p-3 rounded-md border border-[#cfe6dd] font-medium">
                            {customPurpose || 'Evaluación integral de lesión melanocítica atípica en extremidad superior.'}
                          </p>
                        </div>

                        {doctorNotes && (
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0c1512] border-b border-[#d8e0dc] pb-1">
                              2. Observaciones Clínicas del Especialista
                            </h4>
                            <p className="text-[#3f4f49]">
                              {doctorNotes}
                            </p>
                          </div>
                        )}

                        {includeProfile && (
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0c1512] border-b border-[#d8e0dc] pb-1">
                              3. Factores de Riesgo Oncológico
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-[#3f4f49]">
                              <li>Fototipo cutáneo: <strong>Tipo II</strong> (piel clara, propensa al eritema).</li>
                              <li>Conteo de nevos: <strong>50 a 100 lesiones corporales</strong>.</li>
                              <li>Antecedente familiar: <strong>Melanoma de primer grado (Padre/Madre)</strong>.</li>
                            </ul>
                          </div>
                        )}

                        {includeAbcd && (
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0c1512] border-b border-[#d8e0dc] pb-1">
                              4. Análisis Morfométrico Secuencial (Regla ABCD)
                            </h4>
                            <div className="bg-[#fafcfa] p-3 rounded-md border border-[#d8e0dc] space-y-1">
                              <p>• <strong>Lesión Evaluada:</strong> Nevo Brazo Izquierdo (LES-0042).</p>
                              <p>• <strong>Evolución de Asimetría:</strong> Incremento radial de +14.2% entre T1 y T2.</p>
                              <p>• <strong>Bordes:</strong> Festoneados en polo superior con pérdida de red pigmentaria periférica.</p>
                              <p>• <strong>Diámetro Mayor:</strong> 6.8 mm (Crecimiento superior a umbral de cribado).</p>
                            </div>
                          </div>
                        )}

                        {includeHistory && (
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0c1512] border-b border-[#d8e0dc] pb-1">
                              5. Síntesis Diagnóstica & Conducta Sugerida
                            </h4>
                            <div className="p-3.5 rounded-md bg-[#f9ecd4] border border-[#f2d8a7] text-[#8a5a0a]">
                              <p className="font-semibold mb-1">Diagnóstico Clínico: Sospecha de Lesión Melanocítica Atípica / Melanoma en fase inicial.</p>
                              <p className="text-[11px] leading-relaxed">
                                Se recomienda derivación preferente a Cirugía Oncológica para biopsia excisional diagnóstica con margen de seguridad oncológico de 2mm y análisis histopatológico complementario.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Digital Signature Footer */}
                        {includeDigitalSignature && (
                          <div className="pt-8 border-t border-[#d8e0dc] flex justify-between items-end">
                            <div className="text-[10px] text-[#5f7b6f] max-w-xs">
                              <p className="font-semibold text-[#0c1512]">Documento con Firma Electrónica Avanzada</p>
                              <p>Emitido a través de Skinnor Teledermatología conforme a la Ley N° 20.584.</p>
                              <p className="font-mono mt-1">Hash: a8f9c42b109e7f8</p>
                            </div>

                            <div className="text-center">
                              <div className="h-14 w-40 flex items-center justify-center mx-auto mb-1 border-b border-[#0c1512]">
                                <span className="font-serif italic text-lg text-[#0c1512]">
                                  Dr. A. Morales R.
                                </span>
                              </div>
                              <p className="font-bold text-xs text-[#0c1512]">Dr. Alejandro Morales Rivera</p>
                              <p className="text-[10px] text-[#5f7b6f]">R.N.P.I. N° 849201 • Dermatología</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

