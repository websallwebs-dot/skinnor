import { Router } from 'express';
import { run, get, all } from '../db';

const router = Router();

function parseJsonFields(row: any) {
  if (!row) return row;
  for (const key of ['perfil', 'clinica', 'preferencias'] as const) {
    if (row[key] && typeof row[key] === 'string') {
      try {
        row[key] = JSON.parse(row[key]);
      } catch {
        row[key] = null;
      }
    }
  }
  return row;
}

// GET /api/profesionales/me — configuración del profesional logueado
router.get('/me', (req, res) => {
  const { usuario_id } = req.query;
  if (!usuario_id) {
    return res.status(400).json({ error: 'usuario_id requerido' });
  }
  const config = get('SELECT * FROM profesional_config WHERE usuario_id = ?', [usuario_id]);
  const user = get('SELECT id, email, nombre, rol, tenant_id FROM usuarios WHERE id = ?', [usuario_id]);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ ...(parseJsonFields(config) || {}), usuario: user });
});

// PUT /api/profesionales/me — guardar secciones de configuración (upsert)
router.put('/me', (req, res) => {
  const { usuario_id } = req.query;
  if (!usuario_id) {
    return res.status(400).json({ error: 'usuario_id requerido' });
  }
  const { perfil, clinica, preferencias } = req.body;

  const existing = get('SELECT usuario_id FROM profesional_config WHERE usuario_id = ?', [usuario_id]);
  const toJson = (v: any) => (v === undefined ? null : JSON.stringify(v ?? null));

  if (existing) {
    run(
      `UPDATE profesional_config SET
        perfil = COALESCE(?, perfil),
        clinica = COALESCE(?, clinica),
        preferencias = COALESCE(?, preferencias),
        actualizado_en = datetime('now')
       WHERE usuario_id = ?`,
      [toJson(perfil), toJson(clinica), toJson(preferencias), usuario_id]
    );
  } else {
    run(
      'INSERT INTO profesional_config (usuario_id, perfil, clinica, preferencias) VALUES (?, ?, ?, ?)',
      [usuario_id, toJson(perfil) ?? null, toJson(clinica) ?? null, toJson(preferencias) ?? null]
    );
  }

  // Mantener sincronizado el nombre visible en el resto de la app
  const nuevoNombre = perfil && typeof perfil === 'object' ? (perfil as any).nombre : undefined;
  if (nuevoNombre) {
    run('UPDATE usuarios SET nombre = ? WHERE id = ?', [nuevoNombre, usuario_id]);
  }

  const updated = get('SELECT * FROM profesional_config WHERE usuario_id = ?', [usuario_id]);
  const user = get('SELECT id, email, nombre, rol, tenant_id FROM usuarios WHERE id = ?', [usuario_id]);
  res.json({ ...(parseJsonFields(updated) || {}), usuario: user });
});

// GET /api/profesionales/:id/alertas — alertas clínicas calculadas desde datos reales
router.get('/:id/alertas', (req, res) => {
  const profesionalId = Number(req.params.id);
  if (!profesionalId) return res.status(400).json({ error: 'id inválido' });

  const descartadas = new Set(
    (all('SELECT alerta_key FROM alertas_descartadas WHERE profesional_id = ?', [profesionalId]) as { alerta_key: string }[])
      .map(r => r.alerta_key)
  );
  const incluir = req.query.incluir_descartadas === '1';

  const alertas: any[] = [];
  const push = (a: any) => {
    a.descartada = descartadas.has(a.key);
    if (incluir || !a.descartada) alertas.push(a);
  };

  // 1) Seguimientos con cambios o síntomas reportados (últimos 90 días)
  const segs = all(
    `SELECT s.id AS seguimiento_id, s.fecha, s.cambios, s.sintomas, s.notas,
            l.id AS lesion_id, l.nombre AS lesion_nombre,
            p.id AS paciente_id, u.id AS paciente_usuario_id, u.nombre AS paciente_nombre
     FROM seguimientos s
     JOIN lesiones l ON s.lesion_id = l.id
     JOIN pacientes p ON l.paciente_id = p.id
     JOIN usuarios u ON p.usuario_id = u.id
     JOIN vinculaciones v ON v.paciente_id = p.id AND v.profesional_id = ?
     WHERE s.fecha >= datetime('now', '-90 days')
       AND (s.cambios = 'si' OR s.sintomas = 'si')
     ORDER BY s.fecha DESC`,
    [profesionalId]
  ) as any[];

  for (const s of segs) {
    const alto = s.cambios === 'si' && s.sintomas === 'si';
    const partes: string[] = [];
    if (s.cambios === 'si') partes.push('cambios visuales reportados');
    if (s.sintomas === 'si') partes.push('síntomas reportados');
    push({
      key: `seg:${s.seguimiento_id}`,
      tipo: 'Evolución reportada',
      riesgo: alto ? 'alto' : 'medio',
      paciente_id: s.paciente_id,
      paciente_usuario_id: s.paciente_usuario_id,
      paciente_nombre: s.paciente_nombre,
      lesion_id: s.lesion_id,
      lesion_nombre: s.lesion_nombre,
      mensaje: `${s.paciente_nombre} reportó ${partes.join(' y ')} en "${s.lesion_nombre}"${s.notas ? ` — ${s.notas}` : '.'}`,
      fecha: s.fecha,
    });
  }

  // 2) Consultas pendientes del profesional
  const consultas = all(
    `SELECT c.id, c.tema, c.creado_en, c.actualizado_en,
            p.id AS paciente_id, u.id AS paciente_usuario_id, u.nombre AS paciente_nombre
     FROM consultas c
     JOIN pacientes p ON c.paciente_id = p.id
     JOIN usuarios u ON p.usuario_id = u.id
     WHERE c.profesional_id = ? AND c.estado = 'pendiente'
     ORDER BY c.actualizado_en DESC`,
    [profesionalId]
  ) as any[];

  for (const c of consultas) {
    push({
      key: `consulta:${c.id}`,
      tipo: 'Consulta pendiente',
      riesgo: 'bajo',
      paciente_id: c.paciente_id,
      paciente_usuario_id: c.paciente_usuario_id,
      paciente_nombre: c.paciente_nombre,
      lesion_id: null,
      lesion_nombre: null,
      mensaje: `Consulta sin responder: "${c.tema}" de ${c.paciente_nombre}.`,
      fecha: c.actualizado_en || c.creado_en,
    });
  }

  // 3) Lesiones sin seguimiento reciente (>30 días) o sin ningún seguimiento
  const lesiones = all(
    `SELECT l.id, l.nombre, l.creado_en,
            p.id AS paciente_id, u.id AS paciente_usuario_id, u.nombre AS paciente_nombre,
            (SELECT MAX(s.fecha) FROM seguimientos s WHERE s.lesion_id = l.id) AS ultima_fecha
     FROM lesiones l
     JOIN pacientes p ON l.paciente_id = p.id
     JOIN usuarios u ON p.usuario_id = u.id
     JOIN vinculaciones v ON v.paciente_id = p.id AND v.profesional_id = ?`,
    [profesionalId]
  ) as any[];

  const now = Date.now();
  for (const l of lesiones) {
    const ultima = l.ultima_fecha ? new Date(l.ultima_fecha).getTime() : null;
    const dias = ultima ? Math.floor((now - ultima) / 86400000) : Math.floor((now - new Date(l.creado_en).getTime()) / 86400000);
    if (ultima && dias <= 30) continue;
    if (!ultima && dias <= 14) continue;
    const riesgo = dias > 90 ? 'medio' : 'bajo';
    push({
      key: `sinseg:${l.id}`,
      tipo: ultima ? 'Sin seguimiento reciente' : 'Lesión sin registros',
      riesgo,
      paciente_id: l.paciente_id,
      paciente_usuario_id: l.paciente_usuario_id,
      paciente_nombre: l.paciente_nombre,
      lesion_id: l.id,
      lesion_nombre: l.nombre,
      mensaje: ultima
        ? `${l.paciente_nombre} no registra "${l.nombre}" hace ${dias} días.`
        : `${l.paciente_nombre} tiene "${l.nombre}" registrada sin ninguna foto de seguimiento.`,
      fecha: l.ultima_fecha || l.creado_en,
    });
  }

  alertas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  res.json({
    alertas,
    resumen: {
      total: alertas.filter(a => !a.descartada).length,
      alto: alertas.filter(a => !a.descartada && a.riesgo === 'alto').length,
      medio: alertas.filter(a => !a.descartada && a.riesgo === 'medio').length,
      bajo: alertas.filter(a => !a.descartada && a.riesgo === 'bajo').length,
      descartadas: alertas.filter(a => a.descartada).length,
    },
  });
});

// POST /api/profesionales/:id/alertas/descartar — descartar una alerta {key}
router.post('/:id/alertas/descartar', (req, res) => {
  const profesionalId = Number(req.params.id);
  const { key } = req.body || {};
  if (!profesionalId || !key) return res.status(400).json({ error: 'id y key requeridos' });
  run(
    'INSERT OR IGNORE INTO alertas_descartadas (profesional_id, alerta_key) VALUES (?, ?)',
    [profesionalId, key]
  );
  res.json({ ok: true });
});

// DELETE /api/profesionales/:id/alertas/descartar/:key — restaurar alerta
router.delete('/:id/alertas/descartar/:key', (req, res) => {
  const profesionalId = Number(req.params.id);
  run('DELETE FROM alertas_descartadas WHERE profesional_id = ? AND alerta_key = ?', [profesionalId, req.params.key]);
  res.json({ ok: true });
});

export default router;
