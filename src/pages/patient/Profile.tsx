import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { get, put } from '@/lib/api';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';
import { Save, Check } from 'lucide-react';

interface PerfilSalud {
  fototipo?: string;
  lunares?: string;
  quemaduras?: string;
  antecedentes?: string;
  inmuno?: string;
  observaciones?: string;
}

const SKIN_TONES = ['#ffead0', '#f5d5b5', '#e3b88e', '#c68e5c', '#8c5028', '#3d2314'];

export default function Profile() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefono, setTelefono] = useState('');

  const [fototipo, setFototipo] = useState('');
  const [lunares, setLunares] = useState('');
  const [quemaduras, setQuemaduras] = useState('');
  const [antecedentes, setAntecedentes] = useState('');
  const [inmuno, setInmuno] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await get(`/pacientes/me?usuario_id=${user.id}`);
      setNombre(data.usuario?.nombre || user.nombre || '');
      setEmail(data.usuario?.email || user.email || '');
      setFechaNacimiento(data.fecha_nacimiento || '');
      setSexo(data.sexo || '');
      setTelefono(data.telefono || '');
      const ps: PerfilSalud = data.perfil_salud || {};
      setFototipo(ps.fototipo || '');
      setLunares(ps.lunares || '');
      setQuemaduras(ps.quemaduras || '');
      setAntecedentes(ps.antecedentes || '');
      setInmuno(ps.inmuno || '');
      setObservaciones(ps.observaciones || '');
    } catch {
      toast.error('No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await put(`/pacientes/me?usuario_id=${user.id}`, {
        nombre,
        email,
        fecha_nacimiento: fechaNacimiento || null,
        sexo: sexo || null,
        telefono: telefono || null,
        perfil_salud: {
          fototipo: fototipo || null,
          lunares: lunares || null,
          quemaduras: quemaduras || null,
          antecedentes: antecedentes || null,
          inmuno: inmuno || null,
          observaciones: observaciones || null,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Perfil guardado');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const opcionesColores = ['Muy blanca', 'Blanca', 'Clara', 'Morena', 'Oscura', 'Muy oscura'];
  const opcionesLunares = ['Menos de 50', 'Entre 50 y 100', 'Más de 100 (Riesgo alto)'];
  const opcionesQuemaduras = ['Ninguna', '1 a 3 episodios en la infancia', 'Múltiples episodios con ampollas'];
  const opcionesAntecedentes = ['Ninguno conocido', 'Familiar de 1er grado (Padre/Madre/Hermano)', 'Familiar de 2do grado'];
  const opcionesInmuno = ['No', 'Sí (VIH, Trasplante, etc.)'];

  const selectClass = 'w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus-visible:ring-[#0c1512] focus-visible:outline-none';
  const labelClass = 'text-xs font-medium text-[#5f7b6f] uppercase tracking-wide';

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">Mi Perfil de Salud</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de datos clínicos, factores de riesgo y antecedentes.</p>
        </div>
        <Button type="submit" form="profile-form" onClick={handleSave} disabled={loading} className="bg-[#0c1512] hover:bg-[#3f4f49] text-white rounded-md shadow-none font-medium">
          {saved ? (<><Check className="mr-2 h-4 w-4" /> Cambios Guardados</>) : (<><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>)}
        </Button>
      </div>

      <form id="profile-form" onSubmit={handleSave} className="space-y-8">
        {/* Sección 1: Datos Personales */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-[#d8e0dc] pb-2">
            <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider">1. Información Personal</h2>
          </div>
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-md">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="nombre" className={labelClass}>Nombre Completo</label>
                  <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border-[#d8e0dc] bg-[#f4f6f5] focus-visible:ring-[#0c1512]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className={labelClass}>Correo Electrónico</label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-[#d8e0dc] bg-[#f4f6f5] focus-visible:ring-[#0c1512]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="fechaNacimiento" className={labelClass}>Fecha de Nacimiento</label>
                  <Input id="fechaNacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="border-[#d8e0dc] bg-[#f4f6f5] focus-visible:ring-[#0c1512]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="sexo" className={labelClass}>Sexo Biológico</label>
                  <select id="sexo" value={sexo} onChange={(e) => setSexo(e.target.value)} className={selectClass}>
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="telefono" className={labelClass}>Teléfono de Contacto</label>
                  <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="border-[#d8e0dc] bg-[#f4f6f5] focus-visible:ring-[#0c1512]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección 2: Factores de Riesgo */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-[#d8e0dc] pb-2">
            <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider">2. Factores de Riesgo Dermatológico</h2>
          </div>
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-md">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <fieldset className="space-y-3 md:col-span-2">
                  <legend className={labelClass}>Fototipo de Piel (Escala Fitzpatrick)</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {opcionesColores.map((desc, i) => {
                      const type = String(i + 1);
                      const selected = fototipo === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFototipo(selected ? '' : type)}
                          className={`border rounded-md p-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                            selected ? 'border-[#0c1512] ring-1 ring-[#0c1512] bg-[#f4f6f5]' : 'border-[#d8e0dc] hover:border-[#0c1512]'
                          }`}
                          aria-pressed={selected}
                        >
                          <div className="w-8 h-8 rounded-full border border-[#d8e0dc]" style={{ backgroundColor: SKIN_TONES[i] }}></div>
                          <div className="text-center">
                            <span className="text-xs font-semibold text-[#0c1512]">Tipo {type}</span>
                            <div className="text-[10px] text-[#5f7b6f]">{desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="space-y-2">
                  <label htmlFor="lunares" className={labelClass}>Cantidad de Lunares</label>
                  <select id="lunares" value={lunares} onChange={(e) => setLunares(e.target.value)} className={selectClass}>
                    <option value="">Seleccionar</option>
                    {opcionesLunares.map((v) => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="quemaduras" className={labelClass}>Quemaduras solares graves</label>
                  <select id="quemaduras" value={quemaduras} onChange={(e) => setQuemaduras(e.target.value)} className={selectClass}>
                    <option value="">Seleccionar</option>
                    {opcionesQuemaduras.map((v) => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección 3: Antecedentes */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-[#d8e0dc] pb-2">
            <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider">3. Antecedentes Clínicos</h2>
          </div>
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-md">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="antecedentes" className={labelClass}>Antecedentes Familiares de Melanoma</label>
                  <select id="antecedentes" value={antecedentes} onChange={(e) => setAntecedentes(e.target.value)} className={selectClass}>
                    <option value="">Seleccionar</option>
                    {opcionesAntecedentes.map((v) => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="inmuno" className={labelClass}>Enfermedades Inmunosupresoras</label>
                  <select id="inmuno" value={inmuno} onChange={(e) => setInmuno(e.target.value)} className={selectClass}>
                    <option value="">Seleccionar</option>
                    {opcionesInmuno.map((v) => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="observaciones" className={labelClass}>Observaciones / Otros cánceres previos</label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Detalla si has tenido carcinomas basocelulares u otras afecciones..."
                    className="border-[#d8e0dc] bg-white text-[#0c1512] focus-visible:ring-[#0c1512] resize-none min-h-[96px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="flex justify-end pb-8">
          <Button type="submit" disabled={loading} className="bg-[#0c1512] hover:bg-[#3f4f49] text-white rounded-md shadow-none font-medium">
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
