import React, { useEffect, useState } from 'react';
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
  Activity,
  Flame,
  SplitSquareVertical,
  ArrowRightLeft,
  Loader2
} from 'lucide-react';
import { RegistroFoto, REGISTROS_FOTOS } from './registrosData';
import DermatoscopeLesionImage from '@/components/dermatology/DermatoscopeLesionImage';
import PreprocessImage, { PREPROCESS_FILTERS, PreprocessFilter } from '@/components/PreprocessImage';
import { API_BASE } from '@/lib/api';

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
  showRoiContour,
  showHeatmap,
  isPolarized,
  zoom,
  highlightAsymmetry,
  filter,
}: {
  foto: RegistroFoto;
  showRoiContour: boolean;
  showHeatmap: boolean;
  isPolarized: boolean;
  zoom: number;
  highlightAsymmetry?: boolean;
  filter?: PreprocessFilter;
}) {
  if (foto.imageUrl) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#110d0a]">
        {filter && filter !== 'original' ? (
          <PreprocessImage src={foto.imageUrl} filter={filter} zoom={zoom} />
        ) : (
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
        )}
      </div>
    );
  }
  return (
    <DermatoscopeLesionImage
      tag={foto.tag}
      lesionName={foto.lesion}
      showReticle={false}
      showRoiContour={showRoiContour}
      showHeatmap={showHeatmap}
      isPolarized={isPolarized}
      zoom={zoom}
      highlightAsymmetry={highlightAsymmetry}
    />
  );
}

function fmtFechaCorta(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface DiffItem {
  paso: number;
  fecha_a: string;
  fecha_b: string;
  img_a: string;
  img_b: string;
  heatmap_id: number;
  par?: {
    cambio_pct?: number;
    color_nuevo_pct?: number;
    registro_confianza?: number;
    diametro_delta_px?: number;
    diametro_delta_pct?: number;
  };
}

/** Comparaciones consecutivas dia a dia de una lesion (basal -> T1 -> T2 ...). */
function LesionSecuenciaDiffs({ lesionId, lesionNombre }: { lesionId: number; lesionNombre: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DiffItem[]>([]);
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/lesiones/${lesionId}/evolucion/diffs`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setErrores(data.errores || []);
      })
      .catch(() => {
        if (!cancelled) setErrores(['No se pudo obtener el análisis secuencial de imagen.']);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [lesionId]);

  return (
    <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{lesionNombre}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Comparación consecutiva día a día: cada control contra el registro anterior.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-1">
          {loading ? 'Analizando…' : `${items.length} ${items.length === 1 ? 'paso' : 'pasos'}`}
        </span>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
          Registrando y comparando imágenes consecutivas…
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          {errores[0] || 'Sin suficientes registros para comparar esta lesión.'}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((it) => {
            const cambio = it.par?.cambio_pct;
            const colorNuevo = it.par?.color_nuevo_pct;
            const confianza = it.par?.registro_confianza;
            return (
              <div key={it.paso} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                    PASO {it.paso}
                  </span>
                  <span className="text-xs text-slate-600">
                    {fmtFechaCorta(it.fecha_a)} <span className="text-slate-400">→</span> {fmtFechaCorta(it.fecha_b)}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {cambio !== undefined && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        cambio > 10
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : cambio > 3
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {cambio}% área cambió
                      </span>
                    )}
                    {colorNuevo !== undefined && colorNuevo > 0 && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-sky-50 text-sky-800 border-sky-200">
                        {colorNuevo}% color nuevo
                      </span>
                    )}
                    {confianza !== undefined && (
                      <span className="text-[11px] text-slate-500">
                        registro {(confianza * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-[1fr_auto_1fr_auto_1.2fr] gap-3 items-center">
                  <figure>
                    <div className="aspect-square w-full rounded-lg overflow-hidden border border-slate-200 bg-[#110d0a]">
                      <img src={`${API_BASE}${it.img_a}`} alt="Registro anterior" className="w-full h-full object-cover" />
                    </div>
                    <figcaption className="text-[10px] text-slate-500 mt-1 text-center font-medium">
                      Anterior · {fmtFechaCorta(it.fecha_a)}
                    </figcaption>
                  </figure>
                  <ArrowRightLeft className="h-4 w-4 text-slate-400 hidden md:block" />
                  <figure>
                    <div className="aspect-square w-full rounded-lg overflow-hidden border border-slate-200 bg-[#110d0a]">
                      <img src={`${API_BASE}${it.img_b}`} alt="Registro actual" className="w-full h-full object-cover" />
                    </div>
                    <figcaption className="text-[10px] text-slate-500 mt-1 text-center font-medium">
                      Actual · {fmtFechaCorta(it.fecha_b)}
                    </figcaption>
                  </figure>
                  <ArrowRightLeft className="h-4 w-4 text-slate-400 hidden md:block" />
                  <figure>
                    <div className="aspect-square w-full rounded-lg overflow-hidden border border-slate-800 bg-[#110d0a]">
                      <img
                        src={`${API_BASE}/lesiones/par-diff/heatmap/${it.heatmap_id}`}
                        alt="Mapa de diferencias"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <figcaption className="text-[10px] text-slate-500 mt-1 text-center font-medium">
                      Diff · zona en rojo = cambio
                    </figcaption>
                  </figure>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {errores.length > 0 && items.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 text-[11px] text-amber-700 bg-amber-50/60">
          {errores.join(' · ')}
        </div>
      )}
    </Card>
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
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'compare' | 'secuencia'>('grid');

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
  const [globalHeatmap, setGlobalHeatmap] = useState<boolean>(false);
  const [globalRoiContour, setGlobalRoiContour] = useState<boolean>(false);

  // Modal zoom and inspection states
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [modalPolarized, setModalPolarized] = useState<boolean>(true);
  const [modalFilter, setModalFilter] = useState<PreprocessFilter>('original');
  const [modalHeatmap, setModalHeatmap] = useState<boolean>(false);
  const [modalRoiContour, setModalRoiContour] = useState<boolean>(false);
  const [modalAsymmetryGuide, setModalAsymmetryGuide] = useState<boolean>(false);

  // Comparator states
  const [compLeftId, setCompLeftId] = useState<string | null>(null);
  const [compRightId, setCompRightId] = useState<string | null>(null);

  const filteredFotos = data;

  const handleOpenModal = (foto: RegistroFoto) => {
    setSelectedFoto(foto);
    setModalZoom(1);
    setModalPolarized(globalPolarized);
    setModalFilter('original');
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
              {isReal && (
              <button
                onClick={() => setViewMode('secuencia')}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === 'secuencia'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Día a día</span>
              </button>
              )}
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
                {(foto.diametro !== 'N/A' || (foto.area && foto.area !== 'N/A')) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    {foto.diametro !== 'N/A' && (
                      <span className="font-semibold text-slate-900 tabular-nums">{foto.diametro}</span>
                    )}
                    {foto.diametro !== 'N/A' && foto.area && foto.area !== 'N/A' && (
                      <span className="text-slate-300">•</span>
                    )}
                    {foto.area && foto.area !== 'N/A' && (
                      <span className="text-slate-600 tabular-nums">{foto.area}</span>
                    )}
                  </div>
                )}
              </div>

              {/* High-Fidelity Dermatoscopy Image Canvas Container */}
              <div className="relative aspect-square w-full bg-[#110d0a] overflow-hidden flex items-center justify-center p-0">
                <CaptureVisual
                  foto={foto}
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
                    {foto.scoreTDS !== 'N/A' ? `Score TDS: ${foto.scoreTDS}` : (isReal ? foto.tipo : 'Topografía')}
                  </span>
                </div>
              </div>

              {/* Bottom info section */}
              <div className="p-3 bg-white space-y-1.5 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 truncate max-w-[140px] font-medium">{foto.tipo}</span>
                  {!isReal && (
                    <span className={`font-semibold ${
                      foto.scoreTDS !== 'N/A' && parseFloat(foto.scoreTDS) > 5.45
                        ? 'text-rose-600 font-bold'
                        : 'text-slate-800'
                    }`}>
                      {foto.scoreTDS !== 'N/A' ? `TDS ${foto.scoreTDS}` : '1x Macro'}
                    </span>
                  )}
                </div>
                {isReal ? (
                  <div className="text-[11px] text-slate-500 truncate pt-0.5">
                    {foto.ubicacion}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 truncate flex items-center justify-between pt-0.5">
                    <span className="truncate max-w-[140px]">{foto.dispositivo.split('+')[0]}</span>
                    <span className="text-emerald-700 font-medium">{foto.calidad.split(' ')[0]}</span>
                  </div>
                )}
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
                    showRoiContour={globalRoiContour}
                    showHeatmap={globalHeatmap}
                    isPolarized={globalPolarized}
                    zoom={1}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    {compLeft.fecha}{compLeft.diametro !== 'N/A' ? ` • ${compLeft.diametro}` : ''}
                  </div>
                </div>

                {isReal ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {([
                      ['Lesión', compLeft.lesion],
                      ['Ubicación', compLeft.ubicacion],
                      ['Diámetro', compLeft.diametro !== 'N/A' ? compLeft.diametro : '—'],
                      ['Estado', compLeft.estado],
                    ] as const).map(([k, v]) => (
                      <div key={k} className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[10px] block font-semibold">{k.toUpperCase()}</span>
                        <span className="font-semibold text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
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
                    showRoiContour={globalRoiContour}
                    showHeatmap={globalHeatmap}
                    isPolarized={globalPolarized}
                    zoom={1}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    {compRight.fecha}{compRight.diametro !== 'N/A' ? ` • ${compRight.diametro}` : ''}
                  </div>
                </div>

                {isReal ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {([
                      ['Lesión', compRight.lesion],
                      ['Ubicación', compRight.ubicacion],
                      ['Diámetro', compRight.diametro !== 'N/A' ? compRight.diametro : '—'],
                      ['Estado', compRight.estado],
                    ] as const).map(([k, v]) => (
                      <div key={k} className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[10px] block font-semibold">{k.toUpperCase()}</span>
                        <span className="font-semibold text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
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

      {/* VIEW: Secuencia día a día — diffs consecutivos por lesión */}
      {viewMode === 'secuencia' && (() => {
        const porLesion = new Map<number, string>();
        for (const f of data) {
          if (f.lesionId == null) continue;
          if (!porLesion.has(f.lesionId)) porLesion.set(f.lesionId, f.lesion);
        }
        const ids = [...porLesion.entries()];
        if (ids.length === 0) {
          return (
            <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-10 text-center">
              <Camera className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Sin lesiones con registros</p>
              <p className="text-xs text-slate-500 mt-1">
                Este paciente aún no tiene lesiones con foto basal y seguimientos para comparar.
              </p>
            </Card>
          );
        }
        return (
          <div className="space-y-5">
            {ids.map(([id, nombre]) => (
              <React.Fragment key={id}>
                <LesionSecuenciaDiffs lesionId={id} lesionNombre={nombre} />
              </React.Fragment>
            ))}
          </div>
        );
      })()}

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
                            showRoiContour={false}
                            showHeatmap={false}
                            isPolarized={true}
                            zoom={1}
                          />
                        </div>
                        <div className="text-xs space-y-1 flex-1 min-w-0">
                          <div className="text-slate-500 text-[11px] truncate">{f.tipo}</div>
                          {isReal ? (
                            <>
                              {f.diametro !== 'N/A' && (
                                <div className="text-slate-900 font-semibold tabular-nums">{f.diametro}</div>
                              )}
                              <div className="text-[11px] text-slate-500 truncate">{f.ubicacion}</div>
                            </>
                          ) : (
                            <>
                              <div className="text-slate-900 font-semibold tabular-nums">
                                Ø {f.diametro} • <span className="text-slate-600 font-normal">{f.area}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                                <span>TDS: <strong className="text-slate-800">{f.scoreTDS}</strong></span>
                                <span className="text-emerald-700 font-medium">{f.calidad.split(' ')[0]}</span>
                              </div>
                            </>
                          )}
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
                    {[selectedFoto.tipo, selectedFoto.aumento, selectedFoto.ubicacion].filter(Boolean).join(' • ')}
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
                    showRoiContour={modalRoiContour || selectedFoto.tag === 'IA-ROI'}
                    showHeatmap={modalHeatmap}
                    isPolarized={modalPolarized}
                    zoom={modalZoom}
                    highlightAsymmetry={modalAsymmetryGuide}
                    filter={selectedFoto.imageUrl ? modalFilter : undefined}
                  />

                  {/* On-screen Zoom Indicator Pill */}
                  <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full border border-white/20 font-medium">
                    {(modalZoom * 10).toFixed(0)}x Magnificación
                  </div>

                  {(selectedFoto.diametro !== 'N/A' || (selectedFoto.area && selectedFoto.area !== 'N/A')) && (
                    <div className="absolute bottom-3 left-3 bg-slate-950/85 text-white text-xs px-3 py-1 rounded-md border border-white/20 font-medium">
                      {selectedFoto.diametro !== 'N/A' && `Ø ${selectedFoto.diametro}`}
                      {selectedFoto.diametro !== 'N/A' && selectedFoto.area && selectedFoto.area !== 'N/A' && ' • '}
                      {selectedFoto.area && selectedFoto.area !== 'N/A' && selectedFoto.area}
                    </div>
                  )}
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

                  {selectedFoto.imageUrl && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">Preprocesamiento:</span>
                    {PREPROCESS_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setModalFilter(f.id)}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                          modalFilter === f.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  )}

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

                {/* TDS & ABCD Score Card (solo datos demo) / Datos del registro (datos reales) */}
                {isReal ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 text-xs">
                    <span className="font-semibold text-slate-800 block">Datos del registro</span>
                    {[
                      ['Lesión', selectedFoto.lesion],
                      ['Ubicación', selectedFoto.ubicacion],
                      ['Diámetro', selectedFoto.diametro !== 'N/A' ? selectedFoto.diametro : null],
                      ['Estado', selectedFoto.estado],
                      ['Respuestas', selectedFoto.colorTonos !== '—' ? selectedFoto.colorTonos : null],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 py-0.5 border-b border-slate-100 last:border-0">
                        <span className="text-slate-500">{k}:</span>
                        <span className="font-medium text-slate-800 text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}

                {/* Microscopic Findings Text */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="font-semibold text-slate-900 block">
                    {isReal ? 'Notas del paciente:' : 'Hallazgos Dermatoscópicos:'}
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedFoto.hallazgos}
                  </p>
                  {!isReal && selectedFoto.colorTonos !== '—' && (
                    <div className="pt-1 text-[11px] text-slate-500 font-medium">
                      Tonos: {selectedFoto.colorTonos}
                    </div>
                  )}
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
                  {selectedFoto.calidad && selectedFoto.calidad !== '—' && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Calidad Óptica / ROI:</span>
                      <span className="font-medium text-emerald-700">{selectedFoto.calidad}</span>
                    </div>
                  )}
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
