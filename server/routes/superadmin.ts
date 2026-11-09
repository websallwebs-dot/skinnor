import { Router } from 'express';
import { run, all, get } from '../db';

const router = Router();

// --- ORGANIZACIONES ---
router.get('/organizaciones', (_req, res) => {
  const rows = all('SELECT * FROM organizaciones ORDER BY nombre');
  res.json(rows);
});

router.post('/organizaciones', (req, res) => {
  const { nombre, subdomain, tier, status, country, contact_email, storage_limit_gb, monthly_scans_limit, mrr_usd, hipaa_agreement_signed } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
  const result = run(
    `INSERT INTO organizaciones (nombre, subdomain, tier, status, country, contact_email, storage_limit_gb, monthly_scans_limit, mrr_usd, hipaa_agreement_signed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, subdomain || null, tier || 'Starter Clinic', status || 'Activo', country || null, contact_email || null, storage_limit_gb || 100, monthly_scans_limit || 250, mrr_usd || 0, hipaa_agreement_signed ? 1 : 0]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// --- MODELOS IA ---
router.get('/modelos-ia', (_req, res) => {
  const rows = all('SELECT * FROM modelos_ia ORDER BY nombre');
  res.json(rows);
});

router.post('/modelos-ia', (req, res) => {
  const { model_id, nombre, version, status, framework, accuracy_top1, sensitivity_melanoma, specificity_nevus, avg_latency_ms, inferences_24h, gpu_memory_usage_mb, last_updated, description } = req.body;
  if (!model_id || !nombre || !version) return res.status(400).json({ error: 'model_id, nombre y version requeridos' });
  const result = run(
    `INSERT INTO modelos_ia (model_id, nombre, version, status, framework, accuracy_top1, sensitivity_melanoma, specificity_nevus, avg_latency_ms, inferences_24h, gpu_memory_usage_mb, last_updated, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [model_id, nombre, version, status || 'Staging', framework || null, accuracy_top1 || null, sensitivity_melanoma || null, specificity_nevus || null, avg_latency_ms || null, inferences_24h || 0, gpu_memory_usage_mb || null, last_updated || new Date().toISOString(), description || null]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/modelos-ia/:id', (req, res) => {
  const { id } = req.params;
  const { status, accuracy_top1, inferences_24h } = req.body;
  run(
    "UPDATE modelos_ia SET status = COALESCE(?, status), accuracy_top1 = COALESCE(?, accuracy_top1), inferences_24h = COALESCE(?, inferences_24h), last_updated = datetime('now') WHERE id = ?",
    [status, accuracy_top1, inferences_24h, id]
  );
  res.json({ success: true });
});

// --- DISCREPANCIAS BIOPSIA ---
router.get('/discrepancias', (_req, res) => {
  const rows = all('SELECT * FROM discrepancias_biopsia ORDER BY date DESC');
  res.json(rows);
});

router.post('/discrepancias', (req, res) => {
  const { date, tenant_name, lesion_tag, ai_prediction, ai_confidence, pathology_diagnosis, discrepancy_type, reported_by, re_train_status } = req.body;
  if (!date || !discrepancy_type) return res.status(400).json({ error: 'date y discrepancy_type requeridos' });
  const result = run(
    `INSERT INTO discrepancias_biopsia (date, tenant_name, lesion_tag, ai_prediction, ai_confidence, pathology_diagnosis, discrepancy_type, reported_by, re_train_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date, tenant_name || null, lesion_tag || null, ai_prediction || null, ai_confidence || null, pathology_diagnosis || null, discrepancy_type, reported_by || null, re_train_status || 'En Cola de Reentrenamiento']
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

// --- AUDITORÍA ---
router.get('/auditoria', (req, res) => {
  const { tenant_name, severity, limit = 100 } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];
  if (tenant_name) { sql += ' AND tenant_name = ?'; params.push(tenant_name); }
  if (severity) { sql += ' AND severity = ?'; params.push(severity); }
  sql += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(Number(limit));
  const rows = all(sql, params);
  res.json(rows);
});

// --- FACTURAS SAAS ---
router.get('/facturas', (_req, res) => {
  const rows = all('SELECT * FROM facturas_saas ORDER BY date DESC');
  res.json(rows);
});

router.post('/facturas', (req, res) => {
  const { tenant_name, date, amount_usd, status, tier, overage_scans, payment_method } = req.body;
  if (!tenant_name || !date || amount_usd === undefined) return res.status(400).json({ error: 'tenant_name, date y amount_usd requeridos' });
  const result = run(
    `INSERT INTO facturas_saas (tenant_name, date, amount_usd, status, tier, overage_scans, payment_method)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tenant_name, date, amount_usd, status || 'Pendiente', tier || null, overage_scans || 0, payment_method || null]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
