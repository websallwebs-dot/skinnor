import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  Camera, 
  X, 
  ArrowRight,
  Calendar as CalendarIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Layers,
  Zap,
  Grid,
  Activity,
  Flame,
  SplitSquareVertical,
  CheckCircle2
} from 'lucide-react';
import { RegistroFoto, REGISTROS_FOTOS } from './registrosData';
import DermatoscopeLesionImage from '@/components/dermatology/DermatoscopeLesionImage';

interface GaleriaImagenes4ColProps {
  fotos?: RegistroFoto[];
  titulo?: string;
  subtitulo?: string;
  onSelectImageForModal?: (foto: RegistroFoto) => void;
  onGoToLab?: () => void;
  onGoToHistory?: () => void;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/** Vista de imagen de captura: foto real del servidor o generador SVG (datos demo). */
function CaptureVisual({
  foto,
  showReticle,
  showRoiContour,
  showHeatmap,
  isPolarized,
  zoom,
  highlightAsymmetry,
}: {
  foto: RegistroFoto;
  showReticle: boolean;
  showRoiContour: boolean;
  showHeatmap: boolean;
  isPolarized: boolean;
  zoom: number;
  highlightAsymmetry?: boolean;
}) {
  if (foto.imageUrl) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#110d0a]">
        <img
          src={foto.imageUrl}
          alt={foto.lesion}
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.25s ease-out',
          }}
          draggable={false}
        />
        {showReticle && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g stroke="#10b981" strokeWidth="0.4" opacity="0.85">
              <line x1="50" y1="0" x2="50" y2="100" />
              <line x1="0" y1="50" x2="100" y2="50" />
            </g>
            <circle cx="50" cy="50" r="18" fill="none" stroke="#10b981" strokeWidth="0.4" opacity="0.85" />
            <circle cx="50" cy="50" r="6" fill="none" stroke="#10b981" strokeWidth="0.4" opacity="0.85" />
          </svg>
        )}
      </div>
    );
  }
  return (
    <DermatoscopeLesionImage
      tag={foto.tag}
      lesionName={foto.lesion}
      showReticle={showReticle}
      showRoiContour={showRoiContour}
      showHeatmap={showHeatmap}
      isPolarized={isPolarized}
      zoom={zoom}
      highlightAsymmetry={highlightAsymmetry}
    />
  );
}

export default function GaleriaImagenes4Col({
  fotos: fotosProp,
  titulo,
  subtitulo,
  onSelectImageForModal,
  onGoToLab,
  onGoToHistory
}: GaleriaImagenes4ColProps) {
  const data = fotosProp ?? REGISTROS_FOTOS;
  const isReal = fotosProp !== undefined;
  const [selectedFoto, setSelectedFoto] = useState<RegistroFoto | null>(null);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'dermatoscopia' | 'macro' | 'cambios' | 'estables'>('todos');
  const [lesionFilter, setLesionFilter] = useState<string>('todas');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'compare'>('grid');

  // Meses disponibles derivados de las fechas reales de las capturas
  const availableMonths = Array.from(
    new Set(data.map(f => {
      const d = new Date(f.isoDate || f.fecha);
      return isNaN(d.getTime()) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).filter(Boolean))
  ).sort();
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState<string>(
    availableMonths.length ? availableMonths[availableMonths.length - 1] : ''
  );

  // Optical and overlay settings across gallery
  const [globalPolarized, setGlobalPolarized] = useState<boolean>(true);
  const [globalReticle, setGlobalReticle] = useState<boolean>(true);
  const [globalHeatmap, setGlobalHeatmap] = useState<boolean>(false);
  const [globalRoiContour, setGlobalRoiContour] = useState<boolean>(false);

  // Modal zoom and inspection states
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [modalPolarized, setModalPolarized] = useState<boolean>(true);
  const [modalReticle, setModalReticle] = useState<boolean>(true);
  const [modalHeatmap, setModalHeatmap] = useState<boolean>(false);
  const [modalRoiContour, setModalRoiContour] = useState<boolean>(false);
  const [modalAsymmetryGuide, setModalAsymmetryGuide] = useState<boolean>(false);

  // Comparator states
  const [compLeftId, setCompLeftId] = useState<string | null>(null);
  const [compRightId, setCompRightId] = useState<string | null>(null);

  const lesionesDisponibles = Array.from(new Set(data.map(f => f.lesion)));

  const filteredFotos = data.filter(foto => {
    if (lesionFilter !== 'todas' && foto.lesion !== lesionFilter) return false;
    if (isReal) {
      if (activeFilter === 'cambios') return foto.estado === 'Cambios reportados';
      if (activeFilter === 'estables') return foto.estado === 'Sin cambios' || foto.estado === 'Registro inicial';
      return true;
    }
    if (activeFilter === 'dermatoscopia') return foto.tipo.includes('Dermatoscopía');
    if (activeFilter === 'macro') return foto.tipo.includes('Macro') || foto.tipo.includes('Panorámica');
    return true;
  });

  const handleOpenModal = (foto: RegistroFoto) => {
    setSelectedFoto(foto);
    setModalZoom(1);
    setModalPolarized(globalPolarized);
    setModalReticle(globalReticle);
    setModalHeatmap(globalHeatmap);
    setModalRoiContour(globalRoiContour);
    setModalAsymmetryGuide(false);
    if (onSelectImageForModal) {
      onSelectImageForModal(foto);
    }
  };

  const monthKeyToLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return `${MONTH_NAMES_ES[m - 1]} ${y}`;
  };
  const monthLabel = selectedCalendarMonth ? monthKeyToLabel(selectedCalendarMonth) : '—';

  const monthKeyOf = (iso?: string, fallback?: string) => {
    const d = new Date(iso || fallback || '');
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const dayOfMonth = (f: RegistroFoto) => {
    const d = new Date(f.isoDate || f.fecha);
    return isNaN(d.getTime()) ? -1 : d.getDate();
  };

  const getFotosForDay = (monthKey: string, day: number) => {
    return data.filter(f => monthKeyOf(f.isoDate, f.fecha) === monthKey && dayOfMonth(f) === day);
  };

  const getDaysInMonth = (monthKey: string) => {
    const [y, m] = monthKey.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  };

  const getStartDayOfWeek = (monthKey: string) => {
    const [y, m] = monthKey.split('-').map(Number);
    return new Date(y, m - 1, 1).getDay();
  };

  const uniqueDates = Array.from(
    new Map(
      data
        .map(f => {
          const d = new Date(f.isoDate || f.fecha);
          return isNaN(d.getTime()) ? null : { key: d.toISOString().slice(0, 10), d, f };
        })
        .filter(Boolean)
        .map(x => [x!.key, x!])
    ).values()
  ).sort((a, b) => a.d.getTime() - b.d.getTime());

  const [activeCalendarDate, setActiveCalendarDate] = useState<{ month: string; day: number } | null>(null);
  const activeDayFotos = activeCalendarDate
    ? getFotosForDay(activeCalendarDate.month, activeCalendarDate.day)
    : [];

  const compLeft = data.find(f => f.id === compLeftId) || data[0];
  const compRight = data.find(f => f.id === compRightId) || data[Math.min(5, data.length - 1)];

  const getTagBadgeStyle = (tag: string) => {
    if (tag === 'T5') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (tag === 'IA-ROI') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (tag === 'MACRO') {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Unified, Organized Toolbar Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Upper Tier: Title, View Switcher & Actions */}
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <Camera className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-semibold text-slate-900">
                  {titulo ?? 'Secuencia Fotográfica Dermatoscópica'}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredFotos.length} capturas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitulo ?? 'Nevo Melanocítico (Brazo Izq.) • Epiluminiscencia con polarización cruzada y retículo milimétrico.'}
              </p>
            </div>
          </div>

          {/* Right Action Controls: View Switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
                <span>4 Columnas</span>
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === 'compare'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SplitSquareVertical className="h-3.5 w-3.5 text-slate-500" />
                <span>Comparar</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Calendario</span>
              </button>
            </div>

            {onGoToHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToHistory}
                className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 hidden xl:flex items-center gap-1 shadow-none"
              >
                Historial <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Lower Tier: Filter tabs + Optical controls cleanly organized */}
        <div className="px-4 py-2.5 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Left: Category Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-xs font-medium mr-1">Filtrar:</span>
            <button
              onClick={() => setActiveFilter('todos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeFilter === 'todos'
                  ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Todas ({data.length})
            </button>
            {isReal ? (
              <>
                <button
                  onClick={() => setActiveFilter('cambios')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeFilter === 'cambios'
                      ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Con cambios ({data.filter(f => f.estado === 'Cambios reportados').length})
                </button>
                <button
                  onClick={() => setActiveFilter('estables')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeFilter === 'estables'
                      ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Estables ({data.filter(f => f.estado === 'Sin cambios' || f.estado === 'Registro inicial').length})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveFilter('dermatoscopia')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeFilter === 'dermatoscopia'
                      ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Dermatoscopía ({data.filter(f => f.tipo.includes('Dermatoscopía')).length})
                </button>
                <button
                  onClick={() => setActiveFilter('macro')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeFilter === 'macro'
                      ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Topografía ({data.filter(f => f.tipo.includes('Macro') || f.tipo.includes('Panorámica')).length})
                </button>
              </>
            )}

            {lesionesDisponibles.length > 1 && (
              <select
                value={lesionFilter}
                onChange={(e) => setLesionFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-medium text-slate-800 outline-none focus:border-slate-400 ml-1"
              >
                <option value="todas">Lesión: Todas</option>
                {lesionesDisponibles.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            )}
          </div>

          {/* Right: Optical Layer Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-xs font-medium mr-1 flex items-center gap-1">
              <Sliders className="h-3 w-3 text-slate-400" /> Modos Ópticos:
            </span>

            {!isReal && (
            <>
            <button
              onClick={() => setGlobalPolarized(!globalPolarized)}
              className={`px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 transition-colors ${
                globalPolarized
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Zap className="h-3 w-3" />
              <span>Polarizada</span>
            </button>

            <button
              onClick={() => setGlobalRoiContour(!globalRoiContour)}
              className={`px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 transition-colors ${
                globalRoiContour
                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="h-3 w-3 text-teal-600" />
              <span>Contorno IA</span>
            </button>

            <button
              onClick={() => setGlobalHeatmap(!globalHeatmap)}
              className={`px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 transition-colors ${
                globalHeatmap
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flame className="h-3 w-3 text-amber-600" />
              <span>Densidad</span>
            </button>
            </>
            )}

            <button
              onClick={() => setGlobalReticle(!globalReticle)}
              className={`px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 transition-colors ${
                globalReticle
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Grid className="h-3 w-3 text-emerald-600" />
              <span>Retículo mm</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Grid of 4 Columns */}
      {viewMode === 'grid' && (
        filteredFotos.length === 0 ? (
          <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-10 text-center">
            <Camera className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Sin capturas fotográficas</p>
            <p className="text-xs text-slate-500 mt-1">
              Este paciente aún no ha enviado registros fotográficos de lesiones.
            </p>
          </Card>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFotos.map((foto) => (
            <Card
              key={foto.id}
              onClick={() => handleOpenModal(foto)}
              className="group bg-white border-slate-200 hover:border-slate-400 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between"
            >
              {/* Top Bar inside Card: Session Tag & Date */}
              <div className="p-3 pb-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getTagBadgeStyle(foto.tag)}`}>
                    {foto.tag}
                  </span>
                  <span className="text-xs font-medium text-slate-700">
                    {foto.fecha}
                  </span>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  foto.estado === 'Indicación Biopsia'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}>
                  {foto.estado}
                </span>
              </div>

              {/* Lesion & Size specs */}
              <div className="px-3 pt-2.5 pb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {foto.lesion}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900 tabular-nums">{foto.diametro}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 tabular-nums">{foto.area}</span>
                </div>
              </div>

              {/* High-Fidelity Dermatoscopy Image Canvas Container */}
              <div className="relative aspect-square w-full bg-[#110d0a] overflow-hidden flex items-center justify-center p-0">
                <CaptureVisual
                  foto={foto}
                  showReticle={globalReticle}
                  showRoiContour={globalRoiContour || foto.tag === 'IA-ROI'}
                  showHeatmap={globalHeatmap}
                  isPolarized={globalPolarized && !foto.tipo.includes('No Polarizada')}
                  zoom={1}
                />

                {/* Hover overlay with button */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4 backdrop-blur-2xs">
                  <Button size="sm" variant="secondary" className="h-8 text-xs bg-white text-slate-900 hover:bg-white/95 font-medium shadow-md">
                    <ZoomIn className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Inspeccionar 10x
                  </Button>
                  <span className="text-xs bg-slate-900/90 px-2.5 py-1 rounded-md text-white border border-white/10 font-medium">
                    {foto.scoreTDS !== 'N/A' ? `Score TDS: ${foto.scoreTDS}` : 'Topografía'}
                  </span>
                </div>
              </div>

              {/* Bottom info section */}
              <div className="p-3 bg-white space-y-1.5 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 truncate max-w-[130px] font-medium">{foto.tipo}</span>
                  <span className={`font-semibold ${
                    foto.scoreTDS !== 'N/A' && parseFloat(foto.scoreTDS) > 5.45 
                      ? 'text-rose-600 font-bold' 
                      : 'text-slate-800'
                  }`}>
                    {foto.scoreTDS !== 'N/A' ? `TDS ${foto.scoreTDS}` : '1x Macro'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center justify-between pt-0.5">
                  <span className="truncate max-w-[140px]">{foto.dispositivo.split('+')[0]}</span>
                  <span className="text-emerald-700 font-medium">{foto.calidad.split(' ')[0]}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        )
      )}

      {/* VIEW 2: Dual Timeline Comparator (T0 vs T5) */}
      {viewMode === 'compare' && (
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <SplitSquareVertical className="h-4 w-4 text-emerald-700" />
                Comparador Morfométrico Side-by-Side
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparación directa entre sesiones de control para evaluar crecimiento radial, asimetría y pigmentación.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompLeftId(data[0]?.id ?? null);
                  setCompRightId(data[Math.min(data.length - 1, 1)]?.id ?? null);
                }}
                className="text-xs h-8 border-slate-200"
              >
                Resetear (Inicial vs Reciente)
              </Button>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Left Capture */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-900">Captura A:</label>
                    <select
                      value={compLeft?.id ?? ''}
                      onChange={(e) => setCompLeftId(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 font-medium text-slate-800 outline-none focus:border-slate-400"
                    >
                      {data.map((f) => (
                        <option key={`left-${f.id}`} value={f.id}>
                          {f.tag} — {f.fecha} ({f.lesion})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getTagBadgeStyle(compLeft.tag)}`}>
                    {compLeft.tag}
                  </span>
                </div>

                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800/30 shadow-inner">
                  <CaptureVisual
                    foto={compLeft}
                    showReticle={globalReticle}
                    showRoiContour={globalRoiContour}
                    showHeatmap={globalHeatmap}
                    isPolarized={globalPolarized}
                    zoom={1}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    {compLeft.fecha} • Ø {compLeft.diametro}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-semibold">TDS SCORE</span>
                    <span className="font-semibold text-slate-900 text-sm tabular-nums">{compLeft.scoreTDS}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-semibold">ÁREA LESIONAL</span>
                    <span className="font-semibold text-slate-900 text-sm tabular-nums">{compLeft.area}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-semibold">ASIMETRÍA</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{compLeft.asimetria}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-semibold">BORDES</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{compLeft.bordes}</span>
                  </div>
                </div>
              </div>

              {/* Right Capture */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-900">Captura B:</label>
                    <select
                      value={compRight?.id ?? ''}
                      onChange={(e) => setCompRightId(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 font-medium text-slate-800 outline-none focus:border-slate-400"
                    >
                      {data.map((f) => (
                        <option key={`right-${f.id}`} value={f.id}>
                          {f.tag} — {f.fecha} ({f.lesion})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getTagBadgeStyle(compRight.tag)}`}>
                    {compRight.tag}
                  </span>
                </div>

                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800/30 shadow-inner">
                  <CaptureVisual
                    foto={compRight}
                    showReticle={globalReticle}
                    showRoiContour={globalRoiContour}
                    showHeatmap={globalHeatmap}
                    isPolarized={globalPolarized}
                    zoom={1}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    {compRight.fecha} • Ø {compRight.diametro}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-semibold">TDS SCORE</span>
                    <span className={`font-semibold text-sm tabular-nums ${
                      compRight.scoreTDS !== 'N/A' && parseFloat(compRight.scoreTDS) > 5.45 ? 'text-rose-600 font-bold' : 'text-slate-900'
                    }`}>
                      {compRight.scoreTDS}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-semibold">ÁREA LESIONAL</span>
                    <span className="font-semibold text-slate-900 text-sm tabular-nums">{compRight.area}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-semibold">ASIMETRÍA</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{compRight.asimetria}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-semibold">BORDES</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{compRight.bordes}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Differential Morphometric delta banner */}
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-amber-700" />
                  Comparación {compLeft.tag} ({compLeft.fecha}) ➔ {compRight.tag} ({compRight.fecha}):
                </span>
                <p className="text-amber-800 leading-relaxed">
                  {(() => {
                    const num = (s: string) => {
                      const n = parseFloat(s);
                      return isNaN(n) ? null : n;
                    };
                    const deltas: string[] = [];
                    const dDiam = num(compLeft.diametro) !== null && num(compRight.diametro) !== null
                      ? (num(compRight.diametro)! - num(compLeft.diametro)!) : null;
                    const dArea = num(compLeft.area) !== null && num(compRight.area) !== null
                      ? (num(compRight.area)! - num(compLeft.area)!) : null;
                    const dTds = num(compLeft.scoreTDS) !== null && num(compRight.scoreTDS) !== null
                      ? (num(compRight.scoreTDS)! - num(compLeft.scoreTDS)!) : null;
                    if (dDiam !== null) deltas.push(`diámetro ${dDiam >= 0 ? '+' : ''}${dDiam.toFixed(1)} mm`);
                    if (dArea !== null) deltas.push(`área ${dArea >= 0 ? '+' : ''}${dArea.toFixed(1)} mm²`);
                    if (dTds !== null) deltas.push(`TDS ${dTds >= 0 ? '+' : ''}${dTds.toFixed(2)} pts`);
                    if (deltas.length === 0) {
                      return `Lesión: ${compRight.lesion}. ${compRight.hallazgos || ''} ${compRight.colorTonos || ''}`.trim();
                    }
                    return `Variación: ${deltas.join(', ')}.`;
                  })()}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenModal(compRight)}
                className="bg-amber-900 hover:bg-amber-950 text-white shrink-0 text-xs h-8 font-medium"
              >
                Inspeccionar {compRight.tag}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VIEW 3: Interactive, Organized Calendar View */}
      {viewMode === 'calendar' && (
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          {/* Calendar Grid Card (8 cols) */}
          <Card className="lg:col-span-8 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-emerald-700" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Calendario de Capturas y Controles Dermatológicos
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 border-slate-200 text-slate-700 hover:bg-white"
                  disabled={availableMonths.length === 0 || selectedCalendarMonth === availableMonths[0]}
                  onClick={() => {
                    const idx = availableMonths.indexOf(selectedCalendarMonth);
                    if (idx > 0) setSelectedCalendarMonth(availableMonths[idx - 1]);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-semibold text-slate-900 min-w-[110px] text-center">
                  {monthLabel}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 border-slate-200 text-slate-700 hover:bg-white"
                  disabled={availableMonths.length === 0 || selectedCalendarMonth === availableMonths[availableMonths.length - 1]}
                  onClick={() => {
                    const idx = availableMonths.indexOf(selectedCalendarMonth);
                    if (idx >= 0 && idx < availableMonths.length - 1) setSelectedCalendarMonth(availableMonths[idx + 1]);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-5">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 mb-3 pb-2 border-b border-slate-100">
                <div>Dom</div>
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2">
                {selectedCalendarMonth && Array.from({ length: getStartDayOfWeek(selectedCalendarMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[76px] rounded-lg bg-slate-50/40 border border-transparent"></div>
                ))}

                {selectedCalendarMonth && Array.from({ length: getDaysInMonth(selectedCalendarMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dayFotos = getFotosForDay(selectedCalendarMonth, day);
                  const isSelected = activeCalendarDate !== null && activeCalendarDate.month === selectedCalendarMonth && activeCalendarDate.day === day;
                  const hasCaptures = dayFotos.length > 0;

                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() => {
                        if (hasCaptures) {
                          setActiveCalendarDate({ month: selectedCalendarMonth, day });
                        }
                      }}
                      className={`min-h-[76px] p-2 rounded-lg border transition-all flex flex-col justify-between ${
                        hasCaptures 
                          ? 'cursor-pointer hover:border-slate-400 hover:shadow-2xs' 
                          : 'cursor-default opacity-60'
                      } ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600/30' 
                          : hasCaptures
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          isSelected ? 'font-bold text-emerald-800' : 'font-medium text-slate-800'
                        }`}>
                          {day}
                        </span>
                        {hasCaptures && (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
                        )}
                      </div>

                      {/* Clean, Soft Event Pills (NO solid harsh black boxes) */}
                      {hasCaptures && (
                        <div className="space-y-1 mt-1">
                          {dayFotos.slice(0, 2).map((f) => (
                            <div 
                              key={f.id} 
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex items-center justify-between ${
                                f.tag === 'T5' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                                  : f.tag === 'IA-ROI'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                                  : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}
                            >
                              <span className="font-semibold">{f.tag}</span>
                              <span className="tabular-nums text-[9px] text-slate-600">{f.diametro}</span>
                            </div>
                          ))}
                          {dayFotos.length > 2 && (
                            <span className="text-[9px] text-slate-500 block text-center font-medium">
                              +{dayFotos.length - 2} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Chronological Navigation Bar */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-900 block mb-2.5">
                  Sesiones Registradas en Línea de Tiempo:
                </span>
                {uniqueDates.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin fechas registradas.</p>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {uniqueDates.slice(0, 12).map(({ d, f }) => {
                    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    const isSessionSelected = activeCalendarDate !== null && activeCalendarDate.month === mk && activeCalendarDate.day === d.getDate();
                    const isAlerta = data.some(x => x.isoDate?.slice(0, 10) === d.toISOString().slice(0, 10) && x.estado === 'Cambios reportados');
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => {
                          setSelectedCalendarMonth(mk);
                          setActiveCalendarDate({ month: mk, day: d.getDate() });
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          isSessionSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{f.tag}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                            isAlerta ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {f.estado === 'Cambios reportados' ? 'Cambios' : f.estado === 'Sin cambios' ? 'Estable' : 'Base'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">{f.fecha}</div>
                      </button>
                    );
                  })}
                </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Day Detail & Captures List (4 cols) */}
          <Card className="lg:col-span-4 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden flex flex-col justify-between h-full">
            <div>
              <div className="p-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Detalle de Sesión
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeCalendarDate
                        ? `${activeCalendarDate.day} de ${monthKeyToLabel(activeCalendarDate.month)}`
                        : 'Seleccione una fecha en el calendario'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white text-slate-700 border-slate-200">
                    {activeDayFotos.length} {activeDayFotos.length === 1 ? 'captura' : 'capturas'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3 overflow-y-auto max-h-[460px]">
                {activeDayFotos.length > 0 ? (
                  activeDayFotos.map((f) => (
                    <div 
                      key={f.id}
                      onClick={() => handleOpenModal(f)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-white cursor-pointer transition-all space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getTagBadgeStyle(f.tag)}`}>
                            {f.tag}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{f.lesion}</span>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          f.estado === 'Indicación Biopsia'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}>
                          {f.estado}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-[#110d0a] shrink-0 relative overflow-hidden border border-slate-200">
                          <CaptureVisual
                            foto={f}
                            showReticle={false}
                            showRoiContour={false}
                            showHeatmap={false}
                            isPolarized={true}
                            zoom={1}
                          />
                        </div>
                        <div className="text-xs space-y-1 flex-1 min-w-0">
                          <div className="text-slate-500 text-[11px] truncate">{f.tipo}</div>
                          <div className="text-slate-900 font-semibold tabular-nums">
                            Ø {f.diametro} • <span className="text-slate-600 font-normal">{f.area}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                            <span>TDS: <strong className="text-slate-800">{f.scoreTDS}</strong></span>
                            <span className="text-emerald-700 font-medium">{f.calidad.split(' ')[0]}</span>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-800 shrink-0">
                          <ZoomIn className="h-4 w-4 text-emerald-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Sin capturas en este día. Seleccione una fecha marcada en la línea de tiempo.
                  </div>
                )}
              </CardContent>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50/70">
              <Button 
                variant="outline" 
                onClick={() => setViewMode('grid')}
                className="w-full text-xs h-8 border-slate-200 text-slate-700 hover:bg-white"
              >
                Volver a Cuadrícula 4 Columnas
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Advanced High-Resolution Dermatoscope Inspection Modal */}
      {selectedFoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getTagBadgeStyle(selectedFoto.tag)}`}>
                  {selectedFoto.tag}
                </span>
                <div>
                  <h3 className="text-sm md:text-base font-semibold text-slate-900">
                    Inspección Microscópica #{selectedFoto.id} — {selectedFoto.fecha}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedFoto.tipo} • {selectedFoto.aumento} • {selectedFoto.ubicacion}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFoto(null)}
                className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grid lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Dermatoscope Live Lens */}
              <div className="lg:col-span-7 space-y-3">
                <div className="relative aspect-square w-full rounded-2xl bg-[#110d0a] border border-slate-800 shadow-2xl overflow-hidden">
                  <CaptureVisual
                    foto={selectedFoto}
                    showReticle={modalReticle}
                    showRoiContour={modalRoiContour || selectedFoto.tag === 'IA-ROI'}
                    showHeatmap={modalHeatmap}
                    isPolarized={modalPolarized}
                    zoom={modalZoom}
                    highlightAsymmetry={modalAsymmetryGuide}
                  />

                  {/* On-screen Zoom Indicator Pill */}
                  <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full border border-white/20 font-medium">
                    {(modalZoom * 10).toFixed(0)}x Magnificación
                  </div>

                  <div className="absolute bottom-3 left-3 bg-slate-950/85 text-white text-xs px-3 py-1 rounded-md border border-white/20 font-medium">
                    Ø {selectedFoto.diametro} • {selectedFoto.area}
                  </div>
                </div>

                {/* Live Optical & Filter Controls inside Modal */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-emerald-700" /> {isReal ? 'Zoom' : 'Zoom Óptico'}: {(modalZoom * 10).toFixed(0)}x
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 1.5, 2, 2.5, 3].map((z) => (
                        <button
                          key={z}
                          onClick={() => setModalZoom(z)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            modalZoom === z 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {z * 10}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200">
                    {!isReal && (
                    <button
                      onClick={() => setModalPolarized(!modalPolarized)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-colors ${
                        modalPolarized ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Zap className="h-3 w-3" /> Polarizada
                    </button>
                    )}
                    <button
                      onClick={() => setModalReticle(!modalReticle)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-colors ${
                        modalReticle ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Grid className="h-3 w-3 text-emerald-600" /> Retículo mm
                    </button>
                    {!isReal && (
                    <>
                    <button
                      onClick={() => setModalRoiContour(!modalRoiContour)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-colors ${
                        modalRoiContour ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className="h-3 w-3 text-teal-600" /> Contorno IA
                    </button>
                    <button
                      onClick={() => setModalHeatmap(!modalHeatmap)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-colors ${
                        modalHeatmap ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Flame className="h-3 w-3 text-amber-600" /> Densidad
                    </button>
                    <button
                      onClick={() => setModalAsymmetryGuide(!modalAsymmetryGuide)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-colors ${
                        modalAsymmetryGuide ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Activity className="h-3 w-3 text-amber-700" /> Ejes 2D
                    </button>
                    </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Clinical Telemetry & Morphometric Matrix */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Telemetría y Diagnóstico Morfométrico
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isReal
                      ? 'Datos del registro enviado por el paciente.'
                      : 'Evaluación automatizada mediante regla de Stolz (TDS) y algoritmo ISIC.'}
                  </p>
                </div>

                {/* TDS & ABCD Score Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">Stolz TDS Score</span>
                    <span className="text-base font-bold tabular-nums text-slate-500">
                      {selectedFoto.scoreTDS !== 'N/A' ? `${selectedFoto.scoreTDS} / 8.90` : 'Sin score'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-semibold">A - ASIMETRÍA</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{selectedFoto.asimetria}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-semibold">B - BORDES</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{selectedFoto.bordes}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-semibold">C - COLOR</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{selectedFoto.color}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-semibold">D - DIÁMETRO</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{selectedFoto.diametro}</span>
                    </div>
                  </div>
                </div>

                {/* Microscopic Findings Text */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="font-semibold text-slate-900 block">Hallazgos Dermatoscópicos:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedFoto.hallazgos}
                  </p>
                  <div className="pt-1 text-[11px] text-slate-500 font-medium">
                    Tonos: {selectedFoto.colorTonos}
                  </div>
                </div>

                {/* Equipment & Capture Info */}
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Dispositivo:</span>
                    <span className="font-medium text-slate-800">{selectedFoto.dispositivo}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Operador:</span>
                    <span className="font-medium text-slate-800">{selectedFoto.autor}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Calidad Óptica / ROI:</span>
                    <span className="font-medium text-emerald-700">{selectedFoto.calidad}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => setSelectedFoto(null)}
                    className="w-full text-xs h-9 bg-slate-900 text-white hover:bg-slate-800 font-medium"
                  >
                    Cerrar Inspección
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
