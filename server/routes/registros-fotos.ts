import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

// GET /api/registros-fotos — listar registros dermatoscópicos profesionales
router.get('/', (req, res) => {
  const { paciente_id, profesional_id, tag, limit = 50 } = req.query;
  let sql = 'SELECT * FROM registros_fotos WHERE 1=1';
  const params: any[] = [];
  if (paciente_id) {
    sql += ' AND paciente_id = ?';
    params.push(paciente_id);
  }
  if (profesional_id) {
    sql += ' AND profesional_id = ?';
    params.push(profesional_id);
  }
  if (tag) {
    sql += ' AND tag = ?';
    params.push(tag);
  }
  sql += ' ORDER BY fecha DESC LIMIT ?';
  params.push(Number(limit));
  const rows = all(sql, params);
  res.json(rows);
});

// POST /api/registros-fotos — crear registro dermatoscópico
router.post('/', (req, res) => {
  const {
    tag, fecha, full_date, tipo, aumento, lesion, ubicacion,
    diametro, area, score_tds, asimetria, bordes, color, estado,
    estado_color, autor, calidad, dispositivo, roi, color_tonos,
    hallazgos, svg_hue, preview_url, lesion_id, paciente_id, profesional_id
  } = req.body;
  if (!tag || !fecha) {
    return res.status(400).json({ error: 'tag y fecha son requeridos' });
  }
  const result = run(
    `INSERT INTO registros_fotos (tag, fecha, full_date, tipo, aumento, lesion, ubicacion, diametro, area, score_tds, asimetria, bordes, color, estado, estado_color, autor, calidad, dispositivo, roi, color_tonos, hallazgos, svg_hue, preview_url, lesion_id, paciente_id, profesional_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tag, fecha, full_date || null, tipo || null, aumento || null, lesion || null, ubicacion || null,
     diametro || null, area || null, score_tds || null, asimetria || null, bordes || null, color || null,
     estado || null, estado_color || null, autor || null, calidad || null, dispositivo || null, roi || null,
     color_tonos || null, hallazgos || null, svg_hue || null, preview_url || null,
     lesion_id || null, paciente_id || null, profesional_id || null]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// GET /api/registros-fotos/:id — detalle
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const row = get('SELECT * FROM registros_fotos WHERE id = ?', [id]);
  if (!row) {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }
  res.json(row);
});

export default router;
