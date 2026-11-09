import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, ArrowRight } from 'lucide-react';
import { get } from '@/lib/api';
import { toast } from 'sonner';

interface Paciente {
  id: number;
  usuario_id: number;
  email: string;
  usuario_nombre: string;
  rol: string;
  creado_en: string;
}

export default function PacientesList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [profesionalId, setProfesionalId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('skinnor_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setProfesionalId(Number(user.id));
    }
  }, []);

  useEffect(() => {
    if (!profesionalId) return;
    setLoading(true);
    get(`/pacientes?profesional_id=${profesionalId}`).then((data: Paciente[]) => {
      setPatients(data || []);
      setLoading(false);
    }).catch(() => {
      toast.error('No se pudieron cargar los pacientes');
      setLoading(false);
    });
  }, [profesionalId]);

  const filtered = patients.filter((p) =>
    p.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
            Mis Pacientes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona la información clínica y seguimientos de tu base de pacientes vinculados.
          </p>
        </div>
        <Button 
          className="bg-[#0c1512] hover:bg-[#3f4f49] text-white rounded-md shadow-none font-medium"
          onClick={() => navigate('/pro/pacientes/crear')}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-[#5f7b6f]">Cargando pacientes...</div>
      ) : (
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden mb-6">
          <div className="p-4 border-b border-[#d8e0dc] bg-[#fafcfa] flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f7b6f]" />
              <Input 
                placeholder="Buscar por nombre o email..." 
                className="pl-9 border-[#d8e0dc] bg-white shadow-none focus-visible:ring-[#0d7a63]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f4f6f5] border-b border-[#d8e0dc] text-[#5f7b6f] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Paciente</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Rol</th>
                  <th className="px-6 py-4 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8e0dc]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[#5f7b6f]">
                      No se encontraron pacientes vinculados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((patient) => (
                    <tr key={patient.id} className="hover:bg-[#fafcfa] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0c1512]">{patient.usuario_nombre}</div>
                        <div className="text-xs text-[#5f7b6f] mt-0.5">ID: PAC-{patient.id.toString().padStart(4, '0')}</div>
                      </td>
                      <td className="px-6 py-4 text-[#3f4f49]">{patient.email}</td>
                      <td className="px-6 py-4 text-[#3f4f49]">{patient.rol}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          className="text-[#0d7a63] hover:text-[#0a4539] hover:bg-[#e9efec] font-medium"
                          onClick={() => navigate(`/pro/pacientes/${patient.id}`)}
                        >
                          Ver perfil
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
