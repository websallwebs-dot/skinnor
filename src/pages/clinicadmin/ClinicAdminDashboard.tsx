import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building,
  Camera,
  FileCheck2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  TrendingUp,
  Cpu,
  FileText,
  DoorOpen,
  CheckCircle2,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import {
  INITIAL_CLINIC_STAFF,
  INITIAL_CLINIC_BRANCHES,
  INITIAL_DEVICES,
  INITIAL_PROTOCOL_CONFIG
} from './clinicAdminData';

interface ClinicAdminDashboardProps {
  onNavigateToStaff?: () => void;
  onNavigateToDevices?: () => void;
  onNavigateToProtocols?: () => void;
}

export default function ClinicAdminDashboard({
  onNavigateToStaff,
  onNavigateToDevices,
  onNavigateToProtocols
}: ClinicAdminDashboardProps) {
  const navigate = useNavigate();

  const handleGoToStaff = () => {
    if (onNavigateToStaff) onNavigateToStaff();
    else navigate('/clinic/staff');
  };

  const handleGoToDevices = () => {
    if (onNavigateToDevices) onNavigateToDevices();
    else navigate('/clinic/devices');
  };

  const handleGoToProtocols = () => {
    if (onNavigateToProtocols) onNavigateToProtocols();
    else navigate('/clinic/protocols');
  };

  const scansUsed = 842;
  const scansLimit = 1200;
  const scanPercentage = Math.round((scansUsed / scansLimit) * 100);

  const activeDoctors = INITIAL_CLINIC_STAFF.filter(s => s.status === 'Activo').length;
  const operationalDevices = INITIAL_DEVICES.filter(d => d.status === 'Operativo').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Sede Principal • Plan Hospital Enterprise
            </span>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
              Subdominio: santamaria.skinnor.io
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Panel de Administración — Clínica Dermatológica Santa María
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de equipo médico, sedes, dermatoscopios ópticos, protocolos clínicos y cuotas mensuales.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleGoToStaff}
            className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Invitar Médico
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToProtocols}
            className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <FileCheck2 className="h-3.5 w-3.5 mr-1" /> Configurar Protocolos
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Staff Médico Activo</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{activeDoctors}</span>
            <span className="text-xs text-emerald-700 font-medium">100% operativos</span>
          </div>
          <p className="text-[11px] text-slate-500">
            3 con permiso de firma de biopsia
          </p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cuota de Escaneos IA</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{scansUsed} / {scansLimit}</span>
            <span className="text-xs text-sky-700 font-medium">{scanPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${scanPercentage}%` }}></div>
          </div>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Dermatoscopios Vinculados</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{operationalDevices}</span>
            <span className="text-xs text-amber-700 font-medium">2 Sedes</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Calibración óptica al día
          </p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tiempo Triage Telederm.</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">4.2 hrs</span>
            <span className="text-xs text-indigo-700 font-medium">&lt; 24h SLA</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Resolución rápida de casos
          </p>
        </Card>
      </div>

      {/* Main Grid: Staff overview & Devices */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Medical Staff Summary (7 cols) */}
        <Card className="lg:col-span-7 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-700" />
                Equipo Médico & Asignación de Roles
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Profesionales autorizados para emitir informes y validar segmentación IA.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToStaff}
              className="text-xs h-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              Ver Todos <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {INITIAL_CLINIC_STAFF.map((staff) => (
              <div 
                key={staff.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    {staff.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{staff.name}</div>
                    <div className="text-[11px] text-slate-500">{staff.role} • {staff.assignedBranch}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="hidden sm:block text-[11px] text-slate-500">
                    <div>{staff.monthlyEvaluations} evaluaciones/mes</div>
                    <div className="font-mono">{staff.medicalLicense}</div>
                  </div>
                  {staff.canSignBiopsy && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Firma Biopsia
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Branches & Hardware Quick Panel (5 cols) */}
        <Card className="lg:col-span-5 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-700" />
                Dermatoscopios en Consulta
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Equipos vinculados a boxes y médicos.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToDevices}
              className="text-xs h-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              Inventario <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {INITIAL_DEVICES.map((dev) => (
              <div 
                key={dev.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white transition-all space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{dev.model}</span>
                  <span className="text-[10px] font-mono text-slate-500">{dev.serialNumber}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {dev.assignedBox} ({dev.branchName.split(' ')[0]})
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Batería: <strong>{dev.batteryLevel}%</strong></span>
                  <span>Calibrado: {dev.lastCalibrationDate}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Clinical Protocols & Trigger Thresholds Card */}
      <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-emerald-700" />
              Protocolos de Alerta Temprana & Plantillas de Informe
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Umbrales configurados para derivación automática a dermatólogo especialista y parámetros del informe PDF.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToProtocols}
            className="text-xs h-7 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            Ajustar Parámetros <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Umbral Alerta Stolz TDS</span>
            <span className="text-base font-bold text-rose-700 tabular-nums">&gt; {INITIAL_PROTOCOL_CONFIG.urgencyTdsThreshold}</span>
            <p className="text-[11px] text-slate-500">
              Genera alerta de prioridad alta para citar a biopsia.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Crecimiento Radial Crítico</span>
            <span className="text-base font-bold text-slate-900 tabular-nums">&gt; {INITIAL_PROTOCOL_CONFIG.growthDeltaThresholdMmPerMonth} mm / mes</span>
            <p className="text-[11px] text-slate-500">
              Dispara recomendación de escisión preventiva.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Membrete en Informes PDF</span>
            <span className="text-xs font-bold text-slate-900 line-clamp-1">{INITIAL_PROTOCOL_CONFIG.reportHeaderTitle}</span>
            <p className="text-[11px] text-slate-500">
              Incluye firma digitalizada y número de registro médico.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
