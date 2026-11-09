import { Link, useParams } from 'react-router-dom';
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Camera, X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CameraCapture from '@/components/CameraCapture';
import { get, post, blobToDataURL, API_BASE } from '@/lib/api';
import { toast } from 'sonner';

interface Lesion {
  id: number;
  nombre: string;
  zona: string;
  ubicacion?: string;
  tamaño?: string;
  colores?: string[];
  sintomas?: string[];
  creado_en: string;
}

interface SeguimientoFoto {
  id: number;
  orden: number;
}

interface Seguimiento {
  id: number;
  lesion_id: number;
  fecha: string;
  cambios: 'si' | 'no';
  color: 'si' | 'no';
  sintomas: 'si' | 'no';
  notas?: string;
  fotos?: SeguimientoFoto[];
  foto_count?: number;
}

export default function LesionDetail() {
  const { id } = useParams();
  const lesionId = Number(id);
  const [lesion, setLesion] = useState<Lesion | null>(null);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addFotosSeg, setAddFotosSeg] = useState<Seguimiento | null>(null);
  const [pendingFotos, setPendingFotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [l, segs] = await Promise.all([
        get(`/lesiones/${lesionId}`),
        get(`/lesiones/${lesionId}/seguimientos`),
      ]);
      if (l && l.error) {
        setError(l.error);
        setLesion(null);
      } else {
        setLesion(l ?? null);
      }
      setSeguimientos((segs || []).sort((a: any, b: any) => b.fecha.localeCompare(a.fecha)));
    } catch (err: any) {
      const msg = err?.message || 'No se pudo cargar la lesión';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [lesionId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-center h-64 text-[#5f7b6f]">Cargando lesión...</div>
      </div>
    );
  }

  if (!lesion) {
    if (error) {
      return (
        <div className="max-w-5xl mx-auto pb-12">
          <Link to="/dashboard/lesiones" className="inline-flex items-center text-sm text-[#5f7b6f] mb-4 hover:text-[#0c1512] transition-colors font-medium">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver al catálogo
          </Link>
          <div className="text-center py-20 text-[#5f7b6f]">
            <p>{error}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <Link to="/dashboard/lesiones" className="inline-flex items-center text-sm text-[#5f7b6f] mb-4 hover:text-[#0c1512] transition-colors font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al catálogo
        </Link>
        <div className="text-center py-20 text-[#5f7b6f]">Lesión no encontrada</div>
      </div>
    );
  }

  const fotoUrl = `${API_BASE}/lesiones/${lesion.id}/foto`;

  const segFotoUrl = (seg: Seguimiento, fotoId?: number) =>
    fotoId
      ? `${API_BASE}/lesiones/${lesionId}/seguimientos/${seg.id}/fotos/${fotoId}`
      : `${API_BASE}/lesiones/${lesionId}/seguimientos/${seg.id}/foto`;

  const openAddFotos = (seg: Seguimiento) => {
    setPendingFotos([]);
    setAddFotosSeg(seg);
  };

  const addPendingFoto = async (blob: Blob) => {
    const dataUrl = await blobToDataURL(blob);
    setPendingFotos((prev) => [...prev, dataUrl as string]);
  };

  const savePendingFotos = async () => {
    if (!addFotosSeg || pendingFotos.length === 0) return;
    setUploading(true);
    try {
      await post(`/lesiones/${lesionId}/seguimientos/${addFotosSeg.id}/fotos`, { fotos: pendingFotos });
      toast.success(`${pendingFotos.length} foto${pendingFotos.length > 1 ? 's' : ''} agregada${pendingFotos.length > 1 ? 's' : ''} al registro`);
      setAddFotosSeg(null);
      setPendingFotos([]);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudieron subir las fotos');
    } finally {
      setUploading(false);
    }
  };

  const zonaLabel: Record<string, string> = {
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

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 border-b border-[#d8e0dc] pb-6">
        <Link to="/dashboard/lesiones" className="inline-flex items-center text-sm text-[#5f7b6f] mb-4 hover:text-[#0c1512] transition-colors font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al catálogo
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">{lesion.nombre}</h1>
            <p className="text-[#5f7b6f] mt-1 text-sm uppercase tracking-wider">
              ID: LSN-{lesion.id} • {zonaLabel[lesion.zona] || lesion.zona} • Registrada el {new Date(lesion.creado_en).toLocaleDateString('es-ES')}
            </p>
          </div>
          <Link to={`/dashboard/seguimientos/crear?lesion=${lesion.id}`}>
            <Button className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none rounded-md">
              Añadir registro de hoy
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider">Perfil de la lesión</h2>
          <Card className="border-[#d8e0dc] shadow-none rounded-md bg-[#f4f6f5]">
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-[#5f7b6f] mb-1">Ubicación</div>
                <div className="font-medium text-[#0c1512]">{zonaLabel[lesion.zona] || lesion.zona}</div>
              </div>
              <div>
                <div className="text-xs text-[#5f7b6f] mb-1">Tamaño inicial</div>
                <div className="font-medium text-[#0c1512]">{lesion.tamaño || 'No especificado'} mm de diámetro</div>
              </div>
              <div>
                <div className="text-xs text-[#5f7b6f] mb-1">Colores presentes</div>
                <div className="font-medium text-[#0c1512]">{lesion.colores?.join(', ') || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#5f7b6f] mb-1">Síntomas iniciales</div>
                <div className="font-medium text-[#0c1512]">{lesion.sintomas?.join(', ') || 'Ninguno'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider">Fotografía Base</h2>
          <div className="border border-[#d8e0dc] rounded-md overflow-hidden bg-white">
            <img src={fotoUrl} alt="Foto base" className="w-full h-auto aspect-video object-cover opacity-90 mix-blend-multiply" />
            <div className="p-2 text-[11px] text-[#5f7b6f] text-center bg-[#f4f6f5] border-t border-[#d8e0dc]">
              Capturada el {new Date(lesion.creado_en).toLocaleDateString('es-ES')}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6 border-b border-[#d8e0dc] pb-2">
          <h2 className="text-sm font-semibold text-[#0c1512] uppercase tracking-wider">Historial de Registros</h2>
          <span className="text-xs font-medium text-[#5f7b6f] bg-[#f4f6f5] px-2 py-1 rounded-sm border border-[#d8e0dc]">
            {seguimientos.length} Registros
          </span>
        </div>

        {seguimientos.length === 0 ? (
          <div className="text-center py-12 text-[#5f7b6f]">
            <p>No hay registros de seguimiento todavía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {seguimientos.map((seguimiento) => {
              const fotos = seguimiento.fotos || [];
              const dia = Math.ceil((new Date().getTime() - new Date(seguimiento.fecha).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <Card key={seguimiento.id} className="border-[#d8e0dc] shadow-none rounded-md bg-white overflow-hidden flex flex-col">
                  <div className="bg-[#e9efec] border-b border-[#d8e0dc] relative">
                    {fotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-px">
                        {fotos.slice(0, 4).map((f) => (
                          <img
                            key={f.id}
                            src={segFotoUrl(seguimiento, f.id)}
                            alt={`Seguimiento ${seguimiento.id} foto ${f.orden + 1}`}
                            className="w-full aspect-square object-cover opacity-90 mix-blend-multiply"
                          />
                        ))}
                      </div>
                    ) : (
                      <img src={segFotoUrl(seguimiento)} alt="Seguimiento" className="w-full aspect-square object-cover opacity-90 mix-blend-multiply" />
                    )}
                    {(seguimiento.foto_count ?? fotos.length) > 4 && (
                      <span className="absolute bottom-1 right-1 text-[10px] font-medium bg-[#0c1512]/80 text-white px-1.5 py-0.5 rounded-sm">
                        +{(seguimiento.foto_count ?? fotos.length) - 4} más
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[#0c1512] text-sm">{new Date(seguimiento.fecha).toLocaleDateString('es-ES')}</h3>
                        <span className="text-[10px] font-medium bg-[#e9efec] text-[#5f7b6f] px-1.5 py-0.5 rounded-sm">DÍA {dia}</span>
                      </div>
                      <p className="text-xs text-[#5f7b6f]">
                        Registro #{seguimiento.id}
                        {(seguimiento.foto_count ?? fotos.length) > 0 && ` • ${seguimiento.foto_count ?? fotos.length} foto${(seguimiento.foto_count ?? fotos.length) > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="space-y-1.5 mt-auto text-xs">
                      <div className="flex justify-between border-b border-[#f4f6f5] pb-1">
                        <span className="text-[#5f7b6f]">Cambios</span>
                        <span className={`font-medium ${seguimiento.cambios === 'si' ? 'text-[#0c1512]' : ''}`}>{seguimiento.cambios === 'si' ? 'Sí' : 'No'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#f4f6f5] pb-1">
                        <span className="text-[#5f7b6f]">Síntomas</span>
                        <span className={`font-medium ${seguimiento.sintomas === 'si' ? 'text-[#0c1512]' : ''}`}>{seguimiento.sintomas === 'si' ? 'Sí' : 'No'}</span>
                      </div>
                    </div>
                    {seguimiento.notas && (
                      <p className="text-[11px] text-[#3f4f49] mt-3 line-clamp-2">{seguimiento.notas}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddFotos(seguimiento)}
                      className="mt-3 w-full border-[#d8e0dc] text-[#5f7b6f] hover:text-[#0c1512] hover:bg-[#f4f6f5]"
                    >
                      <ImagePlus className="h-3.5 w-3.5 mr-1.5" /> Añadir fotos
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={addFotosSeg !== null} onOpenChange={(open) => { if (!open) { setAddFotosSeg(null); setPendingFotos([]); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-[#0c1512] mb-1">
            Añadir fotos al registro #{addFotosSeg?.id}
          </h2>
          <p className="text-sm text-[#5f7b6f] mb-4">
            {addFotosSeg ? new Date(addFotosSeg.fecha).toLocaleDateString('es-ES') : ''} — puedes subir varias imágenes a este mismo registro.
          </p>

          {pendingFotos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
              {pendingFotos.map((src, i) => (
                <div key={i} className="relative rounded-md overflow-hidden border border-[#d8e0dc]">
                  <img src={src} alt={`Nueva foto ${i + 1}`} className="w-full aspect-square object-cover" />
                  <button
                    type="button"
                    onClick={() => setPendingFotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-[#0c1512]/80 text-white flex items-center justify-center"
                    aria-label="Quitar foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border border-dashed border-[#d8e0dc] hover:border-[#0c1512] bg-[#fcfdfd] rounded-md p-4 flex flex-col items-center justify-center text-center transition-colors mb-4">
            <Camera className="h-5 w-5 mb-2 text-[#5f7b6f]" />
            <CameraCapture onCapture={addPendingFoto} label="Capturar o subir foto" />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              className="text-[#5f7b6f]"
              onClick={() => { setAddFotosSeg(null); setPendingFotos([]); }}
            >
              Cancelar
            </Button>
            <Button
              onClick={savePendingFotos}
              disabled={uploading || pendingFotos.length === 0}
              className="bg-[#0c1512] hover:bg-[#3f4f49] text-white"
            >
              {uploading ? 'Subiendo...' : `Guardar ${pendingFotos.length} foto${pendingFotos.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
