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
  ShieldCheck,
  Search,
  Lock,
  Download,
  Key,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { INITIAL_GLOBAL_AUDIT_LOGS, GlobalAuditLog } from './superAdminData';

export default function ComplianceAudit() {
  const [logs, setLogs] = useState<GlobalAuditLog[]>(INITIAL_GLOBAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('todos');

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'todos' || l.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const handleExportAudit = () => {
    const csv = "ID,Timestamp,Tenant,User,Role,Action,IP,Severity,Details\n" + 
      logs.map(l => `"${l.id}","${l.timestamp}","${l.tenantName}","${l.userName}","${l.userRole}","${l.action}","${l.ipAddress}","${l.severity}","${l.details}"`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_hipaa_logs_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Auditoría Global, Cumplimiento HIPAA & Seguridad de Datos
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro inmutable de trazabilidad de acceso a fichas clínicas, exportaciones de imágenes y cambios de configuración médica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAudit}
            className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Exportar Informe de Auditoría
          </Button>
        </div>
      </div>

      {/* Compliance Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cifrado de Datos</span>
            <Lock className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="text-lg font-bold text-slate-900">AES-256 / TLS 1.3</div>
          <p className="text-[11px] text-emerald-700 font-medium">
            100% de imágenes e informes cifrados en reposo y en tránsito.
          </p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Acuerdos BAA HIPAA</span>
            <FileText className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="text-lg font-bold text-slate-900">5 de 5 Tenants Vigentes</div>
          <p className="text-[11px] text-slate-500">
            Firmas electrónicas y DPO designados en cada clínica.
          </p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Retención & Anonimización</span>
            <Key className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="text-lg font-bold text-slate-900">10 Años Clínico / Desidentificado</div>
          <p className="text-[11px] text-slate-500">
            Cumple normativa ISO 27799 y Ley de Deberes y Derechos del Paciente.
          </p>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por usuario, acción, clínica o IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-8 bg-white border-slate-200 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="todos">Toda Severidad</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-900">ID / Fecha & Hora</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Organización</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Acción / Tipo de Evento</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Usuario & Rol</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Dirección IP</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Detalles de Auditoría</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="text-xs">
                    <div className="font-mono text-slate-500">{log.id}</div>
                    <div className="text-slate-800 font-medium whitespace-nowrap">{log.timestamp}</div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    {log.tenantName}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      log.severity === 'Critical'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : log.severity === 'Warning'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-slate-900">{log.userName}</div>
                    <div className="text-[11px] text-slate-500">{log.userRole}</div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">
                    {log.ipAddress}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-md leading-relaxed">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
