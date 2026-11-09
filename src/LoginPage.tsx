import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Activity, ShieldCheck } from 'lucide-react';
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
    } catch {
      toast.error('Credenciales inválidas');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f5] px-4 py-8 font-['Golos_Text']">
      <Card className="w-full max-w-lg border border-slate-200 shadow-xl shadow-black/5 bg-white rounded-xl">
        <CardHeader className="space-y-2 items-center pt-8 pb-4">
          <div className="flex items-center gap-2 font-semibold text-[#0d7a63]">
            <Activity className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">Skinnor</span>
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">Ecosistema Multi-Tenant Teledermatológico</CardTitle>
          <CardDescription className="text-center text-slate-500 text-xs">
            Ingresa con tus credenciales institucionales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="email">
                Correo Electrónico
              </label>
              <Input 
                id="email" 
                placeholder="tu@email.com" 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border-slate-200 focus-visible:ring-emerald-600 bg-slate-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="password">
                Contraseña
              </label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border-slate-200 focus-visible:ring-emerald-600 bg-slate-50"
              />
            </div>

            <Button 
              disabled={loggingIn}
              className="w-full bg-[#0d7a63] hover:bg-[#0a4539] text-white" 
              onClick={handleLogin}
            >
              {loggingIn ? 'Ingresando...' : 'Ingresar al Sistema'}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 text-center pb-6 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Plataforma con certificación HIPAA y cumplimiento Ley N° 20.584.
          </p>
          <Button variant="link" className="text-[#0d7a63] text-xs h-auto p-0" onClick={() => navigate('/')}>
            ← Volver a la página principal
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
