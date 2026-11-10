import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, nombre, 'patient');
      toast.success('Cuenta creada correctamente');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f5] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0d7a63] text-white mb-4">
            <Activity className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Crear cuenta</h1>
          <p className="text-sm text-emerald-800/70 mt-1">Registro de paciente</p>
        </div>

        <form
          onSubmit={handleRegister}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-black/5"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre" className="mb-1.5 block text-xs font-medium text-slate-700">
                Nombre completo
              </label>
              <Input
                id="nombre"
                name="nombre"
                autoComplete="name"
                required
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="border-slate-200 bg-slate-50 text-sm focus-visible:ring-emerald-600"
              />
            </div>
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
                autoComplete="new-password"
                required
                minLength={6}
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-200 bg-slate-50 text-sm focus-visible:ring-emerald-600"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0d7a63] text-white hover:bg-[#0a4539] h-10 text-sm font-medium"
            >
              {loading ? 'Creando cuenta…' : 'Registrarse'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-[#0d7a63] hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
