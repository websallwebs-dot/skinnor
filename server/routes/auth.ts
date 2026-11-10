import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

// Helper: asegurar usuario existe (modo desarrollo)
function ensureUser(email: string, rol: string, nombre: string, tenant_id: number | null) {
  let user = get('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (!user) {
    const hash = '$2b$10$placeholder.hash.for.development.only';
    const result = run(
      'INSERT INTO usuarios (email, password_hash, nombre, rol, tenant_id, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [email, hash, nombre, rol, tenant_id]
    );
    const userId = result.lastInsertRowid as number;
    if (rol === 'paciente') {
      run('INSERT OR IGNORE INTO pacientes (usuario_id) VALUES (?)', [userId]);
    }
    user = get('SELECT * FROM usuarios WHERE id = ?', [userId]);
  }
  return user;
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password, rol = 'patient' } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }
  // Modo desarrollo: crear usuario automáticamente si no existe
  const roleMap: Record<string, string> = {
    patient: 'paciente',
    professional: 'profesional',
    clinic_admin: 'clinic_admin',
    super_admin: 'super_admin',
  };
  const dbRol = roleMap[rol] || 'paciente';
  const nombreMap: Record<string, string> = {
    patient: 'Paciente',
    professional: 'Profesional',
    clinic_admin: 'Admin Clínica',
    super_admin: 'Super Admin',
  };
  const user = ensureUser(email, dbRol, nombreMap[rol] || 'Usuario', null);
  const { password_hash, ...userWithoutHash } = user;
  res.json({
    user: {
      id: userWithoutHash.id,
      email: userWithoutHash.email,
      nombre: userWithoutHash.nombre,
      rol: userWithoutHash.rol,
      tenantId: userWithoutHash.tenant_id,
    },
    token: `dev-token-${userWithoutHash.id}`,
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, nombre, rol = 'paciente', tenant_id } = req.body;
  if (!email || !nombre) {
    return res.status(400).json({ error: 'Email y nombre requeridos' });
  }
  const roleMap: Record<string, string> = {
    patient: 'paciente',
    paciente: 'paciente',
    professional: 'profesional',
    profesional: 'profesional',
    clinic_admin: 'clinic_admin',
    super_admin: 'super_admin',
  };
  const dbRol = roleMap[rol] || 'paciente';
  const existing = get('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }
  const hash = '$2b$10$placeholder.hash.for.development.only';
  const result = run(
    'INSERT INTO usuarios (email, password_hash, nombre, rol, tenant_id, activo) VALUES (?, ?, ?, ?, ?, 1)',
    [email, hash, nombre, dbRol, tenant_id || null]
  );
  const userId = result.lastInsertRowid as number;
  if (dbRol === 'paciente') {
    run('INSERT OR IGNORE INTO pacientes (usuario_id) VALUES (?)', [userId]);
  }
  res.status(201).json({
    user: { id: userId, email, nombre, rol: dbRol, tenantId: tenant_id || null },
    token: `dev-token-${userId}`,
  });
});

export default router;
