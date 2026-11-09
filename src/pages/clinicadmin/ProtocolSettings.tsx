import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  FileCheck2,
  Sliders,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Building,
  Bell,
  Scale,
  Save,
  RotateCcw
} from 'lucide-react';
import { get, put } from '@/lib/api';
import { toast } from 'sonner';

export default function ProtocolSettings() {
  const [config, setConfig] = useState<any>({
    urgency_tds_threshold: 5.15,
    growth_delta_threshold_mm_per_month: 0.20,
    mandatory_biopsy_checklist: true,
    enable_patient_telemonitoring: true,
    auto_notify_referral_doctor: true,
    require_two_specialists_for_high_atipia: false,
    clinic_legal_disclaimer: '',
    report_header_title: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/clinica/protocolo').then((data: any) => {
      if (data && Object.keys(data).length > 0) {
        setConfig(data);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await put('/clinica/protocolo', config);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      toast.success('Protocolos guardados');
    } catch {
      toast.error('No se pudieron guardar los protocolos');
    }
  };

  const handleReset = async () => {
    try {
      const data = await get('/clinica/protocolo');
      setConfig(data || {
        urgency_tds_threshold: 5.15,
        growth_delta_threshold_mm_per_month: 0.20,
        mandatory_biopsy_checklist: true,
        enable_patient_telemonitoring: true,
        auto_notify_referral_doctor: true,
        require_two_specialists_for_high_atipia: false,
        clinic_legal_disclaimer: '',
        report_header_title: '',
      });
    } catch {
      toast.error('No se pudo restablecer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#5f7b6f]">Cargando protocolos...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileCheck2 className="h-6 w-6 text-emerald-600" />
            Protocolos Clínicos & Configuración de Informes
          </h1>
          <p className="text-sm text-slate-500">
            Define umbrales de alerta TDS, reglas de biopsia obligatoria, telemonitoreo y cabeceras legales de informes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} className="text-slate-700 hover:bg-slate-50 border-slate-200 text-xs shadow-2xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Restablecer
          </Button>
          <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-2 text-xs">
            <Save className="h-3.5 w-3.5" />
            Guardar Protocolos
          </Button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Protocolos clínicos guardados correctamente.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              Umbrales Diagnósticos & Triage de Lesiones (TDS Score)
            </CardTitle>
            <CardDescription>
              Configuración de sensibilidad para categorización de riesgo según la fórmula de Stolz.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="tds-threshold" className="text-xs font-semibold text-slate-800">
                    Umbral de Alerta Crítica TDS (Puntaje de Stolz)
                  </Label>
                  <Badge variant="warning" className="text-xs font-mono font-bold">
                    {config.urgency_tds_threshold?.toFixed(2)}
                  </Badge>
                </div>
                <Input
                  id="tds-threshold"
                  type="number"
                  step="0.05"
                  min="4.0"
                  max="6.5"
                  value={config.urgency_tds_threshold}
                  onChange={(e) =>
                    setConfig({ ...config, urgency_tds_threshold: parseFloat(e.target.value) || 5.15 })
                  }
                  className="bg-slate-50"
                />
                <p className="text-[11px] text-slate-500">
                  Valores &gt; 5.45 indican sospecha alta de melanoma.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="growth-threshold" className="text-xs font-semibold text-slate-800">
                    Umbral de Crecimiento Rápido Delta (mm/mes)
                  </Label>
                  <Badge variant="info" className="text-xs font-mono font-bold">
                    {config.growth_delta_threshold_mm_per_month?.toFixed(2)} mm
                  </Badge>
                </div>
                <Input
                  id="growth-threshold"
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="1.50"
                  value={config.growth_delta_threshold_mm_per_month}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      growth_delta_threshold_mm_per_month: parseFloat(e.target.value) || 0.20
                    })
                  }
                  className="bg-slate-50"
                />
                <p className="text-[11px] text-slate-500">
                  Un incremento del diámetro mayor a este valor dispara sugerencia de biopsia.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Reglas de Control & Seguridad Clínica
            </CardTitle>
            <CardDescription>
              Políticas institucionales de validación médica cruzada y enrolamiento de telemonitoreo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-slate-800">
                  Checklist Obligatorio de Biopsia Escisional
                </Label>
                <p className="text-[11px] text-slate-500">
                  Exige confirmación de márgenes quirúrgicos antes de emitir la orden médica.
                </p>
              </div>
              <Switch
                checked={config.mandatory_biopsy_checklist === 1}
                onCheckedChange={(val) => setConfig({ ...config, mandatory_biopsy_checklist: val ? 1 : 0 })}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-slate-800">
                  Requerir Segunda Opinión Médica en Atipias Severas (TDS &gt; 5.45)
                </Label>
                <p className="text-[11px] text-slate-500">
                  El informe requiere el visado digital de 2 dermatólogos antes de ser liberado.
                </p>
              </div>
              <Switch
                checked={config.require_two_specialists_for_high_atipia === 1}
                onCheckedChange={(val) =>
                  setConfig({ ...config, require_two_specialists_for_high_atipia: val ? 1 : 0 })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-slate-800">
                  Habilitar Telemonitoreo Domiciliario de Pacientes
                </Label>
                <p className="text-[11px] text-slate-500">
                  Permite a pacientes asignados subir fotos de seguimiento periódicas.
                </p>
              </div>
              <Switch
                checked={config.enable_patient_telemonitoring === 1}
                onCheckedChange={(val) =>
                  setConfig({ ...config, enable_patient_telemonitoring: val ? 1 : 0 })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-slate-800">
                  Notificación Automática a Médico Derivador
                </Label>
                <p className="text-[11px] text-slate-500">
                  Envía copia cifrada del informe al médico derivador.
                </p>
              </div>
              <Switch
                checked={config.auto_notify_referral_doctor === 1}
                onCheckedChange={(val) =>
                  setConfig({ ...config, auto_notify_referral_doctor: val ? 1 : 0 })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-600" />
              Encabezados Institucionales & Descargo Legal
            </CardTitle>
            <CardDescription>
              Configuración de textos legales y membrete clínico para cumplimiento de la Ley N° 20.584.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-title" className="text-xs font-semibold text-slate-800">
                Título del Membrete del Informe Clínico
              </Label>
              <Input
                id="report-title"
                value={config.report_header_title || ''}
                onChange={(e) => setConfig({ ...config, report_header_title: e.target.value })}
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="legal-disclaimer" className="text-xs font-semibold text-slate-800">
                Texto de Descargo de Responsabilidad Médica & Algorítmica
              </Label>
              <textarea
                id="legal-disclaimer"
                rows={3}
                value={config.clinic_legal_disclaimer || ''}
                onChange={(e) => setConfig({ ...config, clinic_legal_disclaimer: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-6 shadow-xs">
            <Save className="h-4 w-4 mr-2" />
            Guardar y Aplicar Todos los Protocolos
          </Button>
        </div>
      </form>
    </div>
  );
}
