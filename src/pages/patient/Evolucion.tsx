import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { usePatientLesiones } from './usePatientLesiones';
import { buildLesionEvolucion } from '@/lib/evolucion';
import EvolucionPanel from '@/components/EvolucionPanel';
import { toast } from 'sonner';
import { useEffect, useMemo } from 'react';

export default function Evolucion() {
  const { lesiones, loading, error } = usePatientLesiones();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const evoluciones = useMemo(
    () => lesiones.map((l) => buildLesionEvolucion(l, l.seguimientos)),
    [lesiones]
  );

  const totalRegistros = lesiones.reduce((acc, l) => acc + l.seguimientos.length, 0);

  return (
    <div className="max-w-6xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">Evolución clínica</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Seguimiento cronológico de tus lesiones: serie fotográfica, diámetros registrados,
          reportes de cambios y evaluación ABCDE.
        </p>
      </div>

      {!loading && lesiones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-[#5f7b6f] mb-1">Lesiones en seguimiento</p>
              <p className="text-3xl font-semibold text-[#0c1512]">{lesiones.length}</p>
            </CardContent>
          </Card>
          <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-[#5f7b6f] mb-1">Controles registrados</p>
              <p className="text-3xl font-semibold text-[#0c1512]">{totalRegistros}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-[#5f7b6f]">Cargando evolución...</div>
      ) : lesiones.length === 0 ? (
        <Card className="border-[#d8e0dc] shadow-none rounded-xl bg-white">
          <CardContent className="p-12 text-center">
            <p className="font-semibold text-[#0c1512]">Aún no tienes lesiones registradas</p>
            <p className="text-sm text-[#5f7b6f] mt-1 mb-6">
              Registra tu primera lesión para comenzar su seguimiento clínico.
            </p>
            <Link
              to="/dashboard/lesiones/crear"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0c1512] hover:underline"
            >
              Registrar lesión <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <EvolucionPanel evoluciones={evoluciones} detalleBase="/dashboard/lesiones" />
      )}
    </div>
  );
}
