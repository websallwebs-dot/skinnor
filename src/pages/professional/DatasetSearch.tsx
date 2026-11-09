import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Database, FileText, Loader2, Microscope, Filter } from 'lucide-react';
import { get } from '@/lib/api';
import { FILTER_LABELS, IMAGE_FILTERS, ImageFilter } from '@/lib/imageFilters';
import { useImageFilters } from '@/lib/useImageFilters';

interface HamImage {
  image_id: string;
  lesion_id: string;
  dx: string;
  dx_type: string;
  age: string;
  sex: string;
  localization: string;
  image_path: string;
  part: number;
}

export default function DatasetSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<HamImage[]>([]);
  const [total, setTotal] = useState(0);

  // Filtros de consulta (HAM10000)
  const [dx, setDx] = useState('');
  const [dxType, setDxType] = useState('');
  const [sex, setSex] = useState('');
  const [localization, setLocalization] = useState('');

  // Pila de filtros de preprocesamiento de imagen (se encadenan entre sí)
  const { stack: filterStack, urls: filteredUrls, processing: imagesProcessing, setItems, addFilter, removeAt, reset: resetFilters } = useImageFilters();

  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';



  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const params: Record<string, string> = {};
      if (dx) params.dx = dx;
      if (localization) params.localization = localization;
      if (sex) params.sex = sex;

      const data = await get('/ham10000', params);
      const rows: HamImage[] = data.results || [];
      setResults(rows);
      setTotal(data.total || 0);
      setItems(rows.map((r) => ({ id: r.image_id, src: `${API_BASE}/ham10000/${r.image_id}/image` })));
      resetFilters();
      setHasSearched(true);
    } catch {
      // Error handled by api.ts (401 -> redirect)
    } finally {
      setIsSearching(false);
    }
  };

  const filters = IMAGE_FILTERS;

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512] flex items-center gap-3">
          Explorador HAM10000
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#0d7a63] bg-[#cfe6dd] px-2.5 py-1 rounded-sm flex items-center gap-1.5 mt-1">
            <Database className="h-3 w-3" />
            Dataset Activo
          </span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
          Filtra e indaga en la base de datos de 10.015 imágenes dermatoscópicas (Human Against Machine) para encontrar casos de referencia y validación clínica.
        </p>
      </div>

      {/* Contenedor de Filtros de Búsqueda */}
      <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl mb-6">
        <div className="border-b border-[#d8e0dc] px-6 py-4 bg-[#fafcfa]">
          <h2 className="text-[15px] font-semibold text-[#0c1512]">Parámetros de Búsqueda</h2>
        </div>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            {/* Diagnóstico (dx) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Diagnóstico (dx)</label>
              <select
                value={dx}
                onChange={(e) => setDx(e.target.value)}
                className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:border-[#0c1512] transition-colors"
              >
                <option value="">Todos los diagnósticos</option>
                <option value="mel">Melanoma (mel)</option>
                <option value="nv">Nevo melanocítico (nv)</option>
                <option value="bcc">Carcinoma basocelular (bcc)</option>
                <option value="akiec">Queratosis actínica / Enf. Bowen (akiec)</option>
                <option value="bkl">Queratosis benigna (bkl)</option>
                <option value="df">Dermatofibroma (df)</option>
                <option value="vasc">Lesión vascular (vasc)</option>
              </select>
            </div>

            {/* Tipo de Confirmación (dx_type) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Validación (dx_type)</label>
              <select
                value={dxType}
                onChange={(e) => setDxType(e.target.value)}
                className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:border-[#0c1512] transition-colors"
              >
                <option value="">Cualquier validación</option>
                <option value="histo">Histopatología (histo)</option>
                <option value="follow_up">Seguimiento clínico (follow_up)</option>
                <option value="consensus">Consenso de expertos (consensus)</option>
                <option value="confocal">Microscopía confocal (confocal)</option>
              </select>
            </div>

            {/* Sexo biológico */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Sexo del Paciente</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:border-[#0c1512] transition-colors"
              >
                <option value="">Cualquier sexo</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="unknown">Desconocido</option>
              </select>
            </div>

            {/* Localización (localization) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Localización Anatómica</label>
              <select
                value={localization}
                onChange={(e) => setLocalization(e.target.value)}
                className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:border-[#0c1512] transition-colors"
              >
                <option value="">Cualquier localización</option>
                <option value="back">Espalda</option>
                <option value="lower extremity">Extremidad inferior</option>
                <option value="trunk">Tronco</option>
                <option value="upper extremity">Extremidad superior</option>
                <option value="abdomen">Abdomen</option>
                <option value="face">Cara</option>
                <option value="chest">Pecho</option>
                <option value="foot">Pie</option>
                <option value="neck">Cuello</option>
                <option value="scalp">Cuero cabelludo</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-[#d8e0dc]">
            <Button
              className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none px-8 font-medium"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando en 10.015 registros...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> Buscar Casos Similares</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros de Procesamiento de Imagen (ABCDE) - se aplican automáticamente al cambiar */}
      <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl mb-6">
        <div className="border-b border-[#d8e0dc] px-6 py-4 bg-[#fafcfa]">
          <h2 className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de Procesamiento de Imagen (Detección ABCDE)
          </h2>
          <p className="text-xs text-[#5f7b6f] mt-1">
            Selecciona un filtro para aplicarlo instantáneamente sobre los resultados buscados.
          </p>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-[#5f7b6f]" />
            <span className="text-xs font-medium text-[#5f7b6f]">Agregar filtro:</span>
            <select
              value=""
              onChange={(e) => { if (e.target.value) addFilter(e.target.value as ImageFilter); e.target.value = ''; }}
              disabled={imagesProcessing}
              className="border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0c1512] cursor-pointer w-auto min-w-[220px]"
            >
              <option value="">Selecciona un filtro…</option>
              {filters.filter((f) => f !== 'none').map((f) => (
                <option key={f} value={f}>
                  {FILTER_LABELS[f]}
                </option>
              ))}
            </select>
            {imagesProcessing && (
              <div className="ml-3 flex items-center gap-1 text-[#0c1512]">
                <div className="h-3 w-3 border-2 border-[#0c1512] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-medium">Procesando...</span>
              </div>
            )}
            <span className="ml-auto text-[10px] text-[#5f7b6f]">
              Canvas API (sin servidor)
            </span>
          </div>

          {/* Pila de filtros activos (se aplican en orden, se pueden quitar o reiniciar) */}
          {filterStack.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#d8e0dc]">
              <span className="text-[11px] font-medium text-[#5f7b6f]">Cadena de filtros:</span>
              {filterStack.map((f, i) => (
                <span
                  key={`${f}-${i}`}
                  className="inline-flex items-center gap-1.5 bg-[#e9efec] border border-[#0d7a63]/30 text-[#0a4539] text-[11px] font-medium px-2.5 py-1 rounded-full"
                >
                  <span className="text-[#5f7b6f] font-mono text-[10px]">{i + 1}.</span>
                  {FILTER_LABELS[f]}
                  <button
                    onClick={() => removeAt(i)}
                    disabled={imagesProcessing}
                    className="ml-0.5 hover:text-[#c77a0b] disabled:opacity-40"
                    title="Quitar este filtro"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={resetFilters}
                disabled={imagesProcessing}
                className="text-[11px] font-medium text-[#0d7a63] hover:text-[#0a4539] underline underline-offset-2 disabled:opacity-40"
              >
                Ver original
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {hasSearched && !isSearching && (
        <div className="space-y-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[#0c1512]">Resultados de la Búsqueda</h2>
              <p className="text-sm text-[#5f7b6f] mt-1">
                Se encontraron {total} casos coincidentes.{' '}
                {filterStack.length > 0 && (
                  <span className="text-[#0c1512] font-medium">
                    (Cadena: {filterStack.map((f) => FILTER_LABELS[f]).join(' → ')})
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" className="border-[#d8e0dc] text-[#0c1512] shadow-none text-xs">
              <FileText className="mr-2 h-3.5 w-3.5" /> Exportar a CSV
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map((result) => {
              const imgSrc = filteredUrls[result.image_id] || `${API_BASE}/ham10000/${result.image_id}/image`;
              return (
                <Card key={result.image_id} className="border-[#d8e0dc] shadow-none bg-white overflow-hidden group cursor-pointer hover:border-[#0d7a63] transition-colors">
                  <div className="aspect-square bg-[#e9efec] relative overflow-hidden flex items-center justify-center border-b border-[#d8e0dc]">
                    <img
                      src={imgSrc}
                      alt={result.image_id}
                      className="w-full h-full object-cover opacity-95"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.classList.add('hidden');
                      }}
                    />
                    {imagesProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <div className="h-4 w-4 border-2 border-[#0c1512] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-[#0c1512] uppercase tracking-wider shadow-sm">
                      {result.image_id}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-[#c77a0b] mb-1">{result.dx}</div>
                      <div className="text-sm font-semibold text-[#0c1512] flex items-center gap-1.5">
                        <Microscope className="h-3.5 w-3.5 text-[#5f7b6f]" />
                        {result.dx_type}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#5f7b6f]">Sexo / Edad</span>
                        <span className="font-medium text-[#0c1512]">{result.sex}, {result.age} años</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#5f7b6f]">Localización</span>
                        <span className="font-medium text-[#0c1512]">{result.localization}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {results.length === 0 && (
              <div className="col-span-full text-center py-20 text-[#5f7b6f]">
                <p>No se encontraron casos con los filtros aplicados.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado vacío (sin buscar) */}
      {!hasSearched && !isSearching && (
        <div className="text-center py-16 px-4 border-2 border-dashed border-[#d8e0dc] rounded-xl bg-[#fafcfa]">
          <Database className="mx-auto h-12 w-12 text-[#b9c6c0] mb-4" />
          <h3 className="text-lg font-semibold text-[#0c1512] mb-2">Dataset Listo</h3>
          <p className="text-sm text-[#5f7b6f] max-w-md mx-auto">
            Selecciona los parámetros anatómicos, demográficos o diagnósticos en la parte superior y presiona "Buscar Casos Similares" para interrogar la base de datos.
          </p>
        </div>
      )}
    </div>
  );
}
