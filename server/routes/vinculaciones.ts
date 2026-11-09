import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

// GET /api/vinculaciones — listar (?profesional_id=, ?paciente_id=)
router.get('/', (req, res) => {
  const { profesional_id, paciente_id } = req.query;
  let sql = `
    SELECT v.*, p.usuario_id as paciente_usuario_id, u.email as paciente_email,
           prof.id as profesional_usuario_id, prof.email as profesional_email
    FROM vinculaciones v
    JOIN pacientes p ON v.paciente_id = p.id
    JOIN usuarios u ON p.usuario_id = u.id
    JOIN usuarios prof ON v.profesional_id = prof.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (profesional_id) {
    sql += ' AND v.profesional_id = ?';
    params.push(profesional_id);
  }
  if (paciente_id) {
    sql += ' AND v.paciente_id = ?';
    params.push(paciente_id);
  }
  sql += ' ORDER BY v.creado_en DESC';
  const rows = all(sql, params);
  res.json(rows);
});

// POST /api/vinculaciones — vincular paciente-profesional (por código de acceso o ids directos)
router.post('/', (req, res) => {
  let { paciente_id, profesional_id, codigo_acceso_id, codigo } = req.body;
  if (!paciente_id) {
    return res.status(400).json({ error: 'paciente_id requerido' });
  }

  // Si viene el código string, resolverlo a su fila (y derivar profesional_id)
  if (codigo && typeof codigo === 'string' && codigo.trim()) {
    const codigoRow = get(
      'SELECT * FROM codigos_acceso WHERE codigo = ? AND activo = 1',
      [codigo.trim().toUpperCase()]
    );
    if (!codigoRow) {
      return res.status(404).json({ error: 'Código de acceso inválido o inactivo' });
    }
    if (codigoRow.expira_en && new Date(codigoRow.expira_en) < new Date()) {
      return res.status(403).json({ error: 'El código de acceso ha expirado' });
    }
    if (codigoRow.usos_maximos && codigoRow.usos_actuales >= codigoRow.usos_maximos) {
      return res.status(403).json({ error: 'Código de acceso agotado' });
    }
    profesional_id = codigoRow.profesional_id;
    codigo_acceso_id = codigoRow.id;
  }

  if (!profesional_id) {
    return res.status(400).json({ error: 'profesional_id o codigo requerido' });
  }

  // Verificar que el código de acceso existe y pertenece al profesional
  if (codigo_acceso_id) {
    const codigo = get('SELECT * FROM codigos_acceso WHERE id = ? AND profesional_id = ? AND activo = 1', [codigo_acceso_id, profesional_id]);
    if (!codigo) {
      return res.status(403).json({ error: 'Código de acceso inválido o no pertenece al profesional' });
    }
    // Incrementar usos
    if (codigo.usos_maximos && codigo.usos_actuales >= codigo.usos_maximos) {
      return res.status(403).json({ error: 'Código de acceso agotado' });
    }
    run('UPDATE codigos_acceso SET usos_actuales = usos_actuales + 1 WHERE id = ?', [codigo_acceso_id]);
  }

  // Verificar que no exista ya una vinculación
  const existing = get('SELECT id FROM vinculaciones WHERE paciente_id = ? AND profesional_id = ?', [paciente_id, profesional_id]);
  if (existing) {
    return res.status(409).json({ error: 'Ya existe una vinculación entre este paciente y profesional' });
  }

  const result = run(
    'INSERT INTO vinculaciones (paciente_id, profesional_id, codigo_acceso_id) VALUES (?, ?, ?)',
    [paciente_id, profesional_id, codigo_acceso_id || null]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
