import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Database, Filter, Loader2, Save, FileText, CheckCircle2 } from 'lucide-react';

export default function DatasetBuilder() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1); // 1: Config, 2: Done

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStep(2);
    }, 2000);
  };

  return (
    <div className="max-w-4xl pb-12">
      <div className="mb-6">
        <Link to="/pro/mis-datasets" className="inline-flex items-center text-sm font-medium text-[#5f7b6f] hover:text-[#0c1512] mb-4 transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a Mis Datasets
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
          Crear Dataset Clínico
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Define las reglas de extracción para compilar un conjunto de datos a partir de tus registros.
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Metadata */}
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-[#0c1512]">1. Información del Dataset</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Nombre del conjunto de datos</label>
                  <Input 
                    placeholder="Ej. Melanomas confirmados Q3 2026" 
                    className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Descripción u objetivo (Opcional)</label>
                  <Input 
                    placeholder="Describe el propósito o los criterios aplicados." 
                    className="border-[#d8e0dc] shadow-none bg-white focus-visible:ring-[#0d7a63]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
                <Filter className="h-4 w-4" /> 2. Criterios de Extracción
              </CardTitle>
              <span className="text-xs font-medium text-[#5f7b6f] bg-[#e9efec] px-2 py-0.5 rounded-sm">
                Base de datos local
              </span>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Diagnóstico Etiquetado</label>
                  <select className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]">
                    <option value="">Todos los registros</option>
                    <option value="mel">Melanoma confirmado</option>
                    <option value="nv">Nevo melanocítico</option>
                    <option value="suspicious">Lesión sospechosa (Riesgo Alto)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Rango de Edad</label>
                  <select className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]">
                    <option value="">Todas las edades</option>
                    <option value="0-18">Menores de 18</option>
                    <option value="19-40">19 a 40 años</option>
                    <option value="41-65">41 a 65 años</option>
                    <option value="65+">Mayores de 65</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Evolución ABCD</label>
                  <select className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]">
                    <option value="">Cualquier estado</option>
                    <option value="changed">Con cambios en últimos 6 meses</option>
                    <option value="stable">Estable</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f7b6f] uppercase tracking-wide">Incluir Imágenes (Dermatoscopia)</label>
                  <select className="w-full border border-[#d8e0dc] rounded-md px-3 py-2 text-sm bg-white text-[#0c1512] focus:outline-none focus:ring-1 focus:ring-[#0d7a63]">
                    <option value="yes">Sí, anexar recortes de lesiones (.zip)</option>
                    <option value="no">No, solo metadata tabular (.csv)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acción */}
          <div className="flex justify-end pt-4">
            <Button 
              className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none px-8 font-medium h-10"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Compilando registros...</>
              ) : (
                <><Database className="mr-2 h-4 w-4" /> Generar Dataset</>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-lg mx-auto mt-12 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#e9efec] mb-6">
            <CheckCircle2 className="h-10 w-10 text-[#0d7a63]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#0c1512] mb-4">Dataset Generado Exitosamente</h2>
          <p className="text-[#3f4f49] mb-8">
            Se encontraron y empaquetaron <strong>42 registros clínicos</strong> que cumplen con los criterios de extracción.
          </p>
          
          <Card className="border-[#d8e0dc] shadow-none bg-[#fafcfa] text-left mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between border-b border-[#d8e0dc] pb-3 mb-3">
                <span className="text-sm font-medium text-[#5f7b6f]">Metadata Tabular</span>
                <span className="text-xs font-semibold text-[#0c1512] flex items-center"><FileText className="h-3 w-3 mr-1" /> records.csv (14 KB)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#5f7b6f]">Imágenes Adjuntas</span>
                <span className="text-xs font-semibold text-[#0c1512] flex items-center"><Save className="h-3 w-3 mr-1" /> images.zip (112 MB)</span>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              className="border-[#d8e0dc] text-[#0c1512] hover:bg-[#fafcfa] shadow-none"
              onClick={() => navigate('/pro/mis-datasets')}
            >
              Volver a Mis Datasets
            </Button>
            <Button 
              className="bg-[#0d7a63] hover:bg-[#0a4539] text-white shadow-none"
            >
              Descargar Archivos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
