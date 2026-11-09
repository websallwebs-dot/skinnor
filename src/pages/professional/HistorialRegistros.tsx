import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { FileClock, Search, Download, Eye, ZoomIn, Calendar as CalendarIcon, SplitSquareVertical, X, LayoutGrid, List, ChevronLeft, ChevronRight, Camera, User } from 'lucide-react';
import type { RegistroFoto } from './registrosData';

interface HistorialRegistrosProps {
  fotos: RegistroFoto[];
  pacienteNombre?: string;
  onGoToLab?: () => void;
  onGoToReport?: () => void;
  onGoToMetrics?: () => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function monthKeyOf(f: RegistroFoto): string | null {
  const d = new Date(f.isoDate || f.fecha);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function dayOfMonth(f: RegistroFoto): number {
  const d = new Date(f.isoDate || f.fecha);
  return isNaN(d.getTime()) ? -1 : d.getDate();
}
function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
function startDayOfWeek(key: string): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).getDay();
}
function diffDays(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (isNaN(da) || isNaN(db)) return null;
  return Math.round(Math.abs(db - da) / 86400000);
}

function getTagBadgeStyle(tag: string, estado?: string) {
  if (estado === 'Cambios reportados') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (tag === 'IA-ROI') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (tag === 'MACRO' || tag === 'BASE') return 'bg-sky-50 text-sky-800 border-sky-200';
  return 'bg-slate-100 text-slate-800 border-slate-200';
}

function estadoBadge(estado?: string) {
  if (estado === 'Cambios reportados') return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
  if (estado === 'Sin cambios') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  return 'bg-white text-slate-600 border-slate-200';
}

function CaptureImg({ foto, className = '' }: { foto: RegistroFoto; className?: string }) {
  const src = foto.imageUrl || foto.previewUrl;
  if (src) {
    return <img src={src} alt={foto.lesion} className={`w-full h-full object-cover ${className}`} draggable={false} />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#110d0a]">
      <Camera className="h-8 w-8 text-slate-600" />
    </div>
  );
}

export default function HistorialRegistros({
  fotos,
  pacienteNombre,
  onGoToLab,
  onGoToReport,
  onGoToMetrics
}: HistorialRegistrosProps) {
  const [activeTab, setActiveTab] = useState<'calendario' | 'galeria' | 'tabla' | 'comparador'>('tabla');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesion, setSelectedLesion] = useState<string>('todas');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [activeModalFoto, setActiveModalFoto] = useState<RegistroFoto | null>(null);

  const lesionesDisponibles = useMemo(() => Array.from(new Set(fotos.map(f => f.lesion))), [fotos]);

  const availableMonths = useMemo(() =>
    Array.from(new Set(fotos.map(monthKeyOf).filter(Boolean) as string[])).sort(),
    [fotos]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[availableMonths.length - 1] || '');
  const [selectedDate, setSelectedDate] = useState<{ month: string; day: number } | null>(null);

  const [compLeftId, setCompLeftId] = useState<string>('');
  const [compRightId, setCompRightId] = useState<string>('');

  const filteredRegistros = useMemo(() => fotos.filter(reg => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      reg.tag?.toLowerCase().includes(q) ||
      reg.fecha?.toLowerCase().includes(q) ||
      reg.lesion?.toLowerCase().includes(q) ||
      reg.hallazgos?.toLowerCase().includes(q) ||
      reg.ubicacion?.toLowerCase().includes(q) ||
      reg.colorTonos?.toLowerCase().includes(q);
    const matchesLesion = selectedLesion === 'todas' || reg.lesion === selectedLesion;
    const matchesEstado =
      selectedEstado === 'todos' ||
      (selectedEstado === 'cambios' && reg.estado === 'Cambios reportados') ||
      (selectedEstado === 'estables' && (reg.estado === 'Sin cambios' || reg.estado === 'Registro inicial'));
    return matchesSearch && matchesLesion && matchesEstado;
  }), [fotos, searchQuery, selectedLesion, selectedEstado]);

  const compLeft = filteredRegistros.find(r => r.id === compLeftId) || filteredRegistros[0];
  const compRight = filteredRegistros.find(r => r.id === compRightId) || filteredRegistros[Math.min(1, filteredRegistros.length - 1)];

  const intervalDays = diffDays(compLeft?.isoDate, compRight?.isoDate);

  const handleExportCSV = () => {
    const headers = 'ID,Tag,Fecha,Tipo,Lesión,Ubicación,Diámetro,Estado,Autor,Notas\n';
    const rows = filteredRegistros.map(r =>
      `"${r.id}","${r.tag}","${r.fecha}","${r.tipo}","${r.lesion}","${r.ubicacion}","${r.diametro}","${r.estado}","${r.autor}","${(r.hallazgos || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_registros_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeDayFotos = selectedDate
    ? fotos.filter(f => monthKeyOf(f) === selectedDate.month && dayOfMonth(f) === selectedDate.day)
    : [];

  const monthIdx = availableMonths.indexOf(selectedMonth);
  const prevMonth = monthIdx > 0 ? availableMonths[monthIdx - 1] : null;
  const nextMonth = monthIdx >= 0 && monthIdx < availableMonths.length - 1 ? availableMonths[monthIdx + 1] : null;

  const emptyState = (
    <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-12 text-center">
      <Camera className="h-10 w-10 text-slate-300 mx-auto mb-4" />
      <h3 className="text-base font-semibold text-slate-800 mb-1">Sin registros fotográficos</h3>
      <p className="text-sm text-slate-500">
        Este paciente aún no ha enviado fotos de seguimiento. Cuando lo haga, aparecerán aquí su historial, comparaciones y calendario.
      </p>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <FileClock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-slate-900">
                  Historial y Archivo Fotográfico
                </h2>
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200 font-normal">
                  {fotos.length} registros
                </Badge>
                {pacienteNombre && (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 font-normal flex items-center gap-1">
                    <User className="h-3 w-3" /> {pacienteNombre}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Registros reales enviados por el paciente: foto base de cada lesión y todos los seguimientos con sus imágenes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredRegistros.length === 0}
              className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-slate-500" /> Exportar CSV
            </Button>
            {onGoToMetrics && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToMetrics}
                className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Métricas
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
            {([
              ['calendario', 'Calendario', CalendarIcon],
              ['galeria', 'Galería', LayoutGrid],
              ['tabla', 'Tabla', List],
              ['comparador', 'Comparar', SplitSquareVertical],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  activeTab === key
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            {activeTab === 'calendario' && 'Navega por meses para inspeccionar las fechas de registro.'}
            {activeTab === 'galeria' && 'Todas las capturas del paciente en cuadrícula.'}
            {activeTab === 'tabla' && 'Detalle de cada registro: fecha, lesión, respuestas y notas.'}
            {activeTab === 'comparador' && 'Compara dos capturas lado a lado para evaluar cambios.'}
          </div>
        </div>
      </div>

      {fotos.length === 0 && emptyState}

      {fotos.length > 0 && activeTab === 'calendario' && (
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          <Card className="lg:col-span-8 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-700" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Calendario de Registros del Paciente
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 border-slate-200 text-slate-700 hover:bg-white"
                    disabled={!prevMonth}
                    onClick={() => { if (prevMonth) { setSelectedMonth(prevMonth); setSelectedDate(null); } }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-semibold text-slate-900 min-w-[110px] text-center">
                    {selectedMonth ? monthLabel(selectedMonth) : '—'}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 border-slate-200 text-slate-700 hover:bg-white"
                    disabled={!nextMonth}
                    onClick={() => { if (nextMonth) { setSelectedMonth(nextMonth); setSelectedDate(null); } }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 mb-3 pb-2 border-b border-slate-100">
                <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {selectedMonth && Array.from({ length: startDayOfWeek(selectedMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[76px] rounded-lg bg-slate-50/40 border border-transparent"></div>
                ))}
                {selectedMonth && Array.from({ length: daysInMonth(selectedMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dayFotos = fotos.filter(f => monthKeyOf(f) === selectedMonth && dayOfMonth(f) === day);
                  const isSelected = selectedDate?.month === selectedMonth && selectedDate.day === day;
                  const hasCaptures = dayFotos.length > 0;
                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() => { if (hasCaptures) setSelectedDate({ month: selectedMonth, day }); }}
                      className={`min-h-[76px] p-2 rounded-lg border transition-all flex flex-col justify-between ${
                        hasCaptures ? 'cursor-pointer hover:border-slate-400 hover:shadow-2xs' : 'cursor-default opacity-60'
                      } ${
                        isSelected ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600/30'
                          : hasCaptures ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isSelected ? 'font-bold text-emerald-800' : 'font-medium text-slate-800'}`}>{day}</span>
                        {hasCaptures && <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>}
                      </div>
                      {hasCaptures && (
                        <div className="space-y-1 mt-1">
                          {dayFotos.slice(0, 2).map((f) => (
                            <div
                              key={f.id}
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex items-center justify-between ${getTagBadgeStyle(f.tag, f.estado)}`}
                            >
                              <span className="font-semibold">{f.tag}</span>
                              <span className="text-[9px] text-slate-600 truncate max-w-[52px]">{f.lesion}</span>
                            </div>
                          ))}
                          {dayFotos.length > 2 && (
                            <span className="text-[9px] text-slate-500 block text-center font-medium">+{dayFotos.length - 2} más</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden flex flex-col justify-between h-full">
            <div>
              <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-900">Registros del Día</CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      {selectedDate ? `${selectedDate.day} de ${monthLabel(selectedDate.month)}` : 'Seleccione una fecha'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white text-slate-700 border-slate-200">
                    {activeDayFotos.length} {activeDayFotos.length === 1 ? 'registro' : 'registros'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 overflow-y-auto max-h-[440px]">
                {activeDayFotos.length > 0 ? (
                  activeDayFotos.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setActiveModalFoto(f)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-white cursor-pointer transition-all space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getTagBadgeStyle(f.tag, f.estado)}`}>{f.tag}</span>
                          <span className="text-xs font-semibold text-slate-900">{f.lesion}</span>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${estadoBadge(f.estado)}`}>{f.estado}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-[#110d0a] shrink-0 relative overflow-hidden border border-slate-200">
                          <CaptureImg foto={f} />
                        </div>
                        <div className="text-xs space-y-1 flex-1 min-w-0">
                          <div className="text-slate-500 text-[11px] truncate">{f.tipo} • {f.ubicacion}</div>
                          {f.diametro !== 'N/A' && (
                            <div className="text-slate-900 font-semibold tabular-nums">{f.diametro}</div>
                          )}
                          {f.colorTonos !== '—' && (
                            <div className="text-[11px] text-slate-500 truncate">{f.colorTonos}</div>
                          )}
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-800 shrink-0">
                          <ZoomIn className="h-4 w-4 text-emerald-600" />
                        </Button>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 line-clamp-2 leading-relaxed">
                        {f.hallazgos}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-xs text-slate-500">
                    {selectedDate ? 'Sin registros en este día.' : 'Seleccione una fecha marcada en el calendario.'}
                  </div>
                )}
              </CardContent>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('comparador')}
                className="w-full text-xs h-8 border-slate-200 text-slate-700 hover:bg-white"
              >
                <SplitSquareVertical className="h-3.5 w-3.5 mr-1" /> Comparar capturas
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab('galeria')}
                className="w-full text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-medium"
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Ver Galería
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'galeria' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRegistros.map((foto) => (
            <Card key={foto.id} className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden group cursor-pointer hover:border-slate-400 transition-colors flex flex-col justify-between" onClick={() => setActiveModalFoto(foto)}>
              <div className="p-3 pb-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getTagBadgeStyle(foto.tag, foto.estado)}`}>{foto.tag}</span>
                  <span className="text-xs font-medium text-slate-700">{foto.fecha}</span>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${estadoBadge(foto.estado)}`}>{foto.estado}</span>
              </div>
              <div className="px-3 pt-2.5 pb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[150px]">{foto.lesion}</span>
                {foto.diametro !== 'N/A' && (
                  <span className="text-xs font-semibold text-slate-900 tabular-nums">{foto.diametro}</span>
                )}
              </div>
              <div className="relative aspect-square w-full bg-[#110d0a] overflow-hidden">
                <CaptureImg foto={foto} />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4 backdrop-blur-2xs">
                  <Button size="sm" variant="secondary" className="h-8 text-xs bg-white text-slate-900 hover:bg-white/95 font-medium shadow-md">
                    <ZoomIn className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Inspeccionar
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-white space-y-1.5 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 truncate max-w-[150px] font-medium">{foto.tipo}</span>
                  <span className="text-slate-600 text-[11px]">{foto.ubicacion}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center justify-between pt-0.5">
                  <span className="truncate max-w-[140px]">{foto.colorTonos}</span>
                  <span className="text-emerald-700 font-medium shrink-0 ml-2">{foto.autor}</span>
                </div>
              </div>
            </Card>
          ))}
          {filteredRegistros.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500 text-sm">
              No hay registros que coincidan con los filtros.
            </div>
          )}
        </div>
      )}

      {activeTab === 'tabla' && (
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por lesión, notas, ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-8 bg-white border-slate-200 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={selectedLesion}
                onChange={(e) => setSelectedLesion(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="todas">Todas las lesiones</option>
                {lesionesDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
              </select>

              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="todos">Todos los estados</option>
                <option value="cambios">Con cambios reportados</option>
                <option value="estables">Sin cambios / iniciales</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-900">Registro</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Fecha</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Lesión & Ubicación</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Tipo</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Respuestas</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900">Estado</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-900 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {filteredRegistros.map((reg) => (
                  <TableRow key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-xs font-medium">
                      <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getTagBadgeStyle(reg.tag, reg.estado)}`}>{reg.tag}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-800 font-medium whitespace-nowrap">
                      {reg.fullDate || reg.fecha}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-slate-900">{reg.lesion}</div>
                      <div className="text-[11px] text-slate-500">{reg.ubicacion}</div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{reg.tipo}</TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-[220px] truncate" title={reg.colorTonos}>
                      {reg.colorTonos}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${estadoBadge(reg.estado)}`}>{reg.estado}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveModalFoto(reg)}
                        className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3 w-3 mr-1 text-slate-500" /> Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRegistros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-sm text-slate-500">
                      Sin registros para los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {activeTab === 'comparador' && filteredRegistros.length > 0 && (
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm md:text-base font-semibold text-slate-900 flex items-center gap-2">
                <SplitSquareVertical className="h-4 w-4 text-emerald-700" />
                Comparador de Capturas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compara dos registros del paciente para evaluar cambios visuales y respuestas reportadas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
                {intervalDays !== null ? `Intervalo: ${intervalDays} días` : '—'}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {([compLeft, compRight] as const).map((comp, idx) => {
              const isLeft = idx === 0;
              return (
                <div key={isLeft ? 'left' : 'right'} className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      {isLeft ? 'Captura A' : 'Captura B'}
                    </span>
                    <select
                      value={(isLeft ? compLeft : compRight)?.id ?? ''}
                      onChange={(e) => isLeft ? setCompLeftId(e.target.value) : setCompRightId(e.target.value)}
                      className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:outline-none max-w-[220px]"
                    >
                      {filteredRegistros.map(r => (
                        <option key={r.id} value={r.id}>{r.tag} — {r.fecha} ({r.lesion})</option>
                      ))}
                    </select>
                  </div>
                  {comp ? (
                    <>
                      <div className="relative aspect-square w-full rounded-xl bg-[#110d0a] overflow-hidden border border-slate-800/30">
                        <CaptureImg foto={comp} />
                        <div className="absolute top-2 left-2 bg-slate-950/85 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                          {comp.tag} • {comp.fecha}
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-white bg-slate-950/85 px-2.5 py-1 rounded-md font-medium">
                          <span>{comp.diametro !== 'N/A' ? comp.diametro : comp.tag}</span>
                          <span className={comp.estado === 'Cambios reportados' ? 'text-amber-300' : ''}>{comp.estado}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed line-clamp-3">
                        {comp.hallazgos}
                        {comp.colorTonos !== '—' && (
                          <span className="block mt-1 text-slate-400">{comp.colorTonos}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="aspect-square rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                      Sin captura seleccionada
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {activeTab === 'comparador' && filteredRegistros.length === 0 && (
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-10 text-center text-sm text-slate-500">
          Se necesitan al menos 2 registros para comparar.
        </Card>
      )}

      {activeModalFoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full overflow-hidden shadow-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getTagBadgeStyle(activeModalFoto.tag, activeModalFoto.estado)}`}>
                  {activeModalFoto.tag}
                </span>
                <div>
                  <h3 className="text-sm md:text-base font-semibold text-slate-900">
                    Registro #{activeModalFoto.id} — {activeModalFoto.fecha}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeModalFoto.tipo} • {activeModalFoto.ubicacion}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveModalFoto(null)}
                className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6 items-start">
              <div className="relative aspect-square w-full rounded-xl bg-[#110d0a] border border-slate-800 flex items-center justify-center shadow-inner overflow-hidden">
                <CaptureImg foto={activeModalFoto} />
                <div className="absolute top-3 left-3 bg-slate-950/85 text-white text-[11px] px-2.5 py-1 rounded-md font-medium border border-white/10">
                  {activeModalFoto.fullDate}
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 rounded ${estadoBadge(activeModalFoto.estado)}`}>
                    {activeModalFoto.estado}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Datos del Registro</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{activeModalFoto.lesion} • {activeModalFoto.ubicacion}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Diámetro</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{activeModalFoto.diametro !== 'N/A' ? activeModalFoto.diametro : '—'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Origen</span>
                    <span className="text-sm font-bold text-slate-900">{activeModalFoto.autor}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Respuestas del paciente:</span>
                    <span className="font-medium text-slate-800 text-right">{activeModalFoto.colorTonos}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Notas:</span>
                    <span className="font-medium text-slate-800 text-right">{activeModalFoto.hallazgos}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveModalFoto(null)}
                    className="text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50 w-full font-medium"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
