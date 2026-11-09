import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { post, get } from '@/lib/api';
import { useAuth } from '@/AuthContext';
import { Copy, CheckCircle2, Link as LinkIcon, KeyRound, Users } from 'lucide-react';
import { toast } from 'sonner';

interface CodigoAcceso {
  id: number;
  codigo: string;
  activo: number;
  usos_actuales: number;
  usos_maximos: number | null;
  creado_en: string;
}

export default function SolicitudesEnlaces() {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [codigos, setCodigos] = useState<CodigoAcceso[]>([]);
  const [vinculados, setVinculados] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [cods, vinc] = await Promise.all([
        get('/codigos-acceso', { profesional_id: user.id }).catch(() => []),
        get('/vinculaciones', { profesional_id: user.id }).catch(() => []),
      ]);
      setCodigos(Array.isArray(cods) ? cods : []);
      setVinculados(Array.isArray(vinc) ? vinc.length : null);
    } catch {
      // silencioso: datos secundarios
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateCode = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      await post('/codigos-acceso', { profesional_id: Number(user.id) });
      toast.success('Código de acceso generado');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el código');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codigosActivos = codigos.filter((c) => c.activo);

  return (
    <div className="max-w-6xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
          Solicitudes y Enlaces
        </h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Genera códigos de acceso para que tus pacientes se vinculen a tu panel profesional y puedas monitorear sus lesiones.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Generar código */}
        <div className="space-y-6">
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Código de Vinculación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-[#3f4f49] mb-6">
                Comparte este código con tu paciente. Él lo ingresa en su portal (sección Consultas → Vincular profesional) y queda conectado a tu panel.
              </p>

              <Button
                disabled={generating || !user}
                className="w-full bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none"
                onClick={handleGenerateCode}
              >
                {generating ? 'Generando...' : 'Generar Nuevo Código'}
              </Button>
            </CardContent>
          </Card>

          {/* Pacientes vinculados */}
          <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl">
            <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
                <Users className="h-4 w-4" /> Pacientes Vinculados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-3xl font-semibold text-[#0c1512]">
                {vinculados === null ? '—' : vinculados}
              </p>
              <p className="text-sm text-[#5f7b6f] mt-1">
                Pacientes que pueden enviarte consultas y cuyo historial fotográfico puedes revisar.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Códigos emitidos */}
        <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl self-start">
          <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-4">
            <CardTitle className="text-[15px] font-semibold text-[#0c1512] flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> Códigos Emitidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {codigosActivos.length === 0 ? (
              <p className="p-6 text-sm text-[#5f7b6f]">
                Aún no has generado códigos. Genera uno y compártelo con tu paciente.
              </p>
            ) : (
              <div className="divide-y divide-[#d8e0dc]">
                {codigosActivos.map((c) => (
                  <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono text-sm font-semibold text-[#0c1512] tracking-wider">
                        {c.codigo}
                      </div>
                      <div className="text-xs text-[#5f7b6f] mt-0.5">
                        Emitido {new Date(c.creado_en).toLocaleDateString('es-ES')}
                        {c.usos_maximos ? ` • ${c.usos_actuales}/${c.usos_maximos} usos` : ''}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#d8e0dc] shadow-none text-[#0c1512] hover:bg-[#fafcfa] shrink-0"
                      onClick={() => copyToClipboard(c.codigo)}
                    >
                      {copiedCode === c.codigo ? (
                        <CheckCircle2 className="h-4 w-4 text-[#0d7a63]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
