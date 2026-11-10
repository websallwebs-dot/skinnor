import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Camera, ChevronDown, FileText, Home, LineChart,
  Microscope, ShieldCheck, Stethoscope, User,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------- datos ---------------------------------- */

const GLOBAL_STATS = [
  { v: '1', s: ' de 5', label: 'personas en el mundo desarrollará cáncer de piel a lo largo de su vida', src: 'Global · OMS' },
  { v: '1.4', s: 'M', label: 'muertes por cáncer de piel registradas en 2022', src: 'Global · OMS' },
  { v: '132', s: 'k', label: 'casos nuevos estimados anualmente en el mundo', src: 'Global · estimación' },
];

const CHILE_STATS = [
  { v: '+40', s: '%', label: 'aumento de muertes por cáncer de piel en la última década', src: 'Chile' },
  { v: '255', s: '', label: 'días de espera promedio para una hora con especialista', src: 'Chile' },
  { v: '5', s: ' min', label: 'para registrar un control desde el teléfono', src: 'Skinnor' },
];

const PROCESS_STEPS = [
  {
    n: '01',
    title: 'Registra la lesión una vez',
    desc: 'El paciente crea la lesión con su foto basal, zona anatómica y código de acceso. A partir de ahí, todo queda ordenado en una sola historia clínica.',
  },
  {
    n: '02',
    title: 'Sigue con fotos de control',
    desc: 'Cada control agrega una o varias fotos con fecha, tamaño estimado y síntomas percibidos. El sistema las ordena cronológicamente y compara cada una con la anterior.',
  },
  {
    n: '03',
    title: 'El profesional monitorea',
    desc: 'El dermatólogo ve la serie completa, los índices de cambio y las alertas priorizadas — y decide si el control puede esperar o debe adelantarse.',
  },
];

const CAPABILITIES = [
  {
    icon: Microscope,
    t: 'Análisis ABCDE por imagen',
    d: 'Asimetría, irregularidad de borde, variegación cromática y diámetro estimado, computados sobre cada control y comparados con el basal.',
    detail: 'A · B · C · D',
  },
  {
    icon: LineChart,
    t: 'Evolución cuantificada',
    d: 'Mapas de diferencia entre controles consecutivos, porcentaje de área modificada y porcentaje de color nuevo — con evidencia visual, no solo números.',
    detail: 'Δ área · Δ color',
  },
  {
    icon: ShieldCheck,
    t: 'Casos de referencia',
    d: 'Comparación contra el dataset dermatológico de referencia (HAM10000) y búsqueda de casos clínicos similares para contextualizar la lesión.',
    detail: 'HAM10000 · 10k imágenes',
  },
  {
    icon: FileText,
    t: 'Informe clínico asistido',
    d: 'El profesional genera el informe de evolución con la evidencia fotográfica y los índices adjuntos, listo para la ficha del paciente.',
    detail: 'Borrador + evidencia',
  },
];

const BOARD_ROWS = [
  { id: 'L-1042', lesion: 'Nevo atípico · Hombro der.', abcde: 'A .31 · B .49 · C 5 · D +2.1', estado: 'Cambio', tone: 'gold' },
  { id: 'L-1087', lesion: 'Queratosis seborreica · Tórax', abcde: 'A .12 · B .22 · C 3 · D +0.3', estado: 'Estable', tone: 'green' },
  { id: 'L-1103', lesion: 'Nevo displásico · Espalda', abcde: 'A .27 · B .44 · C 4 · D +1.4', estado: 'Control', tone: 'amber' },
  { id: 'L-1158', lesion: 'Lesión pigmentada · Brazo izq.', abcde: 'A .08 · B .15 · C 2 · D +0.0', estado: 'Estable', tone: 'green' },
];

const FAQS = [
  {
    q: '¿Skinnor reemplaza la consulta dermatológica presencial?',
    a: 'No. Skinnor es una herramienta de telemonitoreo y apoyo clínico: permite registrar y seguir lesiones entre controles, pero el diagnóstico y la indicación de biopsia corresponden siempre al profesional tratante.',
  },
  {
    q: '¿Cómo registro una lesión y sus fotos de control?',
    a: 'Desde la app creas la lesión una vez (zona, tamaño estimado, foto basal) y luego agregas seguimientos con una o varias fotos, fecha, cambios percibidos y síntomas. El sistema ordena todo cronológicamente.',
  },
  {
    q: '¿Qué mide el análisis de imagen?',
    a: 'Cada control se compara con el registro anterior: porcentaje de área modificada, color nuevo, diámetro estimado, asimetría, irregularidad de borde y variegación cromática. Los resultados son índices auxiliares de soporte, no un diagnóstico.',
  },
  {
    q: '¿Quién puede ver mis imágenes y datos?',
    a: 'Solo los profesionales de salud vinculados a tu cuenta mediante un código de acceso o solicitud aprobada. Los datos clínicos están aislados por paciente y cada acceso queda registrado.',
  },
  {
    q: '¿Qué pasa si el sistema detecta un cambio importante?',
    a: 'La lesión se marca con alertas de cambio y el profesional puede priorizarla en su bandeja de consulta. El paciente puede abrir una consulta directa desde la app para resolver dudas.',
  },
];

/* ------------------------------ dermoscopio SVG ----------------------------- */

function DermoscopyArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-label="Lesión cutánea ilustrada">
      <defs>
        <radialGradient id="lp-skin" cx="42%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#c99a76" />
          <stop offset="55%" stopColor="#a97c58" />
          <stop offset="100%" stopColor="#7d5638" />
        </radialGradient>
        <radialGradient id="lp-field" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#0c1512" stopOpacity="0" />
          <stop offset="100%" stopColor="#0c1512" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="118" fill="#0c1512" />
      <circle cx="120" cy="120" r="112" fill="url(#lp-field)" />
      {/* campo dérmico */}
      <circle cx="120" cy="120" r="104" fill="url(#lp-skin)" />
      {/* textura sutil */}
      <g opacity="0.16" stroke="#5d3f27" strokeWidth="1">
        <path d="M40 96 q30 -8 60 0" fill="none" />
        <path d="M120 210 q40 -6 74 4" fill="none" />
        <path d="M30 150 q24 10 52 4" fill="none" />
        <path d="M160 60 q30 8 52 -2" fill="none" />
      </g>
      {/* lesión: masa pigmentada irregular */}
      <path
        d="M120 62 C152 58 178 78 184 108 C190 140 176 172 146 184 C116 196 82 184 66 156 C50 128 60 92 88 74 C98 66 108 64 120 62 Z"
        fill="#4a2c1c"
        opacity="0.9"
      />
      <path
        d="M120 78 C146 75 166 90 171 114 C176 140 164 164 140 174 C116 184 90 174 78 150 C66 126 74 96 96 82 C104 77 112 76 120 78 Z"
        fill="#6b4227"
        opacity="0.85"
      />
      {/* zonas de color dentro de la lesión */}
      <ellipse cx="132" cy="112" rx="16" ry="11" fill="#2e1a10" opacity="0.8" transform="rotate(-18 132 112)" />
      <ellipse cx="102" cy="140" rx="12" ry="9" fill="#8a5a34" opacity="0.7" />
      <ellipse cx="142" cy="146" rx="9" ry="7" fill="#3a2114" opacity="0.75" />
      {/* contorno de análisis (se dibuja con GSAP) */}
      <path
        className="lp-contour"
        d="M120 60 C154 56 180 76 186 108 C192 142 178 174 148 186 C118 198 82 186 64 156 C46 126 58 90 88 72 C100 64 110 62 120 60 Z"
        fill="none"
        stroke="#0d7a63"
        strokeWidth="2.5"
        strokeDasharray="1"
        strokeDashoffset="1"
        pathLength={1}
        strokeLinecap="round"
      />
      {/* marcador de cambio */}
      <circle cx="176" cy="120" r="7" fill="none" stroke="#c77a0b" strokeWidth="2" />
      <circle cx="176" cy="120" r="2.5" fill="#c77a0b" />
      {/* regla de referencia */}
      <g stroke="#e9efec" strokeWidth="1.4" opacity="0.75">
        <line x1="120" y1="14" x2="120" y2="26" />
        <line x1="120" y1="214" x2="120" y2="226" />
        <line x1="14" y1="120" x2="26" y2="120" />
        <line x1="214" y1="120" x2="226" y2="120" />
      </g>
      <text x="120" y="232" textAnchor="middle" fontSize="7" fill="#5f7b6f" fontFamily="IBM Plex Mono, monospace" letterSpacing="1">
        T1 · CAMPO DÉRMICO
      </text>
    </svg>
  );
}

function ThumbArt({ className, tone = '#6b4227' }: { className?: string; tone?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="23" fill="#0c1512" />
      <circle cx="24" cy="24" r="21" fill={tone} opacity="0.85" />
      <ellipse cx="26" cy="21" rx="6" ry="4.5" fill="#2e1a10" opacity="0.8" transform="rotate(-15 26 21)" />
      <path d="M24 5 C34 5 41 12 42 22 C43 32 38 40 29 42 C20 44 11 40 8 31 C5 22 10 11 19 7 C21 6 22 5 24 5 Z" fill="none" stroke="#0d7a63" strokeWidth="1.4" />
    </svg>
  );
}

/* ------------------------------- teléfono mock ------------------------------ */

function MetricRow({ label, value, pct, tone = '#0d7a63' }: { label: string; value: string; pct: number; tone?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[74px] shrink-0 font-['IBM_Plex_Mono'] text-[8.5px] uppercase tracking-[0.1em] text-[#5f7b6f]">{label}</span>
      <div className="h-[5px] flex-1 rounded-full bg-[#e9efec] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
      </div>
      <span className="w-[30px] text-right font-['IBM_Plex_Mono'] text-[9px] font-semibold text-[#0c1512]">{value}</span>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="lp-phone relative mx-auto w-[300px] sm:w-[320px]">
      {/* bezel */}
      <div className="rounded-[44px] bg-[#0c1512] p-[10px] shadow-[0_30px_60px_-30px_rgba(12,21,18,0.35)] border border-[#1c2b25]">
        {/* pantalla */}
        <div className="relative rounded-[36px] bg-[#f4f6f5] overflow-hidden">
          {/* notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-[22px] w-[90px] rounded-full bg-[#0c1512] z-10" />
          {/* status bar */}
          <div className="flex items-center justify-between px-6 pt-3.5 pb-1 text-[#0c1512]">
            <span className="font-['IBM_Plex_Mono'] text-[9px] font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <span className="h-[7px] w-[14px] rounded-[2px] border border-[#0c1512]/60 relative"><span className="absolute inset-[1.5px] right-[3px] bg-[#0c1512] rounded-[1px]" /></span>
              <span className="h-[9px] w-[9px] rounded-full border border-[#0c1512]/60 flex items-center justify-center"><span className="h-[4px] w-[4px] rounded-full bg-[#0c1512]" /></span>
            </div>
          </div>
          {/* app header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div>
              <div className="font-['Schibsted_Grotesk'] text-[13px] font-bold leading-none">Skinnor</div>
              <div className="font-['IBM_Plex_Mono'] text-[7.5px] uppercase tracking-[0.12em] text-[#5f7b6f] mt-1">Telemonitoreo</div>
            </div>
            <span className="font-['IBM_Plex_Mono'] text-[8.5px] font-semibold text-[#0d7a63] border border-[#0d7a63]/40 bg-[#0d7a63]/10 rounded-[5px] px-1.5 py-0.5">SKN-4F2A</span>
          </div>
          {/* línea de estado de análisis */}
          <div className="mx-4 mb-2 flex items-center gap-1.5 rounded-md bg-white border border-[#d8e0dc] px-2.5 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#54d9a8] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0d7a63]" />
            </span>
            <span className="font-['IBM_Plex_Mono'] text-[8px] uppercase tracking-[0.1em] text-[#0c1512]">Análisis T1 · confianza 94%</span>
          </div>
          {/* dermoscopio */}
          <div className="mx-4 rounded-xl bg-white border border-[#d8e0dc] p-2">
            <DermoscopyArt className="w-full h-auto rounded-lg" />
          </div>
          {/* banner de cambio */}
          <div className="mx-4 mt-2 rounded-md border border-[#eccfc4] bg-[#fbeae4] px-2.5 py-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c77a0b] shrink-0" />
            <span className="font-['IBM_Plex_Mono'] text-[8px] uppercase tracking-[0.08em] text-[#8a3b28] font-semibold">Cambio detectado · +2.1 mm</span>
          </div>
          {/* métricas ABCDE */}
          <div className="mx-4 mt-2 rounded-xl bg-white border border-[#d8e0dc] px-2.5 py-2 space-y-1.5">
            <div className="font-['IBM_Plex_Mono'] text-[7.5px] uppercase tracking-[0.14em] text-[#5f7b6f] mb-1">Regla ABCDE · T1 vs basal</div>
            <MetricRow label="Asimetría" value="0.31" pct={31} />
            <MetricRow label="Borde" value="0.49" pct={49} tone="#c77a0b" />
            <MetricRow label="Colores" value="5" pct={62} tone="#0d7a63" />
            <MetricRow label="Diámetro" value="8.1" pct={68} tone="#3f4f49" />
            <MetricRow label="Evolución" value="+18%" pct={72} tone="#c77a0b" />
          </div>
          {/* historial */}
          <div className="mx-4 mt-2 mb-2 rounded-xl bg-white border border-[#d8e0dc] px-2.5 py-2">
            <div className="font-['IBM_Plex_Mono'] text-[7.5px] uppercase tracking-[0.14em] text-[#5f7b6f] mb-1.5">Serie de controles</div>
            <div className="flex items-center justify-between">
              {[
                { t: 'T0 · 29 sep', tone: '#4a2c1c' },
                { t: 'T1 · 27 oct', tone: '#6b4227' },
                { t: 'T2 · 07 nov', tone: '#8a5a34' },
              ].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <ThumbArt className="w-9 h-9 rounded-full" tone={h.tone} />
                  <span className="font-['IBM_Plex_Mono'] text-[6.5px] text-[#5f7b6f]">{h.t}</span>
                </div>
              ))}
            </div>
          </div>
          {/* tab bar */}
          <div className="flex items-center justify-around border-t border-[#d8e0dc] bg-white px-2 py-2">
            {[Home, Camera, LineChart, User].map((Icon, i) => (
              <span key={i} className={`p-1.5 rounded-md ${i === 2 ? 'text-[#0d7a63]' : 'text-[#5f7b6f]'}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* sombra de apoyo */}
      <div className="mx-auto mt-3 h-4 w-[70%] rounded-[50%] bg-[#0c1512]/10 blur-md" />
    </div>
  );
}

/* --------------------------------- secciones -------------------------------- */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#d8e0dc] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-medium text-[#0c1512]">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#5f7b6f] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-[#3f4f49] max-w-3xl">{a}</p>
        </div>
      </div>
    </div>
  );
}

function StatCell({ v, s, label, src, dark = false }: { v: string; s?: string; label: string; src?: string; dark?: boolean }) {
  const numeric = parseFloat(v);
  const suffix = s ?? v.replace(/[\d.]/g, '');
  return (
    <div>
      <div
        className={`lp-stat font-['Schibsted_Grotesk'] font-extrabold ${dark ? 'text-[#ffd58a]' : 'text-[#0c1512]'} ${v.length > 4 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}
        data-value={numeric}
        data-suffix={suffix}
      >
        {v}{s ?? ''}
      </div>
      <div className={`text-[12.5px] mt-1.5 leading-snug ${dark ? 'text-[#8fb8aa]' : 'text-[#3f4f49]'}`}>{label}</div>
      {src && (
        <div className={`font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.12em] mt-1 ${dark ? 'text-[#5f7b6f]' : 'text-[#5f7b6f]'}`}>{src}</div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.lp-title', { y: 28, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
      gsap.from('.lp-sub', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.35 });
      gsap.from('.lp-cta', { y: 14, opacity: 0, duration: 0.55, ease: 'power2.out', delay: 0.5, stagger: 0.07 });
      gsap.from('.lp-phone', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.55 });
      // El contorno de la lesión se dibuja una vez — el momento autorado de la página
      gsap.fromTo('.lp-contour',
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', delay: 1.0 });

      gsap.utils.toArray<HTMLElement>('.lp-reveal').forEach((el) => {
        gsap.from(el, {
          y: 34, opacity: 0, duration: 0.75, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 87%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('.lp-stat').forEach((el) => {
        const target = parseFloat(el.dataset.value || '0');
        const suffix = el.dataset.suffix || '';
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onUpdate: () => {
            const isFloat = target % 1 !== 0;
            el.textContent = (isFloat ? obj.v.toFixed(1) : Math.round(obj.v).toString()) + suffix;
          },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-[#f4f6f5] text-[#0c1512] font-['Golos_Text'] antialiased">
      {/* ------------------------------- Navigation ------------------------------ */}
      <nav className="sticky top-0 z-50 border-b border-[#d8e0dc] bg-[#f4f6f5]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <span className="font-['Schibsted_Grotesk'] text-lg font-bold tracking-tight">Skinnor</span>
          <div className="hidden md:flex items-center gap-8 font-['Schibsted_Grotesk'] text-[13px] font-medium text-[#3f4f49]">
            <a href="#como-funciona" className="hover:text-[#0c1512] transition-colors">Cómo funciona</a>
            <a href="#capacidades" className="hover:text-[#0c1512] transition-colors">Capacidades</a>
            <a href="#monitoreo" className="hover:text-[#0c1512] transition-colors">Monitoreo</a>
            <a href="#faq" className="hover:text-[#0c1512] transition-colors">Preguntas</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex text-[#3f4f49] hover:text-[#0c1512]" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
            <Button className="bg-[#0d7a63] hover:bg-[#0a4539] text-white" onClick={() => navigate('/register')}>
              Crear cuenta
            </Button>
          </div>
        </div>
      </nav>

      {/* ---------------------------------- Hero --------------------------------- */}
      <section className="mx-auto max-w-7xl px-6 pt-14 pb-20 lg:px-8 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1fr_1.06fr] gap-14 items-center">
        {/* narrativa */}
        <div>
          <h1 className="lp-title font-['Schibsted_Grotesk'] text-[2.6rem] sm:text-6xl lg:text-[4rem] font-extrabold tracking-[-0.03em] leading-[1.06] mb-6">
            La consulta dermatológica{' '}
            <em className="text-[#0d7a63] not-italic">viva.</em>
          </h1>
          <p className="lp-sub text-[1.08rem] leading-[1.6] text-[#3f4f49] mb-9 max-w-[52ch]">
            Skinnor convierte cada control en evidencia: fotos ordenadas, análisis de imagen por control
            y una línea de tiempo compartida con tu profesional — para que la evolución de una lesión
            deje de depender de la memoria y de la agenda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="lp-cta bg-[#0d7a63] hover:bg-[#0a4539] text-white px-7 h-12 rounded-[6px] font-['Schibsted_Grotesk'] text-[15px] font-semibold" onClick={() => navigate('/register')}>
              Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="lp-cta border-[#b9c6c0] bg-white text-[#0c1512] hover:bg-[#e9efec] h-12 rounded-[6px] font-['Schibsted_Grotesk'] text-[15px]" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
          </div>
          <p className="lp-cta mt-5 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.1em] text-[#5f7b6f]">
            Herramienta de apoyo — no reemplaza el juicio clínico
          </p>

          {/* tarjeta de vinculación paciente ↔ doctor */}
          <div className="lp-cta mt-10 inline-flex flex-wrap items-center gap-3 rounded-[10px] border border-[#d8e0dc] bg-white px-4 py-3 shadow-[0_30px_60px_-30px_rgba(12,21,18,0.18)]">
            <span className="flex items-center gap-2 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.1em] text-[#0c1512]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0d7a63]/12 text-[#0d7a63]"><User className="h-3 w-3" /></span>
              Paciente
            </span>
            <svg width="34" height="10" className="text-[#0d7a63]" aria-hidden>
              <line x1="0" y1="5" x2="34" y2="5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" />
            </svg>
            <span className="flex items-center gap-2 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.1em] text-[#0c1512]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f9ecd4] text-[#c77a0b]"><Stethoscope className="h-3 w-3" /></span>
              Profesional
            </span>
            <span className="font-['IBM_Plex_Mono'] text-[10px] font-semibold text-[#0d7a63] border border-dashed border-[#0d7a63]/50 bg-[#0d7a63]/8 rounded-[5px] px-2 py-1">SKN-4F2A</span>
          </div>
        </div>

        {/* instrumento: mockup del teléfono */}
        <div>
          <PhoneMockup />
          <p className="lp-cta mt-5 text-center font-['IBM_Plex_Mono'] text-[9.5px] uppercase tracking-[0.12em] text-[#5f7b6f]">
            Demostración del análisis — imagen generada, no corresponde a un paciente real
          </p>
        </div>
      </section>

      {/* ------------------------------ Banda de datos ---------------------------- */}
      <section className="border-y border-[#d8e0dc] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
            {GLOBAL_STATS.map((s) => (
              <div key={s.src} className="lp-reveal">
                <StatCell {...s} />
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-[#eef1ef] grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
            <div className="lp-reveal md:col-span-3">
              <div className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.14em] text-[#0d7a63] mb-5">Contexto en Chile</div>
            </div>
            {CHILE_STATS.map((s) => (
              <div key={s.src} className="lp-reveal">
                <StatCell {...s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- Cómo funciona --------------------------- */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="max-w-2xl mb-16 lp-reveal">
          <div className="font-['IBM_Plex_Mono'] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d7a63] mb-4">Cómo funciona</div>
          <h2 className="font-['Schibsted_Grotesk'] text-3xl sm:text-[2.6rem] font-bold tracking-[-0.02em] leading-[1.08] mb-5">
            De la foto al control, en tres pasos.
          </h2>
          <p className="text-[1.02rem] leading-[1.6] text-[#3f4f49] max-w-[58ch]">
            El paciente registra desde su teléfono; el sistema ordena la serie cronológica
            y el profesional accede a la evidencia completa de evolución.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-[#d8e0dc] border border-[#d8e0dc] rounded-[10px] overflow-hidden">
          {PROCESS_STEPS.map((s, i) => (
            <div key={s.n} className={`lp-reveal bg-white p-8 ${i > 0 ? 'border-t md:border-t-0 md:border-l border-[#eef1ef]' : ''}`}>
              <div className="font-['IBM_Plex_Mono'] text-[11px] font-semibold text-[#0d7a63] tracking-[0.14em] mb-5">{s.n}</div>
              <h3 className="font-['Schibsted_Grotesk'] text-[1.05rem] font-bold tracking-[-0.01em] mb-2.5">{s.title}</h3>
              <p className="text-[0.9rem] leading-[1.55] text-[#5f7b6f]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- Capacidades ---------------------------- */}
      <section id="capacidades" className="bg-[#e9efec] border-y border-[#d8e0dc]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-14 items-start">
            <div className="lp-reveal lg:sticky lg:top-28">
              <div className="font-['IBM_Plex_Mono'] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d7a63] mb-4">Capacidades</div>
              <h2 className="font-['Schibsted_Grotesk'] text-3xl sm:text-[2.6rem] font-bold tracking-[-0.02em] leading-[1.08] mb-5">
                Cada foto cuenta. Cada índice tiene respaldo.
              </h2>
              <p className="text-[1.02rem] leading-[1.6] text-[#3f4f49] mb-8 max-w-[46ch]">
                El análisis de imagen registra cada control contra el anterior:
                segmentación de la lesión, mapas de diferencia y métricas computadas —
                todo visible en la línea de tiempo clínica.
              </p>
              <ul className="space-y-3">
                {[
                  'Serie fotográfica cronológica con evidencia visual',
                  'Mapas de diferencia por control (calor de cambio)',
                  'Índices de asimetría, borde, color y diámetro en el tiempo',
                  'Alertas de controles pendientes y cambios reportados',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[0.92rem] text-[#3f4f49]">
                    <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-[#0d7a63]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid sm:grid-cols-2 gap-px bg-[#d8e0dc] border border-[#d8e0dc] rounded-[10px] overflow-hidden">
              {CAPABILITIES.map((f, i) => (
                <div key={f.t} className="lp-reveal bg-white p-6">
                  <div className="flex items-start justify-between mb-4">
                    <f.icon className="h-5 w-5 text-[#0d7a63]" strokeWidth={1.8} />
                    <span className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.12em] text-[#5f7b6f]">{f.detail}</span>
                  </div>
                  <h3 className="font-['Schibsted_Grotesk'] text-[0.98rem] font-bold mb-1.5">{f.t}</h3>
                  <p className="text-[0.85rem] leading-[1.5] text-[#5f7b6f]">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------- Problema + tablero (oscuro) ---------------------- */}
      <section id="monitoreo" className="bg-[#08231c] text-[#cfe6dd]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-start mb-20">
            <div className="lp-reveal">
              <div className="font-['IBM_Plex_Mono'] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8fd6c2] mb-5">El problema</div>
              <h2 className="font-['Schibsted_Grotesk'] text-[1.9rem] sm:text-[2.6rem] font-bold leading-[1.12] tracking-[-0.02em] text-white mb-6">
                La detección tardía es el problema. El monitoreo continuo, la respuesta.
              </h2>
              <p className="text-[0.95rem] leading-[1.6] text-[#8fb8aa] mb-4 max-w-[52ch]">
                A nivel global, 1 de cada 5 personas desarrollará cáncer de piel en su vida y en 2022
                se registraron 1,4 millones de muertes. En Chile, las muertes por este cáncer crecieron
                un 40% en la última década, y la espera para una hora con especialista alcanza los
                255 días.
              </p>
              <p className="text-[0.95rem] leading-[1.6] text-[#8fb8aa] max-w-[52ch]">
                Entre controles, la lesión evoluciona sin testigos. Skinnor convierte cada teléfono en
                un punto de monitoreo continuo, con evidencia fotográfica ordenada para que el
                profesional evalúe con datos, no con memoria.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#14503f] rounded-[10px] overflow-hidden lp-reveal">
              <div className="bg-[#08231c] p-7">
                <StatCell v="255" label="días de espera promedio a especialista" src="Chile" dark />
              </div>
              <div className="bg-[#08231c] p-7">
                <StatCell v="+40" s="%" label="aumento de muertes por cáncer de piel en una década" src="Chile" dark />
              </div>
              <div className="bg-[#08231c] p-7">
                <StatCell v="1.4" s="M" label="muertes por cáncer de piel en el mundo (2022)" src="Global · OMS" dark />
              </div>
              <div className="bg-[#08231c] p-7">
                <StatCell v="5" s=" min" label="para registrar un control desde el teléfono" src="Skinnor" dark />
              </div>
            </div>
          </div>

          {/* tablero de monitoreo profesional */}
          <div className="lp-reveal rounded-[10px] bg-[#0c2c23] border border-[#14503f] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#14503f]">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#54d9a8] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#54d9a8]" />
                </span>
                <span className="font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8fd6c2]">Monitoreo en vivo</span>
              </div>
              <span className="font-['IBM_Plex_Mono'] text-[9.5px] uppercase tracking-[0.12em] text-[#5f7b6f]">Panel profesional · vista previa</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-[#14503f]">
                    {['Lesión', 'Último control', 'Índices ABCDE', 'Estado'].map((h) => (
                      <th key={h} className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.14em] text-[#5f7b6f] font-medium px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOARD_ROWS.map((r) => (
                    <tr key={r.id} className="border-b border-[#14503f]/50 last:border-0 hover:bg-[#0a3a2d]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ThumbArt className="w-8 h-8 rounded-full shrink-0" tone="#6b4227" />
                          <div>
                            <div className="text-[12.5px] font-semibold text-[#cfe6dd]">{r.lesion}</div>
                            <div className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.1em] text-[#5f7b6f]">{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-['IBM_Plex_Mono'] text-[10.5px] text-[#8fb8aa]">hace 3 días · T2</td>
                      <td className="px-5 py-3.5 font-['IBM_Plex_Mono'] text-[10px] text-[#cfe6dd]">{r.abcde}</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-['IBM_Plex_Mono'] text-[9px] font-semibold uppercase tracking-[0.1em] rounded-full px-2.5 py-1 border ${
                          r.tone === 'green'
                            ? 'text-[#54d9a8] border-[#54d9a8]/40 bg-[#54d9a8]/12'
                            : r.tone === 'gold'
                              ? 'text-[#ffce6e] border-[#ffce6e]/40 bg-[#ffce6e]/12'
                              : 'text-[#ffd58a] border-[#ffd58a]/40 bg-[#ffd58a]/12'
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-[#14503f]">
              <p className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.1em] text-[#5f7b6f]">
                Datos de demostración — el tablero real se alimenta de los pacientes vinculados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------- FAQ --------------------------------- */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        <div className="mb-12 lp-reveal">
          <div className="font-['IBM_Plex_Mono'] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d7a63] mb-4">Preguntas frecuentes</div>
          <h2 className="font-['Schibsted_Grotesk'] text-3xl sm:text-[2.6rem] font-bold tracking-[-0.02em] leading-[1.08]">Lo que debes saber</h2>
        </div>
        <div className="lp-reveal rounded-[10px] border border-[#d8e0dc] bg-white px-8">
          {FAQS.map((f) => (
            <Fragment key={f.q}><FaqItem q={f.q} a={f.a} /></Fragment>
          ))}
        </div>
      </section>

      {/* ----------------------------- Panel profesional --------------------------- */}
      <section className="bg-[#0a4539] text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="lp-reveal">
            <div className="font-['IBM_Plex_Mono'] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8fd6c2] mb-5">Para profesionales</div>
            <h2 className="font-['Schibsted_Grotesk'] text-3xl sm:text-[2.6rem] font-bold tracking-[-0.02em] leading-[1.08] mb-5">
              La ficha completa del paciente, en una sola pantalla.
            </h2>
            <p className="text-[0.95rem] leading-[1.6] text-[#8fb8aa] mb-8 max-w-[48ch]">
              Accede a la ficha completa de cada paciente vinculado: lesiones, series
              fotográficas, índices de evolución, consultas y casos de estudio — todo
              en un solo lugar, con la evidencia que justifica cada decisión.
            </p>
            <Button size="lg" className="bg-white hover:bg-[#e9efec] text-[#0a4539] font-['Schibsted_Grotesk'] font-bold px-7 h-12 rounded-[6px]" onClick={() => navigate('/login')}>
              Ingresar al panel profesional <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[#14503f] rounded-[10px] overflow-hidden lp-reveal">
            {[
              'Ficha clínica completa del paciente',
              'Alertas de controles y cambios',
              'Análisis de imagen por control',
              'Bandeja de consultas directa',
              'Casos de estudio y datasets',
              'Vínculo por código de acceso',
            ].map((t) => (
              <div key={t} className="bg-[#0a4539] px-5 py-4 text-[13px] font-medium text-[#cfe6dd] flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#8fd6c2] shrink-0" strokeWidth={1.8} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- CTA final ------------------------------- */}
      <section className="bg-[#08231c] text-white">
        <div className="mx-auto max-w-4xl px-6 py-28 lg:px-8 text-center">
          <div className="lp-reveal font-['IBM_Plex_Mono'] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8fd6c2] mb-6">Empieza hoy</div>
          <h2 className="lp-reveal font-['Schibsted_Grotesk'] text-[2rem] sm:text-[3.4rem] font-extrabold tracking-[-0.03em] leading-[1.06] mb-6">
            La próxima lesión que sigas<br />puede ser la que importa.
          </h2>
          <p className="lp-reveal text-[1.02rem] leading-[1.6] text-[#8fb8aa] max-w-[54ch] mx-auto mb-10">
            Registra tu primera lesión en minutos y conecta con un profesional que verá
            cada cambio con evidencia, no con supuestos.
          </p>
          <div className="lp-reveal flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-[#0d7a63] hover:bg-[#0a4539] text-white px-8 h-12 rounded-[6px] font-['Schibsted_Grotesk'] font-bold" onClick={() => navigate('/register')}>
              Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-[#14503f] bg-transparent text-[#cfe6dd] hover:bg-[#0c2c23] h-12 rounded-[6px] font-['Schibsted_Grotesk'] font-semibold" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
          </div>
          <p className="lp-reveal mt-10 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.1em] text-[#5f7b6f]">
            * Skinnor es una herramienta de apoyo complementaria y no reemplaza el diagnóstico ni la confirmación histopatológica.
          </p>
        </div>
      </section>

      {/* --------------------------------- Footer --------------------------------- */}
      <footer className="bg-[#f4f6f5] border-t border-[#d8e0dc]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 grid md:grid-cols-3 gap-10">
          <div>
            <span className="font-['Schibsted_Grotesk'] font-bold">Skinnor</span>
            <p className="text-[0.85rem] text-[#5f7b6f] leading-relaxed max-w-xs">
              Telemonitoreo dermatológico con evidencia fotográfica e índices de evolución
              para pacientes y profesionales.
            </p>
          </div>
          <div>
            <div className="font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0c1512] mb-4">Producto</div>
            <ul className="space-y-2.5 text-[0.85rem] text-[#5f7b6f]">
              <li><a href="#como-funciona" className="hover:text-[#0c1512] transition-colors">Cómo funciona</a></li>
              <li><a href="#capacidades" className="hover:text-[#0c1512] transition-colors">Capacidades</a></li>
              <li><a href="#monitoreo" className="hover:text-[#0c1512] transition-colors">Monitoreo profesional</a></li>
              <li><a href="#faq" className="hover:text-[#0c1512] transition-colors">Preguntas frecuentes</a></li>
            </ul>
          </div>
          <div>
            <div className="font-['IBM_Plex_Mono'] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0c1512] mb-4">Acceso</div>
            <ul className="space-y-2.5 text-[0.85rem] text-[#5f7b6f]">
              <li><button onClick={() => navigate('/login')} className="hover:text-[#0c1512] transition-colors">Iniciar sesión</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-[#0c1512] transition-colors">Crear cuenta</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-[#0c1512] transition-colors">Panel profesional</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#d8e0dc]">
          <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-['IBM_Plex_Mono'] text-[9.5px] uppercase tracking-[0.12em] text-[#5f7b6f]">© 2026 Skinnor · Teledermatología</span>
            <span className="font-['IBM_Plex_Mono'] text-[9.5px] uppercase tracking-[0.12em] text-[#5f7b6f]">Datos: OMS · MINSAL Chile · HAM10000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
