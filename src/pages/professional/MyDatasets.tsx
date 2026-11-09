import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, DatabaseBackup, Plus, FileText, Download, Calendar, ArchiveRestore } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Mock data for existing datasets
const CUSTOM_DATASETS = [
  {
    id: 'DS-2026-08A',
    name: 'Cohorte Nevos Sospechosos 2026',
    description: 'Pacientes con evolución de asimetría > 10% en el último semestre.',
    records: 145,
    format: 'CSV + ZIP (Imágenes)',
    createdAt: '12 Ago 2026',
    status: 'ready'
  },
  {
    id: 'DS-2026-05B',
    name: 'Melanomas Confirmados - Zona Sur',
    description: 'Casos con confirmación histopatológica, edades 40-65.',
    records: 32,
    format: 'CSV',
    createdAt: '05 May 2026',
    status: 'ready'
  }
];

export default function MyDatasets() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
            Mis Datasets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Genera, estructura y exporta conjuntos de datos a partir de los registros clínicos de tus pacientes.
          </p>
        </div>
        <Button 
          className="bg-[#0c1512] hover:bg-[#3f4f49] text-white rounded-md shadow-none font-medium"
          onClick={() => navigate('/pro/mis-datasets/crear')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Nuevo Dataset
        </Button>
      </div>

      <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[#d8e0dc] bg-[#fafcfa] flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f7b6f]" />
            <Input 
              placeholder="Buscar dataset por nombre o ID..." 
              className="pl-9 border-[#d8e0dc] bg-white shadow-none focus-visible:ring-[#0d7a63]"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f6f5] border-b border-[#d8e0dc] text-[#5f7b6f] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre y Descripción</th>
                <th className="px-6 py-4 font-medium">Volumen</th>
                <th className="px-6 py-4 font-medium">Fecha de Creación</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8e0dc]">
              {CUSTOM_DATASETS.map((dataset) => (
                <tr key={dataset.id} className="hover:bg-[#fafcfa] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0c1512] flex items-center gap-2">
                      <ArchiveRestore className="h-4 w-4 text-[#0d7a63]" />
                      {dataset.name}
                    </div>
                    <div className="text-xs text-[#5f7b6f] mt-1 max-w-md line-clamp-1">{dataset.description}</div>
                    <div className="text-[10px] uppercase tracking-widest text-[#5f7b6f] mt-2 font-medium">ID: {dataset.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0c1512]">{dataset.records} registros</span>
                      <span className="text-xs text-[#5f7b6f] flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {dataset.format}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#3f4f49]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#5f7b6f]" />
                      {dataset.createdAt}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-[#d8e0dc] text-[#0c1512] hover:bg-[#e9efec] shadow-none font-medium h-8"
                    >
                      Editar
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-[#0d7a63] hover:bg-[#0a4539] text-white shadow-none font-medium h-8"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Descargar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {CUSTOM_DATASETS.length === 0 && (
        <div className="text-center py-24 px-4 border-2 border-dashed border-[#d8e0dc] rounded-xl bg-[#fafcfa]">
          <DatabaseBackup className="mx-auto h-12 w-12 text-[#b9c6c0] mb-4" />
          <h3 className="text-lg font-semibold text-[#0c1512] mb-2">No tienes datasets generados</h3>
          <p className="text-sm text-[#5f7b6f] max-w-md mx-auto">
            Crea tu primer conjunto de datos etiquetando y filtrando los registros de tus pacientes para exportarlos y entrenar modelos o realizar estudios.
          </p>
        </div>
      )}
    </div>
  );
}
