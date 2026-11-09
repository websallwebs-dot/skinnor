import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  ShieldAlert,
  FileSignature,
  Cpu,
  Mail,
  Award,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  KeyRound
} from 'lucide-react';
import { get, post, put, del } from '@/lib/api';
import { toast } from 'sonner';

export default function ClinicStaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [branchFilter, setBranchFilter] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Dermatólogo Staff');
  const [medicalLicense, setMedicalLicense] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [assignedBranch, setAssignedBranch] = useState('');
  const [canSignBiopsy, setCanSignBiopsy] = useState(false);
  const [canExecuteAi, setCanExecuteAi] = useState(true);
  const [hasDigitalSignatureUploaded, setHasDigitalSignatureUploaded] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffData, branchesData] = await Promise.all([
        get('/clinica/staff'),
        get('/clinica/sucursales'),
      ]);
      setStaff(staffData || []);
      setBranches(branchesData || []);
    } catch {
      toast.error('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter((member: any) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.medical_license?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.specialty.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'todos' || member.role === roleFilter;
    const matchesBranch = branchFilter === 'todos' || member.assigned_branch_id === branchFilter;

    return matchesSearch && matchesRole && matchesBranch;
  });

  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setRole('Dermatólogo Staff');
    setMedicalLicense('');
    setSpecialty('');
    setAssignedBranch(branches[0]?.id || '');
    setCanSignBiopsy(false);
    setCanExecuteAi(true);
    setHasDigitalSignatureUploaded(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: any) => {
    setEditingStaff(member);
    setName(member.name);
    setEmail(member.email);
    setRole(member.role);
    setMedicalLicense(member.medical_license || '');
    setSpecialty(member.specialty || '');
    setAssignedBranch(member.assigned_branch_id || '');
    setCanSignBiopsy(member.can_sign_biopsy === 1);
    setCanExecuteAi(member.can_execute_ai === 1);
    setHasDigitalSignatureUploaded(member.has_digital_signature_uploaded === 1);
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      if (editingStaff) {
        await put(`/clinica/staff/${editingStaff.id}`, {
          nombre: name,
          email,
          rol: role,
          status: 'Activo',
        });
        toast.error;
      } else {
        await post('/clinica/staff', {
          nombre: name,
          email,
          rol: role,
          medical_license: medicalLicense || 'EN TRÁMITE',
          specialty: specialty || 'Dermatología Clínica',
          status: 'Activo',
          assigned_branch_id: assignedBranch || null,
          can_sign_biopsy: canSignBiopsy ? 1 : 0,
          can_execute_ai: canExecuteAi ? 1 : 0,
          has_digital_signature_uploaded: hasDigitalSignatureUploaded ? 1 : 0,
          patients_assigned_count: 0,
          monthly_evaluations: 0,
        });
      }
      await loadData();
      setIsModalOpen(false);
      toast.success('Profesional guardado');
    } catch {
      toast.error('No se pudo guardar el profesional');
    }
  };

  const handleToggleStatus = async (id: number) => {
    const member = staff.find(s => s.id === id);
    if (!member) return;
    try {
      await put(`/clinica/staff/${id}`, {
        nombre: member.name,
        email: member.email,
        rol: member.role,
        status: member.status === 'Activo' ? 'Inactivo' : 'Activo',
      });
      await loadData();
    } catch {
      toast.error('No se pudo cambiar el estado');
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('¿Eliminar este profesional?')) return;
    try {
      await del(`/clinica/staff/${id}`);
      await loadData();
      toast.success('Profesional eliminado');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const activeCount = staff.filter(s => s.status === 'Activo').length;
  const authorizedBiopsyCount = staff.filter(s => s.can_sign_biopsy === 1).length;
  const aiEnabledCount = staff.filter(s => s.can_execute_ai === 1).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#5f7b6f]">Cargando personal...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-emerald-600" />
            Gestión de Personal & Privilegios Médicos
          </h1>
          <p className="text-sm text-slate-500">
            Administración de especialistas, médicos tratantes, operadores de dermatoscopio y firma digital.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Registrar Profesional
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Profesionales</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{staff.length}</p>
              <span className="text-xs text-emerald-700 font-medium">{activeCount} activos actualmente</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Firma de Biopsias Habilitada</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{authorizedBiopsyCount}</p>
              <span className="text-xs text-slate-500">Especialistas con potestad legal</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <FileSignature className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operadores de IA Diagnóstica</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{aiEnabledCount}</p>
              <span className="text-xs text-slate-500">Inferencia y triage de imágenes</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, registro médico (RCM), email o especialidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-48 bg-slate-50"
              >
                <option value="todos">Todos los Roles</option>
                <option value="Dermatólogo Titular">Dermatólogo Titular</option>
                <option value="Dermatólogo Staff">Dermatólogo Staff</option>
                <option value="Médico General">Médico General</option>
                <option value="Enfermera / Técnico Captura">Técnico / Enfermera</option>
              </Select>

              <Select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-52 bg-slate-50"
              >
                <option value="todos">Todas las Sedes</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Nómina de Personal Clínico</CardTitle>
              <CardDescription>
                Mostrando {filteredStaff.length} de {staff.length} colaboradores
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesional & Registro</TableHead>
                <TableHead>Rol & Especialidad</TableHead>
                <TableHead>Sede Asignada</TableHead>
                <TableHead>Privilegios Clínicos</TableHead>
                <TableHead>Firma Digital</TableHead>
                <TableHead>Carga Mensual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredStaff.length > 0 ? (
              filteredStaff.map((member: any) => {
                const branch = branches.find((b: any) => b.id === member.assigned_branch_id);
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          {member.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {member.medical_license}
                          </span>
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <Badge variant="outline" className="font-medium text-slate-700 bg-slate-50 text-[11px]">
                          {member.role}
                        </Badge>
                        <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={member.specialty}>
                          {member.specialty}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {branch?.nombre || '—'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className={`inline-flex items-center gap-1 ${member.can_sign_biopsy === 1 ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                          {member.can_sign_biopsy === 1 ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-slate-300" />}
                          Firma Biopsias
                        </span>
                        <span className={`inline-flex items-center gap-1 ${member.can_execute_ai === 1 ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                          {member.can_execute_ai === 1 ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-slate-300" />}
                          Inferencia IA
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {member.has_digital_signature_uploaded === 1 ? (
                        <Badge variant="success" className="text-[10px]">
                          Válida & Criptográfica
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                          Pendiente Carga
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800">{member.monthly_evaluations}</span> eval / mes
                        <div className="text-[11px] text-slate-500">{member.patients_assigned_count} pac. activos</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(member.id)}
                        className="cursor-pointer"
                        title="Haz clic para alternar estado"
                      >
                        <Badge variant={member.status === 'Activo' ? 'success' : 'destructive'} className="text-[11px]">
                          {member.status}
                        </Badge>
                      </button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditModal(member)}
                          className="h-7 px-2.5 text-xs text-slate-600"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteStaff(member.id)}
                          className="h-7 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                  No se encontraron profesionales con los filtros aplicados.
                </TableCell>
              </TableRow>
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleSaveStaff}>
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Modificar Privilegios & Datos de Profesional' : 'Registrar Nuevo Profesional Clínico'}
              </DialogTitle>
              <DialogDescription>
                Configura los accesos asistenciales, enrolamiento en sedes y potestades diagnósticas bajo la normativa clínica.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-name">Nombre Completo con Título</Label>
                  <Input
                    id="staff-name"
                    placeholder="Ej: Dr. Matías Valdés"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-email">Correo Electrónico Institucional</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="m.valdes@clinicasantamaria.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-role">Rol Clínico</Label>
                  <Select
                    id="staff-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                  >
                    <option value="Dermatólogo Titular">Dermatólogo Titular</option>
                    <option value="Dermatólogo Staff">Dermatólogo Staff</option>
                    <option value="Médico General">Médico General</option>
                    <option value="Enfermera / Técnico Captura">Enfermera / Técnico Captura</option>
                    <option value="Secretaría / Recepción">Secretaría / Recepción</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-branch">Sede Principal</Label>
                  <Select
                    id="staff-branch"
                    value={assignedBranch}
                    onChange={(e) => setAssignedBranch(e.target.value)}
                  >
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-license">Registro Colegio Médico / SIS</Label>
                  <Input
                    id="staff-license"
                    placeholder="Ej: RCM-78219-CL"
                    value={medicalLicense}
                    onChange={(e) => setMedicalLicense(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-specialty">Subespecialidad / Enfoque</Label>
                  <Input
                    id="staff-specialty"
                    placeholder="Ej: Dermatoscopia Digital & Cirugía"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                  Permisos & Privilegios Médicos
                </h4>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold text-slate-800">Autorización para Firmar Órdenes de Biopsia</Label>
                    <p className="text-[11px] text-slate-500">Permite emitir solicitudes histopatológicas y reportes finales al paciente.</p>
                  </div>
                  <Switch checked={canSignBiopsy} onCheckedChange={setCanSignBiopsy} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold text-slate-800">Ejecución de Inferencia IA & Scoring TDS</Label>
                    <p className="text-[11px] text-slate-500">Habilita el pipeline de segmentación y análisis de asimetría/bordes.</p>
                  </div>
                  <Switch checked={canExecuteAi} onCheckedChange={setCanExecuteAi} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold text-slate-800">Certificado de Firma Digital Verificado</Label>
                    <p className="text-[11px] text-slate-500">Sello de firma electrónica avanzada para informes telemédicos.</p>
                  </div>
                  <Switch checked={hasDigitalSignatureUploaded} onCheckedChange={setHasDigitalSignatureUploaded} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
                {editingStaff ? 'Guardar Cambios' : 'Registrar Profesional'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
