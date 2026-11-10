import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../AuthContext';
import {
  Home,
  Search,
  MessageSquare,
  Users,
  BookOpen,
  Link as LinkIcon,
  Settings,
  DatabaseBackup,
  AlertTriangle,
  Activity,
  ChevronDown,
  Building2,
  UserCheck,
  Stethoscope,
  User,
  LogOut,
  LogIn,
  ScanSearch
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

export default function ProfessionalLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavLinkClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    if (isActive) {
      return "flex items-center gap-3 rounded-lg bg-[#f0f4f3] px-3 py-2.5 text-[#0d7a63] font-medium transition-all";
    }
    return "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#3f4f49] font-medium transition-all hover:bg-white hover:text-[#0c1512]";
  };

  const getIconClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    return isActive ? "h-[18px] w-[18px] text-[#0d7a63]" : "h-[18px] w-[18px] text-[#5f7b6f]";
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fafcfa]">
      {/* Top Header matching image */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#d8e0dc] bg-white px-4 shadow-xs sm:px-6">
        <div className="flex items-center gap-2 font-semibold text-[#0c1512]">
          <span className="text-xl tracking-tight font-bold">Skinnor</span>
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#d8e0dc] bg-white px-3 py-1.5 text-xs font-medium text-[#3f4f49] hover:text-[#0c1512] hover:border-[#0d7a63]/50 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" /> Volver al login
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#0c1512] text-white text-sm font-medium cursor-pointer"
                />
              }
            >
              {user?.nombre?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="font-semibold text-slate-900">{user?.nombre || 'Profesional'}</div>
                  <div className="text-[11px] text-slate-500 font-normal">{user?.email}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Dermatología Oncológica</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/pro/configuracion')}>
                  Configuración & Perfil
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
        {/* Sidebar matching image */}
        <aside className="hidden w-64 flex-col bg-[#fafcfa] sm:flex pt-6 border-r border-[#d8e0dc]">
          <nav className="flex flex-1 flex-col gap-1 px-4 text-[13px]">
            <Link to="/pro" className={getNavLinkClass('/pro', true)}>
              <Home className={getIconClass('/pro', true)} />
              Escritorio
            </Link>
            
            <div className="mt-6 mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-[#5f7b6f]">
              Atención & Pacientes
            </div>
            
            <Link to="/pro/alertas" className={getNavLinkClass('/pro/alertas')}>
              <AlertTriangle className={getIconClass('/pro/alertas')} />
              <span>Alertas Clínicas</span>
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#c77a0b] px-1.5 text-[10px] font-bold text-white">3</span>
            </Link>
            <Link to="/pro/pacientes" className={getNavLinkClass('/pro/pacientes')}>
              <Users className={getIconClass('/pro/pacientes')} />
              <span>Mis Pacientes</span>
            </Link>
            <Link to="/pro/consultas" className={getNavLinkClass('/pro/consultas')}>
              <MessageSquare className={getIconClass('/pro/consultas')} />
              <span>Consultas</span>
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0d7a63] px-1.5 text-[10px] font-bold text-white">8</span>
            </Link>
            <Link to="/pro/enlaces" className={getNavLinkClass('/pro/enlaces')}>
              <LinkIcon className={getIconClass('/pro/enlaces')} />
              <span>Solicitudes / Enlaces</span>
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0c1512] px-1.5 text-[10px] font-bold text-white">2</span>
            </Link>
            
            <div className="mt-6 mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-[#5f7b6f]">
              Herramientas Globales
            </div>
            
            <Link to="/pro/dataset" className={getNavLinkClass('/pro/dataset')}>
              <Search className={getIconClass('/pro/dataset')} />
              Explorador HAM10000
            </Link>
            <Link to="/pro/mis-datasets" className={getNavLinkClass('/pro/mis-datasets')}>
              <DatabaseBackup className={getIconClass('/pro/mis-datasets')} />
              Mis Datasets
            </Link>
            <Link to="/pro/casos" className={getNavLinkClass('/pro/casos', true)}>
              <BookOpen className={getIconClass('/pro/casos', true)} />
              Casos de Estudio
            </Link>
            <Link to="/pro/casos-similares" className={getNavLinkClass('/pro/casos-similares')}>
              <ScanSearch className={getIconClass('/pro/casos-similares')} />
              Buscar Casos Similares
            </Link>
            
            <div className="mt-auto mb-6">
              <Link to="/pro/configuracion" className={getNavLinkClass('/pro/configuracion')}>
                <Settings className={getIconClass('/pro/configuracion')} />
                Configuración
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
