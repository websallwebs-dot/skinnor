import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

function parseArray(value: any): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [value];
    }
  }
  return [];
}

function serializeLesion(row: any) {
  return { ...row, colores: parseArray(row.colores), sintomas: parseArray(row.sintomas) };
}

const LESION_COLUMNS = `l.id, l.paciente_id, l.nombre, l.zona, l.ubicacion, l.tamaño, l.colores, l.sintomas, l.creado_en,
           p.usuario_id, u.email as paciente_email`;

// GET /api/lesiones — listar (opcional ?paciente_id=, ?search=)
router.get('/', (req, res) => {
  const { paciente_id, search } = req.query;
  let resolvedPacienteId: number | undefined = undefined;

  if (paciente_id) {
    // Resolver usuarios.id → pacientes.id si es necesario
    const pacienteRow = get('SELECT id FROM pacientes WHERE usuario_id = ?', [paciente_id]);
    if (pacienteRow) {
      resolvedPacienteId = pacienteRow.id;
    } else {
      // Puede que ya sea pacientes.id directamente
      resolvedPacienteId = Number(paciente_id);
    }
  }

  let sql = `
    SELECT ${LESION_COLUMNS}
    FROM lesiones l
    JOIN pacientes p ON l.paciente_id = p.id
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (resolvedPacienteId !== undefined) {
    sql += ' AND l.paciente_id = ?';
    params.push(resolvedPacienteId);
  }
  if (search) {
    sql += ' AND (l.nombre LIKE ? OR l.ubicacion LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY l.creado_en DESC';
  const rows = all(sql, params);
  res.json(rows.map(serializeLesion));
});

// GET /api/lesiones/:id — detalle
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const lesion = get(
    `SELECT ${LESION_COLUMNS}
     FROM lesiones l
     JOIN pacientes p ON l.paciente_id = p.id
     JOIN usuarios u ON p.usuario_id = u.id
     WHERE l.id = ?`,
    [id]
  );
  if (!lesion) {
    return res.status(404).json({ error: 'Lesión no encontrada' });
  }
  res.json(serializeLesion(lesion));
});

// GET /api/lesiones/:id/foto — servir foto base como imagen
router.get('/:id/foto', (req, res) => {
  const { id } = req.params;
  const lesion = get('SELECT foto_base FROM lesiones WHERE id = ?', [id]);
  if (!lesion || !lesion.foto_base) {
    return res.status(404).json({ error: 'Foto no encontrada' });
  }
  const blob = lesion.foto_base as Buffer;
  res.set('Content-Type', 'image/jpeg');
  res.send(blob);
});

// POST /api/lesiones — crear lesión con foto BLOB
router.post('/', (req, res) => {
  const { paciente_id, nombre, zona, ubicacion, tamaño, colores, sintomas, creado_en } = req.body;
  const fotoBase = req.body.foto_base; // base64 o buffer

  if (!paciente_id || !nombre || !zona) {
    return res.status(400).json({ error: 'paciente_id, nombre y zona son requeridos' });
  }

  // Resolver pacientes.id a partir de usuarios.id (el frontend envía usuarios.id)
  const pacienteRow = get('SELECT id FROM pacientes WHERE usuario_id = ?', [paciente_id]);
  if (!pacienteRow) {
    return res.status(400).json({ error: 'No se encontró paciente para ese usuario' });
  }
  const resolvedPacienteId = pacienteRow.id;

  let fotoBuffer: Buffer | null = null;
  if (fotoBase) {
    if (typeof fotoBase === 'string' && fotoBase.startsWith('data:')) {
      const matches = fotoBase.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        fotoBuffer = Buffer.from(matches[2], 'base64');
      }
    } else if (Buffer.isBuffer(fotoBase)) {
      fotoBuffer = Buffer.from(fotoBase);
    }
  }

  if (!fotoBuffer) {
    return res.status(400).json({ error: 'Foto base requerida' });
  }

  const coloresStr = Array.isArray(colores) ? JSON.stringify(colores) : colores || null;
  const sintomasStr = Array.isArray(sintomas) ? JSON.stringify(sintomas) : sintomas || null;

  const result = run(
    `INSERT INTO lesiones (paciente_id, nombre, zona, ubicacion, tamaño, colores, sintomas, creado_en, foto_base)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [resolvedPacienteId, nombre, zona, ubicacion || null, tamaño || null, coloresStr, sintomasStr, creado_en || new Date().toISOString(), fotoBuffer]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/lesiones/:id — actualizar
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, zona, ubicacion, tamaño, colores, sintomas } = req.body;
  const lesion = get('SELECT id FROM lesiones WHERE id = ?', [id]);
  if (!lesion) {
    return res.status(404).json({ error: 'Lesión no encontrada' });
  }
  const coloresStr = Array.isArray(colores) ? JSON.stringify(colores) : colores;
  const sintomasStr = Array.isArray(sintomas) ? JSON.stringify(sintomas) : sintomas;
  run(
    `UPDATE lesiones SET nombre = COALESCE(?, nombre), zona = COALESCE(?, zona),
     ubicacion = COALESCE(?, ubicacion), tamaño = COALESCE(?, tamaño),
     colores = COALESCE(?, colores), sintomas = COALESCE(?, sintomas),
     actualizado_en = datetime('now') WHERE id = ?`,
    [nombre, zona, ubicacion, tamaño, coloresStr, sintomasStr, id]
  );
  res.json({ success: true });
});

// DELETE /api/lesiones/:id — eliminar (cascade a seguimientos via FK)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const lesion = get('SELECT id FROM lesiones WHERE id = ?', [id]);
  if (!lesion) {
    return res.status(404).json({ error: 'Lesión no encontrada' });
  }
  run('DELETE FROM lesiones WHERE id = ?', [id]);
  res.json({ success: true });
});

export default router;
