import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const data = await login(email, password);
      const roleMap: Record<string, string> = {
        patient: '/dashboard',
        paciente: '/dashboard',
        professional: '/pro/pacientes',
        profesional: '/pro/pacientes',
        clinic_admin: '/clinic',
        super_admin: '/admin',
      };
      navigate(roleMap[data.user.rol] || '/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f5] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0d7a63] text-white mb-4">
            <Activity className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Skinnor</h1>
          <p className="text-sm text-emerald-800/70 mt-1">Teledermatología</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-black/5"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700">
                Correo electrónico
              </label>
              <Input
                id="email"
                name="email"
                autoComplete="username"
                required
                type="email"
                placeholder="nombre@correo.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-200 bg-slate-50 text-sm focus-visible:ring-emerald-600"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-700">
                Contraseña
              </label>
              <Input
                id="password"
                name="password"
                autoComplete="current-password"
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-200 bg-slate-50 text-sm focus-visible:ring-emerald-600"
              />
            </div>
            <Button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-[#0d7a63] text-white hover:bg-[#0a4539] h-10 text-sm font-medium"
            >
              {loggingIn ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Acceso restringido a personal autorizado.
        </p>
      </div>
    </div>
  );
}
