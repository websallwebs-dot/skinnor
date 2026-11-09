import { run as dbRun, exec as dbExec, get as dbGet, all as dbAll } from './db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, 'schema.sql');

function getOrInsert(insertSql: string, insertParams: any[], selectSql: string, selectParams: any[]): number {
  const row = dbGet(selectSql, selectParams) as { id: number } | undefined;
  if (row) return row.id;
  const result = dbRun(insertSql, insertParams);
  const id = result.lastInsertRowid as number;
  return id > 0 ? id : 0;
}

export async function migrate() {
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  dbExec(sql);
  // Backfill: copiar la foto única de seguimientos existentes a seguimiento_fotos (idempotente)
  dbExec(`
    INSERT INTO seguimiento_fotos (seguimiento_id, foto, mime, orden, creado_en)
    SELECT s.id, s.foto, 'image/jpeg', 0, s.fecha
    FROM seguimientos s
    WHERE s.foto IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM seguimiento_fotos sf WHERE sf.seguimiento_id = s.id)
  `);
  // Columna nueva en pacientes (DBs existentes): perfil de salud en JSON
  try {
    dbExec('ALTER TABLE pacientes ADD COLUMN perfil_salud TEXT');
  } catch {
    // columna ya existe
  }
  console.log('Migración ejecutada: esquema SQLite creado/actualizado');
}

export async function seed() {
  const orgs = [
    {
      nombre: 'Clínica Dermatológica Santa María',
      subdomain: 'santamaria.skinnor.io',
      tier: 'Enterprise Hospital',
      status: 'Activo',
      country: 'Chile',
      contact_email: 'admin@clinicasantamaria.cl',
      storage_used_gb: 142.5,
      storage_limit_gb: 500,
      monthly_scans_used: 842,
      monthly_scans_limit: 1200,
      mrr_usd: 1850,
      hipaa_agreement_signed: 1,
    },
    {
      nombre: 'Instituto Dermatológico Las Condes',
      subdomain: 'dermacondes.skinnor.io',
      tier: 'Pro Clinic',
      status: 'Activo',
      country: 'Chile',
      contact_email: 'teledermatologia@dermacondes.cl',
      storage_used_gb: 68.2,
      storage_limit_gb: 200,
      monthly_scans_used: 490,
      monthly_scans_limit: 600,
      mrr_usd: 890,
      hipaa_agreement_signed: 1,
    },
    {
      nombre: 'Hospital Universitario San Juan',
      subdomain: 'sanjuan-salud.skinnor.io',
      tier: 'Network Group',
      status: 'Activo',
      country: 'Colombia',
      contact_email: 'dermatologia@hospitalsanjuan.org',
      storage_used_gb: 318.0,
      storage_limit_gb: 1000,
      monthly_scans_used: 2150,
      monthly_scans_limit: 3000,
      mrr_usd: 3450,
      hipaa_agreement_signed: 1,
    },
    {
      nombre: 'Centro Melanoma & Nevus Monterrey',
      subdomain: 'melanomamty.skinnor.io',
      tier: 'Pro Clinic',
      status: 'Periodo de Prueba',
      country: 'México',
      contact_email: 'contacto@melanomamty.mx',
      storage_used_gb: 19.4,
      storage_limit_gb: 200,
      monthly_scans_used: 145,
      monthly_scans_limit: 600,
      mrr_usd: 890,
      hipaa_agreement_signed: 1,
    },
    {
      nombre: 'Unidad de Fototerapia & Teledermatología BA',
      subdomain: 'fotoba.skinnor.io',
      tier: 'Starter Clinic',
      status: 'Activo',
      country: 'Argentina',
      contact_email: 'dr.alvarez@fotoba.com.ar',
      storage_used_gb: 14.8,
      storage_limit_gb: 100,
      monthly_scans_used: 110,
      monthly_scans_limit: 250,
      mrr_usd: 420,
      hipaa_agreement_signed: 1,
    },
  ];

  const insertOrgSql = `
    INSERT INTO organizaciones (nombre, subdomain, tier, status, country, contact_email, storage_used_gb, storage_limit_gb, monthly_scans_used, monthly_scans_limit, mrr_usd, hipaa_agreement_signed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const selectOrgSql = 'SELECT id FROM organizaciones WHERE subdomain = ?';

  const orgIds: number[] = [];
  for (const o of orgs) {
    const id = getOrInsert(
      insertOrgSql,
      [o.nombre, o.subdomain, o.tier, o.status, o.country, o.contact_email,
       o.storage_used_gb, o.storage_limit_gb, o.monthly_scans_used, o.monthly_scans_limit, o.mrr_usd, o.hipaa_agreement_signed],
      selectOrgSql,
      [o.subdomain]
    );
    orgIds.push(id);
  }

  const hash = '$2b$10$placeholder.hash.for.development.only';

  const insertUserSql = `
    INSERT INTO usuarios (email, password_hash, nombre, rol, tenant_id, activo)
    VALUES (?, ?, ?, ?, ?, 1)
  `;
  const selectUserSql = 'SELECT id FROM usuarios WHERE email = ?';

  const users = [
    { email: 'sofia.valenzuela@gmail.com', hash, nombre: 'Sofía Valenzuela', rol: 'paciente', tenantId: orgIds[0] },
    { email: 'd.munoz@clinicasantamaria.cl', hash, nombre: 'Dr. Diego Muñoz', rol: 'profesional', tenantId: orgIds[0] },
    { email: 'admin@clinicasantamaria.cl', hash, nombre: 'Dra. Marcela Lagos', rol: 'clinic_admin', tenantId: orgIds[0] },
    { email: 'admin.platform@skinnor.io', hash, nombre: 'Ing. Carlos Mendoza', rol: 'super_admin', tenantId: null },
  ];

  const userIds: number[] = [];
  for (const u of users) {
    const id = getOrInsert(
      insertUserSql,
      [u.email, u.hash, u.nombre, u.rol, u.tenantId],
      selectUserSql,
      [u.email]
    );
    userIds.push(id);
  }

  let pacienteSofiaId = 0;
  if (userIds[0] && userIds[0] > 0) {
    const insertPacienteSql = `
      INSERT INTO pacientes (usuario_id, fecha_nacimiento, sexo, telefono)
      VALUES (?, '1990-05-15', 'Femenino', '+56 9 1234 5678')
    `;
    const selectPacienteSql = 'SELECT id FROM pacientes WHERE usuario_id = ?';
    pacienteSofiaId = getOrInsert(
      insertPacienteSql,
      [userIds[0]],
      selectPacienteSql,
      [userIds[0]]
    );
  }

  if (pacienteSofiaId && userIds[1] && userIds[1] > 0) {
    const insertVinculacionSql = `
      INSERT INTO vinculaciones (paciente_id, profesional_id, codigo_acceso_id)
      VALUES (?, ?, NULL)
    `;
    const selectVinculacionSql = 'SELECT id FROM vinculaciones WHERE paciente_id = ? AND profesional_id = ?';
    getOrInsert(
      insertVinculacionSql,
      [pacienteSofiaId, userIds[1]],
      selectVinculacionSql,
      [pacienteSofiaId, userIds[1]]
    );
  }

  // Datos demo: conectar todos los pacientes existentes con el especialista
  // y asegurar lesión con fotos + consulta para cada uno (idempotente)
  const profesionalDemo = dbGet(
    "SELECT id FROM usuarios WHERE email = 'd.munoz@clinicasantamaria.cl'"
  ) as { id: number } | undefined;
  const profesionalDemoId = profesionalDemo?.id ?? userIds[1];

  if (profesionalDemoId) {
    const hamDir = path.resolve(__dirname, '../data/ham10000/HAM10000_images_part_1');
    const loadHamImage = (idx: number): Buffer | null => {
      try {
        const files = fs.readdirSync(hamDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
        if (!files.length) return null;
        return fs.readFileSync(path.join(hamDir, files[idx % files.length]));
      } catch {
        return null;
      }
    };

    const pacientesRows = dbAll('SELECT id, usuario_id FROM pacientes') as { id: number; usuario_id: number }[];

    // Vincular cualquier paciente sin vínculo con el especialista demo
    for (const p of pacientesRows) {
      const existe = dbGet('SELECT id FROM vinculaciones WHERE paciente_id = ? AND profesional_id = ?', [p.id, profesionalDemoId]);
      if (!existe) {
        dbRun('INSERT INTO vinculaciones (paciente_id, profesional_id, codigo_acceso_id) VALUES (?, ?, NULL)', [p.id, profesionalDemoId]);
      }
    }

    for (const p of pacientesRows) {
      // Lesión demo (por nombre, idempotente)
      let lesionRow = dbGet(`SELECT id FROM lesiones WHERE paciente_id = ? AND nombre = 'Nevo en hombro derecho'`, [p.id]) as { id: number } | undefined;
      let lesionId = lesionRow?.id;
      const fotoLesion = loadHamImage(0);
      if (!lesionId && fotoLesion) {
        const r = dbRun(
          `INSERT INTO lesiones (paciente_id, nombre, zona, ubicacion, tamaño, colores, sintomas, creado_en, foto_base)
           VALUES (?, 'Nevo en hombro derecho', 'brazo_der', 'Hombro derecho', '~6 mm', ?, ?, ?, ?)`,
          [p.id, JSON.stringify(['Marrón', 'Negro']), JSON.stringify(['Picazón ocasional']),
           new Date(Date.now() - 45 * 86400000).toISOString(), fotoLesion]
        );
        lesionId = r.lastInsertRowid as number;
      }

      if (lesionId) {
        const segCount = ((dbGet('SELECT COUNT(*) AS c FROM seguimientos WHERE lesion_id = ?', [lesionId]) as { c: number } | undefined)?.c) || 0;
        if (segCount === 0) {
          const segs = [
            { daysAgo: 30, cambios: 'no', color: 'no', sintomas: 'no', notas: 'Primera fotografía de referencia.', imgs: [1] },
            { daysAgo: 14, cambios: 'si', color: 'no', sintomas: 'si', notas: 'Ligero aumento de picazón reportado por la paciente.', imgs: [2, 3] },
            { daysAgo: 2, cambios: 'no', color: 'no', sintomas: 'no', notas: 'Sin cambios visuales respecto al control anterior.', imgs: [4] },
          ];
          for (const s of segs) {
            const f1 = loadHamImage(s.imgs[0]);
            if (!f1) continue;
            const sr = dbRun(
              `INSERT INTO seguimientos (lesion_id, fecha, cambios, color, sintomas, notas, foto)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [lesionId, new Date(Date.now() - s.daysAgo * 86400000).toISOString(), s.cambios, s.color, s.sintomas, s.notas, f1]
            );
            const segId = sr.lastInsertRowid as number;
            s.imgs.forEach((imgIdx, i) => {
              const buf = loadHamImage(imgIdx);
              if (buf) {
                dbRun('INSERT INTO seguimiento_fotos (seguimiento_id, foto, mime, orden) VALUES (?, ?, ?, ?)', [segId, buf, 'image/jpeg', i]);
              }
            });
          }
        }
      }

      // Consulta demo paciente ↔ especialista
      const consultaRow = dbGet('SELECT id FROM consultas WHERE paciente_id = ? AND profesional_id = ? LIMIT 1', [p.id, profesionalDemoId]) as { id: number } | undefined;
      if (!consultaRow) {
        const cr = dbRun(
          `INSERT INTO consultas (paciente_id, profesional_id, tema, estado) VALUES (?, ?, 'Control de nevo en hombro derecho', 'pendiente')`,
          [p.id, profesionalDemoId]
        );
        const cid = cr.lastInsertRowid as number;
        dbRun(
          `INSERT INTO mensajes_consulta (consulta_id, remitente_id, remitente_tipo, contenido) VALUES (?, ?, 'paciente', ?)`,
          [cid, p.usuario_id, 'Doctor, he estado registrando fotos del lunar cada 15 días. ¿Puede revisarlas cuando pueda? Gracias.']
        );
        dbRun(
          `INSERT INTO mensajes_consulta (consulta_id, remitente_id, remitente_tipo, contenido) VALUES (?, ?, 'profesional', ?)`,
          [cid, profesionalDemoId, 'Hola, con gusto reviso tu historial. Por ahora las imágenes se ven estables; sigue con los controles semanales.']
        );
      }
    }
  }

  const insertProtocoloSql = `
    INSERT INTO protocolos_clinicos (
      urgency_tds_threshold, growth_delta_threshold_mm_per_month,
      mandatory_biopsy_checklist, enable_patient_telemonitoring,
      auto_notify_referral_doctor, require_two_specialists_for_high_atipia,
      clinic_legal_disclaimer, report_header_title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const selectProtocoloSql = 'SELECT id FROM protocolos_clinicos LIMIT 1';
  getOrInsert(
    insertProtocoloSql,
    [
      5.15, 0.20, 1, 1, 1, 0,
      'Este informe fue generado por el Servicio de Dermatología. Los puntajes algorítmicos son herramientas auxiliares y no reemplazan el juicio clínico ni la confirmación histopatológica por biopsia.',
      'Servicio de Dermatología & Unidad de Lesiones Pigmentadas',
    ],
    selectProtocoloSql,
    []
  );

  console.log('Seed completado: organizaciones, usuarios y pacientes insertados');
}

export async function init() {
  await migrate();
  await seed();
}

init().catch((err) => {
  console.error('Error en inicialización:', err);
  process.exit(1);
});
