import { useState, useEffect, useCallback } from 'react';
import { get, API_BASE } from '@/lib/api';
import { useAuth } from '@/AuthContext';

export interface SeguimientoFoto {
  id: number;
  orden: number;
}

export interface Seguimiento {
  id: number;
  lesion_id: number;
  fecha: string;
  cambios: string;
  color: string;
  sintomas: string;
  tamano_mm?: number | null;
  notas?: string | null;
  fotos: SeguimientoFoto[];
  foto_count: number;
}

export interface Lesion {
  id: number;
  paciente_id: number;
  usuario_id?: number;
  nombre: string;
  zona: string;
  ubicacion?: string | null;
  tamaño?: string | null;
  colores?: string[];
  sintomas?: string[];
  creado_en: string;
  seguimientos: Seguimiento[];
}

export function lesionFotoUrl(lesionId: number): string {
  return `${API_BASE}/lesiones/${lesionId}/foto`;
}

export function seguimientoFotoUrl(lesionId: number, seguimientoId: number, fotoId: number): string {
  return `${API_BASE}/lesiones/${lesionId}/seguimientos/${seguimientoId}/fotos/${fotoId}`;
}

export function usePatientLesiones() {
  const { user } = useAuth();
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLesiones([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await get('/lesiones', { paciente_id: user.id });
      const rows: Lesion[] = Array.isArray(list) ? list : [];
      const withSeguimientos = await Promise.all(
        rows.map(async (l) => {
          try {
            const segs = await get(`/lesiones/${l.id}/seguimientos`);
            return { ...l, seguimientos: Array.isArray(segs) ? segs : [] };
          } catch {
            return { ...l, seguimientos: [] as Seguimiento[] };
          }
        })
      );
      setLesiones(withSeguimientos);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las lesiones');
      setLesiones([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { lesiones, loading, error, reload: load };
}
