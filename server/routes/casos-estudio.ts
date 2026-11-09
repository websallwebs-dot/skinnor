import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

// GET /api/casos-estudio — listar casos del profesional (?profesional_id=)
router.get('/', (req, res) => {
  const { profesional_id } = req.query;
  if (!profesional_id) {
    return res.status(400).json({ error: 'profesional_id requerido' });
  }
  const rows = all(
    `SELECT c.*,
            u.nombre AS paciente_nombre, u.email AS paciente_email,
            l.nombre AS lesion_nombre, l.zona AS lesion_zona,
            (SELECT COUNT(*) FROM seguimientos s WHERE s.lesion_id = c.lesion_id) AS seguimientos_count,
            (SELECT COUNT(*) FROM seguimiento_fotos sf
              JOIN seguimientos s2 ON sf.seguimiento_id = s2.id
              WHERE s2.lesion_id = c.lesion_id) AS fotos_count
     FROM casos_estudio c
     LEFT JOIN pacientes p ON c.paciente_id = p.id
     LEFT JOIN usuarios u ON p.usuario_id = u.id
     LEFT JOIN lesiones l ON c.lesion_id = l.id
     WHERE c.profesional_id = ?
     ORDER BY c.creado_en DESC`,
    [profesional_id]
  );
  res.json(rows);
});

// POST /api/casos-estudio — crear caso de estudio
router.post('/', (req, res) => {
  const {
    profesional_id, paciente_id, lesion_id, titulo,
    diagnostico, riesgo, etiquetas, descripcion, privado,
  } = req.body || {};

  if (!profesional_id) return res.status(400).json({ error: 'profesional_id requerido' });
  if (!titulo || !String(titulo).trim()) return res.status(400).json({ error: 'titulo requerido' });

  // Validar que la lesión pertenece al paciente si ambos vienen
  if (lesion_id && paciente_id) {
    const les = get('SELECT id FROM lesiones WHERE id = ? AND paciente_id = ?', [lesion_id, paciente_id]);
    if (!les) return res.status(400).json({ error: 'La lesión no pertenece al paciente indicado' });
  }

  const result = run(
    `INSERT INTO casos_estudio
       (profesional_id, paciente_id, lesion_id, titulo, diagnostico, riesgo, etiquetas, descripcion, privado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profesional_id,
      paciente_id || null,
      lesion_id || null,
      String(titulo).trim(),
      diagnostico || null,
      riesgo || null,
      etiquetas ? JSON.stringify(etiquetas) : null,
      descripcion || null,
      privado === false || privado === 0 ? 0 : 1,
    ]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// PATCH /api/casos-estudio/:id — actualizar (solo del profesional dueño)
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const caso = get('SELECT * FROM casos_estudio WHERE id = ?', [id]);
  if (!caso) return res.status(404).json({ error: 'Caso no encontrado' });

  const { profesional_id } = req.body || {};
  if (profesional_id && Number(profesional_id) !== caso.profesional_id) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const fields: string[] = [];
  const params: any[] = [];
  const map: Record<string, any> = {
    titulo: req.body.titulo,
    diagnostico: req.body.diagnostico,
    riesgo: req.body.riesgo,
    descripcion: req.body.descripcion,
    paciente_id: req.body.paciente_id,
    lesion_id: req.body.lesion_id,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) {
      fields.push(`${k} = ?`);
      params.push(v === '' ? null : v);
    }
  }
  if (req.body.etiquetas !== undefined) {
    fields.push('etiquetas = ?');
    params.push(req.body.etiquetas ? JSON.stringify(req.body.etiquetas) : null);
  }
  if (req.body.privado !== undefined) {
    fields.push('privado = ?');
    params.push(req.body.privado === false || req.body.privado === 0 ? 0 : 1);
  }
  if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

  params.push(id);
  run(`UPDATE casos_estudio SET ${fields.join(', ')} WHERE id = ?`, params);
  res.json({ ok: true });
});

// DELETE /api/casos-estudio/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const caso = get('SELECT profesional_id FROM casos_estudio WHERE id = ?', [id]);
  if (!caso) return res.status(404).json({ error: 'Caso no encontrado' });
  const { profesional_id } = req.query;
  if (profesional_id && Number(profesional_id) !== caso.profesional_id) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  run('DELETE FROM casos_estudio WHERE id = ?', [id]);
  res.json({ ok: true });
});

export default router;
