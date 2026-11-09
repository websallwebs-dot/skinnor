import { Router } from 'express';
import { get, all, run, getDb } from '../db';
import { ZipArchive } from 'archiver';
import crypto from 'crypto';

const router = Router();

interface Criterios {
  paciente_ids?: number[];
  edad_min?: number | null;
  edad_max?: number | null;
  sexo?: string | null;
  solo_cambios?: boolean;
}

function edadDesde(fecha?: string | null): number | null {
  if (!fecha) return null;
  const t = new Date(fecha).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (365.25 * 24 * 3600 * 1000));
}

function cohorteHash(pacienteId: number): string {
  return 'PAC-' + crypto.createHash('sha256').update(`ds:${pacienteId}`).digest('hex').slice(0, 8).toUpperCase();
}

function parseJson(v: any, fallback: any = null) {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

// Pacientes vinculados al profesional que cumplen los criterios
function pacientesFiltrados(profesionalId: number, criterios: Criterios) {
  const params: any[] = [profesionalId];
  let sql = `SELECT p.id, p.fecha_nacimiento, p.sexo
             FROM vinculaciones v
             JOIN pacientes p ON p.id = v.paciente_id
             WHERE v.profesional_id = ?`;

  if (criterios.paciente_ids?.length) {
    sql += ` AND p.id IN (${criterios.paciente_ids.map(() => '?').join(',')})`;
    params.push(...criterios.paciente_ids);
  }
  if (criterios.sexo) {
    sql += ' AND p.sexo = ?';
    params.push(criterios.sexo);
  }

  const rows = all(sql, params);
  return rows.filter((p: any) => {
    if (criterios.edad_min != null || criterios.edad_max != null) {
      const edad = edadDesde(p.fecha_nacimiento);
      if (edad == null) return false; // sin fecha de nacimiento no pasa filtro etario
      if (criterios.edad_min != null && edad < criterios.edad_min) return false;
      if (criterios.edad_max != null && edad > criterios.edad_max) return false;
    }
    return true;
  });
}

interface RegistroDesc {
  tipo: 'base' | 'seguimiento';
  lesion: any;
  seg?: any;
  foto?: any; // {id, mime}
  orden: number; // índice de seguimiento dentro de la lesión
}

// Construye la lista de registros (una fila por imagen) para los pacientes filtrados
function construirRegistros(pacienteIds: number[], criterios: Criterios): { paciente: any; registros: RegistroDesc[] }[] {
  const out: { paciente: any; registros: RegistroDesc[] }[] = [];

  for (const pid of pacienteIds) {
    const paciente = get('SELECT id, fecha_nacimiento, sexo FROM pacientes WHERE id = ?', [pid]);
    if (!paciente) continue;
    const lesiones = all(
      'SELECT id, nombre, zona, ubicacion, tamaño, colores, sintomas, creado_en, foto_base FROM lesiones WHERE paciente_id = ? ORDER BY creado_en ASC',
      [pid]
    );

    const registros: RegistroDesc[] = [];
    for (const lesion of lesiones) {
      registros.push({ tipo: 'base', lesion, orden: 0 });

      const segs = all(
        'SELECT id, fecha, cambios, color, sintomas, notas FROM seguimientos WHERE lesion_id = ? ORDER BY fecha ASC',
        [lesion.id]
      );
      let orden = 0;
      for (const seg of segs) {
        orden++;
        if (criterios.solo_cambios && seg.cambios !== 'si') continue;
        const fotos = all(
          'SELECT id, orden, mime FROM seguimiento_fotos WHERE seguimiento_id = ? ORDER BY orden ASC, id ASC',
          [seg.id]
        );
        for (const f of fotos) {
          registros.push({ tipo: 'seguimiento', lesion, seg, foto: f, orden });
        }
      }
    }
    if (registros.length) out.push({ paciente, registros });
  }
  return out;
}

function metadataAnonima(rec: RegistroDesc, paciente: any, recordId: string) {
  const lesion = rec.lesion;
  return {
    record_id: recordId,
    cohorte_id: cohorteHash(paciente.id),
    tipo: rec.tipo,
    tipo_lesion: lesion.nombre,
    zona: lesion.zona,
    ubicacion: lesion.ubicacion || null,
    edad: edadDesde(paciente.fecha_nacimiento),
    sexo: paciente.sexo || null,
    diametro_mm: lesion.tamaño || null,
    colores: parseJson(lesion.colores, []),
    sintomas: parseJson(lesion.sintomas, []),
    orden_seguimiento: rec.tipo === 'seguimiento' ? rec.orden : null,
    cambios_reportados: rec.seg?.cambios || null,
    color_antes: rec.seg?.color || null,
    sintomas_reportados: rec.seg?.sintomas || null,
  };
}

function imagenDeRegistro(rec: RegistroDesc): { buffer: Buffer; mime: string } | null {
  if (rec.tipo === 'base') {
    return rec.lesion.foto_base ? { buffer: rec.lesion.foto_base as Buffer, mime: 'image/jpeg' } : null;
  }
  const row = get('SELECT foto, mime FROM seguimiento_fotos WHERE id = ?', [rec.foto.id]);
  return row?.foto ? { buffer: row.foto as Buffer, mime: row.mime || 'image/jpeg' } : null;
}

const CSV_HEADER = 'record_id,cohorte_id,tipo,tipo_lesion,zona,ubicacion,edad,sexo,diametro_mm,colores,sintomas,orden_seguimiento,cambios_reportados,color_antes,sintomas_reportados';

function csvEscape(v: any): string {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join('|') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function filaCsv(meta: any): string {
  return [
    meta.record_id, meta.cohorte_id, meta.tipo, meta.tipo_lesion, meta.zona, meta.ubicacion,
    meta.edad, meta.sexo, meta.diametro_mm, meta.colores, meta.sintomas,
    meta.orden_seguimiento, meta.cambios_reportados, meta.color_antes, meta.sintomas_reportados,
  ].map(csvEscape).join(',');
}

// GET /api/datasets?profesional_id= — listar datasets del profesional
router.get('/', (req, res) => {
  const profesionalId = Number(req.query.profesional_id);
  if (!profesionalId) return res.status(400).json({ error: 'profesional_id requerido' });
  const rows = all(
    'SELECT * FROM datasets WHERE profesional_id = ? ORDER BY creado_en DESC',
    [profesionalId]
  );
  res.json(rows.map((d: any) => ({ ...d, criterios: parseJson(d.criterios, {}) })));
});

// POST /api/datasets/preview — contar registros sin materializar
router.post('/preview', (req, res) => {
  const { profesional_id, criterios } = req.body || {};
  if (!profesional_id) return res.status(400).json({ error: 'profesional_id requerido' });
  const pacientes = pacientesFiltrados(Number(profesional_id), criterios || {});
  const grupos = construirRegistros(pacientes.map((p: any) => p.id), criterios || {});
  res.json({
    pacientes: grupos.length,
    registros: grupos.reduce((acc, g) => acc + g.registros.length, 0),
  });
});

// POST /api/datasets — crear dataset materializando registros anonimizados
router.post('/', (req, res) => {
  const { profesional_id, nombre, descripcion, etiqueta, criterios, incluir_imagenes } = req.body || {};
  if (!profesional_id || !nombre?.trim()) {
    return res.status(400).json({ error: 'profesional_id y nombre son requeridos' });
  }

  const crit: Criterios = criterios || {};
  const pacientes = pacientesFiltrados(Number(profesional_id), crit);
  if (!pacientes.length) {
    return res.status(400).json({ error: 'Ningún paciente vinculado cumple los criterios' });
  }

  const grupos = construirRegistros(pacientes.map((p: any) => p.id), crit);
  const totalRegistros = grupos.reduce((acc, g) => acc + g.registros.length, 0);
  if (!totalRegistros) {
    return res.status(400).json({ error: 'Los pacientes cumplen los filtros pero no tienen imágenes registradas' });
  }

  const db = getDb();
  const datasetId = db.prepare(
    `INSERT INTO datasets (profesional_id, nombre, descripcion, etiqueta, criterios, incluir_imagenes, registros_count, pacientes_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    Number(profesional_id), nombre.trim(), descripcion || null, etiqueta || null,
    JSON.stringify(crit), incluir_imagenes === false ? 0 : 1, totalRegistros, grupos.length
  ).lastInsertRowid as number;

  const insertReg = db.prepare(
    'INSERT INTO dataset_registros (dataset_id, record_id, tipo, lesion_id, seguimiento_id, foto_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  let seq = 0;
  const tx = db.transaction(() => {
    for (const g of grupos) {
      for (const rec of g.registros) {
        seq++;
        const recordId = `DS${datasetId}-${String(seq).padStart(4, '0')}`;
        const meta = metadataAnonima(rec, g.paciente, recordId);
        insertReg.run(
          datasetId, recordId, rec.tipo, rec.lesion.id,
          rec.seg?.id ?? null, rec.foto?.id ?? null, JSON.stringify(meta)
        );
      }
    }
  });
  tx();

  res.status(201).json({ id: datasetId, registros: totalRegistros, pacientes: grupos.length });
});

function datasetDelPro(id: number, profesionalId: number) {
  return get('SELECT * FROM datasets WHERE id = ? AND profesional_id = ?', [id, profesionalId]);
}

// GET /api/datasets/:id?profesional_id= — detalle + registros (metadata anonimizada)
router.get('/:id', (req, res) => {
  const profesionalId = Number(req.query.profesional_id);
  const ds = datasetDelPro(Number(req.params.id), profesionalId);
  if (!ds) return res.status(404).json({ error: 'Dataset no encontrado' });
  const regs = all(
    'SELECT record_id, tipo, lesion_id, seguimiento_id, foto_id, metadata FROM dataset_registros WHERE dataset_id = ? ORDER BY id ASC',
    [ds.id]
  ).map((r: any) => ({ ...r, metadata: parseJson(r.metadata, {}) }));
  res.json({ ...ds, criterios: parseJson(ds.criterios, {}), registros: regs });
});

// DELETE /api/datasets/:id?profesional_id=
router.delete('/:id', (req, res) => {
  const profesionalId = Number(req.query.profesional_id);
  const ds = datasetDelPro(Number(req.params.id), profesionalId);
  if (!ds) return res.status(404).json({ error: 'Dataset no encontrado' });
  run('DELETE FROM datasets WHERE id = ?', [ds.id]);
  res.json({ success: true });
});

// GET /api/datasets/:id/export?profesional_id=&format=csv|zip
router.get('/:id/export', async (req, res) => {
  const profesionalId = Number(req.query.profesional_id);
  const ds = datasetDelPro(Number(req.params.id), profesionalId);
  if (!ds) return res.status(404).json({ error: 'Dataset no encontrado' });

  const regs = all(
    `SELECT dr.*, l.foto_base AS _base, l.id AS _lesion_id
     FROM dataset_registros dr
     LEFT JOIN lesiones l ON l.id = dr.lesion_id
     WHERE dr.dataset_id = ? ORDER BY dr.id ASC`,
    [ds.id]
  );

  const rows = regs.map((r: any) => {
    const rec: RegistroDesc = {
      tipo: r.tipo,
      lesion: { id: r.lesion_id, foto_base: r._base },
      seg: r.seguimiento_id ? { id: r.seguimiento_id } : undefined,
      foto: r.foto_id ? { id: r.foto_id } : undefined,
      orden: 0,
    };
    const meta = parseJson(r.metadata, {});
    return { record_id: r.record_id, meta, rec };
  });

  const csv = CSV_HEADER + '\n' + rows.map((r) => filaCsv(r.meta)).join('\n');
  const slug = `dataset-${ds.id}-${String(ds.nombre).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  const wantZip = req.query.format === 'zip' || (!req.query.format && ds.incluir_imagenes);
  if (wantZip) {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`);
    archive.pipe(res);
    archive.append(csv, { name: 'records.csv' });

    let conImagen = 0;
    for (const r of rows) {
      const img = imagenDeRegistro(r.rec);
      if (img) {
        conImagen++;
        archive.append(img.buffer, { name: `images/${r.record_id}.${img.mime.includes('png') ? 'png' : 'jpg'}` });
      }
    }
    archive.append(JSON.stringify({ dataset: ds.nombre, registros: rows.length, imagenes: conImagen }, null, 2), { name: 'manifest.json' });
    await archive.finalize();
    return;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}.csv"`);
  res.send('﻿' + csv);
});

// GET /api/datasets/:id/imagen/:recordId?profesional_id= — servir imagen de un registro
router.get('/:id/imagen/:recordId', (req, res) => {
  const profesionalId = Number(req.query.profesional_id);
  const ds = datasetDelPro(Number(req.params.id), profesionalId);
  if (!ds) return res.status(404).json({ error: 'Dataset no encontrado' });

  const reg = get(
    'SELECT dr.tipo, dr.foto_id, l.foto_base FROM dataset_registros dr LEFT JOIN lesiones l ON l.id = dr.lesion_id WHERE dr.dataset_id = ? AND dr.record_id = ?',
    [ds.id, req.params.recordId]
  );
  if (!reg) return res.status(404).json({ error: 'Registro no encontrado' });

  const img = reg.tipo === 'base'
    ? (reg.foto_base ? { buffer: reg.foto_base as Buffer, mime: 'image/jpeg' } : null)
    : (() => {
        const f = get('SELECT foto, mime FROM seguimiento_fotos WHERE id = ?', [reg.foto_id]);
        return f?.foto ? { buffer: f.foto as Buffer, mime: f.mime || 'image/jpeg' } : null;
      })();

  if (!img) return res.status(404).json({ error: 'Imagen no disponible' });
  res.set('Content-Type', img.mime);
  res.send(img.buffer);
});

export default router;
