import { API_BASE } from '@/lib/api';
import type { RegistroFoto } from './registrosData';

export interface LesionLike {
  id: number;
  nombre: string;
  zona: string;
  ubicacion?: string | null;
  tamaño?: string | null;
  creado_en: string;
}

export interface SeguimientoLike {
  id: number;
  lesion_id: number;
  fecha: string;
  cambios: string;
  color: string;
  sintomas: string;
  notas?: string | null;
  fotos?: { id: number; orden: number }[];
  foto_count?: number;
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

function fmtFecha(iso: string): { fecha: string; fullDate: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { fecha: iso, fullDate: iso };
  return {
    fecha: d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }),
    fullDate: `${d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })} - ${d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs`,
  };
}

function siNo(v: string): string {
  return v === 'si' ? 'Sí' : v === 'no' ? 'No' : v;
}

/** Normaliza el tamaño de lesión a "~6 mm" sin duplicar la unidad. */
function fmtTamano(tamano?: string | null): string {
  const t = (tamano || '').trim();
  if (!t) return 'N/A';
  const num = t.replace(/mm\s*$/i, '').trim();
  return num ? `${num} mm` : 'N/A';
}

/**
 * Convierte lesiones + seguimientos reales del paciente en capturas
 * con la forma RegistroFoto que consume GaleriaImagenes4Col.
 * Cada foto de seguimiento y la foto base de la lesión se vuelven una captura.
 */
export function buildCapturasFromPatient(
  lesiones: LesionLike[],
  seguimientosPorLesion: Record<number, SeguimientoLike[]>
): RegistroFoto[] {
  const capturas: RegistroFoto[] = [];

  for (const lesion of lesiones) {
    const zonaLabel = ZONA_LABELS[lesion.zona] || lesion.zona;
    const ubicacion = lesion.ubicacion ? `${zonaLabel} — ${lesion.ubicacion}` : zonaLabel;
    const segs = [...(seguimientosPorLesion[lesion.id] || [])].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    // Foto base de la lesión (registro inicial)
    const baseFecha = fmtFecha(lesion.creado_en);
    capturas.push({
      id: `LES-${lesion.id}-BASE`,
      tag: 'BASE',
      fecha: baseFecha.fecha,
      fullDate: baseFecha.fullDate,
      isoDate: lesion.creado_en,
      tipo: 'Foto inicial de lesión',
      aumento: '',
      lesion: lesion.nombre,
      ubicacion,
      diametro: fmtTamano(lesion.tamaño),
      area: '',
      scoreTDS: 'N/A',
      asimetria: 'N/A',
      bordes: 'N/A',
      color: 'N/A',
      estado: 'Registro inicial',
      estadoColor: 'bg-slate-100 text-slate-800 border-slate-200',
      autor: 'Paciente',
      calidad: '',
      dispositivo: 'App Skinnor',
      roi: '—',
      colorTonos: '—',
      hallazgos: 'Fotografía base registrada al crear la lesión.',
      svgHue: '#5c3a26',
      previewUrl: `${API_BASE}/lesiones/${lesion.id}/foto`,
      imageUrl: `${API_BASE}/lesiones/${lesion.id}/foto`,
    });

    // Seguimientos ordenados cronológicamente → tags T1..Tn
    segs.forEach((seg, idx) => {
      const tag = `T${idx + 1}`;
      const fotos = [...(seg.fotos || [])].sort((a, b) => a.orden - b.orden);
      const lista = fotos.length > 0 ? fotos : [{ id: 0, orden: 0 }];
      const fFecha = fmtFecha(seg.fecha);
      const respuestas = `Cambios: ${siNo(seg.cambios)} • Color: ${siNo(seg.color)} • Síntomas: ${siNo(seg.sintomas)}`;

      lista.forEach((f, fotoIdx) => {
        const esFallback = f.id === 0 && !(seg.foto_count ?? 0);
        capturas.push({
          id: `SEG-${seg.id}-F${f.id || fotoIdx}`,
          tag: fotos.length > 1 ? `${tag}.${fotoIdx + 1}` : tag,
          fecha: fFecha.fecha,
          fullDate: fFecha.fullDate,
          isoDate: seg.fecha,
          tipo: 'Registro de seguimiento',
          aumento: '',
          lesion: lesion.nombre,
          ubicacion,
          diametro: fmtTamano(lesion.tamaño),
          area: '',
          scoreTDS: 'N/A',
          asimetria: 'N/A',
          bordes: 'N/A',
          color: 'N/A',
          estado: seg.cambios === 'si' ? 'Cambios reportados' : 'Sin cambios',
          estadoColor: seg.cambios === 'si'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200',
          autor: 'Paciente',
          calidad: '',
          dispositivo: 'App Skinnor',
          roi: '—',
          colorTonos: respuestas,
          hallazgos: seg.notas || 'Sin notas adicionales del paciente.',
          svgHue: '#5c3a26',
          previewUrl: esFallback
            ? `${API_BASE}/lesiones/${lesion.id}/seguimientos/${seg.id}/foto`
            : `${API_BASE}/lesiones/${lesion.id}/seguimientos/${seg.id}/fotos/${f.id}`,
          imageUrl: esFallback
            ? `${API_BASE}/lesiones/${lesion.id}/seguimientos/${seg.id}/foto`
            : `${API_BASE}/lesiones/${lesion.id}/seguimientos/${seg.id}/fotos/${f.id}`,
        });
      });
    });
  }

  return capturas.sort(
    (a, b) => new Date(a.isoDate || a.fecha).getTime() - new Date(b.isoDate || b.fecha).getTime()
  );
}
