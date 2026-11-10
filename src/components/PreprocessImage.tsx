import React, { useEffect, useState } from 'react';

export type PreprocessFilter =
  | 'original'
  | 'lab_l'
  | 'lab_a'
  | 'lab_b'
  | 'gray'
  | 'sobel'
  | 'otsu';

export const PREPROCESS_FILTERS: { id: PreprocessFilter; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'lab_l', label: 'Lab · L' },
  { id: 'lab_a', label: 'Lab · a*' },
  { id: 'lab_b', label: 'Lab · b*' },
  { id: 'gray', label: 'Gris' },
  { id: 'sobel', label: 'Sobel' },
  { id: 'otsu', label: 'Umbral' },
];

const imgCache = new Map<string, HTMLImageElement>();
const dataUrlCache = new Map<string, string>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imgCache.get(src);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

// sRGB -> Lab (D65), devuelve [L 0-100, a, b]
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const lin = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rl = lin(r), gl = lin(g), bl = lin(b);
  const x = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / 0.95047;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const z = (0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function applyFilter(img: HTMLImageElement, filter: PreprocessFilter): string {
  const maxDim = 800;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const n = w * h;

  if (filter === 'original') return canvas.toDataURL('image/png');

  // Canal L completo para filtros que lo necesitan
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = rgbToLab(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])[0];
  }

  if (filter === 'gray') {
    for (let i = 0; i < n; i++) {
      const v = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    }
  } else if (filter === 'lab_l') {
    for (let i = 0; i < n; i++) {
      const v = Math.max(0, Math.min(255, (L[i] / 100) * 255));
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    }
  } else if (filter === 'lab_a' || filter === 'lab_b') {
    const isA = filter === 'lab_a';
    for (let i = 0; i < n; i++) {
      const [, a, b] = rgbToLab(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      const v = isA ? a : b;
      const t = Math.max(-128, Math.min(128, v)) / 128; // -1..1
      let r = 128, g = 128, b2 = 128;
      if (isA) {
        r = 128 + t * 127;
        g = 128 - t * 127;
      } else {
        r = 128 + t * 127;
        b2 = 128 - t * 127;
      }
      d[i * 4] = Math.max(0, Math.min(255, r));
      d[i * 4 + 1] = Math.max(0, Math.min(255, g));
      d[i * 4 + 2] = Math.max(0, Math.min(255, b2));
    }
  } else if (filter === 'sobel' || filter === 'otsu') {
    if (filter === 'sobel') {
      const mag = new Float32Array(n);
      let maxMag = 1;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          const gx =
            -L[i - w - 1] - 2 * L[i - 1] - L[i + w - 1] +
            L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1];
          const gy =
            -L[i - w - 1] - 2 * L[i - w] - L[i - w + 1] +
            L[i + w - 1] + 2 * L[i + w] + L[i + w + 1];
          const m = Math.sqrt(gx * gx + gy * gy);
          mag[i] = m;
          if (m > maxMag) maxMag = m;
        }
      }
      for (let i = 0; i < n; i++) {
        const v = Math.min(255, (mag[i] / maxMag) * 255);
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
      }
    } else {
      // Umbral de Otsu sobre L
      const hist = new Array(256).fill(0);
      const l8 = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const v = Math.max(0, Math.min(255, Math.round((L[i] / 100) * 255)));
        l8[i] = v;
        hist[v]++;
      }
      let sum = 0;
      for (let t = 0; t < 256; t++) sum += t * hist[t];
      let sumB = 0, wB = 0, maxVar = 0, threshold = 127;
      for (let t = 0; t < 256; t++) {
        wB += hist[t];
        if (wB === 0) continue;
        const wF = n - wB;
        if (wF === 0) break;
        sumB += t * hist[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const between = wB * wF * (mB - mF) * (mB - mF);
        if (between > maxVar) {
          maxVar = between;
          threshold = t;
        }
      }
      for (let i = 0; i < n; i++) {
        const v = l8[i] > threshold ? 255 : 0;
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

interface PreprocessImageProps {
  src: string;
  filter: PreprocessFilter;
  zoom?: number;
}

/** Imagen con filtro de preprocesamiento aplicado (canvas, client-side). */
export default function PreprocessImage({ src, filter, zoom = 1 }: PreprocessImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    if (filter === 'original') {
      setUrl(src);
      return;
    }
    const key = `${src}|${filter}`;
    const cached = dataUrlCache.get(key);
    if (cached) {
      setUrl(cached);
      return;
    }
    setUrl(null);
    loadImage(src)
      .then((img) => {
        if (cancelled) return;
        const dataUrl = applyFilter(img, filter);
        dataUrlCache.set(key, dataUrl);
        setUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [src, filter]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
        Filtro no disponible
      </div>
    );
  }
  if (!url) {
    return <div className="w-full h-full bg-[#1a1512] animate-pulse" />;
  }
  return (
    <img
      src={url}
      alt="Vista preprocesada"
      className="w-full h-full object-cover"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'center center',
        transition: 'transform 0.25s ease-out',
      }}
      draggable={false}
    />
  );
}
