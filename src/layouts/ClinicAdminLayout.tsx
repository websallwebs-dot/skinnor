import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../AuthContext';
import {
  Building2,
  Users,
  Camera,
  FileCheck2,
  LayoutDashboard,
  Activity,
  LogOut,
  ChevronDown,
  UserCheck,
  Stethoscope,
  User,
  ShieldCheck,
  DoorOpen,
  ArrowRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ClinicAdminLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavLinkClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    if (isActive) {
      return "flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2 text-white font-medium transition-all shadow-xs";
    }
    return "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 font-medium transition-all hover:bg-slate-100 hover:text-slate-900";
  };

  const getIconClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    return isActive ? "h-4 w-4 text-white" : "h-4 w-4 text-slate-400";
  };

  const quotaUsed = 842;
  const quotaLimit = 1200;
  const quotaPercentage = Math.round((quotaUsed / quotaLimit) * 100);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fafcfa]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 shadow-xs sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              CSM
            </div>
            <span className="text-base tracking-tight font-bold text-slate-900">
              {user?.tenantName || 'Clínica Dermatológica Santa María'}
            </span>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5">
            Admin Clínica
          </Badge>
          <div className="hidden lg:flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Plan Pro Clinic — 2 Sedes Habilitadas</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-emerald-700 text-white text-xs font-bold ring-2 ring-emerald-100 cursor-pointer"
                />
              }
            >
              {user?.nombre?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="font-semibold text-slate-900">{user?.nombre || 'Admin'}</div>
                  <div className="text-[11px] text-slate-500 font-normal">{user?.email}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Dirección Médica & Admin</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/clinic/protocols')}>
                  Configuración de Protocolos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/pro/pacientes')}>
                  Ir a Consulta Médica
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="text-rose-600 focus:bg-rose-50 focus:text-rose-700" onClick={logout}>
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col bg-[#fafcfa] sm:flex pt-5 border-r border-slate-200">
          <nav className="flex flex-1 flex-col gap-1 px-4 text-xs">
            <Link to="/clinic" className={getNavLinkClass('/clinic', true)}>
              <LayoutDashboard className={getIconClass('/clinic', true)} />
              <span>Resumen de Clínica</span>
            </Link>

            <div className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Operación Asistencial
            </div>

            <Link to="/clinic/staff" className={getNavLinkClass('/clinic/staff')}>
              <Users className={getIconClass('/clinic/staff')} />
              <span>Personal & Privilegios</span>
            </Link>

            <Link to="/clinic/devices" className={getNavLinkClass('/clinic/devices')}>
              <Camera className={getIconClass('/clinic/devices')} />
              <span>Dermatoscopios & Equipos</span>
            </Link>

            <Link to="/clinic/branches" className={getNavLinkClass('/clinic/branches')}>
              <DoorOpen className={getIconClass('/clinic/branches')} />
              <span>Sedes & Boxes Clínicos</span>
            </Link>

            <div className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Gobernanza Médica
            </div>

            <Link to="/clinic/protocols" className={getNavLinkClass('/clinic/protocols')}>
              <FileCheck2 className={getIconClass('/clinic/protocols')} />
              <span>Protocolos & Informes</span>
            </Link>

            {/* Quota consumption widget */}
            <div className="mt-auto mb-4 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center text-[11px] mb-1.5">
                <span className="font-semibold text-slate-700">Cuota Mensual IA</span>
                <span className="font-mono text-emerald-800 font-bold">{quotaPercentage}%</span>
              </div>
              <Progress value={quotaPercentage} className="h-1.5" />
              <p className="text-[10px] text-slate-500 mt-2">
                {quotaUsed} de {quotaLimit} escaneos consumidos en el ciclo actual.
              </p>
            </div>

            <div className="mb-4">
              <Link
                to="/pro/pacientes"
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs shadow-xs hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-slate-300" />
                  <span>Módulo Especialista</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
