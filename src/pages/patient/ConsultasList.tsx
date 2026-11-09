import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Plus, Send, MessageSquare, Link2, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { get, post } from '@/lib/api';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';

interface Consulta {
  id: number;
  paciente_id: number;
  profesional_id: number;
  tema: string;
  estado: string;
  creado_en: string;
  actualizado_en: string;
  profesional_nombre?: string;
}

interface Vinculacion {
  id: number;
  profesional_id: number;
  profesional_email?: string;
}

interface Mensaje {
  id: number;
  remitente_id: number;
  remitente_tipo: 'paciente' | 'profesional';
  contenido: string;
  leido: number;
  creado_en: string;
  remitente_nombre?: string;
}

export default function ConsultasList() {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(false);
  const [pacienteRowId, setPacienteRowId] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nuevaTema, setNuevaTema] = useState('');
  const [nuevoProfesionalId, setNuevoProfesionalId] = useState('');
  const [profesionales, setProfesionales] = useState<Vinculacion[]>([]);

  const [search, setSearch] = useState('');
  const [codigoVinculacion, setCodigoVinculacion] = useState('');
  const [vinculando, setVinculando] = useState(false);

  const [activeConsulta, setActiveConsulta] = useState<Consulta | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const loadConsultas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const me = await get(`/pacientes/me?usuario_id=${user.id}`);
      const pid = me?.id;
      setPacienteRowId(pid ?? null);
      if (!pid) {
        setConsultas([]);
        return;
      }
      const [data, vinc] = await Promise.all([
        get(`/consultas?paciente_id=${pid}`),
        get(`/vinculaciones?paciente_id=${pid}`),
      ]);
      setConsultas(Array.isArray(data) ? data : []);
      setProfesionales(Array.isArray(vinc) ? vinc : []);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudieron cargar las consultas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConsultas();
  }, [loadConsultas]);

  const handleVincular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteRowId || !codigoVinculacion.trim()) return;
    setVinculando(true);
    try {
      await post('/vinculaciones', {
        paciente_id: pacienteRowId,
        codigo: codigoVinculacion.trim(),
      });
      setCodigoVinculacion('');
      toast.success('Profesional vinculado correctamente');
      await loadConsultas();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo vincular el código');
    } finally {
      setVinculando(false);
    }
  };

  const handleCrearConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pacienteRowId) return;
    if (!nuevaTema.trim() || !nuevoProfesionalId) {
      toast.error('Completa el tema y selecciona un profesional');
      return;
    }
    setSubmitting(true);
    try {
      await post('/consultas', {
        paciente_id: pacienteRowId,
        profesional_id: Number(nuevoProfesionalId),
        tema: nuevaTema.trim(),
      });
      setNuevaTema('');
      setNuevoProfesionalId('');
      setFormOpen(false);
      await loadConsultas();
      toast.success('Consulta creada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear la consulta');
    } finally {
      setSubmitting(false);
    }
  };

  const openConsulta = async (c: Consulta) => {
    setActiveConsulta(c);
    setMensajeTexto('');
    try {
      const data = await get(`/consultas/${c.id}/mensajes`);
      setMensajes(Array.isArray(data) ? data : []);
    } catch {
      setMensajes([]);
    }
  };

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConsulta || !mensajeTexto.trim()) return;
    setEnviando(true);
    try {
      await post(`/consultas/${activeConsulta.id}/mensajes`, {
        remitente_id: Number(user.id),
        remitente_tipo: 'paciente',
        contenido: mensajeTexto.trim(),
      });
      setMensajeTexto('');
      const data = await get(`/consultas/${activeConsulta.id}/mensajes`);
      setMensajes(Array.isArray(data) ? data : []);
      await loadConsultas();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  const estadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      pendiente: 'bg-[#fef3c7] text-[#92400e]',
      resuelto: 'bg-[#d1fae5] text-[#065f46]',
      cerrado: 'bg-[#f3f4f6] text-[#4b5563]',
    };
    return `text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${styles[estado] || styles.pendiente}`;
  };

  const q = search.trim().toLowerCase();
  const filtered = consultas.filter((c) =>
    !q ||
    c.tema.toLowerCase().includes(q) ||
    (c.profesional_nombre || '').toLowerCase().includes(q)
  );

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">Consultas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Historial de consultas enviadas a los especialistas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setFormOpen(!formOpen)}
              className="bg-[#0c1512] hover:bg-[#3f4f49] text-white rounded-md shadow-none font-medium flex items-center gap-2"
            >
              {formOpen ? (
                <><X className="h-4 w-4" /> Cancelar</>
              ) : (
                <><Plus className="h-4 w-4" /> Nueva Consulta</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Profesionales vinculados + código de acceso */}
      <Card className="border-[#d8e0dc] shadow-sm rounded-xl overflow-hidden bg-white mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#0c1512] flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#0d7a63]" /> Profesionales vinculados
              </h3>
              {profesionales.length === 0 ? (
                <p className="text-xs text-[#5f7b6f] mt-1">
                  No tienes profesionales vinculados. Pide a tu especialista un código de acceso
                  (lo genera desde su panel en "Solicitudes y Enlaces") e ingrésalo aquí.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profesionales.map((v) => (
                    <span key={v.id} className="text-xs bg-[#e9efec] text-[#0d7a63] border border-[#d8e0dc] px-2.5 py-1 rounded-full font-medium">
                      {v.profesional_email || `Profesional #${v.profesional_id}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleVincular} className="flex gap-2 w-full lg:w-auto">
              <Input
                value={codigoVinculacion}
                onChange={(e) => setCodigoVinculacion(e.target.value.toUpperCase())}
                placeholder="Código de acceso (ej: SK-XXXX)"
                className="border-[#d8e0dc] bg-[#f4f6f5] font-mono text-sm tracking-wider w-full lg:w-56"
              />
              <Button type="submit" disabled={vinculando || !codigoVinculacion.trim()} variant="outline" className="border-[#d8e0dc] text-[#0c1512] shrink-0">
                <Link2 className="h-4 w-4 mr-1.5" /> {vinculando ? '...' : 'Vincular'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {formOpen && (
        <Card className="border-[#d8e0dc] shadow-sm rounded-xl overflow-hidden bg-white mb-6">
          <CardContent className="p-6">
            {profesionales.length === 0 ? (
              <p className="text-sm text-[#5f7b6f]">
                No tienes profesionales vinculados todavía. Pide a tu especialista que comparta su código de acceso
                desde su panel y vincúlalo para poder enviar consultas.
              </p>
            ) : (
              <form onSubmit={handleCrearConsulta} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label htmlFor="profesional" className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                    Profesional (destinatario)
                  </label>
                  <select
                    id="profesional"
                    value={nuevoProfesionalId}
                    onChange={(e) => setNuevoProfesionalId(e.target.value)}
                    className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-[#f4f6f5] focus-visible:ring-[#0c1512] focus-visible:outline-none"
                  >
                    <option value="">Selecciona un profesional</option>
                    {profesionales.map((v) => (
                      <option key={v.id} value={v.profesional_id}>
                        {v.profesional_email || `Profesional #${v.profesional_id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="tema" className="text-xs font-semibold uppercase tracking-wider text-[#5f7b6f]">
                    Tema de la consulta
                  </label>
                  <Input
                    id="tema"
                    value={nuevaTema}
                    onChange={(e) => setNuevaTema(e.target.value)}
                    placeholder="Ej: Revisión de lunar en brazo izquierdo"
                    className="border-[#d8e0dc] bg-[#f4f6f5] focus-visible:ring-[#0c1512]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="text-[#5f7b6f]">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-[#0c1512] hover:bg-[#3f4f49] text-white">
                    {submitting ? 'Creando...' : 'Crear Consulta'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-[#d8e0dc] shadow-sm rounded-xl overflow-hidden bg-white min-h-[300px]">
        <div className="p-4 border-b border-[#d8e0dc] flex justify-end">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Buscar por tema o profesional"
              className="w-full rounded-md border-[#d8e0dc] pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-[#d8e0dc]">
              <TableHead className="font-semibold text-[#0c1512]">Consulta</TableHead>
              <TableHead className="font-semibold text-[#0c1512]">Profesional</TableHead>
              <TableHead className="font-semibold text-[#0c1512]">Estado</TableHead>
              <TableHead className="font-semibold text-[#0c1512]">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent border-0">
                <TableCell colSpan={4} className="h-[200px] text-center text-[#5f7b6f]">
                  Cargando consultas...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent border-0">
                <TableCell colSpan={4} className="h-[200px] text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-[#f4f6f5] flex items-center justify-center mb-3">
                      <MessageSquare className="h-5 w-5 text-[#5f7b6f]" />
                    </div>
                    <p className="font-semibold text-[#0c1512]">No se encontraron registros</p>
                    <p className="text-xs text-[#5f7b6f] mt-1">Crea tu primera consulta para comunicarte con un especialista.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => openConsulta(c)}
                  className="hover:bg-[#fafcfa] border-b border-[#d8e0dc] cursor-pointer"
                >
                  <TableCell className="font-medium text-[#0c1512]">
                    {c.tema}
                  </TableCell>
                  <TableCell className="text-sm text-[#3f4f49]">
                    {c.profesional_nombre || `Profesional #${c.profesional_id}`}
                  </TableCell>
                  <TableCell>
                    <span className={estadoBadge(c.estado)}>
                      {c.estado === 'pendiente' ? 'Pendiente' : c.estado === 'resuelto' ? 'Resuelto' : 'Cerrado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#5f7b6f]">
                    {new Date(c.actualizado_en).toLocaleDateString('es-ES')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={activeConsulta !== null} onOpenChange={(open) => { if (!open) setActiveConsulta(null); }}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
          <h2 className="text-lg font-semibold text-[#0c1512] mb-1">{activeConsulta?.tema}</h2>
          <p className="text-xs text-[#5f7b6f] mb-4">
            {activeConsulta?.profesional_nombre || 'Profesional'} •{' '}
            {activeConsulta && new Date(activeConsulta.creado_en).toLocaleDateString('es-ES')}
          </p>

          <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[50vh] pr-1">
            {mensajes.length === 0 ? (
              <p className="text-sm text-[#5f7b6f] text-center py-8">Aún no hay mensajes en esta consulta.</p>
            ) : (
              mensajes.map((m) => {
                const esMio = m.remitente_tipo === 'paciente';
                return (
                  <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        esMio
                          ? 'bg-[#0c1512] text-white'
                          : 'bg-[#f4f6f5] text-[#0c1512] border border-[#d8e0dc]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.contenido}</p>
                      <p className={`text-[10px] mt-1 ${esMio ? 'text-white/60' : 'text-[#5f7b6f]'}`}>
                        {esMio ? 'Tú' : m.remitente_nombre || 'Profesional'} • {new Date(m.creado_en).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleEnviarMensaje} className="flex gap-2 pt-3 border-t border-[#d8e0dc]">
            <Textarea
              value={mensajeTexto}
              onChange={(e) => setMensajeTexto(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="min-h-[44px] max-h-[120px] resize-none border-[#d8e0dc] text-sm"
              rows={1}
            />
            <Button type="submit" disabled={enviando || !mensajeTexto.trim()} className="bg-[#0c1512] hover:bg-[#3f4f49] text-white self-end">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
