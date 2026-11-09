import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Folder, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type CsvRow = {
  lesion_id: string;
  image_id: string;
  dx: string;
  dx_type: string;
  age: string;
  sex: string;
  localization: string;
};

type ImageEntry = {
  image_id: string;
  part: 1 | 2;
};

export default function HamExplorer() {
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<CsvRow[]>([]);
  const [imageBlobs, setImageBlobs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedDx, setSelectedDx] = useState('');
  const objectUrls = useRef<Record<string, string>>({});

  useEffect(() => {
    return () => {
      Object.values(objectUrls.current).forEach((url) => URL.revokeObjectURL(url as string));
    };
  }, []);

  const dxList = Array.from(new Set(rows.map((r) => r.dx))).sort();

  const handleFolderSelect = useCallback(async () => {
    if (!(window as any).showDirectoryPicker) {
      toast.error('Usa Chrome, Edge u Opera para acceder a carpetas locales.');
      return;
    }
    try {
      setLoading(true);
      const handle = (await (window as any).showDirectoryPicker({ mode: 'read' })) as any;

      const metadata = await handle.getFileHandle('HAM10000_metadata.csv');
      const file = await metadata.getFile();
      const text = await file.text();
      const parsed = parseCSV(text);

      setDirectoryHandle(handle);
      setRows(parsed);
      toast.success(`${parsed.length} filas del CSV leídas`);
    } catch (err: any) {
      toast.error('No se pudo leer la carpeta: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query && !selectedDx) {
      setResults([]);
      setImageBlobs({});
      return;
    }

    setLoading(true);
    try {
      let matched: CsvRow[];
      if (selectedDx) {
        matched = rows.filter((r) => r.dx === selectedDx);
      } else if (query) {
        const q = query.toLowerCase();
        matched = rows.filter(
          (r) =>
            r.lesion_id.toLowerCase().includes(q) ||
            r.image_id.toLowerCase().includes(q)
        );
      } else {
        matched = [];
      }

      const top12 = matched.slice(0, 12);
      setResults(top12);

      if (directoryHandle) {
        const newBlobs: Record<string, string> = { ...imageBlobs };
        for (const row of top12) {
          if (objectUrls.current[row.image_id]) {
            newBlobs[row.image_id] = objectUrls.current[row.image_id];
            continue;
          }
          let url = '';
          for (const part of ['HAM10000_images_part_1', 'HAM10000_images_part_2']) {
            try {
              const sub: any = await directoryHandle.getDirectoryHandle(part);
              const fh: any = await sub.getFileHandle(`${row.image_id}.jpg`);
              const file = await fh.getFile();
              url = URL.createObjectURL(file);
              objectUrls.current[row.image_id] = url;
              break;
            } catch {
              // sigue al siguiente part
            }
          }
          if (url) newBlobs[row.image_id] = url;
        }
        setImageBlobs(newBlobs);
      }
    } finally {
      setLoading(false);
    }
  }, [query, selectedDx, rows, directoryHandle]);

  if (!directoryHandle) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="border border-[#d8e0dc] rounded-xl bg-white p-10 space-y-6">
          <Folder className="h-12 w-12 mx-auto text-[#5f7b6f]" />
          <h1 className="text-2xl font-semibold text-[#0c1512]">Buscador HAM10000</h1>
          <p className="text-[#5f7b6f]">Selecciona la carpeta HAM10000 de tu computadora</p>
          <p className="text-xs text-[#5f7b6f]">Requiere Chrome, Edge u Opera. Nada se sube a internet.</p>
          <Button
            onClick={handleFolderSelect}
            className="bg-[#0c1512] text-white px-8 py-3 rounded-md"
          >
            Seleccionar carpeta HAM10000
          </Button>
        </div>
      </div>
    );
  }

  const dxOptions = Array.from(new Set(results.map((r) => r.dx))).sort();

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div className="border-b border-[#d8e0dc] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0c1512]">Buscador HAM10000</h1>
          <p className="text-[#5f7b6f] text-sm">{rows.length} filas CSV • {results.length} resultados</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDirectoryHandle(null)}>
          <RefreshCw className="h-4 w-4" /> Cambiar carpeta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 space-y-4">
          <div className="border border-[#d8e0dc] rounded-md bg-white p-4">
            <label className="text-xs font-semibold text-[#5f7b6f] uppercase mb-2 block">Diagnóstico (dx)</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dxList.map((dx) => (
                <Button
                  key={dx}
                  variant={selectedDx === dx ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => { setSelectedDx(dx); setQuery(''); }}
                  className="w-full text-left text-sm"
                >
                  {dx}
                </Button>
              ))}
              {dxList.length === 0 && <p className="text-[11px] text-[#5f7b6f]">Sin datos</p>}
            </div>
          </div>
          <div className="border border-[#d8e0dc] rounded-md bg-white p-4">
            <label className="text-xs font-semibold text-[#5f7b6f] uppercase mb-2 block">Buscar por ID</label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="lesion_id o image_id"
              className="border-[#d8e0dc] bg-[#f4f6f5]"
            />
            <div className="mt-3">
              <Button onClick={handleSearch} className="w-full bg-[#0c1512] text-white rounded-md py-2">
                Buscar (máx 12)
              </Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-9">
          {loading ? (
            <div className="text-center py-20 text-[#5f7b6f]">Buscando casos e imágenes reales...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-[#5f7b6f]">
              <p>Selecciona un diagnóstico o escribe un ID.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((row) => {
                const url = imageBlobs[row.image_id];
                return (
                  <Card key={row.image_id} className="border-[#d8e0dc] shadow-none rounded-md bg-white overflow-hidden">
                    <div className="aspect-[1/1] bg-[#e9efec] border-b border-[#d8e0dc] relative flex items-center justify-center">
                      <img
                        src={url ?? ''}
                        alt={row.image_id}
                        className="w-full h-full object-cover opacity-95"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.classList.add('hidden');
                        }}
                      />
                      {!url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#f4f6f5]/60">
                          <span className="text-[10px] text-[#5f7b6f]">Sin imagen</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-[#0c1512]/90 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-medium z-10">
                        {row.image_id}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-[#0c1512]/90 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-medium z-10">
                        {row.dx}
                      </div>
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <div className="text-xs font-semibold text-[#0c1512]">{row.lesion_id}</div>
                      <div className="text-xs text-[#5f7b6f]">{row.dx}</div>
                      <div className="flex items-center gap-1 text-[10px] text-[#5f7b6f]">
                        <span>{row.sex}</span>
                        <span>•</span>
                        <span>{row.age}</span>
                        <span>•</span>
                        <span>{row.localization}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseCSV(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const r: Partial<CsvRow> = {};
    header.forEach((h, i) => {
      r[h as keyof CsvRow] = values[i]?.trim() ?? '';
    });
    return r as CsvRow;
  });
}
