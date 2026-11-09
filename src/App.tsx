import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Toaster } from 'sonner';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';

// ─── DASHBOARD MODULES ────────────────────────────────────────────────────────
import {
  Patient,
  PatientLayout,
  Professional,
  ProfessionalLayout,
  Professional as ProfessionalModule,
  ClinicAdmin,
  ClinicAdminLayout,
  SuperAdmin,
  SuperAdminLayout,
} from './dashboards';

// Componente para proteger las rutas
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* 1. Patient Portal Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <PatientLayout />
              </ProtectedRoute>
            } 
          >
            <Route index element={<Patient.DashboardHome />} />
            <Route path="perfil" element={<Patient.Profile />} />
            <Route path="seguimientos/crear" element={<Patient.SeguimientosCreate />} />
            <Route path="lesiones" element={<Patient.LesionesList />} />
            <Route path="lesiones/crear" element={<Patient.LesionesCreate />} />
            <Route path="lesiones/:id" element={<Patient.LesionDetail />} />
            <Route path="consultas" element={<Patient.ConsultasList />} />
            <Route path="evolucion" element={<Patient.Evolucion />} />
          </Route>
          
          {/* 2. Professional Specialist Portal Dashboard */}
          <Route 
            path="/pro" 
            element={
              <ProtectedRoute>
                <ProfessionalLayout />
              </ProtectedRoute>
            } 
          >
            <Route index element={<Professional.ProDashboard />} />
            <Route path="alertas" element={<Professional.Alertas />} />
            <Route path="pacientes" element={<Professional.PacientesList />} />
            <Route path="pacientes/crear" element={<Professional.PacientesCreate />} />
            <Route path="pacientes/:id" element={<Professional.PacienteDetail />} />
            <Route path="consultas" element={<Professional.ConsultasInbox />} />
            <Route path="enlaces" element={<Professional.SolicitudesEnlaces />} />
            <Route path="dataset" element={<Professional.DatasetSearch />} />
            <Route path="mis-datasets" element={<Professional.MyDatasets />} />
            <Route path="mis-datasets/crear" element={<Professional.DatasetBuilder />} />
            <Route path="casos" element={<Professional.CasosEstudio />} />
            <Route path="casos-similares" element={<Professional.CasosSimilares />} />
            <Route path="casos/crear" element={<Professional.CasosCreate />} />
            <Route path="configuracion" element={<Professional.Configuracion />} />
            <Route path="ham-explorer" element={<Professional.HamExplorer />} />
          </Route>

          {/* 3. Super Admin Platform HQ Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperAdmin.SuperAdminDashboard />} />
            <Route path="tenants" element={<SuperAdmin.TenantsManagement />} />
            <Route path="ia-governance" element={<SuperAdmin.IaGovernance />} />
            <Route path="compliance" element={<SuperAdmin.ComplianceAudit />} />
            <Route path="billing" element={<SuperAdmin.SaasBilling />} />
            <Route path="configuracion" element={<SuperAdmin.SuperAdminConfig />} />
          </Route>

          {/* 4. Clinic Admin Tenant HQ Dashboard */}
          <Route
            path="/clinic"
            element={
              <ProtectedRoute>
                <ClinicAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClinicAdmin.ClinicAdminDashboard />} />
            <Route path="staff" element={<ClinicAdmin.ClinicStaffManagement />} />
            <Route path="devices" element={<ClinicAdmin.DeviceInventory />} />
            <Route path="protocols" element={<ClinicAdmin.ProtocolSettings />} />
            <Route path="branches" element={<ClinicAdmin.ClinicBranchesManagement />} />
          </Route>
          
          {/* Fallback to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
