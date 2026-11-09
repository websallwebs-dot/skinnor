import { Router } from 'express';
import { all, get } from '../db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// HAM10000 images directory (archivos estáticos, no BLOB)
// Prioridad: variable de entorno HAM_IMAGES_DIR, luego ruta de descargas del usuario
const HAM_IMAGES_DIR = process.env.HAM_IMAGES_DIR || 'C:\\Users\\munoz\\Downloads\\HAM10000';

// GET /api/ham10000 — listar con filtros y paginación
router.get('/', (req, res) => {
  const { dx, localization, sex, search, page = 1, limit = 12 } = req.query;
  let sql = 'SELECT * FROM ham_images WHERE 1=1';
  const params: any[] = [];

  if (dx) {
    sql += ' AND dx = ?';
    params.push(dx);
  }
  if (localization) {
    sql += ' AND localization = ?';
    params.push(localization);
  }
  if (sex) {
    sql += ' AND sex = ?';
    params.push(sex);
  }
  if (search) {
    sql += ' AND (lesion_id LIKE ? OR image_id LIKE ? OR dx LIKE ? OR localization LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  sql += ' ORDER BY image_id';
  const offset = (Number(page) - 1) * Number(limit);
  sql += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const rows = all(sql, params);

  // Contar total para paginación
  let countSql = 'SELECT COUNT(*) as total FROM ham_images WHERE 1=1';
  const countParams: any[] = [];
  if (dx) { countSql += ' AND dx = ?'; countParams.push(dx); }
  if (localization) { countSql += ' AND localization = ?'; countParams.push(localization); }
  if (sex) { countSql += ' AND sex = ?'; countParams.push(sex); }
  if (search) {
    countSql += ' AND (lesion_id LIKE ? OR image_id LIKE ? OR dx LIKE ? OR localization LIKE ?)';
    const like = `%${search}%`;
    countParams.push(like, like, like, like);
  }
  const totalRow = get(countSql, countParams);
  const total = totalRow.total as number;

  res.json({
    results: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// GET /api/ham10000/:image_id — detalle metadata
router.get('/:image_id', (req, res) => {
  const { image_id } = req.params;
  const row = get('SELECT * FROM ham_images WHERE image_id = ?', [image_id]);
  if (!row) {
    return res.status(404).json({ error: 'Imagen no encontrada' });
  }
  res.json(row);
});

// GET /api/ham10000/:image_id/image — servir imagen JPG desde carpeta estática
router.get('/:image_id/image', (req, res) => {
  const { image_id } = req.params;
  // Buscar en part_1 y part_2
  for (const part of ['HAM10000_images_part_1', 'HAM10000_images_part_2']) {
    const imagePath = path.join(HAM_IMAGES_DIR, part, `${image_id}.jpg`);
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
      return;
    }
  }
  res.status(404).json({ error: 'Archivo de imagen no encontrado' });
});

export default router;
