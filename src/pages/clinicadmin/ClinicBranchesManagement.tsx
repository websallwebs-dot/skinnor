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
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  Users,
  DoorOpen,
  CheckCircle2,
  Edit2,
  Sparkles,
  Trash2
} from 'lucide-react';
import { get, post, put, del } from '@/lib/api';
import { toast } from 'sonner';

export default function ClinicBranchesManagement() {
  const [branches, setBranches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Santiago, Chile');
  const [phone, setPhone] = useState('+56 2 2');
  const [totalBoxes, setTotalBoxes] = useState(4);

  useEffect(() => {
    get('/clinica/sucursales').then((data: any[]) => {
      setBranches(data || []);
      setLoading(false);
    }).catch(() => {
      toast.error('No se pudieron cargar las sucursales');
      setLoading(false);
    });
  }, []);

  const handleOpenAddModal = () => {
    setName('');
    setAddress('');
    setCity('Santiago, Chile');
    setPhone('+56 2 ');
    setTotalBoxes(4);
    setIsModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;

    try {
      await post('/clinica/sucursales', {
        nombre: name,
        direccion: address,
        ciudad: city,
        telefono: phone,
        total_boxes: Number(totalBoxes),
        active_doctors: 0,
        devices_count: 0,
      });
      const data = await get('/clinica/sucursales');
      setBranches(data || []);
      setIsModalOpen(false);
      toast.success('Sucursal creada');
    } catch {
      toast.error('No se pudo crear la sucursal');
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm('¿Eliminar esta sucursal?')) return;
    try {
      await del(`/clinica/sucursales/${id}`);
      const data = await get('/clinica/sucursales');
      setBranches(data || []);
      toast.success('Sucursal eliminada');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#5f7b6f]">Cargando sucursales...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-emerald-600" />
            Sedes & Boxes de Atención Clínica
          </h1>
          <p className="text-sm text-slate-500">
            Administración de centros de atención física, boxes de dermatoscopia digital y equipamiento asignado.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Añadir Sede
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((branch: any) => (
          <Card key={branch.id} className="border-slate-200 shadow-xs hover:border-emerald-200 transition-colors">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    {branch.nombre}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1 text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {branch.direccion} — {branch.ciudad}
                  </CardDescription>
                </div>
                <Badge variant="success" className="text-[10px]">
                  Habilitada SIS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Mesa de entrada: <strong>{branch.telefono}</strong></span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <DoorOpen className="h-4 w-4 text-slate-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900">{branch.total_boxes}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Boxes Clínicos</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <Users className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900">{branch.active_doctors}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Médicos</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <Sparkles className="h-4 w-4 text-sky-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900">{branch.devices_count}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Dermatoscopios</p>
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteBranch(branch.id)}
                className="text-xs text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveBranch}>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Sucursal / Sede</DialogTitle>
              <DialogDescription>
                Ingresa la dirección y capacidad de atención para distribución de pacientes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="branch-name">Nombre de la Sede</Label>
                <Input
                  id="branch-name"
                  placeholder="Ej: Sucursal Vitacura"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch-addr">Dirección Completa</Label>
                <Input
                  id="branch-addr"
                  placeholder="Ej: Av. Vitacura 5250, Piso 3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="branch-city">Ciudad / Comuna</Label>
                  <Input
                    id="branch-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="branch-boxes">N° de Boxes</Label>
                  <Input
                    id="branch-boxes"
                    type="number"
                    min="1"
                    max="20"
                    value={totalBoxes}
                    onChange={(e) => setTotalBoxes(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch-phone">Teléfono de Contacto</Label>
                <Input
                  id="branch-phone"
                  placeholder="+56 2 2900 1200"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
                Crear Sede
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
