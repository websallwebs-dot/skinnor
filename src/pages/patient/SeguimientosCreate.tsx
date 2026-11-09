import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import CameraCapture from '@/components/CameraCapture';
import { get, post, blobToDataURL } from '@/lib/api';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';

interface Lesion {
  id: number;
  nombre: string;
  zona: string;
}

export default function SeguimientosCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [selectedLesionId, setSelectedLesionId] = useState<number | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [cambios, setCambios] = useState<'si' | 'no'>('no');
  const [color, setColor] = useState<'si' | 'no'>('no');
  const [sintomas, setSintomas] = useState<'si' | 'no'>('no');
  const [tamanoMm, setTamanoMm] = useState<string>('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    get('/lesiones', { paciente_id: String(user.id) }).then((data: Lesion[]) => {
      setLesiones(data || []);
      const paramId = searchParams.get('lesion');
      if (paramId) {
        const id = Number(paramId);
        if ((data || []).some((l) => l.id === id)) {
          setSelectedLesionId(id);
        }
      } else if (data && data.length > 0) {
        setSelectedLesionId(data[0].id);
      }
    }).catch(() => {
      toast.error('No se pudieron cargar tus lesiones');
    });
  }, [user?.id, searchParams]);

  const lesion = lesiones.find((l) => l.id === selectedLesionId);

  const addFoto = async (blob: Blob) => {
    const dataUrl = await blobToDataURL(blob);
    setFotos((prev) => [...prev, dataUrl as string]);
  };

  const removeFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesionId) {
      toast.error('Selecciona una lesión');
      return;
    }
    if (fotos.length === 0) {
      toast.error('Agrega al menos una fotografía');
      return;
    }
    setSaving(true);
    try {
      await post(`/lesiones/${selectedLesionId}/seguimientos`, {
        fecha: new Date().toISOString(),
        cambios,
        color,
        sintomas,
        tamano_mm: tamanoMm.trim() !== '' ? Number(tamanoMm) : null,
        notas,
        fotos,
      });
      toast.success('Registro guardado');
      navigate(`/dashboard/lesiones/${selectedLesionId}`);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar el registro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8 border-b border-[#d8e0dc] pb-6">
        <Link to="/dashboard/lesiones" className="inline-flex items-center text-sm text-[#5f7b6f] mb-2 hover:text-[#0c1512] transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Catálogo de lesiones
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">Añadir evolución</h1>
        <p className="text-[#5f7b6f] mt-1">Sube una o varias fotos del estado actual y registra cualquier cambio detectado.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider mb-3">1. Selección de lesión</h2>
          <Card className="border-[#d8e0dc] shadow-none rounded-md bg-white">
            <CardContent className="p-5">
              <select
                value={selectedLesionId ?? ''}
                onChange={(e) => setSelectedLesionId(Number(e.target.value))}
                className="w-full h-10 rounded-md border border-[#d8e0dc] bg-[#f4f6f5] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0c1512] cursor-pointer"
              >
                <option value="" disabled>Selecciona una lesión de tu lista</option>
                {lesiones.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre} - {zonaLabel(l.zona)}
                  </option>
                ))}
              </select>
              {selectedLesionId && !lesion && (
                <p className="text-[11px] text-[#5f7b6f] mt-2">La lesión seleccionada ya no existe.</p>
              )}
              {lesiones.length === 0 && (
                <p className="text-[11px] text-[#5f7b6f] mt-2">No tienes lesiones registradas. Crea una primero.</p>
              )}
              <div className="mt-3 flex justify-end">
                <Link to="/dashboard/lesiones/crear" className="text-sm text-[#5f7b6f] hover:text-[#0c1512] underline font-medium">
                  Registrar una lesión nueva
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider mb-3">
            2. Fotografías ({fotos.length})
          </h2>
          <Card className="border-[#d8e0dc] shadow-none rounded-md bg-white">
            <CardContent className="p-5 space-y-4">
              {fotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fotos.map((src, i) => (
                    <div key={i} className="relative rounded-md overflow-hidden border border-[#d8e0dc] bg-[#f4f6f5]">
                      <img src={src} alt={`Foto ${i + 1}`} className="w-full aspect-square object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFoto(i)}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-[#0c1512]/80 text-white flex items-center justify-center hover:bg-[#0c1512]"
                        aria-label={`Eliminar foto ${i + 1}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-white/90 text-[#0c1512] px-1.5 py-0.5 rounded-sm">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border border-dashed border-[#d8e0dc] hover:border-[#0c1512] bg-[#fcfdfd] rounded-md p-6 flex flex-col items-center justify-center text-center transition-colors">
                <Camera className="h-6 w-6 mb-2 text-[#5f7b6f]" />
                <p className="text-[#5f7b6f] text-sm mb-4">
                  {fotos.length === 0
                    ? 'Captura desde tu cámara o sube archivos. Puedes agregar varias fotos.'
                    : 'Agregar otra foto al mismo registro'}
                </p>
                <CameraCapture onCapture={addFoto} label="Añadir fotografía" />
              </div>
              <p className="text-[11px] text-[#5f7b6f] text-center">
                Coloca una moneda al lado para referencia de tamaño, usa luz natural y mantén siempre la misma distancia.
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider mb-3">3. Análisis de cambios</h2>
          <Card className="border-[#d8e0dc] shadow-none rounded-md bg-white">
            <CardContent className="p-5 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-md bg-[#f4f6f5] border border-[#d8e0dc]">
                  <div>
                    <h4 className="font-semibold text-[#0c1512] text-sm">¿Cambió de tamaño o forma?</h4>
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="size"
                        value="si"
                        checked={cambios === 'si'}
                        onChange={() => setCambios('si')}
                        className="accent-[#0c1512] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[#0c1512]">Sí</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="size"
                        value="no"
                        checked={cambios === 'no'}
                        onChange={() => setCambios('no')}
                        className="accent-[#0c1512] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[#0c1512]">No</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-md bg-[#f4f6f5] border border-[#d8e0dc]">
                  <div>
                    <h4 className="font-semibold text-[#0c1512] text-sm">¿Cambió de color?</h4>
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value="si"
                        checked={color === 'si'}
                        onChange={() => setColor('si')}
                        className="accent-[#0c1512] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[#0c1512]">Sí</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value="no"
                        checked={color === 'no'}
                        onChange={() => setColor('no')}
                        className="accent-[#0c1512] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[#0c1512]">No</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-md bg-[#f4f6f5] border border-[#d8e0dc]">
                  <div>
                    <h4 className="font-semibold text-[#0c1512] text-sm">¿Presenta síntomas nuevos?</h4>
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="symptoms"
                        value="si"
                        checked={sintomas === 'si'}
                        onChange={() => setSintomas('si')}
                        className="accent-[#0c1512] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[#0c1512]">Sí</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="symptoms"
                        value="no"
                        checked={sintomas === 'no'}
                        onChange={() => setSintomas('no')}
                        className="accent-[#0c1512] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[#0c1512]">No</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0c1512]">Diámetro estimado (opcional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={tamanoMm}
                    onChange={(e) => setTamanoMm(e.target.value)}
                    placeholder="Ej: 6.5"
                    className="w-32 h-10 rounded-md border border-[#d8e0dc] bg-[#f4f6f5] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0c1512]"
                  />
                  <span className="text-sm text-[#5f7b6f]">mm de diámetro mayor</span>
                </div>
                <p className="text-[11px] text-[#5f7b6f]">
                  Mide con la misma referencia de la foto anterior (moneda o regla). Permite seguir el crecimiento en el tiempo.
                </p>
              </div>

              <div className="space-y-2 mt-6">
                <label className="text-sm font-semibold text-[#0c1512]">Notas adicionales (Opcional)</label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Describe con tus palabras cualquier detalle relevante..."
                  className="min-h-[80px] border-[#d8e0dc] resize-y bg-[#f4f6f5] text-[#0c1512] focus-visible:ring-1 focus-visible:ring-[#0c1512] rounded-md"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-8 border-t border-[#d8e0dc]">
          <Button
            type="button"
            variant="ghost"
            className="text-[#5f7b6f] hover:text-[#0c1512] font-medium"
            onClick={() => navigate('/dashboard/lesiones')}
          >
            Cancelar y volver
          </Button>
          <Button
            type="submit"
            disabled={saving || !selectedLesionId || fotos.length === 0 || lesion === undefined}
            className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none rounded-md px-8 py-6 h-auto text-base"
          >
            {saving ? 'Guardando...' : `Guardar registro${fotos.length > 1 ? ` (${fotos.length} fotos)` : ''}`}
          </Button>
        </div>
      </form>
    </div>
  );
}

function zonaLabel(zona: string): string {
  const labels: Record<string, string> = {
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
  return labels[zona] || zona;
}
