export type ImageFilter =
  | 'none'
  | 'gray'
  | 'binary'
  | 'roberts'
  | 'prewitt'
  | 'sobel'
  | 'canny'
  | 'invert'
  | 'red'
  | 'contrast'
  | 'blur'
  | 'sharpen'
  | 'sepia'
  | 'edge'
  | 'hue';

export const FILTER_LABELS: Record<ImageFilter, string> = {
  none: 'Original',
  gray: 'Escala de Grises',
  binary: 'Máscara Binaria',
  roberts: 'Roberts (Bordes)',
  prewitt: 'Prewitt (Bordes)',
  sobel: 'Sobel (Bordes)',
  canny: 'Canny (Bordes)',
  invert: 'Invertir',
  red: 'Resaltar Rojos (Color ABCDE)',
  contrast: 'Mejora de Contraste',
  blur: 'Desenfoque Suavizado',
  sharpen: 'Enfoque / Nitidez',
  sepia: 'Tono Sepia',
  edge: 'Bordes Avanzados',
  hue: 'Matiz y Saturación',
};

export const IMAGE_FILTERS: ImageFilter[] = [
  'none', 'gray', 'binary', 'roberts', 'prewitt', 'sobel', 'canny',
  'invert', 'red', 'contrast', 'blur', 'sharpen', 'sepia', 'edge', 'hue',
];

let sharedCanvas: HTMLCanvasElement | null = null;

function getCanvas(): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
  }
  return sharedCanvas;
}

/**
 * Aplica un filtro de procesamiento de imagen (estilo OpenCV) sobre una imagen
 * cargada desde `imgSrc` y devuelve un dataURL JPEG. Todo corre en el cliente
 * con Canvas API, sin servidor.
 */
export function applyFilterToImage(imgSrc: string, filter: ImageFilter): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = getCanvas();
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const h = canvas.height;

        if (filter === 'gray') {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = data[i + 1] = data[i + 2] = gray;
          }
        } else if (filter === 'binary') {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const v = gray > 128 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = v;
          }
        } else if (filter === 'invert') {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
        } else if (filter === 'red') {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            data[i] = Math.min(255, r * 1.5);
            data[i + 1] = Math.max(0, g * 0.5);
            data[i + 2] = Math.max(0, b * 0.5);
          }
        } else if (filter === 'contrast') {
          let min = 255, max = 0;
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            if (gray < min) min = gray;
            if (gray > max) max = gray;
          }
          const range = max - min || 1;
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const v = Math.round(((gray - min) / range) * 255);
            data[i] = data[i + 1] = data[i + 2] = v;
          }
        } else if (filter === 'blur') {
          const temp = new Uint8ClampedArray(data);
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                  for (let kx = -1; kx <= 1; kx++) {
                    const nIdx = ((y + ky) * w + (x + kx)) * 4 + c;
                    sum += temp[nIdx];
                  }
                }
                data[idx + c] = sum / 9;
              }
            }
          }
        } else if (filter === 'sharpen') {
          const temp = new Uint8ClampedArray(data);
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              for (let c = 0; c < 3; c++) {
                const center = temp[idx + c];
                const neighbors =
                  temp[((y - 1) * w + (x - 1)) * 4 + c] +
                  temp[((y - 1) * w + x) * 4 + c] +
                  temp[((y - 1) * w + (x + 1)) * 4 + c] +
                  temp[((y) * w + (x - 1)) * 4 + c] +
                  temp[((y) * w + (x + 1)) * 4 + c] +
                  temp[((y + 1) * w + (x - 1)) * 4 + c] +
                  temp[((y + 1) * w + x) * 4 + c] +
                  temp[((y + 1) * w + (x + 1)) * 4 + c];
                const sharpened = center * 5 - neighbors;
                data[idx + c] = Math.max(0, Math.min(255, sharpened));
              }
            }
          }
        } else if (filter === 'sepia') {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
          }
        } else if (filter === 'edge') {
          const gray = new Float32Array(w * h);
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              gray[y * w + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            }
          }
          const gx = new Float32Array(w * h).fill(0);
          const gy = new Float32Array(w * h).fill(0);
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = y * w + x;
              gx[idx] =
                -1 * gray[idx - w - 1] - 2 * gray[idx - w] - 1 * gray[idx - w + 1] +
                1 * gray[idx + w - 1] + 2 * gray[idx + w] + 1 * gray[idx + w + 1];
              gy[idx] =
                -1 * gray[idx - w - 1] - 2 * gray[idx - 1] - 1 * gray[idx + 1] +
                1 * gray[idx + w - 1] + 2 * gray[idx + w] + 1 * gray[idx + w + 1];
            }
          }
          let maxMag = 0;
          const mag = new Float32Array(w * h);
          for (let i = 0; i < mag.length; i++) {
            mag[i] = Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i]);
            if (mag[i] > maxMag) maxMag = mag[i];
          }
          const threshold = maxMag * 0.3;
          for (let i = 0; i < data.length; i += 4) {
            const idx = i / 4;
            const v = mag[idx] > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = v;
          }
        } else if (filter === 'hue') {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            let h = 0;
            if (delta !== 0) {
              if (max === r) h = ((g - b) / delta) % 6;
              else if (max === g) h = (b - r) / delta + 2;
              else h = (r - g) / delta + 4;
              h *= 60;
              if (h < 0) h += 360;
            }
            const h2 = (h + 30) % 360;
            const s = delta / (max || 1);
            const v = max / 255;
            const c = v * (s * 1.5);
            const x2 = c * (1 - Math.abs(((h2 / 60) % 2) - 1));
            let r2 = 0, g2 = 0, b2 = 0;
            if (h2 < 60) { r2 = c; g2 = x2; }
            else if (h2 < 120) { r2 = x2; g2 = c; }
            else if (h2 < 180) { g2 = c; b2 = x2; }
            else if (h2 < 240) { g2 = x2; b2 = c; }
            else if (h2 < 300) { r2 = x2; b2 = c; }
            else { r2 = c; b2 = x2; }
            const m = v - c;
            data[i] = (r2 + m) * 255;
            data[i + 1] = (g2 + m) * 255;
            data[i + 2] = (b2 + m) * 255;
          }
        } else if (filter === 'roberts' || filter === 'prewitt' || filter === 'sobel' || filter === 'canny') {
          const gray = new Float32Array(w * h);
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              gray[y * w + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            }
          }

          const gx = new Float32Array(w * h).fill(0);
          const gy = new Float32Array(w * h).fill(0);

          if (filter === 'roberts') {
            for (let y = 0; y < h - 1; y++) {
              for (let x = 0; x < w - 1; x++) {
                const idx = y * w + x;
                gx[idx] = gray[idx] - gray[idx + w + 1];
                gy[idx] = gray[idx + 1] - gray[idx + w];
              }
            }
          } else if (filter === 'prewitt') {
            for (let y = 1; y < h - 1; y++) {
              for (let x = 1; x < w - 1; x++) {
                const idx = y * w + x;
                gx[idx] =
                  -gray[idx - w - 1] - gray[idx - w] - gray[idx - w + 1] +
                  gray[idx + w - 1] + gray[idx + w] + gray[idx + w + 1];
                gy[idx] =
                  -gray[idx - w - 1] - gray[idx - 1] - gray[idx + 1] +
                  gray[idx + w - 1] + gray[idx + w] + gray[idx + w + 1];
              }
            }
          } else if (filter === 'sobel' || filter === 'canny') {
            for (let y = 1; y < h - 1; y++) {
              for (let x = 1; x < w - 1; x++) {
                const idx = y * w + x;
                gx[idx] =
                  -1 * gray[idx - w - 1] - 2 * gray[idx - w] - 1 * gray[idx - w + 1] +
                  1 * gray[idx + w - 1] + 2 * gray[idx + w] + 1 * gray[idx + w + 1];
                gy[idx] =
                  -1 * gray[idx - w - 1] - 2 * gray[idx - 1] - 1 * gray[idx + 1] +
                  1 * gray[idx + w - 1] + 2 * gray[idx + w] + 1 * gray[idx + w + 1];
              }
            }
          }

          const magnitude = new Float32Array(w * h);
          let maxMag = 0;
          for (let i = 0; i < magnitude.length; i++) {
            magnitude[i] = Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i]);
            if (magnitude[i] > maxMag) maxMag = magnitude[i];
          }

          const threshold = filter === 'canny' ? maxMag * 0.5 : maxMag * 0.4;
          for (let i = 0; i < data.length; i += 4) {
            const idx = i / 4;
            const v = magnitude[idx] > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = v;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = imgSrc;
  });
}
