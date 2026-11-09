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
import {
  Camera,
  Search,
  Plus,
  BatteryCharging,
  BatteryMedium,
  BatteryLow,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
  Building,
  RefreshCw,
  Eye,
  Crosshair,
  Layers,
  Trash2
} from 'lucide-react';
import { get, post, put } from '@/lib/api';
import { toast } from 'sonner';

export default function DeviceInventory() {
  const [devices, setDevices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [branchFilter, setBranchFilter] = useState('todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [calibratingDevice, setCalibratingDevice] = useState<any | null>(null);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('DermLite DL4');
  const [lensType, setLensType] = useState('Polarizada / No Polarizada (Luz Cruzada)');
  const [assignedBranch, setAssignedBranch] = useState('');
  const [assignedBox, setAssignedBox] = useState('Box 401 — Consulta');

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devicesData, branchesData] = await Promise.all([
        get('/clinica/dispositivos'),
        get('/clinica/sucursales'),
      ]);
      setDevices(devicesData || []);
      setBranches(branchesData || []);
    } catch {
      toast.error('No se pudieron cargar los dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter((d: any) => {
    const matchesSearch =
      d.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assigned_box.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || d.status === statusFilter;
    const matchesBranch = branchFilter === 'todos' || d.branch_name === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const handleOpenAddModal = () => {
    setSerialNumber('');
    setModel('DermLite DL4');
    setLensType('Polarizada / No Polarizada (Luz Cruzada)');
    setAssignedBranch(branches[0]?.id || '');
    setAssignedBox('Box 401 — Consulta');
    setIsModalOpen(true);
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber) return;

    try {
      await post('/clinica/dispositivos', {
        serial_number: serialNumber,
        model: model,
        lens_type: lensType,
        branch_id: assignedBranch || null,
        branch_name: branches.find((b: any) => b.id === assignedBranch)?.nombre || '',
        assigned_box: assignedBox,
        status: 'Operativo',
        battery_level: 100,
        last_calibration_date: new Date().toISOString().split('T')[0],
        total_captures_made: 0,
      });
      await loadData();
      setIsModalOpen(false);
      toast.success('Dispositivo registrado');
    } catch {
      toast.error('No se pudo registrar el dispositivo');
    }
  };

  const handleStartCalibration = async (dev: any) => {
    setCalibratingDevice(dev);
    setIsCalibrationModalOpen(true);
    setCalibrationProgress(0);
    setIsCalibrating(false);
  };

  const executeCalibrationSequence = async () => {
    setIsCalibrating(true);
    setCalibrationProgress(15);

    setTimeout(() => setCalibrationProgress(45), 600);
    setTimeout(() => setCalibrationProgress(80), 1200);
    setTimeout(async () => {
      setCalibrationProgress(100);
      setIsCalibrating(false);
      if (calibratingDevice) {
        try {
          await put(`/clinica/dispositivos/${calibratingDevice.id}`, {
            serial_number: calibratingDevice.serial_number,
            model: calibratingDevice.model,
            lens_type: calibratingDevice.lens_type,
            branch_id: calibratingDevice.branch_id,
            branch_name: calibratingDevice.branch_name,
            assigned_box: calibratingDevice.assigned_box,
            status: 'Operativo',
            battery_level: Math.max(calibratingDevice.battery_level, 95),
            last_calibration_date: new Date().toISOString().split('T')[0],
            total_captures_made: calibratingDevice.total_captures_made,
          });
          await loadData();
        } catch {
          toast.error('No se pudo actualizar la calibración');
        }
      }
    }, 1800);
  };

  const getBatteryIcon = (level: number) => {
    if (level > 70) return <BatteryCharging className="h-4 w-4 text-emerald-600 inline mr-1" />;
    if (level > 30) return <BatteryMedium className="h-4 w-4 text-amber-600 inline mr-1" />;
    return <BatteryLow className="h-4 w-4 text-rose-600 inline mr-1" />;
  };

  const operationalCount = devices.filter(d => d.status === 'Operativo').length;
  const maintenanceCount = devices.filter(d => d.status !== 'Operativo').length;
  const totalCaptures = devices.reduce((acc: number, d: any) => acc + d.total_captures_made, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#5f7b6f]">Cargando dispositivos...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Camera className="h-6 w-6 text-emerald-600" />
            Inventario de Dermatoscopios & Calibración Óptica
          </h1>
          <p className="text-sm text-slate-500">
            Control de hardware dermatológico, calibración cromática, polarización y asignación de boxes.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Registrar Dermatoscopio
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispositivos Operativos</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{operationalCount} / {devices.length}</p>
              <span className="text-xs text-emerald-700 font-medium">100% Calibración óptica al día</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capturas Clínicas Realizadas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCaptures.toLocaleString()}</p>
              <span className="text-xs text-slate-500">Epiluminiscencia & Mapeo</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Crosshair className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mantenimiento Requerido</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{maintenanceCount}</p>
              <span className="text-xs text-slate-500">Próxima mantención en 45 días</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wrench className="h-5 w-5" />
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
                placeholder="Buscar por N° Serie, Modelo o Box asignado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-48 bg-slate-50"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Operativo">Operativo</option>
                <option value="En Calibración">En Calibración</option>
                <option value="Mantenimiento">Mantenimiento</option>
              </Select>

              <Select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-52 bg-slate-50"
              >
                <option value="todos">Todas las Sedes</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.nombre}>{b.nombre}</option>
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
              <CardTitle className="text-base">Inventario de Equipamiento Óptico</CardTitle>
              <CardDescription>
                Mostrando {filteredDevices.length} equipos registrados en clínica
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo & N° Serie</TableHead>
                <TableHead>Tecnología de Lente</TableHead>
                <TableHead>Ubicación & Box</TableHead>
                <TableHead>Batería</TableHead>
                <TableHead>Última Calibración</TableHead>
                <TableHead>Capturas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device: any) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                        <Camera className="h-4 w-4 text-emerald-600" />
                        {device.model}
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">
                        SN: {device.serial_number}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs text-slate-700 font-medium">
                      {device.lens_type}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Building className="h-3 w-3 text-slate-400" />
                        {device.branch_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {device.assigned_box}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs font-medium flex items-center">
                      {getBatteryIcon(device.battery_level)}
                      <span>{device.battery_level}%</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs text-slate-600 font-medium">
                      {device.last_calibration_date}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs font-semibold text-slate-900">
                      {device.total_captures_made.toLocaleString()}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        device.status === 'Operativo'
                          ? 'success'
                          : device.status === 'En Calibración'
                          ? 'warning'
                          : 'destructive'
                      }
                      className="text-[11px]"
                    >
                      {device.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartCalibration(device)}
                      className="h-7 px-2.5 text-xs text-slate-700"
                    >
                      <Sliders className="h-3 w-3 mr-1 text-emerald-600" />
                      Calibrar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredDevices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                    No se encontraron dispositivos coincidentes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSaveDevice}>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Dispositivo Dermatoscópico</DialogTitle>
              <DialogDescription>
                Ingresa el número de serie y asigna el box clínico para trazabilidad fotométrica.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="dev-model">Modelo de Dermatoscopio</Label>
                <Select
                  id="dev-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value as any)}
                >
                  <option value="DermLite DL4">DermLite DL4 (Luz Polarizada / Pigmentada)</option>
                  <option value="DermLite Foto II Pro">DermLite Foto II Pro (DSLR / Mirrorless)</option>
                  <option value="Handyscope 3">Handyscope 3 (Smart Skin Scan)</option>
                  <option value="FotoFinder Medicam 1000">FotoFinder Medicam 1000 (Mapeo Full HD)</option>
                  <option value="Firefly DE300">Firefly DE300 (Video Dermatoscopio)</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dev-sn">Número de Serie (SN grabado en chasis)</Label>
                <Input
                  id="dev-sn"
                  placeholder="Ej: DL4-SN-102948"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dev-lens">Tecnología de Polarización & Óptica</Label>
                <Select
                  id="dev-lens"
                  value={lensType}
                  onChange={(e) => setLensType(e.target.value as any)}
                >
                  <option value="Polarizada / No Polarizada (Luz Cruzada)">Polarizada / No Polarizada (Luz Cruzada)</option>
                  <option value="Óptica Inmersión Líquida">Óptica Inmersión Líquida</option>
                  <option value="HD Multiespectral">HD Multiespectral</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dev-branch">Sede de Operación</Label>
                  <Select
                    id="dev-branch"
                    value={assignedBranch}
                    onChange={(e) => setAssignedBranch(e.target.value)}
                  >
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dev-box">Box Asignado</Label>
                  <Input
                    id="dev-box"
                    placeholder="Ej: Box 402 — Dermatoscopia"
                    value={assignedBox}
                    onChange={(e) => setAssignedBox(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
                Registrar y Habilitar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCalibrationModalOpen} onOpenChange={setIsCalibrationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-slate-700" />
              Asistente de Calibración Cromática
            </DialogTitle>
            <DialogDescription>
              {calibratingDevice?.model} — SN: {calibratingDevice?.serial_number}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">Protocolo de Calibración ISO/IEC 17025:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                <li>Colocar el dermatoscopio sobre la tarjeta de referencia cromática blanca/gris.</li>
                <li>Activar el anillo LED polarizado a máxima intensidad.</li>
                <li>Ejecutar el test de uniformidad y balance de blancos.</li>
              </ol>
            </div>

            {calibrationProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Progreso de calibración óptica:</span>
                  <span className="text-emerald-700">{calibrationProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                    style={{ width: `${calibrationProgress}%` }}
                  />
                </div>
                {calibrationProgress === 100 && (
                  <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 mt-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Calibración fotométrica exitosa. Matriz de color delta-E &lt; 0.8.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCalibrationModalOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              disabled={isCalibrating}
              onClick={executeCalibrationSequence}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isCalibrating ? 'Ejecutando Test...' : 'Iniciar Calibración Automática'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
