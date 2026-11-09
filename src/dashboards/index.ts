/**
 * Skinnor Multi-Tenant Dashboard Modules
 * Organized by Role & Domain Architecture
 */

// 1. Super Admin Dashboard (Platform HQ & Global SaaS Governance)
export * as SuperAdmin from '../pages/superadmin';
export { default as SuperAdminLayout } from '../layouts/SuperAdminLayout';

// 2. Clinic Admin Dashboard (Tenant HQ & Medical Center Operations)
export * as ClinicAdmin from '../pages/clinicadmin';
export { default as ClinicAdminLayout } from '../layouts/ClinicAdminLayout';

// 3. Professional Specialist Dashboard (Dermatology & AI-assisted Clinic)
export * as Professional from '../pages/professional';
export { default as ProfessionalLayout } from '../layouts/ProfessionalLayout';

// 4. Patient Portal Dashboard (Lesion Tracking & Tele-consultations)
export * as Patient from '../pages/patient';
export { default as PatientLayout } from '../layouts/DashboardLayout';
