import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Building2, 
  Sparkles, 
  Bell, 
  Shield, 
  Key, 
  CreditCard, 
  Save, 
  Check, 
  Upload, 
  QrCode, 
  Smartphone, 
  FileText, 
  Award, 
  Sliders, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Stethoscope
} from 'lucide-react';
import { get, put, API_BASE } from '@/lib/api';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';

export default function Configuracion() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'clinica' | 'ia' | 'notificaciones' | 'seguridad' | 'api' | 'suscripcion'>('perfil');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [pacientesVinculados, setPacientesVinculados] = useState<number | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    nombre: '',
    titulo: '',
    registroMedico: '',
    especialidad: '',
    email: '',
    telefono: '',
    universidad: '',
    bio: '',
    idioma: 'es-CL',
    firmaUrl: ''
  });

  // Clinic state
  const [clinic, setClinic] = useState({
    nombreCentro: '',
    rutTributario: '',
    direccion: '',
    ciudad: '',
    pais: '',
    telefonoSecretaria: '',
    emailContacto: '',
    piePaginaLegal: ''
  });

  // AI & Tele-Triage state
  const [aiSettings, setAiSettings] = useState({
    modelo: 'gemini-1.5-pro-derm',
    sensibilidadAbcd: 'alta', // 'alta' | 'estandar' | 'especifica'
    filtroCalidadFoto: true,
    sugerirCie10: true,
    incluirExplicacionPaciente: true,
    umbralAsimetriaAlerta: '12',
    idiomaReporte: 'es'
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    alertasMelanomaEmail: true,
    alertasMelanomaSms: true,
    alertasMelanomaWhatsapp: true,
    nuevaConsultaPaciente: true,
    recordatorioControl30d: true,
    recordatorioControl90d: true,
    resumenSemanalCasos: true
  });

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [apiKey, setApiKey] = useState('');

  const loadConfig = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, vinc] = await Promise.all([
        get(`/profesionales/me?usuario_id=${user.id}`),
        get('/vinculaciones', { profesional_id: user.id }).catch(() => []),
      ]);
      setPacientesVinculados(Array.isArray(vinc) ? vinc.length : null);
      const p = data.perfil || {};
      const c = data.clinica || {};
      const pref = data.preferencias || {};
      setProfile((prev) => ({
        ...prev,
        nombre: p.nombre || data.usuario?.nombre || user.nombre || '',
        email: p.email || data.usuario?.email || user.email || '',
        ...p,
      }));
      setClinic((prev) => ({ ...prev, ...c }));
      if (pref.ia) setAiSettings((prev) => ({ ...prev, ...pref.ia }));
      if (pref.notificaciones) setNotifications((prev) => ({ ...prev, ...pref.notificaciones }));
      if (pref.seguridad) {
        setTwoFactorEnabled(!!pref.seguridad.twoFactorEnabled);
        setSessionTimeout(pref.seguridad.sessionTimeout || '15');
      }
      if (pref.apiKey) setApiKey(pref.apiKey);
    } catch {
      toast.error('No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const key = apiKey || `sk_live_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;
      setApiKey(key);
      await put(`/profesionales/me?usuario_id=${user.id}`, {
        perfil: { ...profile, nombre: profile.nombre || user.nombre },
        clinica: clinic,
        preferencias: {
          ia: aiSettings,
          notificaciones: notifications,
          seguridad: { twoFactorEnabled, sessionTimeout },
          apiKey: key,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      toast.success('Cambios guardados');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleFirmaUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, firmaUrl: String(reader.result) }));
      toast.success('Firma cargada (guarda los cambios para persistirla)');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopyApiKey = () => {
    if (!apiKey) {
      toast.error('Genera y guarda una clave primero');
      return;
    }
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-6xl pb-16">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
              Configuración & Perfil Profesional
            </h1>
            <span className="text-[11px] font-semibold bg-[#cfe6dd] text-[#0d7a63] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Profesional
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Administra tus credenciales clínicas, firma digital, parámetros de IA, clínica y facturación SaaS.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-[#0d7a63] hover:bg-[#0a4539] text-white font-medium shadow-none h-10 px-5"
        >
          {savedSuccess ? (
            <><Check className="mr-2 h-4 w-4" /> Cambios Guardados</>
          ) : saving ? (
            'Guardando...'
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>
          )}
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#d8e0dc] mb-8 pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'perfil'
              ? 'border-b-2 border-[#0c1512] text-[#0c1512] bg-[#fafcfa] font-semibold'
              : 'text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#fafcfa]'
          }`}
        >
          <User className="h-4 w-4" /> Perfil & Credenciales
        </button>

        <button
          onClick={() => setActiveTab('clinica')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'clinica'
              ? 'border-b-2 border-[#0c1512] text-[#0c1512] bg-[#fafcfa] font-semibold'
              : 'text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#fafcfa]'
          }`}
        >
          <Building2 className="h-4 w-4" /> Centro Médico & Membrete
        </button>

        <button
          onClick={() => setActiveTab('ia')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'ia'
              ? 'border-b-2 border-[#0c1512] text-[#0c1512] bg-[#fafcfa] font-semibold'
              : 'text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#fafcfa]'
          }`}
        >
          <Sparkles className="h-4 w-4 text-[#0d7a63]" /> Asistente IA & Algoritmos
        </button>

        <button
          onClick={() => setActiveTab('notificaciones')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'notificaciones'
              ? 'border-b-2 border-[#0c1512] text-[#0c1512] bg-[#fafcfa] font-semibold'
              : 'text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#fafcfa]'
          }`}
        >
          <Bell className="h-4 w-4" /> Alertas & Notificaciones
        </button>

        <button
          onClick={() => setActiveTab('seguridad')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'seguridad'
              ? 'border-b-2 border-[#0c1512] text-[#0c1512] bg-[#fafcfa] font-semibold'
              : 'text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#fafcfa]'
          }`}
        >
          <Shield className="h-4 w-4" /> Seguridad & 2FA
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'api'
              ? 'border-b-2 border-[#0c1512] text-[#0c1512] bg-[#fafcfa] font-semibold'
              : 'text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#fafcfa]'
          }`}
        >
          <Key className="h-4 w-4" /> API & FHIR
        </button>

        <button
          onClick={() => setActiveTab('suscripcion')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'suscripcion'
              ? 'border-b-2 border-[#0c1512] text-[#0c1512] bg-[#fafcfa] font-semibold'
              : 'text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#fafcfa]'
          }`}
        >
          <CreditCard className="h-4 w-4" /> Plan & Facturación
        </button>
      </div>

      {/* Tab 1: Perfil & Credenciales */}
      {activeTab === 'perfil' && (
        <div className="space-y-6">
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0d7a63]" /> Datos del Especialista
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5f7b6f]">
                    Información pública y legal que aparecerá en los informes médicos de teledermatología.
                  </CardDescription>
                </div>
                <span className="text-xs bg-[#e9efec] text-[#3f4f49] px-2.5 py-1 rounded border border-[#d8e0dc] font-mono">
                  ID: PRO-{user?.id ?? '—'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Photo & Header preview */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-[#fafcfa] border border-[#d8e0dc]">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-[#0c1512] text-white flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm overflow-hidden">
                    {profile.nombre
                      ? profile.nombre.split(' ').filter((w) => /^[A-Za-zÁÉÍÓÚÑ]/.test(w)).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                      : 'PR'}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-[#0d7a63] hover:bg-[#0a4539] text-white p-1.5 rounded-full shadow-sm transition-colors cursor-pointer" title="Cambiar foto de perfil">
                    <Upload className="h-3 w-3" />
                    <input type="file" accept="image/*" className="sr-only" onChange={handleFirmaUpload} />
                  </label>
                </div>
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h3 className="font-semibold text-lg text-[#0c1512]">{profile.nombre}</h3>
                  <p className="text-sm text-[#3f4f49]">{profile.titulo}</p>
                  <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                    <span className="inline-flex items-center gap-1 text-xs bg-[#e9efec] text-[#0d7a63] px-2 py-0.5 rounded font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" /> {profile.registroMedico}
                    </span>
                    <span className="text-xs bg-white text-[#5f7b6f] border border-[#d8e0dc] px-2 py-0.5 rounded">
                      {profile.especialidad}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Nombre Completo</label>
                  <Input 
                    value={profile.nombre} 
                    onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Título Profesional</label>
                  <Input 
                    value={profile.titulo} 
                    onChange={(e) => setProfile({ ...profile, titulo: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Registro Médico Nacional (RNPI / Folio)</label>
                  <Input 
                    value={profile.registroMedico} 
                    onChange={(e) => setProfile({ ...profile, registroMedico: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Especialidad Principal</label>
                  <Input 
                    value={profile.especialidad} 
                    onChange={(e) => setProfile({ ...profile, especialidad: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Correo Electrónico Profesional</label>
                  <Input 
                    type="email"
                    value={profile.email} 
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Teléfono de Contacto Médico</label>
                  <Input 
                    value={profile.telefono} 
                    onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Universidad y Formación Especializada</label>
                  <Input 
                    value={profile.universidad} 
                    onChange={(e) => setProfile({ ...profile, universidad: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Resumen Curricular / Bio Clínica</label>
                  <Textarea 
                    rows={3}
                    value={profile.bio} 
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] resize-none text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Digital Signature & Stamp */}
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
              <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0d7a63]" /> Firma Electrónica y Timbre Médico
              </CardTitle>
              <CardDescription className="text-xs text-[#5f7b6f]">
                Esta firma se estampará automáticamente en los informes de síntesis clínica, derivaciones y recetas generadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-dashed border-[#b9c6c0] rounded-xl p-6 flex flex-col items-center justify-center text-center bg-[#fafcfa]">
                  <div className="h-20 w-48 border border-[#d8e0dc] rounded-md bg-white flex items-center justify-center mb-3 shadow-inner overflow-hidden">
                    {profile.firmaUrl ? (
                      <img src={profile.firmaUrl} alt="Firma digital" className="max-h-16 max-w-full object-contain" />
                    ) : (
                      <span className="font-serif italic text-2xl text-[#0c1512] tracking-wider opacity-85 select-none px-2">
                        {profile.nombre || 'Tu nombre'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#0c1512] mb-1">Firma Digitalizada</span>
                  <span className="text-[11px] text-[#5f7b6f] mb-4">{profile.firmaUrl ? 'Imagen cargada' : 'Sube una imagen PNG transparente'}</span>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs border border-[#d8e0dc] rounded-md px-3 h-8 cursor-pointer hover:bg-[#f4f6f5]">
                      <Upload className="h-3.5 w-3.5" /> {profile.firmaUrl ? 'Reemplazar Firma' : 'Subir Firma'}
                      <input type="file" accept="image/*" className="sr-only" onChange={handleFirmaUpload} />
                    </label>
                  </div>
                </div>

                <div className="border border-dashed border-[#b9c6c0] rounded-xl p-6 flex flex-col items-center justify-center text-center bg-[#fafcfa]">
                  <div className="h-20 w-48 border border-[#d8e0dc] rounded-md bg-white p-2 flex flex-col items-center justify-center mb-3 shadow-inner text-[10px] text-center leading-tight">
                    <span className="font-bold uppercase text-[#0c1512] truncate w-full">{profile.nombre || 'Nombre del profesional'}</span>
                    <span className="text-[#5f7b6f] truncate w-full">{profile.registroMedico || 'Registro médico'}</span>
                    <span className="text-[#5f7b6f] truncate w-full">{profile.especialidad || 'Especialidad'}</span>
                    <span className="text-[#0d7a63] font-semibold">SKINNOR TELEMEDICINA</span>
                  </div>
                  <span className="text-xs font-semibold text-[#0c1512] mb-1">Timbre Profesional Configurado</span>
                  <span className="text-[11px] text-[#5f7b6f] mb-4">Generado con validez para recetas e interconsultas</span>
                  <Button variant="outline" size="sm" className="border-[#d8e0dc] text-xs h-8">
                    Editar Datos de Timbre
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Centro Médico & Membrete */}
      {activeTab === 'clinica' && (
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#0d7a63]" /> Datos Institucionales & Membrete de Informes
            </CardTitle>
            <CardDescription className="text-xs text-[#5f7b6f]">
              Configura el encabezado, logotipo y pie legal que acompañará los reportes emitidos para pacientes y colegas.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Nombre del Centro o Consulta</label>
                <Input 
                  value={clinic.nombreCentro} 
                  onChange={(e) => setClinic({ ...clinic, nombreCentro: e.target.value })}
                  className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">RUT / Identificador Tributario</label>
                <Input 
                  value={clinic.rutTributario} 
                  onChange={(e) => setClinic({ ...clinic, rutTributario: e.target.value })}
                  className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Dirección Física</label>
                <Input 
                  value={clinic.direccion} 
                  onChange={(e) => setClinic({ ...clinic, direccion: e.target.value })}
                  className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Ciudad</label>
                  <Input 
                    value={clinic.ciudad} 
                    onChange={(e) => setClinic({ ...clinic, ciudad: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">País</label>
                  <Input 
                    value={clinic.pais} 
                    onChange={(e) => setClinic({ ...clinic, pais: e.target.value })}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Teléfono de Secretaría / Turnos</label>
                <Input 
                  value={clinic.telefonoSecretaria} 
                  onChange={(e) => setClinic({ ...clinic, telefonoSecretaria: e.target.value })}
                  className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Email Institucional de Contacto</label>
                <Input 
                  value={clinic.emailContacto} 
                  onChange={(e) => setClinic({ ...clinic, emailContacto: e.target.value })}
                  className="border-[#d8e0dc] focus-visible:ring-[#0d7a63]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Pie de Página Legal & Consentimiento Informado</label>
                <Textarea 
                  rows={2}
                  value={clinic.piePaginaLegal} 
                  onChange={(e) => setClinic({ ...clinic, piePaginaLegal: e.target.value })}
                  className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] resize-none text-sm"
                />
              </div>
            </div>

            {/* Vista previa del membrete */}
            <div className="mt-6 border border-[#d8e0dc] rounded-xl p-5 bg-[#fafcfa]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f] block mb-3">
                Vista Previa del Encabezado en Documentos PDF
              </span>
              <div className="bg-white p-5 border border-[#d8e0dc] rounded-lg space-y-4">
                <div className="flex justify-between items-start border-b border-[#d8e0dc] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#0c1512] text-white flex items-center justify-center font-bold text-sm">
                      SK
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0c1512] uppercase tracking-wide">{clinic.nombreCentro}</h4>
                      <p className="text-xs text-[#5f7b6f]">{clinic.direccion} • {clinic.ciudad}, {clinic.pais}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#5f7b6f]">
                    <p className="font-semibold text-[#0c1512]">{profile.nombre}</p>
                    <p>{profile.registroMedico}</p>
                  </div>
                </div>
                <div className="text-[11px] text-center text-[#5f7b6f] italic">
                  [Cuerpo estructurado del informe clínico generado por Skinnor Teledermatología]
                </div>
                <div className="border-t border-[#d8e0dc] pt-2 text-[10px] text-center text-[#8a9e96]">
                  {clinic.piePaginaLegal}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Asistente IA & Algoritmo */}
      {activeTab === 'ia' && (
        <div className="space-y-6">
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
              <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0d7a63]" /> Calibración del Modelo & Algoritmo ABCD
              </CardTitle>
              <CardDescription className="text-xs text-[#5f7b6f]">
                Ajusta la sensibilidad del motor de visión computacional y síntesis clínica con Gemini Health.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f] block mb-2">
                    Sensibilidad de Detección de Asimetría y Bordes (Regla ABCD)
                  </label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div 
                      onClick={() => setAiSettings({ ...aiSettings, sensibilidadAbcd: 'alta' })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        aiSettings.sensibilidadAbcd === 'alta'
                          ? 'border-[#0d7a63] bg-[#f0f7f4] ring-1 ring-[#0d7a63]'
                          : 'border-[#d8e0dc] bg-white hover:bg-[#fafcfa]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-[#0c1512]">Alta Sensibilidad</span>
                        {aiSettings.sensibilidadAbcd === 'alta' && <CheckCircle2 className="h-4 w-4 text-[#0d7a63]" />}
                      </div>
                      <p className="text-xs text-[#5f7b6f]">
                        Alerta ante variaciones &gt;10% en asimetría o color. Recomendado para screening de melanoma.
                      </p>
                    </div>

                    <div 
                      onClick={() => setAiSettings({ ...aiSettings, sensibilidadAbcd: 'estandar' })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        aiSettings.sensibilidadAbcd === 'estandar'
                          ? 'border-[#0d7a63] bg-[#f0f7f4] ring-1 ring-[#0d7a63]'
                          : 'border-[#d8e0dc] bg-white hover:bg-[#fafcfa]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-[#0c1512]">Estándar Clínica</span>
                        {aiSettings.sensibilidadAbcd === 'estandar' && <CheckCircle2 className="h-4 w-4 text-[#0d7a63]" />}
                      </div>
                      <p className="text-xs text-[#5f7b6f]">
                        Alerta ante variaciones &gt;15%. Balance óptimo entre falsos positivos y especificidad.
                      </p>
                    </div>

                    <div 
                      onClick={() => setAiSettings({ ...aiSettings, sensibilidadAbcd: 'especifica' })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        aiSettings.sensibilidadAbcd === 'especifica'
                          ? 'border-[#0d7a63] bg-[#f0f7f4] ring-1 ring-[#0d7a63]'
                          : 'border-[#d8e0dc] bg-white hover:bg-[#fafcfa]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-[#0c1512]">Conservadora</span>
                        {aiSettings.sensibilidadAbcd === 'especifica' && <CheckCircle2 className="h-4 w-4 text-[#0d7a63]" />}
                      </div>
                      <p className="text-xs text-[#5f7b6f]">
                        Alerta ante variaciones &gt;25%. Diseñado para pacientes de bajo riesgo o queratosis seborreicas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#d8e0dc] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0c1512]">Control de Calidad Fotográfica Automático</p>
                      <p className="text-xs text-[#5f7b6f]">Detecta automáticamente reflejos de luz, desenfoque o vello y solicita repetición al paciente antes de evaluar.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiSettings.filtroCalidadFoto}
                      onChange={(e) => setAiSettings({ ...aiSettings, filtroCalidadFoto: e.target.checked })}
                      className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0c1512]">Sugerencia de Códigos CIE-10 / SNOMED CT</p>
                      <p className="text-xs text-[#5f7b6f]">Añade diagnósticos diferenciales codificados (C43 Melanoma, C44 Carcinoma, D22 Nevo melanocítico).</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiSettings.sugerirCie10}
                      onChange={(e) => setAiSettings({ ...aiSettings, sugerirCie10: e.target.checked })}
                      className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0c1512]">Generación de Resumen Explicativo en Lenguaje Claro</p>
                      <p className="text-xs text-[#5f7b6f]">Genera una sección pedagógica y comprensible para el paciente junto al informe técnico.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={aiSettings.incluirExplicacionPaciente}
                      onChange={(e) => setAiSettings({ ...aiSettings, incluirExplicacionPaciente: e.target.checked })}
                      className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Notificaciones */}
      {activeTab === 'notificaciones' && (
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#0d7a63]" /> Canales de Alerta & Triage Clínico
            </CardTitle>
            <CardDescription className="text-xs text-[#5f7b6f]">
              Configura por qué vías deseas recibir alertas urgentes de lesiones sospechosas y consultas de pacientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#c77a0b] flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Alertas Críticas (Riesgo Alto / Sospecha de Melanoma)
              </h4>
              
              <div className="p-4 rounded-xl bg-[#fafcfa] border border-[#d8e0dc] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#0c1512]">Notificación Urgente por Email</span>
                    <p className="text-xs text-[#5f7b6f]">Envío prioritario con badge de alerta clínica.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifications.alertasMelanomaEmail}
                    onChange={(e) => setNotifications({ ...notifications, alertasMelanomaEmail: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#d8e0dc]">
                  <div>
                    <span className="text-sm font-medium text-[#0c1512]">Mensaje SMS de Emergencia</span>
                    <p className="text-xs text-[#5f7b6f]">Aviso instantáneo al teléfono del médico de guardia.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifications.alertasMelanomaSms}
                    onChange={(e) => setNotifications({ ...notifications, alertasMelanomaSms: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#d8e0dc]">
                  <div>
                    <span className="text-sm font-medium text-[#0c1512]">WhatsApp Business Clínico</span>
                    <p className="text-xs text-[#5f7b6f]">Bot automatizado con link directo a la ficha del paciente.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifications.alertasMelanomaWhatsapp}
                    onChange={(e) => setNotifications({ ...notifications, alertasMelanomaWhatsapp: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                  />
                </div>
              </div>

              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f] pt-4">
                Recordatorios y Seguimiento de Pacientes
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#0c1512]">Recordatorio a los 30 días</span>
                    <p className="text-xs text-[#5f7b6f]">Envía notificación automática al paciente para subir fotografía de control en lesiones moderadas.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifications.recordatorioControl30d}
                    onChange={(e) => setNotifications({ ...notifications, recordatorioControl30d: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#0c1512]">Recordatorio a los 90 días</span>
                    <p className="text-xs text-[#5f7b6f]">Control trimestral para pacientes con nevos atípicos o antecedentes familiares.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifications.recordatorioControl90d}
                    onChange={(e) => setNotifications({ ...notifications, recordatorioControl90d: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#0c1512]">Resumen Semanal de Actividad</span>
                    <p className="text-xs text-[#5f7b6f]">Informe consolidado cada lunes con estadísticas de pacientes y consultas atendidas.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifications.resumenSemanalCasos}
                    onChange={(e) => setNotifications({ ...notifications, resumenSemanalCasos: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#0d7a63] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Seguridad & 2FA */}
      {activeTab === 'seguridad' && (
        <div className="space-y-6">
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
              <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0d7a63]" /> Autenticación en Dos Pasos (2FA) & Cumplimiento HIPAA
              </CardTitle>
              <CardDescription className="text-xs text-[#5f7b6f]">
                Protección estricta de fichas clínicas e imágenes dermatoscópicas con estándares médicos internacionales.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start justify-between p-4 bg-[#f0f7f4] border border-[#cfe6dd] rounded-xl">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#0d7a63] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#0c1512]">
                      {twoFactorEnabled ? '2FA Activado (Google Authenticator / TOTP)' : '2FA Desactivado'}
                    </h4>
                    <p className="text-xs text-[#3f4f49] mt-0.5">
                      {twoFactorEnabled
                        ? 'Tu cuenta requiere un código de 6 dígitos cada vez que inicias sesión en un dispositivo nuevo.'
                        : 'Activa la autenticación en dos pasos para mayor seguridad en el acceso a fichas clínicas.'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#d8e0dc] text-xs h-8"
                  onClick={() => setTwoFactorEnabled((v) => !v)}
                >
                  {twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Caducidad de Sesión por Inactividad</label>
                  <select 
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]"
                  >
                    <option value="5">5 minutos (Máxima seguridad en clínica compartida)</option>
                    <option value="15">15 minutos (Estándar médico recomendado)</option>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Cifrado de Imágenes en Reposo</label>
                  <div className="flex items-center gap-2 p-2 border border-[#d8e0dc] rounded-md bg-[#fafcfa] text-xs text-[#0c1512]">
                    <Check className="h-4 w-4 text-[#0d7a63]" /> AES-256 Cloud Vault con llaves administradas por HSM
                  </div>
                </div>
              </div>

              {/* Audit log preview */}
              <div className="border border-[#d8e0dc] rounded-xl overflow-hidden">
                <div className="bg-[#fafcfa] px-4 py-3 border-b border-[#d8e0dc] flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#0c1512] uppercase tracking-wider">
                    Registro de Auditoría de Accesos Recientes (Audit Trail)
                  </span>
                  <span className="text-[11px] text-[#5f7b6f]">Últimas 24 horas</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f4f6f5] border-b border-[#d8e0dc] text-[#5f7b6f]">
                    <tr>
                      <th className="px-4 py-2 font-medium">Fecha & Hora</th>
                      <th className="px-4 py-2 font-medium">Acción Realizada</th>
                      <th className="px-4 py-2 font-medium">Paciente / Recurso</th>
                      <th className="px-4 py-2 font-medium text-right">Dirección IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8e0dc]">
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[#5f7b6f]">
                        No hay registros de auditoría disponibles para esta cuenta.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 6: API & FHIR */}
      {activeTab === 'api' && (
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
              <Key className="h-4 w-4 text-[#0d7a63]" /> Interoperabilidad FHIR & API Keys
            </CardTitle>
            <CardDescription className="text-xs text-[#5f7b6f]">
              Conecta Skinnor con tu sistema de Ficha Clínica Electrónica (EHR/HIS), visores DICOM o plataformas hospitalarias.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">Clave de API de Producción (Live Key)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    readOnly
                    value={apiKey || 'Se generará una clave al guardar los cambios'}
                    className="font-mono text-xs border-[#d8e0dc] bg-[#fafcfa] pr-10"
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f7b6f] hover:text-[#0c1512]"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button 
                  onClick={handleCopyApiKey}
                  variant="outline" 
                  className="border-[#d8e0dc] text-xs shadow-none"
                >
                  {copiedKey ? <><Check className="mr-1.5 h-3.5 w-3.5 text-[#0d7a63]" /> Copiado</> : <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar</>}
                </Button>
              </div>
              <p className="text-[11px] text-[#5f7b6f]">
                Nunca compartas esta clave privada. Permite crear y leer observaciones dermatológicas vía REST API.
              </p>
            </div>

            <div className="border border-[#d8e0dc] rounded-xl p-5 bg-[#fafcfa] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#0c1512]">Endpoint HL7 / FHIR R4</h4>
                  <p className="text-xs text-[#5f7b6f]">Recursos soportados: DiagnosticReport, Observation (ABCD Dermatology), Media.</p>
                </div>
                <span className="text-xs bg-[#cfe6dd] text-[#0d7a63] font-mono px-2 py-0.5 rounded font-semibold">
                  Activo
                </span>
              </div>
              <div className="p-3 bg-white border border-[#d8e0dc] rounded-md font-mono text-xs text-[#0c1512] break-all">
                {API_BASE}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 7: Plan & Suscripción SaaS */}
      {activeTab === 'suscripcion' && (
        <div className="space-y-6">
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#0d7a63]" /> Tu Suscripción Skinnor Pro
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5f7b6f]">
                    Gestión de facturación mensual, consumo de análisis dermatoscópicos y comprobantes tributarios.
                  </CardDescription>
                </div>
                <span className="text-xs font-semibold bg-[#0d7a63] text-white px-2.5 py-1 rounded">
                  Plan Activo
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#fafcfa] border border-[#d8e0dc]">
                  <span className="text-xs text-[#5f7b6f] uppercase font-semibold">Plan Actual</span>
                  <div className="text-xl font-bold text-[#0c1512] mt-1">Skinnor Pro</div>
                  <div className="text-xs text-[#0d7a63] font-medium mt-0.5">Plan activo</div>
                  <div className="text-[11px] text-[#5f7b6f] mt-2">Facturación gestionada por la plataforma</div>
                </div>

                <div className="p-4 rounded-xl bg-[#fafcfa] border border-[#d8e0dc]">
                  <span className="text-xs text-[#5f7b6f] uppercase font-semibold">Consumo IA Mensual</span>
                  <div className="text-xl font-bold text-[#0c1512] mt-1">—</div>
                  <div className="text-[11px] text-[#5f7b6f] mt-1.5">Sin medición disponible en esta versión</div>
                </div>

                <div className="p-4 rounded-xl bg-[#fafcfa] border border-[#d8e0dc]">
                  <span className="text-xs text-[#5f7b6f] uppercase font-semibold">Pacientes Vinculados</span>
                  <div className="text-xl font-bold text-[#0c1512] mt-1">
                    {pacientesVinculados === null ? '—' : pacientesVinculados}
                  </div>
                  <div className="text-xs text-[#0d7a63] font-medium mt-0.5">Pacientes con acceso a tu portal</div>
                  <div className="text-[11px] text-[#5f7b6f] mt-2">Gestiona vínculos desde Solicitudes de Enlace</div>
                </div>
              </div>

              {/* Payment method */}
              <div className="border border-[#d8e0dc] rounded-xl p-5 bg-[#fafcfa]">
                <p className="text-sm font-semibold text-[#0c1512]">Método de pago</p>
                <p className="text-xs text-[#5f7b6f] mt-1">
                  No hay un método de pago registrado en esta cuenta. La facturación se gestiona desde el panel de administración de la plataforma.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
