import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Server,
  Shield,
  Key,
  Database,
  BellRing,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function SuperAdminConfig() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maxInferenceConcurrency, setMaxInferenceConcurrency] = useState(50);
  const [defaultDoctorQuota, setDefaultDoctorQuota] = useState(10);
  const [defaultScanQuota, setDefaultScanQuota] = useState(600);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Configuración Global del Sistema Multi-Tenant
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Límites de infraestructura, variables del clúster de inferencia y políticas de aprovisionamiento por defecto.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          className="text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" /> Guardado
            </>
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cluster & Compute Config */}
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-700" />
              Límites de Cómputo & Concurrencia de IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-800">Concurrencia Máxima GPU TensorRT:</label>
              <Input
                type="number"
                value={maxInferenceConcurrency}
                onChange={(e) => setMaxInferenceConcurrency(Number(e.target.value))}
                className="h-8 text-xs bg-slate-50/50"
              />
              <span className="text-[11px] text-slate-500">Peticiones concurrentes simultáneas por nodo acelerador.</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800">Timeout Máximo de Inferencia (segundos):</label>
              <Input
                type="number"
                defaultValue={15}
                className="h-8 text-xs bg-slate-50/50"
              />
              <span className="text-[11px] text-slate-500">Tiempo límite antes de abortar procesamiento y reportar fallo de segmentación.</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">Modo de Mantenimiento Global</span>
                <span className="text-[11px] text-slate-500">Bloquea nuevas subidas a tenants no administradores.</span>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  maintenanceMode ? 'bg-rose-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Default Quotas */}
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-700" />
              Cuotas por Defecto para Nuevos Tenants
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-800">Médicos Incluidos por Defecto (Plan Pro):</label>
              <Input
                type="number"
                value={defaultDoctorQuota}
                onChange={(e) => setDefaultDoctorQuota(Number(e.target.value))}
                className="h-8 text-xs bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800">Escaneos IA Mensuales por Defecto:</label>
              <Input
                type="number"
                value={defaultScanQuota}
                onChange={(e) => setDefaultScanQuota(Number(e.target.value))}
                className="h-8 text-xs bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800">Almacenamiento DICOM Inicial (GB):</label>
              <Input
                type="number"
                defaultValue={250}
                className="h-8 text-xs bg-slate-50/50"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
