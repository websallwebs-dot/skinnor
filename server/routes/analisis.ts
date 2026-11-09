import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

const FASTAPI_ANALYZE_URL =
  process.env.FASTAPI_ANALYZE_URL || 'http://127.0.0.1:8003/analyze_pair';
const ANALYZE_TIMEOUT_MS = 90000;

interface AnalisisItem {
  seguimiento_id: number;
  fecha: string;
  fuente: string;
  base: any;
  follow: any;
  par: any;
  heatmap_id: number | null;
}

function parseTamanoMm(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const m = String(v).match(/\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(',', '.'));
  // diametro cutaneo plausible en mm; valores fuera de rango se descartan
  return Number.isFinite(n) && n >= 0.5 && n <= 50 ? n : null;
}

async function analyzePair(baseBuf: Buffer, followBuf: Buffer, mimeB: string, mimeF: string) {
  const fd = new FormData();
  fd.append('base', new Blob([new Uint8Array(baseBuf)], { type: mimeB }), 'base.jpg');
  fd.append('follow', new Blob([new Uint8Array(followBuf)], { type: mimeF }), 'follow.jpg');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ANALYZE_TIMEOUT_MS);
  try {
    const res = await fetch(FASTAPI_ANALYZE_URL, { method: 'POST', body: fd, signal: ctrl.signal });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`FastAPI ${res.status}: ${txt.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function upsertAnalisis(lesionId: number, seguimientoId: number, fuente: string, metricas: any, heatmapB64: string | null, vizB64: string | null = null): number {
  const heatmap = heatmapB64 ? Buffer.from(heatmapB64, 'base64') : null;
  const viz = vizB64 ? Buffer.from(vizB64, 'base64') : null;
  const metricasJson = JSON.stringify(metricas);
  const existing = get(
    'SELECT id FROM lesion_analisis WHERE lesion_id = ? AND seguimiento_id = ?',
    [lesionId, seguimientoId]
  ) as { id: number } | undefined;
  if (existing) {
    run(
      'UPDATE lesion_analisis SET fuente = ?, metricas = ?, heatmap = ?, viz = ? WHERE id = ?',
      [fuente, metricasJson, heatmap, viz, existing.id]
    );
    return existing.id;
  }
  const r = run(
    'INSERT INTO lesion_analisis (lesion_id, seguimiento_id, fuente, metricas, heatmap, viz) VALUES (?, ?, ?, ?, ?, ?)',
    [lesionId, seguimientoId, fuente, metricasJson, heatmap, viz]
  );
  return r.lastInsertRowid as number;
}

// GET /api/lesiones/:lesionId/evolucion/analisis — metricas de imagen por seguimiento
router.get('/:lesionId/evolucion/analisis', async (req, res) => {
  const lesionId = Number(req.params.lesionId);
  const lesion = get('SELECT id, foto_base, tamaño FROM lesiones WHERE id = ?', [lesionId]) as any;
  if (!lesion) return res.status(404).json({ error: 'Lesión no encontrada' });

  const segs = all(
    `SELECT s.id, s.fecha, s.tamano_mm,
            (SELECT sf.id FROM seguimiento_fotos sf WHERE sf.seguimiento_id = s.id ORDER BY sf.orden ASC, sf.id ASC LIMIT 1) AS foto_id,
            (SELECT sf.foto FROM seguimiento_fotos sf WHERE sf.seguimiento_id = s.id ORDER BY sf.orden ASC, sf.id ASC LIMIT 1) AS foto_blob,
            (SELECT sf.mime FROM seguimiento_fotos sf WHERE sf.seguimiento_id = s.id ORDER BY sf.orden ASC, sf.id ASC LIMIT 1) AS foto_mime,
            s.foto AS legacy_foto
     FROM seguimientos s WHERE s.lesion_id = ? ORDER BY s.fecha ASC`,
    [lesionId]
  ) as any[];

  if (!lesion.foto_base || segs.length === 0) return res.json({ items: [], basal_mm: parseTamanoMm(lesion.tamaño) });

  const basalMm = parseTamanoMm(lesion.tamaño);
  const items: AnalisisItem[] = [];
  const errores: string[] = [];

  for (const seg of segs) {
    const followBuf: Buffer | null = seg.foto_blob || seg.legacy_foto;
    const followMime = seg.foto_mime || 'image/jpeg';
    const fuente = `v4:${seg.foto_id || `legacy-${seg.id}`}`;

    // cache: reutilizar si la fuente no cambio
    const cached = get(
      'SELECT id, fuente, metricas FROM lesion_analisis WHERE lesion_id = ? AND seguimiento_id = ?',
      [lesionId, seg.id]
    ) as any;
    let rowId: number;
    let metricas: any;

    if (cached && cached.fuente === fuente) {
      rowId = cached.id;
      metricas = JSON.parse(cached.metricas);
    } else {
      try {
        const out = await analyzePair(lesion.foto_base as Buffer, followBuf, 'image/jpeg', followMime);
        const { heatmap_b64, viz_b64, ...rest } = out;
        rowId = upsertAnalisis(lesionId, seg.id, fuente, rest, heatmap_b64 || null, viz_b64 || null);
        metricas = rest;
      } catch (e: any) {
        errores.push(`seguimiento ${seg.id}: ${e?.message || e}`);
        if (cached) {
          rowId = cached.id;
          metricas = JSON.parse(cached.metricas);
        } else {
          continue;
        }
      }
    }

    // estimacion de diametro en mm usando la escala declarada en la lesion basal
    const basePx = metricas?.base?.diametro_px;
    const folPx = metricas?.follow?.diametro_px;
    const diametro_mm_est =
      basalMm && basePx && folPx ? Math.round(folPx * (basalMm / basePx) * 10) / 10 : null;

    items.push({
      seguimiento_id: seg.id,
      fecha: seg.fecha,
      fuente,
      base: metricas?.base,
      follow: metricas?.follow,
      par: metricas?.par,
      diametro_mm_est,
      heatmap_id: rowId,
    });
  }

  res.json({ items, basal_mm: basalMm, errores: errores.length ? errores : undefined });
});

// GET /api/analisis/heatmap/:id — heatmap del differencing (PNG)
router.get('/heatmap/:id', (req, res) => {
  const row = get('SELECT heatmap FROM lesion_analisis WHERE id = ?', [req.params.id]) as any;
  if (!row || !row.heatmap) return res.status(404).json({ error: 'Heatmap no disponible' });
  res.set('Content-Type', 'image/png');
  res.send(row.heatmap);
});

// GET /api/lesiones/viz/:id — panel compuesto de analisis (PNG)
router.get('/viz/:id', (req, res) => {
  const row = get('SELECT viz FROM lesion_analisis WHERE id = ?', [req.params.id]) as any;
  if (!row || !row.viz) return res.status(404).json({ error: 'Visualizacion no disponible' });
  res.set('Content-Type', 'image/png');
  res.send(row.viz);
});

export default router;
