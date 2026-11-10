// Limpieza: un solo paciente (iadiegomunoz) + datos demo con imagenes HAM10000
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.resolve(__dirname, 'skinnor.db'));
db.pragma('foreign_keys = ON');

const KEPT_UID = 71; // iadiegomunoz@gmail.com
const PRO_ID = 2; // d.munoz@clinicasantamaria.cl

// Asegurar que el usuario conservado tenga fila en pacientes
let kp = db.prepare('SELECT id FROM pacientes WHERE usuario_id = ?').get(KEPT_UID);
if (!kp) {
  const r = db.prepare('INSERT INTO pacientes (usuario_id, fecha_nacimiento, sexo, telefono) VALUES (?, ?, ?, ?)')
    .run(KEPT_UID, '1992-04-10', 'Femenino', '+56 9 5555 0101');
  kp = { id: r.lastInsertRowid };
}
const KEPT_PID = kp.id;
console.log('paciente conservado id:', KEPT_PID);

// 1. Borrar todos los pacientes excepto el conservado (cascade limpia
//    vinculaciones, consultas, lesiones, seguimientos, fotos, analisis)
const otros = db.prepare('SELECT id FROM pacientes WHERE id != ?').all(KEPT_PID);
console.log('pacientes a borrar:', otros.length);
const delPac = db.prepare('DELETE FROM pacientes WHERE id != ?');
db.transaction(() => {
  for (const p of otros) delPac.run(p.id);
})();

// 2. Borrar usuarios paciente huerfanos (menos el conservado)
const delUsr = db.prepare("DELETE FROM usuarios WHERE rol = 'paciente' AND id != ?");
const r = delUsr.run(KEPT_UID);
console.log('usuarios paciente borrados:', r.changes);

// 3. Asegurar vinculacion profesional <-> paciente conservado
db.prepare('INSERT OR IGNORE INTO vinculaciones (paciente_id, profesional_id, codigo_acceso_id) VALUES (?, ?, NULL)')
  .run(KEPT_PID, PRO_ID);
// Borrar vinculaciones del paciente conservado con otros (solo debe estar el Dr. Muñoz)
db.prepare('DELETE FROM vinculaciones WHERE paciente_id = ? AND profesional_id != ?').run(KEPT_PID, PRO_ID);

// 4. Limpiar datos clinicos del paciente conservado para demo controlada
db.prepare('DELETE FROM lesion_analisis WHERE lesion_id IN (SELECT id FROM lesiones WHERE paciente_id = ?)').run(KEPT_PID);
db.prepare('DELETE FROM seguimiento_fotos WHERE seguimiento_id IN (SELECT id FROM seguimientos WHERE lesion_id IN (SELECT id FROM lesiones WHERE paciente_id = ?))').run(KEPT_PID);
db.prepare('DELETE FROM seguimientos WHERE lesion_id IN (SELECT id FROM lesiones WHERE paciente_id = ?)').run(KEPT_PID);
db.prepare('DELETE FROM lesiones WHERE paciente_id = ?').run(KEPT_PID);

// 5. Imagenes aleatorias del HAM10000
const hamDir = path.resolve(__dirname, '../data/ham10000/HAM10000_images_part_1');
const files = fs.readdirSync(hamDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
const pick = (used) => {
  let i;
  do { i = Math.floor(Math.random() * files.length); } while (used.has(i));
  used.add(i);
  return fs.readFileSync(path.join(hamDir, files[i]));
};
const used = new Set();

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const insLesion = db.prepare(`INSERT INTO lesiones (paciente_id, nombre, zona, ubicacion, tamaño, colores, sintomas, creado_en, foto_base) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insSeg = db.prepare(`INSERT INTO seguimientos (lesion_id, fecha, cambios, color, sintomas, tamano_mm, notas, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const insSegFoto = db.prepare('INSERT INTO seguimiento_fotos (seguimiento_id, foto, mime, orden) VALUES (?, ?, ?, ?)');

const demo = [
  {
    lesion: {
      nombre: 'Nevo atípico en hombro derecho',
      zona: 'brazo_der',
      ubicacion: 'Hombro derecho',
      tamaño: '~6 mm',
      colores: ['Marrón', 'Negro'],
      sintomas: ['Picazón ocasional'],
      creadoDias: 42,
    },
    seg: {
      fechaDias: 14,
      cambios: 'si',
      color: 'si',
      sintomas: 'si',
      tamano_mm: 7.4,
      notas: 'La paciente refiere aumento de tamaño y nuevo tono más oscuro. Solicita evaluación prioritaria.',
      fotos: 3,
    },
  },
  {
    lesion: {
      nombre: 'Lesión pigmentada en zona escapular',
      zona: 'espalda',
      ubicacion: 'Escápula izquierda',
      tamaño: '~4 mm',
      colores: ['Marrón', 'Gris azulado'],
      sintomas: [],
      creadoDias: 63,
    },
    seg: {
      fechaDias: 9,
      cambios: 'no',
      color: 'no',
      sintomas: 'no',
      tamano_mm: 4.2,
      notas: 'Control de rutina. Sin cambios referidos; se refuerzan recomendaciones de foto con buena iluminación.',
      fotos: 5,
    },
  },
];

const tx = db.transaction(() => {
  for (const d of demo) {
    const baseBuf = pick(used);
    const lr = insLesion.run(
      KEPT_PID, d.lesion.nombre, d.lesion.zona, d.lesion.ubicacion, d.lesion.tamaño,
      JSON.stringify(d.lesion.colores), JSON.stringify(d.lesion.sintomas),
      daysAgo(d.lesion.creadoDias), baseBuf
    );
    const lesionId = lr.lastInsertRowid;

    const nFotos = d.seg.fotos;
    const fotoBufs = [];
    for (let i = 0; i < nFotos; i++) fotoBufs.push(pick(used));

    const sr = insSeg.run(
      lesionId, daysAgo(d.seg.fechaDias), d.seg.cambios, d.seg.color, d.seg.sintomas,
      d.seg.tamano_mm, d.seg.notas, fotoBufs[0]
    );
    const segId = sr.lastInsertRowid;
    fotoBufs.forEach((b, i) => insSegFoto.run(segId, b, 'image/jpeg', i));
    console.log(`lesion ${lesionId}: ${d.lesion.nombre} | seguimiento ${segId} con ${nFotos} fotos`);
  }
});
tx();

// resumen final
console.log('---');
console.log('pacientes:', db.prepare('SELECT COUNT(*) c FROM pacientes').get().c);
console.log('usuarios paciente:', db.prepare("SELECT COUNT(*) c FROM usuarios WHERE rol='paciente'").get().c);
console.log('vinculaciones:', db.prepare('SELECT COUNT(*) c FROM vinculaciones').get().c);
console.log('lesiones del paciente:', db.prepare('SELECT COUNT(*) c FROM lesiones WHERE paciente_id=?').get(KEPT_PID).c);
console.log('seguimientos:', db.prepare('SELECT COUNT(*) c FROM seguimientos').get().c);
console.log('seguimiento_fotos:', db.prepare('SELECT COUNT(*) c FROM seguimiento_fotos').get().c);
db.close();
