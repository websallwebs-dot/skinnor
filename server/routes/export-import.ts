import { Router } from 'express';
import { all, get, run as dbRun, getDb as dbGetDb } from '../db';

const router = Router();

// GET /api/export — exportar todo a JSON (lesiones, seguimientos, fotos como data URLs)
router.get('/export', (_req, res) => {
  const lesiones = all(`
    SELECT l.*, p.usuario_id, u.email as paciente_email
    FROM lesiones l
    JOIN pacientes p ON l.paciente_id = p.id
    JOIN usuarios u ON p.usuario_id = u.id
    ORDER BY l.creado_en DESC
  `);

  const serializedLesiones = lesiones.map((l: any) => {
    const fotoBase64 = l.foto_base ? `data:image/jpeg;base64,${Buffer.from(l.foto_base as Buffer).toString('base64')}` : null;
    return {
      id: l.id,
      paciente_id: l.paciente_id,
      nombre: l.nombre,
      zona: l.zona,
      ubicacion: l.ubicacion,
      tamaño: l.tamaño,
      colores: l.colores ? JSON.parse(l.colores as string) : null,
      sintomas: l.sintomas ? JSON.parse(l.sintomas as string) : null,
      creado_en: l.creado_en,
      fotoBase: fotoBase64,
    };
  });

  const lesionIds = serializedLesiones.map((l: any) => l.id);
  let allSeguimientos: any[] = [];
  for (const lesionId of lesionIds) {
    const segs = all('SELECT * FROM seguimientos WHERE lesion_id = ? ORDER BY fecha DESC', [lesionId]);
    allSeguimientos.push(...segs.map((s: any) => {
      const segFotos = all(
        'SELECT id, foto, mime, orden FROM seguimiento_fotos WHERE seguimiento_id = ? ORDER BY orden ASC, id ASC',
        [s.id]
      );
      const fotos = segFotos.map((f: any) =>
        f.foto ? `data:${f.mime || 'image/jpeg'};base64,${Buffer.from(f.foto as Buffer).toString('base64')}` : null
      ).filter(Boolean);
      const fotoBase64 = fotos.length
        ? fotos[0]
        : s.foto ? `data:image/jpeg;base64,${Buffer.from(s.foto as Buffer).toString('base64')}` : null;
      return {
        id: s.id,
        lesionId: s.lesion_id,
        fecha: s.fecha,
        cambios: s.cambios,
        color: s.color,
        sintomas: s.sintomas,
        notas: s.notas,
        foto: fotoBase64,
        fotos,
      };
    }));
  }

  res.json({
    lesiones: serializedLesiones,
    seguimientos: allSeguimientos,
    exportedAt: new Date().toISOString(),
  });
});

// POST /api/import — importar JSON y restaurar en SQLite
router.post('/import', (req, res) => {
  const { lesiones, seguimientos } = req.body;
  if (!lesiones || !Array.isArray(lesiones)) {
    return res.status(400).json({ error: 'Formato de importación inválido: se esperaba array de lesiones' });
  }

  // Limpiar datos existentes (reemplazo completo)
  dbRun('DELETE FROM seguimiento_fotos');
  dbRun('DELETE FROM seguimientos');
  dbRun('DELETE FROM lesiones');

  for (const l of lesiones) {
    let fotoBuffer: Buffer | null = null;
    if (l.fotoBase && typeof l.fotoBase === 'string' && l.fotoBase.startsWith('data:')) {
      const matches = l.fotoBase.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (matches) {
        fotoBuffer = Buffer.from(matches[1], 'base64');
      }
    }
    if (!fotoBuffer) {
      return res.status(400).json({ error: `Lesión ${l.nombre} no tiene foto válida` });
    }

    const coloresStr = l.colores ? JSON.stringify(l.colores) : null;
    const sintomasStr = l.sintomas ? JSON.stringify(l.sintomas) : null;

    const result = dbRun(
      `INSERT INTO lesiones (paciente_id, nombre, zona, ubicacion, tamaño, colores, sintomas, creado_en, foto_base)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.paciente_id || 1, l.nombre, l.zona, l.ubicacion || null, l.tamaño || null, coloresStr, sintomasStr, l.creado_en || new Date().toISOString(), fotoBuffer]
    );
    const lesionId = result.lastInsertRowid as number;

    const lesionSegs = seguimientos?.filter((s: any) => s.lesionId === l.id) || [];
    for (const s of lesionSegs) {
      const fotoList: string[] = Array.isArray(s.fotos) && s.fotos.length ? s.fotos : (s.foto ? [s.foto] : []);
      const decodedFotos: { buffer: Buffer; mime: string }[] = [];
      for (const f of fotoList) {
        if (typeof f === 'string' && f.startsWith('data:')) {
          const m = f.match(/^data:([A-Za-z\-+/]+);base64,(.+)$/);
          if (m) decodedFotos.push({ buffer: Buffer.from(m[2], 'base64'), mime: m[1] || 'image/jpeg' });
        }
      }
      if (decodedFotos.length === 0) continue;

      const segResult = dbRun(
        `INSERT INTO seguimientos (lesion_id, fecha, cambios, color, sintomas, notas, foto)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [lesionId, s.fecha || new Date().toISOString(), s.cambios || 'no', s.color || 'no', s.sintomas || 'no', s.notas || null, decodedFotos[0].buffer]
      );
      const newSegId = segResult.lastInsertRowid as number;
      const insertFoto = dbGetDb().prepare(
        'INSERT INTO seguimiento_fotos (seguimiento_id, foto, mime, orden) VALUES (?, ?, ?, ?)'
      );
      decodedFotos.forEach((f, i) => {
        insertFoto.run(newSegId, f.buffer, f.mime, i);
      });
    }
  }

  res.json({ success: true, lesionesImportadas: lesiones.length });
});

export default router;
