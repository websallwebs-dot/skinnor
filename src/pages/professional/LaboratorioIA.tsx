import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FlaskConical, ImageIcon, Send, Loader2, AlertTriangle,
  CheckCircle2, Stethoscope,
} from 'lucide-react';
import type { RegistroFoto } from './registrosData';

const MODELO = 'marmal88/skin_cancer';

interface ImagenLab {
  id: string;
  imageUrl: string;
  label: string;
  detalle: string;
}

interface MockResponse {
  modelo: string;
  clase: string;
  confianza: number;
  riesgo: string;
  interpretacion: string;
  abcde: { nombre: string; valor: number }[];
}

// Respuesta predeterminada — el endpoint del modelo aún no está conectado.
function respuestaMock(prompt: string): MockResponse {
  return {
    modelo: MODELO,
    clase: 'Melanoma (mel)',
    confianza: 87.4,
    riesgo: 'Alto — requiere correlación dermatoscópica y evaluación clínica',
    interpretacion:
      'La imagen muestra una lesión pigmentar con asimetría en dos ejes, bordes irregulares y variación cromática en tonos marrón-negro-rojizo. ' +
      (prompt.trim()
        ? `Consulta del profesional: "${prompt.trim()}". `
        : '') +
      'Se recomienda correlación con el contexto clínico del paciente, evaluación dermatoscópica presencial y considerar biopsy si la sospecha persiste.',
    abcde: [
      { nombre: 'Asimetría', valor: 78 },
      { nombre: 'Bordes', valor: 71 },
      { nombre: 'Color', valor: 84 },
      { nombre: 'Diámetro', valor: 62 },
      { nombre: 'Evolución', valor: 80 },
    ],
  };
}

export default function LaboratorioIA({ capturas }: { capturas: RegistroFoto[] }) {
  const imagenes = useMemo<ImagenLab[]>(
    () =>
      capturas
        .filter((c) => c.imageUrl)
        .map((c) => ({
          id: c.id,
          imageUrl: c.imageUrl as string,
          label: c.tag,
          detalle: `${c.lesion} • ${c.fecha}`,
        })),
    [capturas]
  );

  const [imagenSel, setImagenSel] = useState<ImagenLab | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [respuesta, setRespuesta] = useState<MockResponse | null>(null);

  const analizar = () => {
    if (!imagenSel || analizando) return;
    setAnalizando(true);
    setRespuesta(null);
    // Simulación de inferencia — reemplazar por llamada real al endpoint del modelo
    setTimeout(() => {
      setRespuesta(respuestaMock(prompt));
      setAnalizando(false);
    }, 1800);
  };

  return (
    <Card className="border-[#d8e0dc] shadow-none bg-white rounded-xl overflow-hidden">
      <CardHeader className="border-b border-[#d8e0dc] bg-[#fafcfa] px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-[#0c1512] flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[#0d7a63]" /> Laboratorio de Inferencia Neural IA
            </CardTitle>
            <CardDescription className="text-xs text-[#5f7b6f]">
              Modelo de clasificación dermatoscópica sobre imágenes del paciente.
            </CardDescription>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-mono text-[#0c1512] bg-[#e9efec] border border-[#d8e0dc] px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Respuesta simulada — modelo no conectado
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* 1. Selección de imagen del paciente */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#5f7b6f] uppercase tracking-wide flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> 1. Elige una imagen del paciente
          </label>
          {imagenes.length === 0 ? (
            <p className="text-sm text-[#5f7b6f]">Este paciente no tiene imágenes registradas.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1">
              {imagenes.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setImagenSel(img)}
                  className={`relative rounded-md overflow-hidden border-2 transition-all ${
                    imagenSel?.id === img.id
                      ? 'border-[#0d7a63] ring-2 ring-[#0d7a63]/30'
                      : 'border-[#d8e0dc] hover:border-[#0d7a63]/60'
                  }`}
                  title={img.detalle}
                >
                  <img src={img.imageUrl} alt={img.label} className="w-full aspect-square object-cover bg-[#f4f6f5]" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          {imagenSel && (
            <div className="flex items-center gap-3 rounded-lg border border-[#d8e0dc] bg-[#fafcfa] p-3">
              <img src={imagenSel.imageUrl} alt="Seleccionada" className="w-14 h-14 rounded-md object-cover border border-[#d8e0dc]" />
              <div className="text-xs">
                <div className="font-medium text-[#0c1512]">{imagenSel.detalle}</div>
                <div className="text-[#5f7b6f]">Captura {imagenSel.label}</div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Prompt */}
        <div className="space-y-2">
          <label htmlFor="lab-prompt" className="text-xs font-semibold text-[#5f7b6f] uppercase tracking-wide">
            2. Prompt para el modelo
          </label>
          <Textarea
            id="lab-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Analiza esta lesión considerando el ABCDE y el contexto del paciente. ¿Sugieres seguimiento o derivación?"
            className="min-h-[80px] border-[#d8e0dc] text-sm focus-visible:ring-[#0d7a63]"
          />
        </div>

        {/* 3. Ejecutar */}
        <div className="flex items-center gap-3">
          <Button
            onClick={analizar}
            disabled={!imagenSel || analizando}
            className="bg-[#0c1512] hover:bg-[#3f4f49] text-white shadow-none"
          >
            {analizando ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inferiendo con {MODELO}...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Analizar imagen</>
            )}
          </Button>
          <span className="text-[11px] text-[#5f7b6f] font-mono">modelo: {MODELO}</span>
        </div>

        {/* 4. Respuesta */}
        {analizando && (
          <div className="rounded-xl border border-[#d8e0dc] bg-[#fafcfa] p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#0d7a63] mx-auto mb-2" />
            <p className="text-xs text-[#5f7b6f]">Procesando imagen y generando respuesta del modelo...</p>
          </div>
        )}

        {respuesta && !analizando && (
          <div className="rounded-xl border border-[#d8e0dc] bg-[#fafcfa] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0c1512] flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-[#0d7a63]" /> Respuesta del modelo
              </span>
              <span className="text-[10px] font-mono text-[#5f7b6f] bg-white border border-[#d8e0dc] px-2 py-0.5 rounded">
                {respuesta.modelo}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#d8e0dc] bg-white p-3">
                <div className="text-[10px] uppercase tracking-wide text-[#5f7b6f] font-semibold">Clase predicha</div>
                <div className="text-sm font-semibold text-[#0c1512] mt-1">{respuesta.clase}</div>
              </div>
              <div className="rounded-lg border border-[#d8e0dc] bg-white p-3">
                <div className="text-[10px] uppercase tracking-wide text-[#5f7b6f] font-semibold">Confianza</div>
                <div className="text-sm font-semibold text-[#0c1512] mt-1">{respuesta.confianza}%</div>
                <div className="h-1.5 bg-[#e9efec] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#0d7a63] rounded-full" style={{ width: `${respuesta.confianza}%` }} />
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Riesgo
                </div>
                <div className="text-xs font-semibold text-amber-800 mt-1 leading-snug">{respuesta.riesgo}</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-[#5f7b6f] font-semibold mb-2">Vectores ABCDE estimados</div>
              <div className="grid grid-cols-5 gap-2">
                {respuesta.abcde.map((a) => (
                  <div key={a.nombre} className="rounded-lg bg-white border border-[#d8e0dc] p-2 text-center">
                    <div className="text-[9px] uppercase text-[#5f7b6f] font-semibold">{a.nombre}</div>
                    <div className="text-sm font-bold text-[#0c1512]">{a.valor}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-[#d8e0dc] p-3">
              <div className="text-[10px] uppercase tracking-wide text-[#5f7b6f] font-semibold mb-1">Interpretación</div>
              <p className="text-xs text-[#3f4f49] leading-relaxed">{respuesta.interpretacion}</p>
            </div>

            <p className="text-[10px] text-[#5f7b6f] flex items-start gap-1.5">
              <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-[#0d7a63]" />
              Salida simulada con fines de demostración. Cuando el endpoint de {MODELO} esté disponible, esta sección llamará al modelo real.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
