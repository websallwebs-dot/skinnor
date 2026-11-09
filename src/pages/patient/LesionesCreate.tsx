import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import CameraCapture from '@/components/CameraCapture';
import { post, blobToDataURL } from '@/lib/api';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';

export default function LesionesCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nombre, setNombre] = useState('');
  const [zona, setZona] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [tamaño, setTamaño] = useState('');
  const [colores, setColores] = useState<string[]>([]);
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [fotoBase, setFotoBase] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const opcionesColores = ['Marrón claro', 'Marrón oscuro', 'Negro', 'Rojo/Rosado', 'Blanco', 'Azul/Gris'];
  const opcionesSintomas = ['Ninguno', 'Picazón / Comezón', 'Dolor o Sensibilidad', 'Sangrado o Costra', 'Descamación'];

  const toggle = (arr: string[], value: string) => arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !zona) {
      toast.error('Completa al menos el nombre y la zona.');
      return;
    }
    if (!fotoBase) {
      toast.error('Toma o sube la fotografía base.');
      return;
    }
    setSaving(true);
    try {
      await post('/lesiones', {
        paciente_id: Number(user?.id),
        nombre,
        zona,
        ubicacion,
        tamaño,
        colores,
        sintomas,
        creado_en: new Date().toISOString(),
        foto_base: fotoBase,
      });
      toast.success('Lesión registrada');
      navigate('/dashboard/lesiones');
    } catch (err: any) {
      const msg = err?.message || 'No se pudo guardar la lesión';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeFoto = () => {
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    setFotoBase(null);
    setFotoUrl(null);
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8 border-b border-[#d8e0dc] pb-6">
        <button onClick={() => navigate('/dashboard/lesiones')} className="flex items-center text-sm text-[#5f7b6f] mb-4 hover:text-[#0c1512] transition-colors font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al catálogo
        </button>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">Registrar Nueva Lesión</h1>
        <p className="text-[#5f7b6f] mt-1 text-lg">Proporciona detalles específicos para establecer el perfil base de esta lesión.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        <section>
          <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider mb-4">1. Identificación y Ubicación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-md border border-[#d8e0dc] shadow-none">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#0c1512]">Nombre identificador</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Lunar oscuro en el hombro derecho"
                className="border-[#d8e0dc] bg-[#f4f6f5] focus-visible:ring-[#0c1512]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0c1512]">Parte del cuerpo</label>
              <select
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className="w-full h-10 rounded-md border border-[#d8e0dc] bg-[#f4f6f5] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0c1512] cursor-pointer"
              >
                <option value="" disabled>Selecciona una zona</option>
                <option value="cabeza">Cabeza y Rostro</option>
                <option value="cuello">Cuello</option>
                <option value="torso_frente">Torso (Frente)</option>
                <option value="espalda">Espalda</option>
                <option value="brazo_izq">Brazo Izquierdo</option>
                <option value="brazo_der">Brazo Derecho</option>
                <option value="pierna_izq">Pierna Izquierda</option>
                <option value="pierna_der">Pierna Derecha</option>
                <option value="manos_pies">Manos o Pies</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#0c1512]">Ubicación exacta detallada</label>
              <Input
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej: Tres centímetros debajo de la clavícula"
                className="border-[#d8e0dc] bg-[#f4f6f5] focus-visible:ring-[#0c1512]"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider">2. Características Iniciales</h2>
          </div>

          <div className="space-y-6 bg-white p-6 rounded-md border border-[#d8e0dc] shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#0c1512]">Tamaño aproximado</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tamaño}
                    onChange={(e) => setTamaño(e.target.value)}
                    placeholder="Ej: 6"
                    className="border-[#d8e0dc] bg-[#f4f6f5] w-24 focus-visible:ring-[#0c1512]"
                  />
                  <span className="text-sm text-[#5f7b6f]">milímetros de diámetro</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-[#0c1512]">¿Hace cuánto notaste esta lesión?</label>
                <select className="w-full h-10 rounded-md border border-[#d8e0dc] bg-[#f4f6f5] px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0c1512]">
                  <option value="">Recientemente (Días/Semanas)</option>
                  <option value="">Hace algunos meses</option>
                  <option value="">Hace más de un año</option>
                  <option value="">Siempre la he tenido, pero cambió</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#f4f6f5]">
              <label className="text-sm font-medium text-[#0c1512]">Colores presentes</label>
              <div className="flex flex-wrap gap-2">
                {opcionesColores.map((color) => (
                  <label key={color} className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:bg-[#f4f6f5] transition-colors">
                    <input
                      type="checkbox"
                      checked={colores.includes(color)}
                      onChange={() => setColores((prev) => toggle(prev, color))}
                      className={`accent-[#0c1512] w-4 h-4 cursor-pointer ${colores.includes(color) ? 'border-[#0c1512]' : 'border-[#d8e0dc]'}`}
                    />
                    <span className={`text-sm font-medium text-[#0c1512] ${colores.includes(color) ? 'font-semibold' : ''}`}>{color}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#f4f6f5]">
              <label className="text-sm font-medium text-[#0c1512]">Síntomas actuales</label>
              <div className="flex flex-wrap gap-2">
                {opcionesSintomas.map((sintoma) => (
                  <label key={sintoma} className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:bg-[#f4f6f5] transition-colors">
                    <input
                      type="checkbox"
                      checked={sintomas.includes(sintoma)}
                      onChange={() => setSintomas((prev) => toggle(prev, sintoma))}
                      className={`accent-[#0c1512] w-4 h-4 cursor-pointer ${sintomas.includes(sintoma) ? 'border-[#0c1512]' : 'border-[#d8e0dc]'}`}
                    />
                    <span className={`text-sm font-medium text-[#0c1512] ${sintomas.includes(sintoma) ? 'font-semibold' : ''}`}>{sintoma}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider mb-4">3. Fotografía Base</h2>
          <Card className="border-[#d8e0dc] shadow-none rounded-md bg-white">
            <CardContent className="p-0">
              <div className="p-6">
                {fotoUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={fotoUrl} alt="Foto base" className="w-full max-w-md h-auto rounded-md border border-[#d8e0dc] object-cover" />
                    <p className="text-[11px] text-[#5f7b6f] text-center">Foto guardada en tu expediente clínico</p>
                    <Button variant="outline" size="sm" onClick={removeFoto} className="text-[#5f7b6f]">
                      Eliminar foto
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#d8e0dc] hover:border-[#0c1512] bg-[#fcfdfd] rounded-md p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                    <h3 className="text-base font-semibold text-[#0c1512] mb-1">Toma la primera fotografía</h3>
                    <p className="text-[#5f7b6f] text-sm max-w-sm mb-6">Esta imagen servirá como punto de comparación inicial. Asegúrate de enfocar correctamente.</p>
                    <CameraCapture onCapture={async (blob) => {
                      const dataUrl = await blobToDataURL(blob);
                      setFotoBase(dataUrl as string);
                      setFotoUrl(dataUrl as string);
                    }} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-[#d8e0dc]">
          <Button type="button" variant="ghost" className="text-[#5f7b6f] hover:text-[#0c1512]" onClick={() => navigate('/dashboard/lesiones')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none rounded-md px-8">
            {saving ? 'Guardando...' : 'Guardar perfil de lesión'}
          </Button>
        </div>
      </form>
    </div>
  );
}
