export interface ClinicStaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Dermatólogo Titular' | 'Dermatólogo Staff' | 'Médico General' | 'Enfermera / Técnico Captura' | 'Secretaría / Recepción';
  medicalLicense: string;
  specialty: string;
  status: 'Activo' | 'Vacaciones' | 'Inactivo';
  assignedBranch: string;
  canSignBiopsy: boolean;
  canExecuteAi: boolean;
  hasDigitalSignatureUploaded: boolean;
  patientsAssignedCount: number;
  monthlyEvaluations: number;
}

export interface ClinicBranch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  totalBoxes: number;
  activeDoctors: number;
  devicesCount: number;
}

export interface DermatoscopeDevice {
  id: string;
  serialNumber: string;
  model: 'DermLite DL4' | 'DermLite Foto II Pro' | 'Handyscope 3' | 'FotoFinder Medicam 1000' | 'Firefly DE300';
  lensType: 'Polarizada / No Polarizada (Luz Cruzada)' | 'Óptica Inmersión Líquida' | 'HD Multiespectral';
  branchId: string;
  branchName: string;
  assignedBox: string;
  status: 'Operativo' | 'En Calibración' | 'Mantenimiento';
  batteryLevel: number;
  lastCalibrationDate: string;
  totalCapturesMade: number;
}

export interface ClinicalProtocolConfig {
  urgencyTdsThreshold: number; // e.g. 5.15
  growthDeltaThresholdMmPerMonth: number; // e.g. 0.20
  mandatoryBiopsyCheckList: boolean;
  enablePatientTelemonitoring: boolean;
  autoNotifyReferralDoctor: boolean;
  requireTwoSpecialistsForHighAtipia: boolean;
  clinicReportLogoUrl?: string;
  clinicLegalDisclaimer: string;
  reportHeaderTitle: string;
}

export const INITIAL_CLINIC_STAFF: ClinicStaffMember[] = [
  {
    id: 'STF-001',
    name: 'Dr. Diego Muñoz',
    email: 'd.munoz@clinicasantamaria.cl',
    role: 'Dermatólogo Titular',
    medicalLicense: 'RCM-49821-CL',
    specialty: 'Dermatología Oncológica & Epiluminiscencia',
    status: 'Activo',
    assignedBranch: 'Sede Central Providencia',
    canSignBiopsy: true,
    canExecuteAi: true,
    hasDigitalSignatureUploaded: true,
    patientsAssignedCount: 142,
    monthlyEvaluations: 88
  },
  {
    id: 'STF-002',
    name: 'Dra. Marcela Lagos',
    email: 'm.lagos@clinicasantamaria.cl',
    role: 'Dermatólogo Titular',
    medicalLicense: 'RCM-38291-CL',
    specialty: 'Dermatología Quirúrgica & Cirugía Micrográfica Mohs',
    status: 'Activo',
    assignedBranch: 'Sede Central Providencia',
    canSignBiopsy: true,
    canExecuteAi: true,
    hasDigitalSignatureUploaded: true,
    patientsAssignedCount: 190,
    monthlyEvaluations: 112
  },
  {
    id: 'STF-003',
    name: 'Dr. Ignacio Pavez',
    email: 'i.pavez@clinicasantamaria.cl',
    role: 'Dermatólogo Staff',
    medicalLicense: 'RCM-51204-CL',
    specialty: 'Dermatoscopia Digital & Mapeo Corporal',
    status: 'Activo',
    assignedBranch: 'Sucursal Las Condes',
    canSignBiopsy: true,
    canExecuteAi: true,
    hasDigitalSignatureUploaded: true,
    patientsAssignedCount: 96,
    monthlyEvaluations: 64
  },
  {
    id: 'STF-004',
    name: 'Dra. Camila Soto',
    email: 'c.soto@clinicasantamaria.cl',
    role: 'Médico General',
    medicalLicense: 'RCM-63102-CL',
    specialty: 'Medicina General & Triage Teledermatológico',
    status: 'Activo',
    assignedBranch: 'Sucursal Las Condes',
    canSignBiopsy: false,
    canExecuteAi: true,
    hasDigitalSignatureUploaded: false,
    patientsAssignedCount: 65,
    monthlyEvaluations: 45
  },
  {
    id: 'STF-005',
    name: 'Enf. Rodrigo Araya',
    email: 'r.araya@clinicasantamaria.cl',
    role: 'Enfermera / Técnico Captura',
    medicalLicense: 'REG-ENF-8812',
    specialty: 'Fotografía Clínica Dermatológica & Calibración Óptica',
    status: 'Activo',
    assignedBranch: 'Sede Central Providencia',
    canSignBiopsy: false,
    canExecuteAi: true,
    hasDigitalSignatureUploaded: false,
    patientsAssignedCount: 0,
    monthlyEvaluations: 180
  }
];

export const INITIAL_CLINIC_BRANCHES: ClinicBranch[] = [
  {
    id: 'BR-01',
    name: 'Sede Central Providencia',
    address: 'Av. Santa María 0500, Edificio Médico A, Piso 4',
    city: 'Santiago, Chile',
    phone: '+56 2 2913 0000',
    totalBoxes: 6,
    activeDoctors: 12,
    devicesCount: 8
  },
  {
    id: 'BR-02',
    name: 'Sucursal Las Condes',
    address: 'Av. Las Condes 12430, Torre Médica B, Piso 2',
    city: 'Santiago, Chile',
    phone: '+56 2 2913 5500',
    totalBoxes: 3,
    activeDoctors: 6,
    devicesCount: 4
  }
];

export const INITIAL_DEVICES: DermatoscopeDevice[] = [
  {
    id: 'DEV-001',
    serialNumber: 'DL4-SN-98124',
    model: 'DermLite DL4',
    lensType: 'Polarizada / No Polarizada (Luz Cruzada)',
    branchId: 'BR-01',
    branchName: 'Sede Central Providencia',
    assignedBox: 'Box 401 — Consulta Dr. Muñoz',
    status: 'Operativo',
    batteryLevel: 94,
    lastCalibrationDate: '01 Ago 2026',
    totalCapturesMade: 1420
  },
  {
    id: 'DEV-002',
    serialNumber: 'HS3-SN-4102',
    model: 'Handyscope 3',
    lensType: 'Polarizada / No Polarizada (Luz Cruzada)',
    branchId: 'BR-01',
    branchName: 'Sede Central Providencia',
    assignedBox: 'Box 403 — Consulta Dra. Lagos',
    status: 'Operativo',
    batteryLevel: 88,
    lastCalibrationDate: '28 Jul 2026',
    totalCapturesMade: 980
  },
  {
    id: 'DEV-003',
    serialNumber: 'FF-MED-2044',
    model: 'FotoFinder Medicam 1000',
    lensType: 'HD Multiespectral',
    branchId: 'BR-01',
    branchName: 'Sede Central Providencia',
    assignedBox: 'Box Fotografía & Mapeo Corporal',
    status: 'Operativo',
    batteryLevel: 100,
    lastCalibrationDate: '10 Ago 2026',
    totalCapturesMade: 3240
  },
  {
    id: 'DEV-004',
    serialNumber: 'DL4-SN-99411',
    model: 'DermLite DL4',
    lensType: 'Polarizada / No Polarizada (Luz Cruzada)',
    branchId: 'BR-02',
    branchName: 'Sucursal Las Condes',
    assignedBox: 'Box 201 — Consulta Dr. Pavez',
    status: 'Operativo',
    batteryLevel: 76,
    lastCalibrationDate: '15 Jul 2026',
    totalCapturesMade: 610
  }
];

export const INITIAL_PROTOCOL_CONFIG: ClinicalProtocolConfig = {
  urgencyTdsThreshold: 5.15,
  growthDeltaThresholdMmPerMonth: 0.20,
  mandatoryBiopsyCheckList: true,
  enablePatientTelemonitoring: true,
  autoNotifyReferralDoctor: true,
  requireTwoSpecialistsForHighAtipia: false,
  clinicLegalDisclaimer: 'Este informe fue generado por el Servicio de Dermatología de Clínica Santa María. Los puntajes algorítmicos son herramientas auxiliares y no reemplazan el juicio clínico ni la confirmación histopatológica por biopsia.',
  reportHeaderTitle: 'Servicio de Dermatología & Unidad de Lesiones Pigmentadas'
};
