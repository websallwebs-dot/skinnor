import { Router } from 'express';
import { run, all, get, getDb } from '../db';

const router = Router();

function decodeDataUrl(value: any): { buffer: Buffer; mime: string } | null {
  if (typeof value !== 'string' || !value.startsWith('data:')) return null;
  const m = value.match(/^data:([A-Za-z\-+/]+);base64,(.+)$/);
  if (!m) return null;
  return { buffer: Buffer.from(m[2], 'base64'), mime: m[1] || 'image/jpeg' };
}

function normalizeFotos(input: any): { buffer: Buffer; mime: string }[] {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  const out: { buffer: Buffer; mime: string }[] = [];
  for (const item of list) {
    const decoded = decodeDataUrl(item);
    if (decoded) out.push(decoded);
  }
  return out;
}

function insertFotos(seguimientoId: number, fotos: { buffer: Buffer; mime: string }[], ordenInicial = 0): number[] {
  const db = getDb();
  const ids: number[] = [];
  const insert = db.prepare(
    'INSERT INTO seguimiento_fotos (seguimiento_id, foto, mime, orden) VALUES (?, ?, ?, ?)'
  );
  const tx = db.transaction(() => {
    fotos.forEach((f, i) => {
      const r = insert.run(seguimientoId, f.buffer, f.mime, ordenInicial + i);
      ids.push(r.lastInsertRowid as number);
    });
  });
  tx();
  return ids;
}

// GET /api/lesiones/:lesionId/seguimientos — listar seguimientos de una lesión (con conteo de fotos)
router.get('/:lesionId/seguimientos', (req, res) => {
  const { lesionId } = req.params;
  const rows = all(
    'SELECT id, lesion_id, fecha, cambios, color, sintomas, tamano_mm, notas FROM seguimientos WHERE lesion_id = ? ORDER BY fecha DESC',
    [lesionId]
  );
  if (rows.length === 0) return res.json([]);

  const ids = rows.map((r: any) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const fotos = all(
    `SELECT id, seguimiento_id, orden FROM seguimiento_fotos WHERE seguimiento_id IN (${placeholders}) ORDER BY orden ASC, id ASC`,
    ids
  );
  const bySeg = new Map<number, { id: number; orden: number }[]>();
  for (const f of fotos) {
    const arr = bySeg.get(f.seguimiento_id) || [];
    arr.push({ id: f.id, orden: f.orden });
    bySeg.set(f.seguimiento_id, arr);
  }
  const result = rows.map((r: any) => {
    const segFotos = bySeg.get(r.id) || [];
    return { ...r, fotos: segFotos, foto_count: segFotos.length };
  });
  res.json(result);
});

// POST /api/lesiones/:lesionId/seguimientos — crear seguimiento con una o varias fotos
router.post('/:lesionId/seguimientos', (req, res) => {
  const { lesionId } = req.params;
  const { fecha, cambios, color, sintomas, tamano_mm, notas, foto, fotos } = req.body;

  if (!cambios || !color || !sintomas) {
    return res.status(400).json({ error: 'cambios, color y sintomas son requeridos' });
  }

  const decoded = normalizeFotos(Array.isArray(fotos) && fotos.length ? fotos : foto);
  if (decoded.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos una fotografía' });
  }

  const db = getDb();
  const ids: number[] = [];
  const tx = db.transaction(() => {
    const tamano = tamano_mm !== undefined && tamano_mm !== null && tamano_mm !== ''
      ? Number(tamano_mm) : null;
    const result = run(
      `INSERT INTO seguimientos (lesion_id, fecha, cambios, color, sintomas, tamano_mm, notas, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [lesionId, fecha || new Date().toISOString(), cambios, color, sintomas, Number.isFinite(tamano) ? tamano : null, notas || null, decoded[0].buffer]
    );
    const seguimientoId = result.lastInsertRowid as number;
    ids.push(...insertFotos(seguimientoId, decoded));
    return seguimientoId;
  });
  const seguimientoId = tx() as number;

  res.status(201).json({ id: seguimientoId, foto_ids: ids, foto_count: decoded.length });
});

// GET /api/lesiones/:lesionId/seguimientos/:seguimientoId/fotos — listar fotos (sin blob)
router.get('/:lesionId/seguimientos/:seguimientoId/fotos', (req, res) => {
  const { seguimientoId } = req.params;
  const rows = all(
    'SELECT id, orden, mime, creado_en FROM seguimiento_fotos WHERE seguimiento_id = ? ORDER BY orden ASC, id ASC',
    [seguimientoId]
  );
  res.json(rows);
});

// POST /api/lesiones/:lesionId/seguimientos/:seguimientoId/fotos — agregar fotos a un seguimiento existente
router.post('/:lesionId/seguimientos/:seguimientoId/fotos', (req, res) => {
  const { seguimientoId } = req.params;
  const seg = get('SELECT id FROM seguimientos WHERE id = ?', [seguimientoId]);
  if (!seg) {
    return res.status(404).json({ error: 'Seguimiento no encontrado' });
  }

  const decoded = normalizeFotos(req.body.fotos ?? req.body.foto);
  if (decoded.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos una fotografía válida' });
  }

  const maxRow = get('SELECT COALESCE(MAX(orden), -1) AS max_orden FROM seguimiento_fotos WHERE seguimiento_id = ?', [seguimientoId]) as any;
  const ordenInicial = (maxRow?.max_orden ?? -1) + 1;
  const ids = insertFotos(Number(seguimientoId), decoded, ordenInicial);

  res.status(201).json({ ids, added: ids.length });
});

// GET /api/lesiones/:lesionId/seguimientos/:seguimientoId/fotos/:fotoId — servir una foto
router.get('/:lesionId/seguimientos/:seguimientoId/fotos/:fotoId', (req, res) => {
  const { fotoId } = req.params;
  const row = get('SELECT foto, mime FROM seguimiento_fotos WHERE id = ?', [fotoId]);
  if (!row || !row.foto) {
    return res.status(404).json({ error: 'Foto no encontrada' });
  }
  res.set('Content-Type', (row.mime as string) || 'image/jpeg');
  res.send(row.foto as Buffer);
});

// DELETE /api/lesiones/:lesionId/seguimientos/:seguimientoId/fotos/:fotoId — eliminar una foto
router.delete('/:lesionId/seguimientos/:seguimientoId/fotos/:fotoId', (req, res) => {
  const { fotoId, seguimientoId } = req.params;
  const row = get('SELECT id FROM seguimiento_fotos WHERE id = ? AND seguimiento_id = ?', [fotoId, seguimientoId]);
  if (!row) {
    return res.status(404).json({ error: 'Foto no encontrada' });
  }
  run('DELETE FROM seguimiento_fotos WHERE id = ?', [fotoId]);
  res.json({ success: true });
});

// GET /api/lesiones/:lesionId/seguimientos/:seguimientoId/foto — servir foto principal (compatibilidad)
router.get('/:lesionId/seguimientos/:seguimientoId/foto', (req, res) => {
  const { seguimientoId } = req.params;
  const seg = get('SELECT foto FROM seguimientos WHERE id = ?', [seguimientoId]);
  if (!seg || !seg.foto) {
    return res.status(404).json({ error: 'Foto no encontrada' });
  }
  const blob = seg.foto as Buffer;
  res.set('Content-Type', 'image/jpeg');
  res.send(blob);
});

export default router;
