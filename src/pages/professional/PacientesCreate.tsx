import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Smartphone, UserPlus, Copy, CheckCircle2, ChevronLeft } from 'lucide-react';
import { post } from '@/lib/api';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';

export default function PacientesCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profesionalId = user?.id;

  const [view, setView] = useState<'selection' | 'code' | 'manual'>('selection');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  // Formulario manual
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefono, setTelefono] = useState('');

  const handleGenerateCode = async () => {
    if (!profesionalId) {
      toast.error('No se pudo identificar al profesional');
      return;
    }
    setCreating(true);
    try {
      const data = await post('/codigos-acceso', {
        profesional_id: profesionalId,
        usos_maximos: 1,
      });
      const codigo = data.codigo || data.codigo_acceso;
      setGeneratedCode(codigo);
      setView('code');
      toast.success('Código de acceso generado');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el código');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCrearPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profesionalId) {
      toast.error('No se pudo identificar al profesional. Usuario no autenticado.');
      return;
    }
    if (!nombre || !email) {
      toast.error('Nombre y correo son requeridos');
      return;
    }
    setCreating(true);
    try {
      await post('/pacientes', {
        profesional_id: profesionalId,
        email,
        nombre,
        fecha_nacimiento: fechaNacimiento || null,
        sexo: sexo || null,
        telefono: telefono || null,
      });
      toast.success('Paciente creado y vinculado correctamente');
      navigate('/pro/pacientes');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear el paciente');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link to="/pro/pacientes" className="inline-flex items-center text-sm font-medium text-[#5f7b6f] hover:text-[#0c1512] mb-4 transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a Pacientes
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
          Añadir Paciente
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vincula a un paciente existente o crea un nuevo expediente clínico.
        </p>
      </div>

      {view === 'selection' && (
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Opción 1: Conectar con Código */}
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden hover:border-[#0d7a63] transition-colors cursor-pointer group" onClick={handleGenerateCode}>
            <div className="h-2 w-full bg-[#0d7a63]"></div>
            <CardContent className="p-8 text-center flex flex-col items-center h-full">
              <div className="h-16 w-16 bg-[#e9efec] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="h-8 w-8 text-[#0d7a63]" />
              </div>
              <h2 className="text-xl font-semibold text-[#0c1512] mb-3">Vincular con Código</h2>
              <div className="text-[11px] font-medium uppercase tracking-widest text-[#0d7a63] bg-[#cfe6dd] px-2.5 py-1 rounded-sm mb-4">Recomendado</div>
              <p className="text-sm text-[#3f4f49] mb-8 leading-relaxed">
                El paciente ya usa la aplicación Skinnor en su dispositivo. Genera un código de invitación para conectar su cuenta y acceder a todo su historial, fotos y métricas instantáneamente.
              </p>
              <div className="mt-auto w-full">
                <Button
                  disabled={creating}
                  className="w-full bg-[#0c1512] hover:bg-[#3f4f49] text-white rounded-md shadow-none font-medium"
                >
                  {creating ? 'Generando...' : 'Generar Código de Enlace'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Opción 2: Crear Manualmente */}
          <Card className="border-[#d8e0dc] shadow-none bg-[#fafcfa] rounded-xl overflow-hidden hover:border-[#b9c6c0] transition-colors cursor-pointer" onClick={() => setView('manual')}>
            <div className="h-2 w-full bg-[#b9c6c0]"></div>
            <CardContent className="p-8 text-center flex flex-col items-center h-full">
              <div className="h-16 w-16 bg-white border border-[#d8e0dc] rounded-full flex items-center justify-center mb-6">
                <UserPlus className="h-8 w-8 text-[#5f7b6f]" />
              </div>
              <h2 className="text-xl font-semibold text-[#0c1512] mb-3">Crear desde Cero</h2>
              <div className="text-[11px] font-medium uppercase tracking-widest text-[#5f7b6f] bg-[#e9efec] px-2.5 py-1 rounded-sm mb-4">Gestión Manual</div>
              <p className="text-sm text-[#3f4f49] mb-8 leading-relaxed">
                El paciente no tiene cuenta en Skinnor. Crea su expediente clínico manualmente e ingresa sus factores de riesgo, antecedentes y fotografías de lesiones directamente desde la clínica.
              </p>
              <div className="mt-auto w-full">
                <Button variant="outline" className="w-full border-[#d8e0dc] text-[#0c1512] hover:bg-white font-medium shadow-none">
                  Completar Formulario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'code' && (
        <div className="max-w-xl mx-auto mt-12 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#e9efec] mb-6">
            <Smartphone className="h-10 w-10 text-[#0d7a63]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#0c1512] mb-4">Código Generado</h2>
          <p className="text-[#3f4f49] mb-8">
            Pide a tu paciente que ingrese este código en su aplicación Skinnor, sección "Mis Médicos", para autorizar la sincronización de sus datos.
          </p>

          <div className="bg-white border-2 border-dashed border-[#0d7a63] rounded-xl p-8 mb-8 relative">
            <div className="text-4xl md:text-5xl font-mono font-bold tracking-widest text-[#0c1512]">
              {generatedCode}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-[#0d7a63] hover:bg-[#0a4539] text-white shadow-none"
              onClick={handleCopyCode}
            >
              {copied ? (
                <><CheckCircle2 className="mr-2 h-4 w-4" /> ¡Copiado!</>
              ) : (
                <><Copy className="mr-2 h-4 w-4" /> Copiar Código</>
              )}
            </Button>
            <Button
              variant="outline"
              className="border-[#d8e0dc] text-[#0c1512] hover:bg-[#fafcfa] shadow-none"
              onClick={() => navigate('/pro/pacientes')}
            >
              Volver a Mis Pacientes
            </Button>
          </div>
        </div>
      )}

      {view === 'manual' && (
        <div className="mt-8">
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
            <CardContent className="p-8">
              <h2 className="text-lg font-semibold text-[#0c1512] mb-6">Información Personal</h2>
              <form id="crear-paciente-form" onSubmit={handleCrearPaciente} className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Nombre Completo</label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] bg-[#fafcfa] shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Correo Electrónico</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej. juan@email.com"
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] bg-[#fafcfa] shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Documento de Identidad</label>
                  <Input
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="Ej. 12345678-9"
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] bg-[#fafcfa] shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Fecha de Nacimiento</label>
                  <Input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] bg-[#fafcfa] shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Sexo Biológico</label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full h-9 border border-[#d8e0dc] rounded-md px-3 py-1 text-sm bg-[#fafcfa] text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63] transition-colors"
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Teléfono de Contacto</label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. +56 9 1234 5678"
                    className="border-[#d8e0dc] focus-visible:ring-[#0d7a63] bg-[#fafcfa] shadow-none"
                  />
                </div>
              </form>

              <div className="pt-6 border-t border-[#d8e0dc]">
                <div className="flex justify-end gap-4">
                  <Button variant="outline" className="border-[#d8e0dc] shadow-none" onClick={() => setView('selection')}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    form="crear-paciente-form"
                    disabled={creating}
                    className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none"
                  >
                    {creating ? 'Creando...' : 'Guardar y Crear Expediente'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
