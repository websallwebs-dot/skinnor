import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

// --- SUCURSALES ---
router.get('/sucursales', (_req, res) => {
  const rows = all('SELECT * FROM sucursales ORDER BY nombre');
  res.json(rows);
});

router.post('/sucursales', (req, res) => {
  const { nombre, direccion, ciudad, telefono, total_boxes, active_doctors, devices_count } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
  const result = run(
    'INSERT INTO sucursales (nombre, direccion, ciudad, telefono, total_boxes, active_doctors, devices_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre, direccion || null, ciudad || null, telefono || null, total_boxes || 0, active_doctors || 0, devices_count || 0]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// --- STAFF ---
router.get('/staff', (req, res) => {
  const { assigned_branch_id } = req.query;
  let sql = 'SELECT * FROM staff_clinica WHERE 1=1';
  const params: any[] = [];
  if (assigned_branch_id) {
    sql += ' AND assigned_branch_id = ?';
    params.push(assigned_branch_id);
  }
  sql += ' ORDER BY nombre';
  const rows = all(sql, params);
  res.json(rows);
});

router.post('/staff', (req, res) => {
  const { nombre, email, rol, medical_license, specialty, status, assigned_branch_id, can_sign_biopsy, can_execute_ai, has_digital_signature_uploaded, patients_assigned_count, monthly_evaluations } = req.body;
  if (!nombre || !email || !rol) return res.status(400).json({ error: 'nombre, email y rol requeridos' });
  const result = run(
    `INSERT INTO staff_clinica (nombre, email, rol, medical_license, specialty, status, assigned_branch_id, can_sign_biopsy, can_execute_ai, has_digital_signature_uploaded, patients_assigned_count, monthly_evaluations)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, email, rol, medical_license || null, specialty || null, status || 'Activo', assigned_branch_id || null, can_sign_biopsy ? 1 : 0, can_execute_ai ? 1 : 0, has_digital_signature_uploaded ? 1 : 0, patients_assigned_count || 0, monthly_evaluations || 0]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/staff/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, status } = req.body;
  run(
    'UPDATE staff_clinica SET nombre = COALESCE(?, nombre), email = COALESCE(?, email), rol = COALESCE(?, rol), status = COALESCE(?, status) WHERE id = ?',
    [nombre, email, rol, status, id]
  );
  res.json({ success: true });
});

// --- DISPOSITIVOS ---
router.get('/dispositivos', (req, res) => {
  const { branch_id } = req.query;
  let sql = 'SELECT * FROM dispositivos WHERE 1=1';
  const params: any[] = [];
  if (branch_id) {
    sql += ' AND branch_id = ?';
    params.push(branch_id);
  }
  sql += ' ORDER BY serial_number';
  const rows = all(sql, params);
  res.json(rows);
});

router.post('/dispositivos', (req, res) => {
  const { serial_number, model, lens_type, branch_id, branch_name, assigned_box, status, battery_level, last_calibration_date, total_captures_made } = req.body;
  if (!serial_number || !model) return res.status(400).json({ error: 'serial_number y model requeridos' });
  const result = run(
    `INSERT INTO dispositivos (serial_number, model, lens_type, branch_id, branch_name, assigned_box, status, battery_level, last_calibration_date, total_captures_made)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [serial_number, model, lens_type || null, branch_id || null, branch_name || null, assigned_box || null, status || 'Operativo', battery_level || 100, last_calibration_date || null, total_captures_made || 0]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// --- PROTOCOLO CLÍNICO ---
router.get('/protocolo', (_req, res) => {
  const row = get('SELECT * FROM protocolos_clinicos ORDER BY id DESC LIMIT 1');
  res.json(row || {});
});

router.put('/protocolo', (req, res) => {
  const { urgency_tds_threshold, growth_delta_threshold_mm_per_month, mandatory_biopsy_checklist, enable_patient_telemonitoring, auto_notify_referral_doctor, require_two_specialists_for_high_atipia, clinic_legal_disclaimer, report_header_title, clinic_logo_url } = req.body;
  const existing = get('SELECT id FROM protocolos_clinicos LIMIT 1');
  if (existing) {
    run(
      `UPDATE protocolos_clinicos SET urgency_tds_threshold = COALESCE(?, urgency_tds_threshold),
       growth_delta_threshold_mm_per_month = COALESCE(?, growth_delta_threshold_mm_per_month),
       mandatory_biopsy_checklist = COALESCE(?, mandatory_biopsy_checklist),
       enable_patient_telemonitoring = COALESCE(?, enable_patient_telemonitoring),
       auto_notify_referral_doctor = COALESCE(?, auto_notify_referral_doctor),
       require_two_specialists_for_high_atipia = COALESCE(?, require_two_specialists_for_high_atipia),
       clinic_legal_disclaimer = COALESCE(?, clinic_legal_disclaimer),
       report_header_title = COALESCE(?, report_header_title),
       clinic_logo_url = COALESCE(?, clinic_logo_url),
       updated_en = datetime('now') WHERE id = ?`,
      [urgency_tds_threshold, growth_delta_threshold_mm_per_month, mandatory_biopsy_checklist, enable_patient_telemonitoring, auto_notify_referral_doctor, require_two_specialists_for_high_atipia, clinic_legal_disclaimer, report_header_title, clinic_logo_url, existing.id]
    );
  } else {
    run(
      `INSERT INTO protocolos_clinicos (urgency_tds_threshold, growth_delta_threshold_mm_per_month, mandatory_biopsy_checklist, enable_patient_telemonitoring, auto_notify_referral_doctor, require_two_specialists_for_high_atipia, clinic_legal_disclaimer, report_header_title, clinic_logo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [urgency_tds_threshold, growth_delta_threshold_mm_per_month, mandatory_biopsy_checklist, enable_patient_telemonitoring, auto_notify_referral_doctor, require_two_specialists_for_high_atipia, clinic_legal_disclaimer, report_header_title, clinic_logo_url]
    );
  }
  res.json({ success: true });
});

export default router;
