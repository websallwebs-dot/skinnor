import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

function parsePerfilSalud(row: any) {
  if (!row) return row;
  if (row.perfil_salud && typeof row.perfil_salud === 'string') {
    try {
      row.perfil_salud = JSON.parse(row.perfil_salud);
    } catch {
      row.perfil_salud = null;
    }
  }
  return row;
}

// GET /api/pacientes/me — obtener perfil del paciente vinculado al usuario logueado
router.get('/me', (req, res) => {
  const { usuario_id } = req.query;
  if (!usuario_id) {
    return res.status(400).json({ error: 'usuario_id requerido' });
  }
  const paciente = get('SELECT * FROM pacientes WHERE usuario_id = ?', [usuario_id]);
  if (!paciente) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }
  const user = get('SELECT id, email, nombre, rol, tenant_id FROM usuarios WHERE id = ?', [usuario_id]);
  res.json({ ...parsePerfilSalud(paciente), usuario: user });
});

// PUT /api/pacientes/me — actualizar perfil del paciente y sus datos de usuario
router.put('/me', (req, res) => {
  const { usuario_id } = req.query;
  const { nombre, email, fecha_nacimiento, sexo, telefono, perfil_salud } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: 'usuario_id requerido' });
  }

  const user = get('SELECT id, rol FROM usuarios WHERE id = ?', [usuario_id]);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  if (user.rol !== 'paciente') {
    return res.status(400).json({ error: 'Este endpoint es solo para usuarios con rol paciente' });
  }

  if (nombre !== undefined) {
    run('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, usuario_id]);
  }
  if (email !== undefined) {
    run('UPDATE usuarios SET email = ? WHERE id = ?', [email, usuario_id]);
  }

  const paciente = get('SELECT id FROM pacientes WHERE usuario_id = ?', [usuario_id]);
  const perfilSaludStr = perfil_salud !== undefined ? JSON.stringify(perfil_salud) : undefined;
  if (paciente) {
    if (fecha_nacimiento !== undefined) {
      run('UPDATE pacientes SET fecha_nacimiento = ? WHERE usuario_id = ?', [fecha_nacimiento, usuario_id]);
    }
    if (sexo !== undefined) {
      run('UPDATE pacientes SET sexo = ? WHERE usuario_id = ?', [sexo, usuario_id]);
    }
    if (telefono !== undefined) {
      run('UPDATE pacientes SET telefono = ? WHERE usuario_id = ?', [telefono, usuario_id]);
    }
    if (perfilSaludStr !== undefined) {
      run('UPDATE pacientes SET perfil_salud = ? WHERE usuario_id = ?', [perfilSaludStr, usuario_id]);
    }
  } else {
    run(
      'INSERT INTO pacientes (usuario_id, fecha_nacimiento, sexo, telefono, perfil_salud) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, fecha_nacimiento || null, sexo || null, telefono || null, perfilSaludStr || null]
    );
  }

  const updatedPaciente = get('SELECT * FROM pacientes WHERE usuario_id = ?', [usuario_id]);
  const updatedUser = get('SELECT id, email, nombre, rol, tenant_id FROM usuarios WHERE id = ?', [usuario_id]);
  res.json({ ...parsePerfilSalud(updatedPaciente), usuario: updatedUser });
});

// GET /api/pacientes/:id — detalle de un paciente (para profesional)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const paciente = get(
    `SELECT p.*, u.email, u.nombre as usuario_nombre, u.rol, u.tenant_id
     FROM pacientes p
     JOIN usuarios u ON p.usuario_id = u.id
     WHERE p.id = ?`,
    [id]
  );
  if (!paciente) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }
  res.json(parsePerfilSalud(paciente));
});

// POST /api/pacientes — crear un nuevo paciente y vincularlo con un profesional
router.post('/', (req, res) => {
  const { profesional_id, email, nombre, fecha_nacimiento, sexo, telefono, password_hash } = req.body;

  if (!profesional_id || !email || !nombre) {
    return res.status(400).json({ error: 'profesional_id, email y nombre son requeridos' });
  }

  // Verificar que el profesional existe
  const profesional = get('SELECT id FROM usuarios WHERE id = ? AND rol = ?', [profesional_id, 'profesional']);
  if (!profesional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  // Verificar que el email no exista ya
  const existing = get('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hash = password_hash || '$2b$10$placeholder.hash.for.development.only';

  // Crear el usuario paciente
  const userResult = run(
    `INSERT INTO usuarios (email, password_hash, nombre, rol, activo)
     VALUES (?, ?, ?, 'paciente', 1)`,
    [email, hash, nombre]
  );
  const usuarioId = userResult.lastInsertRowid as number;

  // Crear la fila en pacientes
  const pacienteResult = run(
    `INSERT INTO pacientes (usuario_id, fecha_nacimiento, sexo, telefono)
     VALUES (?, ?, ?, ?)`,
    [usuarioId, fecha_nacimiento || null, sexo || null, telefono || null]
  );
  const pacienteRowId = pacienteResult.lastInsertRowid as number;

  // Generar un código de acceso para el profesional
  const codigo = `SK-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10000).toString(36).toUpperCase()}`;
  const codigoResult = run(
    `INSERT INTO codigos_acceso (codigo, profesional_id, activo, usos_maximos, usos_actuales)
     VALUES (?, ?, 1, 1, 0)`,
    [codigo, profesional_id]
  );
  const codigoId = codigoResult.lastInsertRowid as number;

  // Crear la vinculación paciente-profesional
  run(
    `INSERT INTO vinculaciones (paciente_id, profesional_id, codigo_acceso_id)
     VALUES (?, ?, ?)`,
    [pacienteRowId, profesional_id, codigoId]
  );

  const paciente = get('SELECT * FROM pacientes WHERE usuario_id = ?', [usuarioId]);
  const user = get('SELECT id, email, nombre, rol, tenant_id FROM usuarios WHERE id = ?', [usuarioId]);

  res.status(201).json({
    ...paciente,
    usuario: user,
    codigo_acceso: codigo,
  });
});

// GET /api/pacientes — listar (para profesionales con vinculaciones)
router.get('/', (req, res) => {
  const { profesional_id } = req.query;
  let sql = `
    SELECT p.*, u.email, u.nombre as usuario_nombre, u.rol
    FROM pacientes p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (profesional_id) {
    sql += `
      AND p.id IN (
        SELECT v.paciente_id FROM vinculaciones v WHERE v.profesional_id = ?
      )
    `;
    params.push(profesional_id);
  }
  sql += ' ORDER BY p.creado_en DESC';
  const rows = all(sql, params);
  res.json(rows);
});

export default router;
