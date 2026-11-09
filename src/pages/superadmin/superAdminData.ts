export interface TenantOrganization {
  id: string;
  name: string;
  subdomain: string;
  tier: 'Starter Clinic' | 'Pro Clinic' | 'Enterprise Hospital' | 'Network Group';
  status: 'Activo' | 'Periodo de Prueba' | 'Suspended' | 'Auditoría';
  createdAt: string;
  country: string;
  doctorsCount: number;
  patientsCount: number;
  storageUsedGb: number;
  storageLimitGb: number;
  monthlyScansUsed: number;
  monthlyScansLimit: number;
  mrrUsd: number;
  contactEmail: string;
  customDomain?: string;
  hipaaAgreementSigned: boolean;
}

export interface AIModelTelemetry {
  modelId: string;
  name: string;
  version: string;
  status: 'Producción' | 'Staging' | 'Retirado' | 'Entrenamiento';
  framework: string;
  accuracyTop1: number;
  sensitivityMelanoma: number;
  specificityNevus: number;
  avgLatencyMs: number;
  inferences24h: number;
  gpuMemoryUsageMb: number;
  lastUpdated: string;
  description: string;
}

export interface BiopsyDiscrepancyLog {
  id: string;
  date: string;
  tenantName: string;
  lesionTag: string;
  aiPrediction: string;
  aiConfidence: number;
  pathologyDiagnosis: string;
  discrepancyType: 'Falso Positivo' | 'Falso Negativo' | 'Subestimación Atipia';
  reportedBy: string;
  reTrainStatus: 'En Cola de Reentrenamiento' | 'Auditado' | 'Ignorado';
}

export interface GlobalAuditLog {
  id: string;
  timestamp: string;
  tenantName: string;
  userName: string;
  userRole: string;
  action: 'EXPORT_PATIENT_DICOM' | 'UPDATE_DIAGNOSIS_PROTOCOL' | 'PROVISION_TENANT' | 'OVERRIDE_AI_SCORE' | 'USER_ROLE_ELEVATED' | 'API_KEY_ROTATED' | 'TENANT_SUSPENDED';
  ipAddress: string;
  severity: 'Info' | 'Warning' | 'Critical';
  details: string;
}

export interface SaasInvoice {
  id: string;
  tenantName: string;
  date: string;
  amountUsd: number;
  status: 'Pagada' | 'Pendiente' | 'Fallida';
  tier: string;
  overageScans: number;
  paymentMethod: string;
}

export const INITIAL_TENANTS: TenantOrganization[] = [
  {
    id: 'TEN-001',
    name: 'Clínica Dermatológica Santa María',
    subdomain: 'santamaria.skinnor.io',
    tier: 'Enterprise Hospital',
    status: 'Activo',
    createdAt: '2025-11-10',
    country: 'Chile',
    doctorsCount: 18,
    patientsCount: 1420,
    storageUsedGb: 142.5,
    storageLimitGb: 500,
    monthlyScansUsed: 842,
    monthlyScansLimit: 1200,
    mrrUsd: 1850,
    contactEmail: 'admin@clinicasantamaria.cl',
    customDomain: 'dermatologia.clinicasantamaria.cl',
    hipaaAgreementSigned: true,
  },
  {
    id: 'TEN-002',
    name: 'Instituto Dermatológico Las Condes',
    subdomain: 'dermacondes.skinnor.io',
    tier: 'Pro Clinic',
    status: 'Activo',
    createdAt: '2026-01-15',
    country: 'Chile',
    doctorsCount: 8,
    patientsCount: 680,
    storageUsedGb: 68.2,
    storageLimitGb: 200,
    monthlyScansUsed: 490,
    monthlyScansLimit: 600,
    mrrUsd: 890,
    contactEmail: 'teledermatologia@dermacondes.cl',
    hipaaAgreementSigned: true,
  },
  {
    id: 'TEN-003',
    name: 'Hospital Universitario San Juan',
    subdomain: 'sanjuan-salud.skinnor.io',
    tier: 'Network Group',
    status: 'Activo',
    createdAt: '2025-08-20',
    country: 'Colombia',
    doctorsCount: 34,
    patientsCount: 3120,
    storageUsedGb: 318.0,
    storageLimitGb: 1000,
    monthlyScansUsed: 2150,
    monthlyScansLimit: 3000,
    mrrUsd: 3450,
    contactEmail: 'dermatologia@hospitalsanjuan.org',
    customDomain: 'skin.hospitalsanjuan.org',
    hipaaAgreementSigned: true,
  },
  {
    id: 'TEN-004',
    name: 'Centro Melanoma & Nevus Monterrey',
    subdomain: 'melanomamty.skinnor.io',
    tier: 'Pro Clinic',
    status: 'Periodo de Prueba',
    createdAt: '2026-07-28',
    country: 'México',
    doctorsCount: 5,
    patientsCount: 210,
    storageUsedGb: 19.4,
    storageLimitGb: 200,
    monthlyScansUsed: 145,
    monthlyScansLimit: 600,
    mrrUsd: 890,
    contactEmail: 'contacto@melanomamty.mx',
    hipaaAgreementSigned: true,
  },
  {
    id: 'TEN-005',
    name: 'Unidad de Fototerapia & Teledermatología BA',
    subdomain: 'fotoba.skinnor.io',
    tier: 'Starter Clinic',
    status: 'Activo',
    createdAt: '2026-03-04',
    country: 'Argentina',
    doctorsCount: 3,
    patientsCount: 185,
    storageUsedGb: 14.8,
    storageLimitGb: 100,
    monthlyScansUsed: 110,
    monthlyScansLimit: 250,
    mrrUsd: 420,
    contactEmail: 'dr.alvarez@fotoba.com.ar',
    hipaaAgreementSigned: true,
  }
];

export const INITIAL_AI_MODELS: AIModelTelemetry[] = [
  {
    modelId: 'MDL-SEG-01',
    name: 'Skinnor U-Net MaskLesion',
    version: 'v2.4.2-prod',
    status: 'Producción',
    framework: 'PyTorch / TensorRT',
    accuracyTop1: 96.8,
    sensitivityMelanoma: 97.4,
    specificityNevus: 94.1,
    avgLatencyMs: 142,
    inferences24h: 3890,
    gpuMemoryUsageMb: 2450,
    lastUpdated: '2026-08-01',
    description: 'Segmentación del contorno de lesión y cálculo de asimetría bi-axial.'
  },
  {
    modelId: 'MDL-CLS-02',
    name: 'ISIC DeepClassifier DenseNet',
    version: 'v3.1.0-prod',
    status: 'Producción',
    framework: 'PyTorch / ONNX Runtime',
    accuracyTop1: 94.2,
    sensitivityMelanoma: 98.1,
    specificityNevus: 92.5,
    avgLatencyMs: 198,
    inferences24h: 3890,
    gpuMemoryUsageMb: 3120,
    lastUpdated: '2026-07-15',
    description: 'Clasificación multiclase de lesiones melanocíticas vs queratosis seborreica y carcinoma basocelular.'
  },
  {
    modelId: 'MDL-TDS-03',
    name: 'Stolz Rule Telemetry Engine',
    version: 'v1.8.5-prod',
    status: 'Producción',
    framework: 'Native WASM / Rust Core',
    accuracyTop1: 99.1,
    sensitivityMelanoma: 96.0,
    specificityNevus: 97.2,
    avgLatencyMs: 18,
    inferences24h: 4250,
    gpuMemoryUsageMb: 320,
    lastUpdated: '2026-06-20',
    description: 'Motor analítico determinístico para cálculo estandarizado del Total Dermatoscopy Score.'
  },
  {
    modelId: 'MDL-EXP-04',
    name: 'Vision Transformer ViT-SkinViT',
    version: 'v4.0.0-rc2',
    status: 'Staging',
    framework: 'PyTorch / JAX',
    accuracyTop1: 97.5,
    sensitivityMelanoma: 98.9,
    specificityNevus: 95.8,
    avgLatencyMs: 240,
    inferences24h: 120,
    gpuMemoryUsageMb: 4800,
    lastUpdated: '2026-08-14',
    description: 'Modelo de atención cruzada experimental con capacidad de explicación por mapa de atención visual.'
  }
];

export const INITIAL_DISCREPANCIES: BiopsyDiscrepancyLog[] = [
  {
    id: 'DISC-2026-089',
    date: '14 Ago 2026',
    tenantName: 'Clínica Santa María',
    lesionTag: 'T5-ESPALDA',
    aiPrediction: 'Nevo Displásico Alto Grado (Score TDS 5.75)',
    aiConfidence: 89.2,
    pathologyDiagnosis: 'Melanoma In Situ Breslow 0.2mm',
    discrepancyType: 'Subestimación Atipia',
    reportedBy: 'Dr. Diego Muñoz',
    reTrainStatus: 'En Cola de Reentrenamiento'
  },
  {
    id: 'DISC-2026-074',
    date: '02 Ago 2026',
    tenantName: 'Hospital San Juan',
    lesionTag: 'HOMBRO-DER-02',
    aiPrediction: 'Sospecha Melanoma Lentiginoso',
    aiConfidence: 78.4,
    pathologyDiagnosis: 'Queratosis Seborreica Reticulada Pigmentada',
    discrepancyType: 'Falso Positivo',
    reportedBy: 'Dra. Sandra Ortiz',
    reTrainStatus: 'Auditado'
  }
];

export const INITIAL_GLOBAL_AUDIT_LOGS: GlobalAuditLog[] = [
  {
    id: 'LOG-9481',
    timestamp: '16 Ago 2026 14:15:22',
    tenantName: 'Clínica Santa María',
    userName: 'Dr. Diego Muñoz',
    userRole: 'Dermatólogo Especialista',
    action: 'EXPORT_PATIENT_DICOM',
    ipAddress: '190.161.44.12',
    severity: 'Info',
    details: 'Exportación masiva de serie temporal epiluminiscencia T0-T5 para paciente Sofía Valenzuela (Ficha #9482).'
  },
  {
    id: 'LOG-9480',
    timestamp: '16 Ago 2026 13:40:05',
    tenantName: 'Skinnor Global SaaS HQ',
    userName: 'Ing. Carlos Mendoza',
    userRole: 'Super Admin',
    action: 'PROVISION_TENANT',
    ipAddress: '186.105.12.80',
    severity: 'Info',
    details: 'Aprovisionamiento de nuevo subdominio seguro para Centro Melanoma & Nevus Monterrey.'
  },
  {
    id: 'LOG-9479',
    timestamp: '16 Ago 2026 11:20:18',
    tenantName: 'Hospital San Juan',
    userName: 'Dra. Sandra Ortiz',
    userRole: 'Jefe Servicio Dermatología',
    action: 'UPDATE_DIAGNOSIS_PROTOCOL',
    ipAddress: '181.129.80.3',
    severity: 'Warning',
    details: 'Reducción de umbral de derivación urgente de TDS 5.45 a TDS 5.15 en protocolo hospitalario.'
  },
  {
    id: 'LOG-9478',
    timestamp: '15 Ago 2026 19:12:44',
    tenantName: 'Clínica Santa María',
    userName: 'Dra. Marcela Lagos',
    userRole: 'Clinic Admin',
    action: 'USER_ROLE_ELEVATED',
    ipAddress: '190.161.44.10',
    severity: 'Warning',
    details: 'Asignación de privilegios de firma de biopsia al Dr. Ignacio Pavez.'
  }
];

export const INITIAL_SAAS_INVOICES: SaasInvoice[] = [
  {
    id: 'INV-2026-0801',
    tenantName: 'Clínica Dermatológica Santa María',
    date: '01 Ago 2026',
    amountUsd: 1850.00,
    status: 'Pagada',
    tier: 'Enterprise Hospital',
    overageScans: 0,
    paymentMethod: 'Tarjeta Corporativa Visa •••• 9812'
  },
  {
    id: 'INV-2026-0802',
    tenantName: 'Hospital Universitario San Juan',
    date: '01 Ago 2026',
    amountUsd: 3650.00,
    status: 'Pagada',
    tier: 'Network Group',
    overageScans: 200,
    paymentMethod: 'Transferencia SWIFT / Facturación Hospitalaria'
  },
  {
    id: 'INV-2026-0803',
    tenantName: 'Instituto Dermatológico Las Condes',
    date: '01 Ago 2026',
    amountUsd: 890.00,
    status: 'Pagada',
    tier: 'Pro Clinic',
    overageScans: 0,
    paymentMethod: 'Mastercard Corporativa •••• 4120'
  },
  {
    id: 'INV-2026-0804',
    tenantName: 'Unidad de Fototerapia & Teledermatología BA',
    date: '01 Ago 2026',
    amountUsd: 420.00,
    status: 'Pagada',
    tier: 'Starter Clinic',
    overageScans: 0,
    paymentMethod: 'MercadoPago Empresas'
  }
];
