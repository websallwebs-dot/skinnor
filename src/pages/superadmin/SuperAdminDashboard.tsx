import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Cpu, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Server,
  Zap,
  Globe,
  Database,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { INITIAL_TENANTS, INITIAL_AI_MODELS, INITIAL_GLOBAL_AUDIT_LOGS } from './superAdminData';

const INFERENCE_TIME_SERIES = [
  { time: '00:00', inferences: 210, latency: 135 },
  { time: '04:00', inferences: 85, latency: 120 },
  { time: '08:00', inferences: 840, latency: 155 },
  { time: '12:00', inferences: 1450, latency: 180 },
  { time: '16:00', inferences: 1820, latency: 172 },
  { time: '20:00', inferences: 910, latency: 145 },
  { time: '23:59', inferences: 410, latency: 138 }
];

const TENANT_GROWTH = [
  { month: 'Mar', mrr: 4800, tenants: 3 },
  { month: 'Abr', mrr: 5400, tenants: 3 },
  { month: 'May', mrr: 6100, tenants: 4 },
  { month: 'Jun', mrr: 6850, tenants: 4 },
  { month: 'Jul', mrr: 7200, tenants: 5 },
  { month: 'Ago', mrr: 7500, tenants: 5 }
];

interface SuperAdminDashboardProps {
  onNavigateToTenants?: () => void;
  onNavigateToIa?: () => void;
}

export default function SuperAdminDashboard({
  onNavigateToTenants,
  onNavigateToIa
}: SuperAdminDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const totalDoctors = INITIAL_TENANTS.reduce((acc, t) => acc + t.doctorsCount, 0);
  const totalPatients = INITIAL_TENANTS.reduce((acc, t) => acc + t.patientsCount, 0);
  const totalScansMonth = INITIAL_TENANTS.reduce((acc, t) => acc + t.monthlyScansUsed, 0);
  const totalMrr = INITIAL_TENANTS.reduce((acc, t) => acc + t.mrrUsd, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Platform Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Plataforma Multi-Tenant SkinNor Core Operativa
            </span>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
              Cluster US-East (Cloud Run & GPU Nodes)
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Panel de Control Global — Super Administrador SaaS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisión centralizada de organizaciones médicas, telemetría de modelos de IA, cumplimiento HIPAA y métricas de negocio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sincronizar Telemetría
          </Button>
          {onNavigateToTenants && (
            <Button
              size="sm"
              onClick={onNavigateToTenants}
              className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Aprovisionar Tenant
            </Button>
          )}
        </div>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Organizaciones Activas</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{INITIAL_TENANTS.length}</span>
            <span className="text-xs text-emerald-700 font-medium flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> 100% SLA
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {totalDoctors} médicos con licencia activa
          </p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Inferencia IA (Mes)</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalScansMonth.toLocaleString()}
            </span>
            <span className="text-xs text-sky-700 font-medium flex items-center">
              ~160 ms lat.
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            U-Net + ISIC DenseNet + Stolz Rust
          </p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pacientes Monitorizados</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalPatients.toLocaleString()}
            </span>
            <span className="text-xs text-indigo-700 font-medium flex items-center">
              +14% mensual
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Historiales longitudinales activos
          </p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">MRR Suscripciones</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              ${totalMrr.toLocaleString()} USD
            </span>
            <span className="text-xs text-emerald-700 font-medium flex items-center">
              ARR: ${(totalMrr * 12).toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            0% tasa de abandono (Churn 0.0%)
          </p>
        </Card>
      </div>

      {/* Main Charts & Telemetry Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Real-time Inferences Chart (7 cols) */}
        <Card className="lg:col-span-7 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-700" />
                Carga de Inferencia de IA & Latencia Promedio (24 Horas)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Volumen de ejecuciones U-Net y tiempo de procesamiento en milisegundos.
              </CardDescription>
            </div>
            {onNavigateToIa && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToIa}
                className="text-xs h-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Gobernanza IA <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={INFERENCE_TIME_SERIES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInferences" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d7a63" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0d7a63" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inferences" 
                    name="Inferencias" 
                    stroke="#0d7a63" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorInferences)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Latencia Media (p50)</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">142 ms</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Latencia Crítica (p99)</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">285 ms</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tasa de Error Inferencia</span>
                <span className="font-bold text-emerald-700 text-sm tabular-nums">0.002%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Tenants List / Quota Status (5 cols) */}
        <Card className="lg:col-span-5 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-700" />
                Organizaciones & Consumo de Cuotas
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Estado de tenants aprovisionados en la plataforma.
              </CardDescription>
            </div>
            {onNavigateToTenants && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToTenants}
                className="text-xs h-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Ver Todas <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {INITIAL_TENANTS.slice(0, 4).map((tenant) => {
              const scanPercent = Math.round((tenant.monthlyScansUsed / tenant.monthlyScansLimit) * 100);
              return (
                <div 
                  key={tenant.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{tenant.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{tenant.subdomain}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                      {tenant.tier}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Uso de Escaneos IA:</span>
                      <span className="font-semibold tabular-nums">{tenant.monthlyScansUsed} / {tenant.monthlyScansLimit} ({scanPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          scanPercent > 90 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(scanPercent, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>{tenant.doctorsCount} Médicos • {tenant.patientsCount} Pacientes</span>
                    <span className="font-semibold text-slate-800">${tenant.mrrUsd}/mes</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Model Registry & Security Logs Summary */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Model Status (6 cols) */}
        <Card className="lg:col-span-6 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-700" />
              Modelos de IA en Producción & Exactitud
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {INITIAL_AI_MODELS.map((model) => (
              <div key={model.modelId} className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{model.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{model.version} • {model.framework}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    model.status === 'Producción'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {model.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 text-[10px] block">Sensibilidad Melanoma</span>
                    <span className="font-bold text-slate-900 tabular-nums">{model.sensitivityMelanoma}%</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 text-[10px] block">Especificidad Nevus</span>
                    <span className="font-bold text-slate-900 tabular-nums">{model.specificityNevus}%</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 text-[10px] block">Latencia Media</span>
                    <span className="font-bold text-slate-900 tabular-nums">{model.avgLatencyMs} ms</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Global Security Audit Log (6 cols) */}
        <Card className="lg:col-span-6 border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              Auditoría Global & Eventos de Seguridad HIPAA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {INITIAL_GLOBAL_AUDIT_LOGS.map((log) => (
              <div key={log.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      log.severity === 'Critical' 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : log.severity === 'Warning' 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">{log.tenantName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 tabular-nums">{log.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {log.details}
                </p>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Usuario: <strong>{log.userName}</strong> ({log.userRole})</span>
                  <span className="font-mono">{log.ipAddress}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
