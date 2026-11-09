import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../AuthContext';
import { 
  Building2, 
  Cpu, 
  ShieldCheck, 
  DollarSign, 
  Settings, 
  LayoutDashboard, 
  Activity, 
  LogOut,
  ChevronDown,
  UserCheck,
  Stethoscope,
  User
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

export default function SuperAdminLayout() {
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fafcfa]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 shadow-xs sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              HQ
            </div>
            <span className="text-lg tracking-tight font-bold">Skinnor</span>
          </div>
          <Badge className="bg-slate-900 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5">
            Super Admin
          </Badge>
          <div className="hidden md:flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Multi-Tenant Platform Active</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-white text-xs font-bold ring-2 ring-slate-100"
                />
              }
            >
              {user?.nombre?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="font-semibold text-slate-900">{user?.nombre || 'Super Admin'}</div>
                  <div className="text-[11px] text-slate-500 font-normal">{user?.email}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Plataforma Global</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/configuracion')}>
                  Configuración del Sistema
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
            <Link to="/admin" className={getNavLinkClass('/admin', true)}>
              <LayoutDashboard className={getIconClass('/admin', true)} />
              <span>Escritorio Global</span>
            </Link>

            <div className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Gobernanza & Tenancy
            </div>

            <Link to="/admin/tenants" className={getNavLinkClass('/admin/tenants')}>
              <Building2 className={getIconClass('/admin/tenants')} />
              <span>Organizaciones / Clínicas</span>
            </Link>

            <Link to="/admin/ia-governance" className={getNavLinkClass('/admin/ia-governance')}>
              <Cpu className={getIconClass('/admin/ia-governance')} />
              <span>Modelos & Inferencia IA</span>
            </Link>

            <div className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Seguridad & Finanzas
            </div>

            <Link to="/admin/compliance" className={getNavLinkClass('/admin/compliance')}>
              <ShieldCheck className={getIconClass('/admin/compliance')} />
              <span>Auditoría & HIPAA</span>
            </Link>

            <Link to="/admin/billing" className={getNavLinkClass('/admin/billing')}>
              <DollarSign className={getIconClass('/admin/billing')} />
              <span>Planes & Facturación</span>
            </Link>

            <div className="mt-auto mb-6">
              <Link to="/admin/configuracion" className={getNavLinkClass('/admin/configuracion')}>
                <Settings className={getIconClass('/admin/configuracion')} />
                <span>Configuración Global</span>
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
