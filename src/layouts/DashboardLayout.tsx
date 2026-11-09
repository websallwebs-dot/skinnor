import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../AuthContext';
import {
  Home,
  MessageSquare,
  Eye,
  Clock,
  User,
  Activity,
  ChevronDown,
  Building2,
  UserCheck,
  Stethoscope,
  LogOut
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

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavLinkClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    if (isActive) {
      return "flex items-center gap-3 rounded-lg bg-[#e9efec] px-3 py-2 text-[#0d7a63] font-semibold transition-all";
    }
    return "flex items-center gap-3 rounded-lg px-3 py-2 text-[#3f4f49] transition-all hover:text-[#0c1512]";
  };

  const getIconClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    return isActive ? "h-4 w-4 text-[#0d7a63]" : "h-4 w-4 text-[#3f4f49]";
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f4f6f5]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#d8e0dc] bg-white px-4 shadow-2xs sm:px-6">
        <div className="flex items-center gap-2 font-semibold text-[#0c1512]">
          <span className="text-xl tracking-tight font-bold">Skinnor</span>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] uppercase font-semibold">
            Portal Paciente
          </Badge>
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#0c1512] text-white text-xs font-bold cursor-pointer"
                />
              }
            >
              {user?.nombre?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="font-semibold text-slate-900">{user?.nombre || 'Usuario'}</div>
                  <div className="text-[11px] text-slate-500 font-normal">{user?.email}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Paciente Activa</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/perfil')}>
                  Mi Perfil
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
        <aside className="hidden w-64 flex-col bg-[#f4f6f5] sm:flex pt-6 border-r border-slate-200">
          <nav className="flex flex-1 flex-col gap-1 px-4 text-xs font-medium">
            <Link to="/dashboard" className={getNavLinkClass('/dashboard', true)}>
              <Home className={getIconClass('/dashboard', true)} />
              Escritorio
            </Link>
            <Link to="/dashboard/perfil" className={getNavLinkClass('/dashboard/perfil')}>
              <User className={getIconClass('/dashboard/perfil')} />
              Mi Perfil
            </Link>
            <Link to="/dashboard/consultas" className={getNavLinkClass('/dashboard/consultas')}>
              <MessageSquare className={getIconClass('/dashboard/consultas')} />
              Consultas
            </Link>
            <Link to="/dashboard/lesiones" className={getNavLinkClass('/dashboard/lesiones')}>
              <Eye className={getIconClass('/dashboard/lesiones')} />
              Mis Lesiones
            </Link>
            <Link to="/dashboard/evolucion" className={getNavLinkClass('/dashboard/evolucion')}>
              <Clock className={getIconClass('/dashboard/evolucion')} />
              Evolución
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
