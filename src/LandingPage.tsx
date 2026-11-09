import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, ArrowRight, ShieldCheck, Microscope, LineChart, FileText } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-[#0c1512] font-['Golos_Text']">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#d8e0dc] bg-[#f4f6f5]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[#0d7a63]">
            <Activity className="h-6 w-6" />
            <span className="text-xl font-semibold  tracking-tight text-[#0c1512]">Skinnor</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-1 text-xs  font-medium uppercase tracking-widest text-[#0c1512]">
              <button className="px-2 py-1 rounded bg-[#e9efec] text-[#0c1512]">ES</button>
              <button className="px-2 py-1 rounded text-[#3f4f49] hover:text-[#0c1512]">EN</button>
            </div>
            <Button 
              variant="outline" 
              className="hidden sm:inline-flex border-[#b9c6c0] text-[#0c1512] hover:bg-[#e9efec]"
              onClick={() => navigate('/login')}
            >
              Iniciar sesión
            </Button>
            <Button 
              className="bg-[#0d7a63] hover:bg-[#0a4539] text-white"
              onClick={() => navigate('/login')}
            >
              Acceso Clínico <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-[#d8e0dc] bg-white px-3 py-1 text-[11.5px]  font-medium uppercase tracking-widest text-[#0d7a63]">
            <span className="flex h-2 w-2 rounded-full bg-[#c77a0b] mr-2"></span>
            Monitoreo en casa
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight  leading-[1.06] text-[#0c1512] sm:text-7xl mb-8">
            La consulta dermatológica <em className="text-[#0d7a63] not-italic">viva.</em>
          </h1>
          <p className="text-lg leading-relaxed text-[#3f4f49] mb-10 max-w-xl">
            Skinnor mide y sigue la evolución de tus lesiones cutáneas desde casa con algoritmos matemáticos e IA. Conecta a pacientes con profesionales de la salud, reduciendo tiempos de espera de meses a minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-[#0d7a63] hover:bg-[#0a4539] text-white px-8 h-14 rounded-md text-base font-semibold " onClick={() => navigate('/login')}>
              Iniciar Evaluación
            </Button>
            <Button size="lg" variant="outline" className="border-[#b9c6c0] text-[#0c1512] hover:bg-[#e9efec] h-14 rounded-md text-base" onClick={() => navigate('/login')}>
              Portal para Médicos
            </Button>
          </div>
        </div>
        
        {/* Phone Mockup Area */}
        <div className="relative mx-auto w-full max-w-[380px]">
          <div className="relative rounded-[48px] border-[12px] border-[#0c1512] bg-white shadow-2xl overflow-hidden aspect-[9/19]">
            {/* Dynamic Island */}
            <div className="absolute top-0 inset-x-0 flex justify-center z-20 pt-2">
              <div className="h-7 w-24 bg-[#0c1512] rounded-[16px]"></div>
            </div>
            
            {/* App UI */}
            <div className="pt-14 px-5 pb-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[11.5px]  font-medium uppercase text-[#0d7a63] bg-[#cfe6dd] px-2 py-0.5 rounded-sm">ABCDE-T1</span>
                <span className="text-[11.5px]  font-medium text-[#3f4f49]">09:41</span>
              </div>
              
              <div className="bg-[#f4f6f5] rounded-xl aspect-square mb-4 relative overflow-hidden flex items-center justify-center border border-[#d8e0dc]">
                {/* Simulated Dermoscopy SVG */}
                <div className="absolute inset-0 bg-[#e9efec] opacity-50"></div>
                <div className="relative w-48 h-48 rounded-full bg-[#b9c6c0] overflow-hidden flex items-center justify-center">
                  <div className="w-32 h-32 bg-[#3f4f49] rounded-[40%] rotate-12 opacity-80 mix-blend-multiply"></div>
                  <div className="absolute inset-0 border-2 border-dashed border-[#0d7a63] rounded-full scale-90"></div>
                </div>
                {/* Alert Ring */}
                <div className="absolute inset-4 border-2 border-[#c77a0b] rounded-full opacity-60"></div>
              </div>

              <div className="bg-[#f9ecd4] border border-[#d9b163] rounded-md p-3 mb-4">
                <div className="flex items-center gap-2 text-[#c77a0b] font-semibold text-sm mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#c77a0b]"></span>
                  Cambio Detectado
                </div>
                <p className="text-xs text-[#8a5a0a]">Evolución del 14% en asimetría desde T0.</p>
              </div>

              <div className="space-y-3 mt-auto">
                <div className="flex items-center justify-between border-b border-[#d8e0dc] pb-2">
                  <span className="text-xs  uppercase text-[#3f4f49]">Asimetría</span>
                  <span className="text-sm font-semibold  text-[#c77a0b]">78%</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#d8e0dc] pb-2">
                  <span className="text-xs  uppercase text-[#3f4f49]">Bordes</span>
                  <span className="text-sm font-semibold  text-[#0c1512]">42%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs  uppercase text-[#3f4f49]">Color</span>
                  <span className="text-sm font-semibold  text-[#0c1512]">12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Problem Band */}
      <section className="bg-[#08231c] text-[#cfe6dd] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[11.5px]  uppercase tracking-widest text-[#8fd6c2] mb-6">El Problema</div>
            <h2 className="text-3xl sm:text-4xl font-semibold  leading-[1.2] text-white mb-6">
              255 días de espera promedio para ver a un especialista.
            </h2>
            <p className="text-lg text-[#8fb8aa] leading-relaxed">
              1 de cada 5 personas desarrollará cáncer de piel. La detección temprana es crítica, pero los sistemas de salud están saturados. Skinnor puentea esta brecha conectando tu cámara directamente al conocimiento clínico.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="border-l border-[#14503f] pl-6">
              <div className="text-5xl font-extrabold  text-[#ffd58a] mb-2">&gt;95%</div>
              <div className="text-sm text-[#5f7b6f]">Precisión en clasificación (7 tipos de lesiones)</div>
            </div>
            <div className="border-l border-[#14503f] pl-6">
              <div className="text-5xl font-extrabold  text-[#ffd58a] mb-2">10k+</div>
              <div className="text-sm text-[#5f7b6f]">Imágenes analizadas usando HAM10000</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Capabilities */}
      <section className="bg-white py-24 border-y border-[#d8e0dc]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-[11.5px]  uppercase tracking-widest text-[#0d7a63] mb-4">Capacidades</div>
            <h2 className="text-4xl font-semibold  text-[#0c1512]">Precisión Matemática</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-[#f4f6f5] p-8 rounded-xl border border-[#d8e0dc]">
              <Microscope className="h-8 w-8 text-[#0d7a63] mb-6" />
              <h3 className="text-xl font-semibold  text-[#0c1512] mb-3">Regla ABCDE Automatizada</h3>
              <p className="text-[#3f4f49]">Análisis de bordes, asimetría y color mediante reducción de ruido Gaussiano y algoritmos de segmentación (Sobel/Prewitt).</p>
            </div>
            <div className="bg-[#f4f6f5] p-8 rounded-xl border border-[#d8e0dc]">
              <LineChart className="h-8 w-8 text-[#0d7a63] mb-6" />
              <h3 className="text-xl font-semibold  text-[#0c1512] mb-3">Detección de Cambio</h3>
              <p className="text-[#3f4f49]">Alertas tempranas (señal ámbar) cuando una lesión evoluciona entre dos tomas de tiempo diferentes (T0 → T1).</p>
            </div>
            <div className="bg-[#f4f6f5] p-8 rounded-xl border border-[#d8e0dc]">
              <ShieldCheck className="h-8 w-8 text-[#0d7a63] mb-6" />
              <h3 className="text-xl font-semibold  text-[#0c1512] mb-3">Casos Similares Reales</h3>
              <p className="text-[#3f4f49]">Búsqueda vectorial en el dataset HAM10000 para encontrar y mostrar visualmente los casos confirmados más cercanos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional CTA */}
      <section className="bg-[#0c2c23] text-white py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-extrabold  mb-6">Únete al panel clínico</h2>
          <p className="text-xl text-[#8fb8aa] mb-10 max-w-2xl mx-auto">
            Accede al tablero de monitoreo para profesionales. Visualiza casos similares, rastrea la evolución de pacientes vinculados y genera borradores de informes clínicos asistidos por IA.
          </p>
          <Button size="lg" className="bg-white hover:bg-[#e9efec] text-[#0a4539] font-semibold text-lg px-8 h-14" onClick={() => navigate('/login')}>
            Acceder al Panel Profesional
          </Button>
          <p className="mt-8 text-xs text-[#5f7b6f]  uppercase">
            * Skinnor es una herramienta de apoyo complementaria y no reemplaza el diagnóstico profesional presencial.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f4f6f5] border-t border-[#d8e0dc] py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-[#0c1512]">
            <Activity className="h-5 w-5 text-[#0d7a63]" />
            <span className="font-semibold ">Skinnor</span>
          </div>
          <div className="text-sm text-[#3f4f49]">
            © {new Date().getFullYear()} Skinnor. Telemedicina y Monitoreo Inteligente.
          </div>
        </div>
      </footer>
    </div>
  );
}
