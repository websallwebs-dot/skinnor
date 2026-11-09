import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

// GET /api/codigos-acceso — listar códigos del profesional (?profesional_id=)
router.get('/', (req, res) => {
  const { profesional_id } = req.query;
  let sql = 'SELECT * FROM codigos_acceso WHERE 1=1';
  const params: any[] = [];
  if (profesional_id) {
    sql += ' AND profesional_id = ?';
    params.push(profesional_id);
  }
  sql += ' ORDER BY creado_en DESC';
  const rows = all(sql, params);
  res.json(rows);
});

// POST /api/codigos-acceso — generar código de acceso
router.post('/', (req, res) => {
  const { profesional_id, expira_en, usos_maximos } = req.body;
  if (!profesional_id) {
    return res.status(400).json({ error: 'profesional_id requerido' });
  }
  const codigo = `SK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const result = run(
    'INSERT INTO codigos_acceso (codigo, profesional_id, expira_en, usos_maximos) VALUES (?, ?, ?, ?)',
    [codigo, profesional_id, expira_en || null, usos_maximos || null]
  );
  res.status(201).json({ id: result.lastInsertRowid, codigo });
});

export default router;
