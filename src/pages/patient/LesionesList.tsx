import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Download, Upload, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { get, post, API_BASE } from '@/lib/api';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';

const API_BASE_URL = API_BASE;

interface Lesion {
  id: number;
  paciente_id: number;
  nombre: string;
  zona: string;
  ubicacion?: string;
  tamaño?: string;
  colores?: string[];
  sintomas?: string[];
  creado_en: string;
}

export default function LesionesList() {
  const { user } = useAuth();
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLesiones = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { paciente_id: String(user.id) };
      if (search.trim()) params.search = search.trim();
      const data = await get('/lesiones', params);
      setLesiones(data || []);
    } catch {
      toast.error('No se pudieron cargar las lesiones');
    } finally {
      setLoading(false);
    }
  }, [user, search]);

  useEffect(() => {
    loadLesiones();
  }, [loadLesiones]);

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/export`);
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skinnor-respaldo-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Respaldo exportado');
    } catch {
      toast.error('No se pudo exportar el respaldo');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await post('/import', json);
      await loadLesiones();
      toast.success('Respaldo importado');
    } catch {
      toast.error('No se pudo importar el respaldo');
    } finally {
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pb-12">
        <div className="flex items-center justify-center h-64 text-[#5f7b6f]">Cargando lesiones...</div>
      </div>
    );
  }

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
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center text-sm text-[#5f7b6f] mb-1">
              <span className="text-[#0c1512] font-medium">Mis Lesiones</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">Catálogo de Lesiones</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona los lunares y manchas que estás monitoreando.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2 text-[#5f7b6f] hover:text-[#0c1512]">
              <Download className="h-4 w-4" /> Exportar respaldo
            </Button>
            <label className="flex items-center gap-2 cursor-pointer text-[#5f7b6f] hover:text-[#0c1512]">
              <Upload className="h-4 w-4" />
              <input type="file" accept=".json" className="sr-only" onChange={handleImport} />
              Importar respaldo
            </label>
            <Link to="/dashboard/lesiones/crear">
              <Button className="bg-[#0c1512] hover:bg-[#3f4f49] text-white rounded-md shadow-none">
                <Plus className="mr-2 h-4 w-4" /> Nueva Lesión
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-md mb-8">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5f7b6f]" />
        <Input
          type="search"
          placeholder="Buscar por nombre o ubicación..."
          className="w-full rounded-md border-[#d8e0dc] pl-9 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {lesiones.length === 0 ? (
        <div className="text-center py-20 text-[#5f7b6f]">
          <p className="text-lg">No hay lesiones registradas</p>
          <p className="text-sm mt-1">Crea tu primera lesión para comenzar el seguimiento fotográfico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {lesiones.map((lesion) => {
            const fotoUrl = `${API_BASE_URL}/lesiones/${lesion.id}/foto`;
            return (
              <Card key={lesion.id} className="border-[#d8e0dc] shadow-none rounded-xl overflow-hidden bg-white hover:border-[#0c1512] transition-colors group flex flex-col">
                <div className="aspect-[4/3] bg-[#e9efec] relative flex items-center justify-center border-b border-[#d8e0dc]">
                  <img src={fotoUrl} alt="Lesión" className="w-full h-full object-cover opacity-85 mix-blend-multiply" />
                  <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-sm text-xs font-semibold text-[#0c1512] border border-[#d8e0dc]">
                    {zonaLabel[lesion.zona] || lesion.zona}
                  </div>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="mb-2">
                    <h3 className="font-semibold text-xl text-[#0c1512] leading-tight">{lesion.nombre}</h3>
                  </div>
                  <div className="flex gap-4 mt-1 mb-6 text-sm text-[#5f7b6f]">
                    <div>Seguimientos pendientes</div>
                    <div>•</div>
                    <div>Desde {new Date(lesion.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div className="mt-auto space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link to={`/dashboard/seguimientos/crear?lesion=${lesion.id}`} className="w-full">
                        <Button variant="outline" className="w-full border-[#d8e0dc] text-[#0c1512] hover:bg-[#f4f6f5]">
                          Añadir foto
                        </Button>
                      </Link>
                      <Link to={`/dashboard/lesiones/${lesion.id}`} className="w-full">
                        <Button variant="ghost" className="w-full text-[#0c1512] hover:bg-[#f4f6f5]">
                          Historial <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
