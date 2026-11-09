import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

// GET /api/consultas — listar consultas (filtra por ?paciente_id= o ?profesional_id=)
router.get('/', (req, res) => {
  const { paciente_id, profesional_id } = req.query;
  let sql = `
    SELECT c.*, up.nombre as paciente_nombre, u.nombre as profesional_nombre
    FROM consultas c
    JOIN pacientes p ON c.paciente_id = p.id
    JOIN usuarios up ON p.usuario_id = up.id
    JOIN usuarios u ON c.profesional_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (paciente_id) {
    sql += ' AND c.paciente_id = ?';
    params.push(paciente_id);
  }
  if (profesional_id) {
    sql += ' AND c.profesional_id = ?';
    params.push(profesional_id);
  }
  sql += ' ORDER BY c.actualizado_en DESC';
  const rows = all(sql, params);
  res.json(rows);
});

// GET /api/consultas/:id — detalle de una consulta
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const consulta = get(
    `SELECT c.*, up.nombre as paciente_nombre, u.nombre as profesional_nombre
     FROM consultas c
     JOIN pacientes p ON c.paciente_id = p.id
     JOIN usuarios up ON p.usuario_id = up.id
     JOIN usuarios u ON c.profesional_id = u.id
     WHERE c.id = ?`,
    [id]
  );
  if (!consulta) {
    return res.status(404).json({ error: 'Consulta no encontrada' });
  }
  res.json(consulta);
});

// GET /api/consultas/:id/mensajes — listar mensajes de una consulta
router.get('/:id/mensajes', (req, res) => {
  const { id } = req.params;
  const rows = all(
    `SELECT m.*, u.nombre as remitente_nombre, u.email as remitente_email
     FROM mensajes_consulta m
     JOIN usuarios u ON m.remitente_id = u.id
     WHERE m.consulta_id = ?
     ORDER BY m.creado_en ASC`,
    [id]
  );
  res.json(rows);
});

// POST /api/consultas — crear una nueva consulta (paciente -> profesional)
router.post('/', (req, res) => {
  const { paciente_id, profesional_id, tema } = req.body;

  if (!paciente_id || !profesional_id || !tema) {
    return res.status(400).json({ error: 'paciente_id, profesional_id y tema son requeridos' });
  }

  // Verificar que existe la vinculacion paciente-profesional
  const vinculacion = get(
    'SELECT id FROM vinculaciones WHERE paciente_id = ? AND profesional_id = ?',
    [paciente_id, profesional_id]
  );
  if (!vinculacion) {
    return res.status(403).json({ error: 'No existe una vinculacion entre este paciente y profesional' });
  }

  const result = run(
    `INSERT INTO consultas (paciente_id, profesional_id, tema, estado, creado_en, actualizado_en)
     VALUES (?, ?, ?, 'pendiente', datetime('now'), datetime('now'))`,
    [paciente_id, profesional_id, tema]
  );
  const consultaId = result.lastInsertRowid as number;

  res.status(201).json({ id: consultaId, estado: 'pendiente', tema });
});

// POST /api/consultas/:id/mensajes — enviar un mensaje dentro de una consulta
router.post('/:id/mensajes', (req, res) => {
  const { id } = req.params;
  const { remitente_id, remitente_tipo, contenido } = req.body;

  if (!remitente_id || !remitente_tipo || !contenido) {
    return res.status(400).json({ error: 'remitente_id, remitente_tipo y contenido son requeridos' });
  }

  const consulta = get('SELECT id FROM consultas WHERE id = ?', [id]);
  if (!consulta) {
    return res.status(404).json({ error: 'Consulta no encontrada' });
  }

  const result = run(
    `INSERT INTO mensajes_consulta (consulta_id, remitente_id, remitente_tipo, contenido, leido, creado_en)
     VALUES (?, ?, ?, ?, 0, datetime('now'))`,
    [id, remitente_id, remitente_tipo, contenido]
  );
  const mensajeId = result.lastInsertRowid as number;

  // Actualizar fecha de actualizacion de la consulta
  run("UPDATE consultas SET actualizado_en = datetime('now') WHERE id = ?", [id]);

  res.status(201).json({ id: mensajeId, consultaId: id, contenido, creado_en: new Date().toISOString() });
});

// PUT /api/consultas/:id/estado — cambiar estado de una consulta
router.put('/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado || !['pendiente', 'resuelto', 'cerrado'].includes(estado)) {
    return res.status(400).json({ error: 'estado debe ser pendiente, resuelto o cerrado' });
  }

  const consulta = get('SELECT id FROM consultas WHERE id = ?', [id]);
  if (!consulta) {
    return res.status(404).json({ error: 'Consulta no encontrada' });
  }

  run("UPDATE consultas SET estado = ?, actualizado_en = datetime('now') WHERE id = ?", [estado, id]);
  res.json({ success: true, estado });
});

export default router;
