-- ============================================
-- Skinnor — Esquema SQLite completo
-- Teledermatología: paciente, profesional, clínica, superadmin
-- ============================================

PRAGMA foreign_keys = ON;

-- -------------------------------------------------
-- Usuarios y autenticación (base)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('paciente','profesional','clinic_admin','super_admin')),
  tenant_id INTEGER,
  activo INTEGER DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES organizaciones(id)
);

-- -------------------------------------------------
-- Multi-tenencia (SuperAdmin)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS organizaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  tier TEXT NOT NULL DEFAULT 'Starter Clinic' CHECK (tier IN ('Starter Clinic','Pro Clinic','Enterprise Hospital','Network Group')),
  status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo','Periodo de Prueba','Suspended','Auditoría')),
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  contact_email TEXT,
  custom_domain TEXT,
  hipaa_agreement_signed INTEGER DEFAULT 0,
  storage_used_gb REAL DEFAULT 0,
  storage_limit_gb REAL DEFAULT 100,
  monthly_scans_used INTEGER DEFAULT 0,
  monthly_scans_limit INTEGER DEFAULT 250,
  mrr_usd REAL DEFAULT 0
);

-- -------------------------------------------------
-- Paciente
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE,
  fecha_nacimiento TEXT,
  sexo TEXT,
  telefono TEXT,
  perfil_salud TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Lesiones (foto_base como BLOB)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS lesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  zona TEXT NOT NULL CHECK (zona IN ('cabeza','cuello','torso_frente','espalda','brazo_izq','brazo_der','pierna_izq','pierna_der','manos_pies')),
  ubicacion TEXT,
  tamaño TEXT,
  colores TEXT,
  sintomas TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  foto_base BLOB NOT NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Seguimientos (foto como BLOB, cascade delete con lesión)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS seguimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesion_id INTEGER NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  cambios TEXT NOT NULL CHECK (cambios IN ('si','no')),
  color TEXT NOT NULL CHECK (color IN ('si','no')),
  sintomas TEXT NOT NULL CHECK (sintomas IN ('si','no')),
  notas TEXT,
  foto BLOB NOT NULL,
  FOREIGN KEY (lesion_id) REFERENCES lesiones(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Fotos de seguimientos (1:N — varias imágenes por registro)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS seguimiento_fotos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seguimiento_id INTEGER NOT NULL,
  foto BLOB NOT NULL,
  mime TEXT NOT NULL DEFAULT 'image/jpeg',
  orden INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (seguimiento_id) REFERENCES seguimientos(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Códigos de acceso profesional <-> paciente
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS codigos_acceso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  profesional_id INTEGER NOT NULL,
  activo INTEGER DEFAULT 1,
  expira_en TEXT,
  usos_maximos INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profesional_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Vinculaciones paciente-profesional
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS vinculaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  profesional_id INTEGER NOT NULL,
  codigo_acceso_id INTEGER,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (profesional_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (codigo_acceso_id) REFERENCES codigos_acceso(id) ON DELETE SET NULL
);

-- -------------------------------------------------
-- Consultas (mensajes entre paciente y profesional)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS consultas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  profesional_id INTEGER NOT NULL,
  tema TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','resuelto','cerrado')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (profesional_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Mensajes de consultas
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS mensajes_consulta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consulta_id INTEGER NOT NULL,
  remitente_id INTEGER NOT NULL,
  remitente_tipo TEXT NOT NULL CHECK (remitente_tipo IN ('paciente','profesional')),
  contenido TEXT NOT NULL,
  leido INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_profesional ON consultas(profesional_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_consulta ON mensajes_consulta(consulta_id);

-- -------------------------------------------------
-- Registros fotográficos profesionales (dermatoscopía)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS registros_fotos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag TEXT NOT NULL,
  fecha TEXT NOT NULL,
  full_date TEXT,
  tipo TEXT,
  aumento TEXT,
  lesion TEXT,
  ubicacion TEXT,
  diametro TEXT,
  area TEXT,
  score_tds TEXT,
  asimetria TEXT,
  bordes TEXT,
  color TEXT,
  estado TEXT,
  estado_color TEXT,
  autor TEXT,
  calidad TEXT,
  dispositivo TEXT,
  roi TEXT,
  color_tonos TEXT,
  hallazgos TEXT,
  svg_hue TEXT,
  preview_url TEXT,
  lesion_id INTEGER,
  paciente_id INTEGER,
  profesional_id INTEGER,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesion_id) REFERENCES lesiones(id) ON DELETE SET NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
  FOREIGN KEY (profesional_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- -------------------------------------------------
-- Casos de estudio del profesional (marcar pacientes/lesiones)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS casos_estudio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profesional_id INTEGER NOT NULL,
  paciente_id INTEGER,
  lesion_id INTEGER,
  titulo TEXT NOT NULL,
  diagnostico TEXT,
  riesgo TEXT,
  etiquetas TEXT,
  descripcion TEXT,
  privado INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
  FOREIGN KEY (lesion_id) REFERENCES lesiones(id) ON DELETE SET NULL,
  FOREIGN KEY (profesional_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- Alertas clínicas descartadas por el profesional
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas_descartadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profesional_id INTEGER NOT NULL,
  alerta_key TEXT NOT NULL,
  descartada_en TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(profesional_id, alerta_key)
);

-- -------------------------------------------------
-- Dataset HAM10000 (metadata en SQLite, imágenes como archivos estáticos)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS ham_images (
  image_id TEXT PRIMARY KEY,
  lesion_id TEXT,
  dx TEXT,
  dx_type TEXT,
  age TEXT,
  sex TEXT,
  localization TEXT,
  image_path TEXT,
  part INTEGER CHECK (part IN (1,2))
);

-- -------------------------------------------------
-- Clínica: sucursales
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS sucursales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  telefono TEXT,
  total_boxes INTEGER DEFAULT 0,
  active_doctors INTEGER DEFAULT 0,
  devices_count INTEGER DEFAULT 0
);

-- -------------------------------------------------
-- Clínica: staff médico
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_clinica (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL CHECK (rol IN ('Dermatólogo Titular','Dermatólogo Staff','Médico General','Enfermera / Técnico Captura','Secretaría / Recepción')),
  medical_license TEXT,
  specialty TEXT,
  status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo','Vacaciones','Inactivo')),
  assigned_branch_id INTEGER,
  can_sign_biopsy INTEGER DEFAULT 0,
  can_execute_ai INTEGER DEFAULT 0,
  has_digital_signature_uploaded INTEGER DEFAULT 0,
  patients_assigned_count INTEGER DEFAULT 0,
  monthly_evaluations INTEGER DEFAULT 0,
  FOREIGN KEY (assigned_branch_id) REFERENCES sucursales(id) ON DELETE SET NULL
);

-- -------------------------------------------------
-- Clínica: dispositivos (dermatoscopios)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL CHECK (model IN ('DermLite DL4','DermLite Foto II Pro','Handyscope 3','FotoFinder Medicam 1000','Firefly DE300')),
  lens_type TEXT,
  branch_id INTEGER,
  branch_name TEXT,
  assigned_box TEXT,
  status TEXT NOT NULL DEFAULT 'Operativo' CHECK (status IN ('Operativo','En Calibración','Mantenimiento')),
  battery_level INTEGER DEFAULT 100,
  last_calibration_date TEXT,
  total_captures_made INTEGER DEFAULT 0,
  FOREIGN KEY (branch_id) REFERENCES sucursales(id) ON DELETE SET NULL
);

-- -------------------------------------------------
-- Clínica: protocolos clínicos
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS protocolos_clinicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  urgency_tds_threshold REAL DEFAULT 5.15,
  growth_delta_threshold_mm_per_month REAL DEFAULT 0.20,
  mandatory_biopsy_checklist INTEGER DEFAULT 1,
  enable_patient_telemonitoring INTEGER DEFAULT 1,
  auto_notify_referral_doctor INTEGER DEFAULT 1,
  require_two_specialists_for_high_atipia INTEGER DEFAULT 0,
  clinic_legal_disclaimer TEXT,
  report_header_title TEXT,
  clinic_logo_url TEXT,
  updated_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -------------------------------------------------
-- SuperAdmin: modelos IA
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS modelos_ia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Producción','Staging','Retirado','Entrenamiento')),
  framework TEXT,
  accuracy_top1 REAL,
  sensitivity_melanoma REAL,
  specificity_nevus REAL,
  avg_latency_ms INTEGER,
  inferences_24h INTEGER DEFAULT 0,
  gpu_memory_usage_mb INTEGER,
  last_updated TEXT,
  description TEXT
);

-- -------------------------------------------------
-- SuperAdmin: discrepancias biopsia
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS discrepancias_biopsia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  tenant_name TEXT,
  lesion_tag TEXT,
  ai_prediction TEXT,
  ai_confidence REAL,
  pathology_diagnosis TEXT,
  discrepancy_type TEXT NOT NULL CHECK (discrepancy_type IN ('Falso Positivo','Falso Negativo','Subestimación Atipia')),
  reported_by TEXT,
  re_train_status TEXT NOT NULL DEFAULT 'En Cola de Reentrenamiento' CHECK (re_train_status IN ('En Cola de Reentrenamiento','Auditado','Ignorado'))
);

-- -------------------------------------------------
-- SuperAdmin: audit logs
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  tenant_name TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  severity TEXT NOT NULL DEFAULT 'Info' CHECK (severity IN ('Info','Warning','Critical')),
  details TEXT
);

-- -------------------------------------------------
-- SuperAdmin: facturas SaaS
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas_saas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_name TEXT NOT NULL,
  date TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pagada','Pendiente','Fallida')),
  tier TEXT,
  overage_scans INTEGER DEFAULT 0,
  payment_method TEXT
);

-- -------------------------------------------------
-- Índices
-- -------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lesiones_paciente ON lesiones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_lesiones_creado_en ON lesiones(creado_en);
CREATE INDEX IF NOT EXISTS idx_seguimientos_lesion ON seguimientos(lesion_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_fecha ON seguimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_seguimiento_fotos_seg ON seguimiento_fotos(seguimiento_id);
CREATE INDEX IF NOT EXISTS idx_vinculaciones_paciente ON vinculaciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_vinculaciones_profesional ON vinculaciones(profesional_id);
CREATE INDEX IF NOT EXISTS idx_registros_paciente ON registros_fotos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_registros_profesional ON registros_fotos(profesional_id);
CREATE INDEX IF NOT EXISTS idx_ham_dx ON ham_images(dx);
CREATE INDEX IF NOT EXISTS idx_ham_localization ON ham_images(localization);
CREATE INDEX IF NOT EXISTS idx_ham_sex ON ham_images(sex);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_name);

-- -------------------------------------------------
-- Configuración de perfil profesional (JSON por secciones)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS profesional_config (
  usuario_id INTEGER PRIMARY KEY,
  perfil TEXT,
  clinica TEXT,
  preferencias TEXT,
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
