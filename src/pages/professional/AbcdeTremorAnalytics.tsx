import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  Info,
  Layers,
  ArrowUpRight,
  Download
} from 'lucide-react';

const fullEvolutionData = [
  { date: '15 Ene', fullDate: '15 Ene 2026', asimetria: 42, bordes: 38, color: 45, diametro: 5.2, scoreTDS: 3.85, alerta: 'Benigno' },
  { date: '15 Mar', fullDate: '15 Mar 2026', asimetria: 48, bordes: 42, color: 50, diametro: 5.5, scoreTDS: 4.20, alerta: 'Benigno' },
  { date: '15 May', fullDate: '15 May 2026', asimetria: 55, bordes: 49, color: 62, diametro: 5.9, scoreTDS: 4.65, alerta: 'Sospechoso' },
  { date: '01 Jul', fullDate: '01 Jul 2026', asimetria: 64, bordes: 56, color: 70, diametro: 6.2, scoreTDS: 5.15, alerta: 'Sospechoso' },
  { date: '01 Ago', fullDate: '01 Ago 2026', asimetria: 72, bordes: 61, color: 78, diametro: 6.5, scoreTDS: 5.50, alerta: 'Alto Riesgo' },
  { date: '15 Ago', fullDate: '15 Ago 2026', asimetria: 78, bordes: 65, color: 82, diametro: 6.8, scoreTDS: 5.75, alerta: 'Crítico' },
];

const CustomTremorTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0c1512] text-white p-3 rounded-lg shadow-xl border border-white/10 text-xs font-sans min-w-[190px]">
        <div className="font-semibold border-b border-white/15 pb-1.5 mb-2 flex justify-between items-center">
          <span>{label}</span>
          <span className="text-[#a4dfcf] text-[10px] uppercase font-mono">Control</span>
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2 h-2 rounded-full inline-block" 
                  style={{ backgroundColor: entry.color || entry.stroke || '#0d7a63' }}
                />
                <span className="text-slate-300">{entry.name}:</span>
              </div>
              <span className="font-semibold text-white font-mono">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface AbcdeTremorAnalyticsProps {
  onTransferToReport?: () => void;
}

export default function AbcdeTremorAnalytics({ onTransferToReport }: AbcdeTremorAnalyticsProps) {
  const [metricMode, setMetricMode] = useState<'score' | 'abcde'>('score');

  return (
    <div className="space-y-6">
      {/* 4 Tremor-Style KPI Cards with clear deltas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Score TDS */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl p-5 hover:border-[#b8c9c1] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#5f7b6f] uppercase font-semibold tracking-wider font-mono">
              Score TDS (Total)
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c1512] bg-[#f4f6f5] px-2 py-0.5 rounded border border-[#d8e0dc]">
              <TrendingUp className="h-3 w-3" /> +12.8%
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-3xl font-bold text-[#0c1512] font-mono">5.75</span>
              <span className="text-xs text-[#5f7b6f] ml-1">/ 8.9 pts</span>
            </div>
            <span className="text-[11px] font-semibold text-white bg-[#0c1512] px-2 py-0.5 rounded">
              Sospecha Alta
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[#5f7b6f]">
              <span>Benigno (&lt;4.75)</span>
              <span>Límite (5.45)</span>
              <span className="font-semibold text-[#0c1512]">Actual (5.75)</span>
            </div>
            <div className="w-full h-1.5 bg-[#e9efec] rounded-full overflow-hidden flex">
              <div className="bg-[#5f7b6f] h-full" style={{ width: '53%' }} />
              <div className="bg-[#a2b5ab] h-full" style={{ width: '8%' }} />
              <div className="bg-[#0c1512] h-full" style={{ width: '39%' }} />
            </div>
          </div>
        </Card>

        {/* Card 2: A - Asimetría */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl p-5 hover:border-[#b8c9c1] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#5f7b6f] uppercase font-semibold tracking-wider font-mono">
              A - Asimetría 2D
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c1512] bg-[#f4f6f5] px-2 py-0.5 rounded border border-[#d8e0dc]">
              <TrendingUp className="h-3 w-3" /> +14.5%
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-3xl font-bold text-[#0c1512] font-mono">78%</span>
              <span className="text-xs text-[#5f7b6f] ml-1">en 2 ejes</span>
            </div>
            <span className="text-[11px] font-medium text-[#0c1512] bg-[#e9efec] px-2 py-0.5 rounded border border-[#d8e0dc]">
              Biaxial
            </span>
          </div>
          <div className="text-[11px] text-[#5f7b6f] flex justify-between">
            <span>Diferencia radial:</span>
            <span className="font-semibold text-[#0c1512]">Eje 45° vs 135°</span>
          </div>
        </Card>

        {/* Card 3: B - Bordes */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl p-5 hover:border-[#b8c9c1] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#5f7b6f] uppercase font-semibold tracking-wider font-mono">
              B - Bordes / Abrupto
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c1512] bg-[#f4f6f5] px-2 py-0.5 rounded border border-[#d8e0dc]">
              <TrendingUp className="h-3 w-3" /> +8.2%
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-3xl font-bold text-[#0c1512] font-mono">65%</span>
              <span className="text-xs text-[#5f7b6f] ml-1">Festoneado</span>
            </div>
            <span className="text-[11px] font-medium text-[#0c1512] bg-[#e9efec] px-2 py-0.5 rounded border border-[#d8e0dc]">
              6/8 Sectores
            </span>
          </div>
          <div className="text-[11px] text-[#5f7b6f] flex justify-between">
            <span>Interrupción abrupta:</span>
            <span className="font-semibold text-[#0c1512]">Cuadrante sup-izq</span>
          </div>
        </Card>

        {/* Card 4: D - Diámetro */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl p-5 hover:border-[#b8c9c1] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#5f7b6f] uppercase font-semibold tracking-wider font-mono">
              D - Diámetro
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0c1512] bg-[#f4f6f5] px-2 py-0.5 rounded border border-[#d8e0dc]">
              <TrendingUp className="h-3 w-3" /> +0.6 mm
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-3xl font-bold text-[#0c1512] font-mono">6.8</span>
              <span className="text-xs text-[#5f7b6f] ml-1">mm (&gt;6mm)</span>
            </div>
            <span className="text-[11px] font-semibold text-white bg-[#0c1512] px-2 py-0.5 rounded">
              Expansión
            </span>
          </div>
          <div className="text-[11px] text-[#5f7b6f] flex justify-between">
            <span>Velocidad mensual:</span>
            <span className="font-semibold text-[#0c1512]">+0.18 mm / mes</span>
          </div>
        </Card>
      </div>

      {/* Single Main Clean Tremor Area Chart */}
      <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
              Evolución Longitudinal de Lesión (Gráfico de Área)
            </CardTitle>
            <CardDescription className="text-xs text-[#5f7b6f]">
              Comportamiento temporal de puntuación dermatoscópica Stolz TDS frente a umbral clínico de seguridad.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-[#d8e0dc] bg-white p-0.5 text-xs font-medium">
              <button
                onClick={() => setMetricMode('score')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  metricMode === 'score'
                    ? 'bg-[#0c1512] text-white shadow-xs font-semibold'
                    : 'text-[#5f7b6f] hover:text-[#0c1512]'
                }`}
              >
                Score TDS
              </button>
              <button
                onClick={() => setMetricMode('abcde')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  metricMode === 'abcde'
                    ? 'bg-[#0c1512] text-white shadow-xs font-semibold'
                    : 'text-[#5f7b6f] hover:text-[#0c1512]'
                }`}
              >
                Variables ABCD (%)
              </button>
            </div>

            {onTransferToReport && (
              <Button
                onClick={onTransferToReport}
                className="bg-[#0d7a63] hover:bg-[#0a4539] text-white text-xs h-8 shadow-none"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Redactar Síntesis
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {metricMode === 'score' ? (
            <div>
              <div className="flex items-center justify-between mb-4 text-xs text-[#5f7b6f]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-rose-500 rounded-sm"></span>
                    <span className="font-medium text-[#0c1512]">Score TDS Observado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-rose-600 border-b border-dashed border-rose-600"></span>
                    <span>Umbral Malignidad (&gt;5.45)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-500"></span>
                    <span>Umbral Seguimiento (&gt;4.75)</span>
                  </div>
                </div>
                <span className="font-mono text-[#0c1512] font-semibold bg-[#f9ecd4] px-2 py-0.5 rounded">
                  Delta Total: +1.90 pts
                </span>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fullEvolutionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mainScoreTds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f7b6f' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f7b6f' }} domain={[3.0, 6.5]} />
                    <Tooltip content={<CustomTremorTooltip />} />
                    
                    <ReferenceLine y={5.45} stroke="#e11d48" strokeDasharray="4 4" label={{ value: 'Alto Riesgo (5.45)', fill: '#e11d48', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={4.75} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'Seguimiento (4.75)', fill: '#d97706', fontSize: 10, position: 'right' }} />
                    
                    <Area 
                      type="monotone" 
                      dataKey="scoreTDS" 
                      name="Score TDS" 
                      unit="pts"
                      stroke="#e11d48" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#mainScoreTds)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#c77a0b] rounded-sm"></span>
                  <span className="text-[#0c1512] font-medium">Asimetría (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#0d7a63] rounded-sm"></span>
                  <span className="text-[#0c1512] font-medium">Bordes Irregulares (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#2563eb] rounded-sm"></span>
                  <span className="text-[#0c1512] font-medium">Policromía (%)</span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fullEvolutionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaAsim2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c77a0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#c77a0b" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="areaBord2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d7a63" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0d7a63" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="areaColor2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f7b6f' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f7b6f' }} domain={[0, 100]} />
                    <Tooltip content={<CustomTremorTooltip />} />
                    
                    <Area type="monotone" dataKey="asimetria" name="Asimetría" unit="%" stroke="#c77a0b" strokeWidth={2} fill="url(#areaAsim2)" />
                    <Area type="monotone" dataKey="bordes" name="Bordes" unit="%" stroke="#0d7a63" strokeWidth={2} fill="url(#areaBord2)" />
                    <Area type="monotone" dataKey="color" name="Policromía" unit="%" stroke="#2563eb" strokeWidth={2} fill="url(#areaColor2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clean Neutral Callout */}
      <div className="p-4 rounded-xl bg-[#fafcfa] border border-[#d8e0dc] flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-[#0c1512] shrink-0 mt-0.5" />
        <div className="text-xs text-[#0c1512] space-y-1">
          <h4 className="font-semibold text-[#0c1512]">
            Interpretación Clínica Cuantitativa
          </h4>
          <p className="text-[#3f4f49] leading-relaxed">
            Puntuación TDS de <strong>5.75</strong> con crecimiento radial sostenido (+0.18 mm/mes). Asimetría biaxial persistente. Criterio de derivación oncológica para confirmación por biopsia.
          </p>
        </div>
      </div>
    </div>
  );
}
