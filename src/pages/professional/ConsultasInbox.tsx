import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Paperclip, Send, Clock, CheckCircle2, Image as ImageIcon, AlertCircle, Mail, User as UserIcon } from 'lucide-react';
import { get, post, put } from '@/lib/api';
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
  paciente_nombre?: string;
  profesional_nombre?: string;
}

interface Mensaje {
  id: number;
  consulta_id: number;
  remitente_id: number;
  remitente_tipo: 'paciente' | 'profesional';
  contenido: string;
  leido: number;
  creado_en: string;
  remitente_nombre?: string;
}

export default function ConsultasInbox() {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadConsultas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await get(`/consultas?profesional_id=${user.id}`);
      setConsultas(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && activeThreadId === null) {
        setActiveThreadId(data[0].id);
      }
    } catch (err: any) {
      toast.error(err?.message || 'No se pudieron cargar las consultas');
    } finally {
      setLoading(false);
    }
  }, [user, activeThreadId]);

  useEffect(() => {
    loadConsultas();
  }, [loadConsultas]);

  const activeThread = consultas.find((c) => c.id === activeThreadId);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  const loadMensajes = useCallback(async () => {
    if (!activeThreadId) return;
    try {
      const data = await get(`/consultas/${activeThreadId}/mensajes`);
      setMensajes(data || []);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudieron cargar los mensajes');
    }
  }, [activeThreadId]);

  useEffect(() => {
    loadMensajes();
  }, [loadMensajes]);

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeThreadId || !inputText.trim()) return;
    setSending(true);
    try {
      await post(`/consultas/${activeThreadId}/mensajes`, {
        remitente_id: user.id,
        remitente_tipo: 'profesional',
        contenido: inputText,
      });
      setInputText('');
      await loadMensajes();
      // Refrescar la lista para actualizar actualizado_en
      await loadConsultas();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleMarcarEstado = async (nuevoEstado: 'resuelto' | 'pendiente') => {
    if (!activeThreadId) return;
    try {
      await put(`/consultas/${activeThreadId}/estado`, { estado: nuevoEstado });
      await loadConsultas();
      toast.success(`Consulta marcada como ${nuevoEstado}`);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar el estado');
    }
  };

  const q = search.trim().toLowerCase();
  const filteredThreads = consultas.filter(
    (t) =>
      (filter === 'all' || t.estado === 'pendiente') &&
      (!q ||
        (t.paciente_nombre || '').toLowerCase().includes(q) ||
        t.tema.toLowerCase().includes(q))
  );

  const estadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      pendiente: 'bg-[#fef3c7] text-[#92400e]',
      resuelto: 'bg-[#d1fae5] text-[#065f46]',
      cerrado: 'bg-[#f3f4f6] text-[#4b5563]',
    };
    return `text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${styles[estado] || styles.pendiente}`;
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto pb-12 text-center py-20 text-[#5f7b6f]">
        Debes iniciar sesión para ver las consultas.
      </div>
    );
  }

  return (
    <div className="max-w-6xl h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
            Bandeja de Consultas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra las dudas, alertas y seguimientos de tus pacientes.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 text-[11px] font-semibold uppercase tracking-widest py-1.5 rounded-sm transition-colors ${filter === 'pending' ? 'bg-[#e9efec] text-[#0d7a63]' : 'text-[#5f7b6f] hover:bg-white border border-transparent hover:border-[#d8e0dc]'}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 text-[11px] font-semibold uppercase tracking-widest py-1.5 rounded-sm transition-colors ${filter === 'all' ? 'bg-[#e9efec] text-[#0d7a63]' : 'text-[#5f7b6f] hover:bg-white border border-transparent hover:border-[#d8e0dc]'}`}
          >
            Todas
          </button>
        </div>
      </div>

      {consultas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#5f7b6f]">
          <Mail className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-semibold">No tienes consultas todavía</p>
          <p className="text-sm mt-1">Las consultas de tus pacientes aparecerán aquí.</p>
        </div>
      ) : (
        <Card className="flex flex-col md:flex-row h-[calc(100vh-12rem)] min-h-[600px] border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
          {/* Left Sidebar - Thread List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#d8e0dc] flex flex-col bg-[#fafcfa]">
            <div className="p-4 border-b border-[#d8e0dc]">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f7b6f]" />
                <Input
                  placeholder="Buscar paciente..."
                  className="pl-9 border-[#d8e0dc] bg-white shadow-none focus-visible:ring-[#0d7a63] text-sm h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full text-left p-4 border-b border-[#d8e0dc] hover:bg-white transition-colors relative ${activeThreadId === thread.id ? 'bg-white' : ''}`}
                >
                  {activeThreadId === thread.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0d7a63]"></div>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-[#0c1512] flex items-center gap-2">
                      {thread.paciente_nombre || 'Paciente'}
                    </span>
                    <span className="text-[11px] text-[#5f7b6f] font-medium">
                      {new Date(thread.actualizado_en).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="text-[12px] font-medium text-[#5f7b6f] mb-1">
                    {thread.tema}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={estadoBadge(thread.estado)}>
                      {thread.estado === 'pendiente' ? 'Pendiente' : thread.estado === 'resuelto' ? 'Resuelto' : 'Cerrado'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Area - Active Conversation */}
          <div className="flex-1 flex flex-col bg-white">
            {activeThread ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-[#d8e0dc] flex justify-between items-center bg-[#fafcfa]">
                  <div>
                    <h2 className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
                      {activeThread.paciente_nombre || 'Paciente'}
                      <span className="text-[11px] font-medium uppercase tracking-widest text-[#5f7b6f] bg-[#e9efec] px-2 py-0.5 rounded-sm">
                        Paciente ID #{activeThread.paciente_id}
                      </span>
                    </h2>
                    <div className="text-sm text-[#3f4f49] mt-1 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-[#5f7b6f]" />
                      Tema: <span className="font-medium text-[#0c1512]">{activeThread.tema}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleMarcarEstado(activeThread.estado === 'pendiente' ? 'resuelto' : 'pendiente')}
                      className="border-[#d8e0dc] text-[#0c1512] shadow-none h-9 text-xs font-medium"
                    >
                      {activeThread.estado === 'pendiente' ? (
                        <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#0d7a63]" /> Marcar Resuelto</>
                      ) : (
                        <><Clock className="mr-1.5 h-3.5 w-3.5 text-[#c77a0b]" /> Reabrir Consulta</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
                  {mensajes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#5f7b6f]">
                      <p>No hay mensajes todavía.</p>
                      <p className="text-xs mt-1">Escribe el primer mensaje para iniciar la conversación.</p>
                    </div>
                  ) : (
                    <>
                      {mensajes.map((msg) => {
                        const isDoctor = msg.remitente_tipo === 'profesional';
                        return (
                          <div key={msg.id} className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-baseline gap-2 mb-1.5">
                              <span className="text-[13px] font-semibold text-[#0c1512]">
                                {isDoctor ? 'Tú (Profesional)' : activeThread.paciente_nombre || 'Paciente'}
                              </span>
                              <span className="text-[11px] text-[#5f7b6f] font-medium">
                                {new Date(msg.creado_en).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <div className={`px-4 py-2.5 rounded-xl max-w-[85%] text-[14px] leading-relaxed shadow-sm ${
                              isDoctor
                                ? 'bg-[#0c1512] text-white rounded-tr-sm'
                                : 'bg-[#f4f6f5] border border-[#d8e0dc] text-[#0c1512] rounded-tl-sm'
                            }`}>
                              {msg.contenido}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Message Input Area */}
                <div className="p-4 border-t border-[#d8e0dc] bg-[#fafcfa]">
                  <form onSubmit={handleEnviarMensaje} className="flex items-end gap-2 bg-white border border-[#d8e0dc] rounded-xl p-1 focus-within:ring-1 focus-within:ring-[#0d7a63] transition-all">
                    <textarea
                      className="flex-1 max-h-32 min-h-[40px] resize-none border-0 bg-transparent py-2.5 px-2 text-sm text-[#0c1512] placeholder:text-[#5f7b6f] focus:outline-none focus:ring-0"
                      placeholder="Escribe tu respuesta clínica..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={1}
                    />
                    <Button
                      type="submit"
                      disabled={sending || !inputText.trim()}
                      className="h-10 px-4 bg-[#0d7a63] hover:bg-[#0a4539] text-white shrink-0 rounded-lg shadow-none"
                    >
                      {sending ? 'Enviando...' : <><Send className="h-4 w-4 mr-2" /> Enviar</>}
                    </Button>
                  </form>
                  <div className="flex justify-between items-center mt-2 px-2 text-[11px] text-[#5f7b6f]">
                    <span>Puedes adjuntar imágenes, recetas o informes PDF (máx. 10MB)</span>
                    <span className="uppercase font-medium tracking-widest text-[#0c1512]">Presiona Enter para enviar</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#5f7b6f] text-sm">
                Selecciona una consulta para ver los detalles
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
