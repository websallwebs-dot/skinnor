import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Cpu,
  Activity,
  Layers,
  Sparkles,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Brain,
  Sliders,
  Database
} from 'lucide-react';
import { INITIAL_AI_MODELS, INITIAL_DISCREPANCIES, AIModelTelemetry } from './superAdminData';

export default function IaGovernance() {
  const [models, setModels] = useState<AIModelTelemetry[]>(INITIAL_AI_MODELS);
  const [activeModel, setActiveModel] = useState<AIModelTelemetry>(INITIAL_AI_MODELS[0]);
  const [discrepancies, setDiscrepancies] = useState(INITIAL_DISCREPANCIES);

  const handlePromoteToProduction = (modelId: string) => {
    setModels(prev => prev.map(m => {
      if (m.modelId === modelId) {
        return { ...m, status: 'Producción' };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Gobernanza de Inteligencia Artificial & Telemetría de Modelos
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisión técnica de redes neuronales (U-Net, ISIC Classifiers, Motores Stolz) y bucle de reentrenamiento clínico con biopsias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 py-1">
            TensorRT GPU Cluster: 99.98% Healthy
          </Badge>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map((model) => {
          const isSelected = activeModel.modelId === model.modelId;
          return (
            <Card 
              key={model.modelId} 
              onClick={() => setActiveModel(model)}
              className={`border transition-all cursor-pointer rounded-xl p-4 space-y-3 ${
                isSelected 
                  ? 'border-emerald-600 ring-1 ring-emerald-600/30 bg-emerald-50/20 shadow-xs' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500">{model.modelId}</span>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{model.name}</h3>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  model.status === 'Producción'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {model.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 line-clamp-2">
                {model.description}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">Sens. Melanoma</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">{model.sensitivityMelanoma}%</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">Latencia Media</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">{model.avgLatencyMs} ms</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Deep Model Telemetry Inspector */}
      <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-700" />
              <CardTitle className="text-sm md:text-base font-semibold text-slate-900">
                Inspección de Modelo: {activeModel.name} ({activeModel.version})
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Framework: {activeModel.framework} • Actualizado el {activeModel.lastUpdated}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {activeModel.status === 'Staging' && (
              <Button
                size="sm"
                onClick={() => handlePromoteToProduction(activeModel.modelId)}
                className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Promover a Producción (Rollout 100%)
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-slate-500 block text-[11px] font-medium">Exactitud Global Top-1</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{activeModel.accuracyTop1}%</span>
              <span className="text-[10px] text-emerald-700 block mt-1">Validado con ISIC 2024 Archive</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-slate-500 block text-[11px] font-medium">Sensibilidad Melanoma Maligno</span>
              <span className="text-xl font-bold text-emerald-800 tabular-nums">{activeModel.sensitivityMelanoma}%</span>
              <span className="text-[10px] text-slate-500 block mt-1">Falsos negativos &lt; 2.6%</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-slate-500 block text-[11px] font-medium">Especificidad Lesión Benigna</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{activeModel.specificityNevus}%</span>
              <span className="text-[10px] text-slate-500 block mt-1">Evita biopsias innecesarias</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-slate-500 block text-[11px] font-medium">Memoria VRAM Asignada</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{activeModel.gpuMemoryUsageMb} MB</span>
              <span className="text-[10px] text-slate-500 block mt-1">NVIDIA L4 TensorRT Core</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Discrepancy & Biopsy Feedback Loop */}
      <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-700" />
                Bucle de Retroalimentación: Discrepancias Clínicas vs Biopsias Histopatológicas
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Casos en que el diagnóstico histológico definitivo difiere de la estimación inicial del algoritmo, integrados para reentrenamiento.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-white text-slate-700 border-slate-200">
              {discrepancies.length} casos en cola
            </Badge>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-900">ID / Fecha</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Organización</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Predicción IA</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Histopatología Definitiva (Biopsia)</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Tipo de Discrepancia</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Reportado Por</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900 text-right">Estado Reentrenamiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {discrepancies.map((disc) => (
                <TableRow key={disc.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="text-xs">
                    <div className="font-mono text-slate-500">{disc.id}</div>
                    <div className="text-slate-800">{disc.date}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-900">
                    {disc.tenantName}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="text-slate-800 font-medium">{disc.aiPrediction}</div>
                    <div className="text-[11px] text-slate-500">Confianza: {disc.aiConfidence}%</div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-rose-700">
                    {disc.pathologyDiagnosis}
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                      {disc.discrepancyType}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {disc.reportedBy}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      {disc.reTrainStatus}
                    </span>
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
