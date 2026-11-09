import React, { useState } from 'react';
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
  Building2,
  Search,
  Plus,
  Settings2,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  Cpu,
  Users,
  HardDrive
} from 'lucide-react';
import { INITIAL_TENANTS, TenantOrganization } from './superAdminData';

export default function TenantsManagement() {
  const [tenants, setTenants] = useState<TenantOrganization[]>(INITIAL_TENANTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTenantDetail, setSelectedTenantDetail] = useState<TenantOrganization | null>(null);

  // Form State for new tenant provisioning
  const [newTenantName, setNewTenantName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newTier, setNewTier] = useState<TenantOrganization['tier']>('Pro Clinic');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newCountry, setNewCountry] = useState('Chile');

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = selectedTier === 'todos' || t.tier === selectedTier;
    const matchesStatus = selectedStatus === 'todos' || t.status === selectedStatus;

    return matchesSearch && matchesTier && matchesStatus;
  });

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newSubdomain || !newContactEmail) return;

    const newOrg: TenantOrganization = {
      id: `TEN-${String(tenants.length + 1).padStart(3, '0')}`,
      name: newTenantName,
      subdomain: `${newSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')}.skinnor.io`,
      tier: newTier,
      status: 'Periodo de Prueba',
      createdAt: new Date().toISOString().split('T')[0],
      country: newCountry,
      doctorsCount: newTier === 'Starter Clinic' ? 3 : newTier === 'Pro Clinic' ? 10 : 30,
      patientsCount: 0,
      storageUsedGb: 0.5,
      storageLimitGb: newTier === 'Starter Clinic' ? 100 : newTier === 'Pro Clinic' ? 250 : 1000,
      monthlyScansUsed: 0,
      monthlyScansLimit: newTier === 'Starter Clinic' ? 250 : newTier === 'Pro Clinic' ? 600 : 2500,
      mrrUsd: newTier === 'Starter Clinic' ? 420 : newTier === 'Pro Clinic' ? 890 : 2450,
      contactEmail: newContactEmail,
      hipaaAgreementSigned: true
    };

    setTenants([newOrg, ...tenants]);
    setIsCreateModalOpen(false);
    setNewTenantName('');
    setNewSubdomain('');
    setNewContactEmail('');
  };

  const handleToggleStatus = (id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'Activo' ? 'Suspended' : 'Activo'
        };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Gestión de Organizaciones & Clínicas (Tenants)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aprovisionamiento de instancias aisladas, control de planes, límites de almacenamiento y cuotas de IA.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Aprovisionar Nueva Clínica
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, subdominio o contacto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-8 bg-white border-slate-200 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="todos">Todos los Planes</option>
              <option value="Starter Clinic">Starter Clinic</option>
              <option value="Pro Clinic">Pro Clinic</option>
              <option value="Enterprise Hospital">Enterprise Hospital</option>
              <option value="Network Group">Network Group</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="todos">Todos los Estados</option>
              <option value="Activo">Activo</option>
              <option value="Periodo de Prueba">Periodo de Prueba</option>
              <option value="Suspended">Suspendido</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-900">ID / Organización</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Plan & Subdominio</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Estado</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Médicos / Pacientes</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Cuota Escaneos IA</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Almacenamiento</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">MRR (USD)</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => {
                const scanPercent = Math.round((tenant.monthlyScansUsed / tenant.monthlyScansLimit) * 100);
                return (
                  <TableRow key={tenant.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-xs">
                      <div className="font-semibold text-slate-900">{tenant.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <span>{tenant.id}</span>
                        <span>•</span>
                        <span>{tenant.country}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-slate-900">{tenant.tier}</div>
                      <a 
                        href={`https://${tenant.subdomain}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                      >
                        {tenant.subdomain} <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        tenant.status === 'Activo'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : tenant.status === 'Periodo de Prueba'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {tenant.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      <div className="font-medium text-slate-900">{tenant.doctorsCount} médicos</div>
                      <div className="text-[11px] text-slate-500">{tenant.patientsCount} pacientes</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-medium text-slate-900 tabular-nums">{tenant.monthlyScansUsed} / {tenant.monthlyScansLimit}</span>
                        <span className="text-slate-500">{scanPercent}%</span>
                      </div>
                      <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(scanPercent, 100)}%` }}
                        ></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-slate-700">
                      <span className="font-semibold text-slate-900">{tenant.storageUsedGb} GB</span>
                      <span className="text-slate-500 text-[11px]"> / {tenant.storageLimitGb} GB</span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900 tabular-nums">
                      ${tenant.mrrUsd} /mes
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTenantDetail(tenant)}
                          className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          <Settings2 className="h-3 w-3 mr-1 text-slate-500" /> Gestionar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(tenant.id)}
                          className={`h-7 text-xs border-slate-200 shadow-2xs ${
                            tenant.status === 'Activo' 
                              ? 'text-amber-700 hover:bg-amber-50 hover:border-amber-200' 
                              : 'text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {tenant.status === 'Activo' ? 'Suspender' : 'Activar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail / Quota Config Drawer Modal */}
      {selectedTenantDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-xl border border-slate-200 space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Configuración de Tenant: {selectedTenantDetail.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedTenantDetail.id} • {selectedTenantDetail.subdomain}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTenantDetail(null)}
                className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Plan Actual</span>
                <span className="font-bold text-slate-900 text-xs">{selectedTenantDetail.tier}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Doctores Máximos</span>
                <span className="font-bold text-slate-900 text-xs tabular-nums">{selectedTenantDetail.doctorsCount} cupos</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Cuota Escaneos IA</span>
                <span className="font-bold text-slate-900 text-xs tabular-nums">{selectedTenantDetail.monthlyScansLimit} / mes</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Límite DICOM / Fotos</span>
                <span className="font-bold text-slate-900 text-xs tabular-nums">{selectedTenantDetail.storageLimitGb} GB</span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Dominio Personalizado (SSL):</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedTenantDetail.customDomain || 'No configurado (Usa *.skinnor.io)'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Contacto de Administración / DPO:</span>
                <span className="font-medium text-slate-900">{selectedTenantDetail.contactEmail}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Acuerdo de Confidencialidad Médica & HIPAA BAA:</span>
                <span className="font-semibold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Firmado & Vigente
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTenantDetail(null)}
                className="text-xs h-8"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">
                  Aprovisionar Nueva Organización / Tenant
                </h3>
                <p className="text-xs text-slate-500">
                  Crea un esquema aislado y subdominio seguro en la nube.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800">Nombre de la Clínica u Hospital:</label>
                <Input
                  required
                  placeholder="ej. Hospital Clínico Universidad Central"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="h-8 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800">Subdominio Único:</label>
                <div className="flex items-center">
                  <Input
                    required
                    placeholder="hospital-central"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    className="h-8 text-xs bg-slate-50/50 rounded-r-none font-mono"
                  />
                  <span className="h-8 px-2.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-md text-[11px] text-slate-600 flex items-center font-mono">
                    .skinnor.io
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">Plan de Suscripción:</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as TenantOrganization['tier'])}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
                  >
                    <option value="Starter Clinic">Starter Clinic ($420/mes)</option>
                    <option value="Pro Clinic">Pro Clinic ($890/mes)</option>
                    <option value="Enterprise Hospital">Enterprise Hospital ($1,850/mes)</option>
                    <option value="Network Group">Network Group ($3,450/mes)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">País de Operación:</label>
                  <select
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
                  >
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                    <option value="México">México</option>
                    <option value="Argentina">Argentina</option>
                    <option value="España">España</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800">Email Administrador / Director Médico:</label>
                <Input
                  required
                  type="email"
                  placeholder="direccionmedica@hospitalcentral.org"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="h-8 text-xs bg-slate-50/50"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                Al aprovisionar el tenant, se creará automáticamente el contenedor de base de datos cifrado AES-256 y se enviará una invitación de activación al correo del administrador.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Confirmar & Aprovisionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
