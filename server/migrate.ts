import { run as dbRun, exec as dbExec, get as dbGet } from './db';
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
  try {
    dbExec('ALTER TABLE seguimientos ADD COLUMN tamano_mm REAL');
  } catch {
    // columna ya existe
  }
  try {
    dbExec('ALTER TABLE lesion_analisis ADD COLUMN viz BLOB');
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
    { email: 'admin@clinicasantamaria.cl', hash, nombre: 'Dra. Marcela Lagos', rol: 'clinic_admin', tenantId: orgIds[0] },
    { email: 'admin.platform@skinnor.io', hash, nombre: 'Ing. Carlos Mendoza', rol: 'super_admin', tenantId: null },
  ];

  for (const u of users) {
    getOrInsert(
      insertUserSql,
      [u.email, u.hash, u.nombre, u.rol, u.tenantId],
      selectUserSql,
      [u.email]
    );
  }

  // Los datos clinicos demo ya no se re-siembran: los pacientes y profesionales
  // se gestionan por la app (registro funcional + vinculaciones manuales).

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
