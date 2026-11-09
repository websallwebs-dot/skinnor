import { useCallback, useRef, useState } from 'react';
import { applyFilterToImage, ImageFilter } from './imageFilters';

export interface FilterableImage {
  id: string;
  src: string;
}

/**
 * Maneja una pila de filtros de imagen encadenados sobre un set de imágenes.
 * Cada filtro se aplica sobre el resultado del anterior, partiendo siempre de
 * la fuente original (evita degradación por re-codificación JPEG).
 *
 * Uso:
 *   const { stack, urls, processing, setItems, addFilter, removeAt, reset } = useImageFilters();
 *   setItems([{ id, src }, ...]);           // al cargar resultados
 *   const imgSrc = urls[id] || srcOriginal; // src del <img>
 */
export function useImageFilters() {
  const itemsRef = useRef<FilterableImage[]>([]);
  const [stack, setStack] = useState<ImageFilter[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const setItems = useCallback((items: FilterableImage[]) => {
    itemsRef.current = items.filter((i) => i.src);
  }, []);

  const stackRef = useRef<ImageFilter[]>([]);

  const run = useCallback(async (next: ImageFilter[]) => {
    stackRef.current = next;
    setStack(next);
    const items = itemsRef.current;
    if (next.length === 0 || items.length === 0) {
      setUrls({});
      return;
    }
    setProcessing(true);
    const out: Record<string, string> = {};
    await Promise.all(
      items.map(async (it) => {
        let src = it.src;
        try {
          for (const f of next) src = await applyFilterToImage(src, f);
        } catch {
          // si un eslabón falla, se conserva la última imagen válida
        }
        out[it.id] = src;
      })
    );
    setUrls(out);
    setProcessing(false);
  }, []);

  const addFilter = useCallback(
    (f: ImageFilter) => {
      if (f === 'none') {
        run([]);
        return;
      }
      const prev = stackRef.current;
      // Evita duplicar el mismo filtro dos veces seguidas
      if (prev[prev.length - 1] === f) return;
      run([...prev, f]);
    },
    [run]
  );

  const removeAt = useCallback(
    (index: number) => {
      run(stackRef.current.filter((_, i) => i !== index));
    },
    [run]
  );

  const reset = useCallback(() => run([]), [run]);

  return { stack, urls, processing, setItems, addFilter, removeAt, reset };
}
