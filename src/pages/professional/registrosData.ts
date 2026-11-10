export interface RegistroFoto {
  id: string;
  lesionId?: number;
  tag: string;
  fecha: string;
  fullDate: string;
  isoDate?: string;
  tipo: string;
  aumento: string;
  lesion: string;
  ubicacion: string;
  diametro: string;
  area: string;
  scoreTDS: string;
  asimetria: string;
  bordes: string;
  color: string;
  estado: string;
  estadoColor: string;
  autor: string;
  calidad: string;
  dispositivo: string;
  roi: string;
  colorTonos: string;
  hallazgos: string;
  svgHue: string;
  previewUrl: string;
  imageUrl?: string;
}

export const REGISTROS_FOTOS: RegistroFoto[] = [
  {
    id: 'REG-001',
    tag: 'T0',
    fecha: '15 Ene 2026',
    fullDate: '15 Enero 2026 - 11:20 hrs',
    tipo: 'Dermatoscopía Polarizada',
    aumento: '10x Óptico',
    lesion: 'Nevo Melanocítico',
    ubicacion: 'Escápula / Brazo Izq.',
    diametro: '5.2 mm',
    area: '21.2 mm²',
    scoreTDS: '3.85',
    asimetria: '42%',
    bordes: '38%',
    color: '2 tonos',
    estado: 'Base Inicial',
    estadoColor: 'bg-[#fafcfa] text-[#0c1512] border-[#d8e0dc]',
    autor: 'Dr. Alejandro Morales',
    calidad: '100% (Óptima)',
    dispositivo: 'DermLite DL4 + iPhone 15 Pro',
    roi: '99%',
    colorTonos: 'Marrón uniforme con patrón reticular fino',
    hallazgos: 'Red de pigmento homogénea sin velo ni proyecciones atípicas.',
    svgHue: '#5c3a26',
    previewUrl: 'dermatoscope-t0'
  },
  {
    id: 'REG-002',
    tag: 'T1',
    fecha: '15 Mar 2026',
    fullDate: '15 Marzo 2026 - 09:45 hrs',
    tipo: 'Dermatoscopía Polarizada',
    aumento: '10x Óptico',
    lesion: 'Nevo Melanocítico',
    ubicacion: 'Escápula / Brazo Izq.',
    diametro: '5.5 mm',
    area: '23.7 mm²',
    scoreTDS: '4.20',
    asimetria: '48%',
    bordes: '42%',
    color: '2 tonos',
    estado: 'Estable',
    estadoColor: 'bg-[#fafcfa] text-[#0c1512] border-[#d8e0dc]',
    autor: 'Dr. Alejandro Morales',
    calidad: '98% (Óptima)',
    dispositivo: 'DermLite DL4 + iPhone 15 Pro',
    roi: '98%',
    colorTonos: 'Marrón claro y oscuro concéntrico',
    hallazgos: 'Leve elongación radial simétrica. Sin atipia celular.',
    svgHue: '#4f301e',
    previewUrl: 'dermatoscope-t1'
  },
  {
    id: 'REG-003',
    tag: 'T2',
    fecha: '15 May 2026',
    fullDate: '15 Mayo 2026 - 16:10 hrs',
    tipo: 'Dermatoscopía No Polarizada',
    aumento: '10x Contacto',
    lesion: 'Nevo Melanocítico',
    ubicacion: 'Escápula / Brazo Izq.',
    diametro: '5.9 mm',
    area: '27.3 mm²',
    scoreTDS: '4.65',
    asimetria: '55%',
    bordes: '49%',
    color: '3 tonos',
    estado: 'Observación',
    estadoColor: 'bg-[#fafcfa] text-[#0c1512] border-[#d8e0dc]',
    autor: 'Diego Muñoz (Paciente)',
    calidad: '94% (Apta)',
    dispositivo: 'DermLite Handyscope + iOS',
    roi: '95%',
    colorTonos: 'Marrón claro, marrón oscuro y gris periférico',
    hallazgos: 'Inicio de festoneado en polo superior. Asimetría moderada.',
    svgHue: '#422515',
    previewUrl: 'dermatoscope-t2'
  },
  {
    id: 'REG-004',
    tag: 'T3',
    fecha: '01 Jul 2026',
    fullDate: '01 Julio 2026 - 12:30 hrs',
    tipo: 'Dermatoscopía Polarizada',
    aumento: '10x Óptico',
    lesion: 'Nevo Melanocítico',
    ubicacion: 'Escápula / Brazo Izq.',
    diametro: '6.2 mm',
    area: '30.2 mm²',
    scoreTDS: '5.15',
    asimetria: '64%',
    bordes: '56%',
    color: '3 tonos',
    estado: 'Control Semestral',
    estadoColor: 'bg-[#fafcfa] text-[#0c1512] border-[#d8e0dc]',
    autor: 'Diego Muñoz (Paciente)',
    calidad: '96% (Óptima)',
    dispositivo: 'DermLite Handyscope + iOS',
    roi: '96%',
    colorTonos: 'Policromía acentuada con focos negruzcos',
    hallazgos: 'Supera el umbral clásico de 6mm. Bordes con corte abrupto.',
    svgHue: '#351a0d',
    previewUrl: 'dermatoscope-t3'
  },
  {
    id: 'REG-005',
    tag: 'T4',
    fecha: '01 Ago 2026',
    fullDate: '01 Agosto 2026 - 10:15 hrs',
    tipo: 'Dermatoscopía Polarizada',
    aumento: '10x Óptico',
    lesion: 'Nevo con Atipia',
    ubicacion: 'Escápula / Brazo Izq.',
    diametro: '6.5 mm',
    area: '33.1 mm²',
    scoreTDS: '5.50',
    asimetria: '72%',
    bordes: '61%',
    color: '3 tonos',
    estado: 'Atipia Progresiva',
    estadoColor: 'bg-[#fafcfa] text-[#0c1512] border-[#d8e0dc]',
    autor: 'Dra. Claudia Vera',
    calidad: '100% (Óptima)',
    dispositivo: 'FotoFinder Medicam 1000',
    roi: '99%',
    colorTonos: 'Gris velo periférico y glóbulos asimétricos',
    hallazgos: 'Proyecciones radiales atípicas en cuadrante 2. Alarma IA activada.',
    svgHue: '#2a1107',
    previewUrl: 'dermatoscope-t4'
  },
  {
    id: 'REG-006',
    tag: 'T5',
    fecha: '15 Ago 2026',
    fullDate: '15 Agosto 2026 - 15:40 hrs',
    tipo: 'Dermatoscopía Polarizada Dual',
    aumento: '10x Cross-Polarized',
    lesion: 'Lesión Melanocítica Atípica',
    ubicacion: 'Escápula / Brazo Izq.',
    diametro: '6.8 mm',
    area: '36.3 mm²',
    scoreTDS: '5.75',
    asimetria: '78%',
    bordes: '65%',
    color: '3+ tonos',
    estado: 'Indicación Biopsia',
    estadoColor: 'bg-[#0c1512] text-white border-[#0c1512]',
    autor: 'Dr. Alejandro Morales',
    calidad: '100% (Óptima)',
    dispositivo: 'DermLite DL4 Polarized Cross',
    roi: '100%',
    colorTonos: 'Marrón claro, negro, gris-azulado y velo blanquecino',
    hallazgos: 'Atipia arquitectural severa, red pigmentaria ensanchada y áreas desestructuradas.',
    svgHue: '#1d0903',
    previewUrl: 'dermatoscope-t5'
  },
  {
    id: 'REG-007',
    tag: 'MACRO',
    fecha: '15 Ago 2026',
    fullDate: '15 Agosto 2026 - 15:42 hrs',
    tipo: 'Foto Clínica Panorámica',
    aumento: '1x Macro 90mm',
    lesion: 'Topografía Escápula',
    ubicacion: 'Espalda Superior Izq.',
    diametro: 'Escala 1:1',
    area: 'Región dorsal',
    scoreTDS: 'N/A',
    asimetria: 'Ubicación',
    bordes: 'Macro',
    color: 'Fototipo II',
    estado: 'Topografía',
    estadoColor: 'bg-[#fafcfa] text-[#0c1512] border-[#d8e0dc]',
    autor: 'Dr. Alejandro Morales',
    calidad: '100% (Óptima)',
    dispositivo: 'Sony Alpha 7IV Macro 90mm',
    roi: '100%',
    colorTonos: 'Campo anatómico completo con diana milimetrada',
    hallazgos: 'Mapeo corporal total para seguimiento de signos del patito feo.',
    svgHue: '#4a3224',
    previewUrl: 'dermatoscope-macro'
  },
  {
    id: 'REG-008',
    tag: 'IA-ROI',
    fecha: '15 Ago 2026',
    fullDate: '15 Agosto 2026 - 15:45 hrs',
    tipo: 'Segmentación Neuronal IA',
    aumento: '10x Vectorial',
    lesion: 'Máscara ROI Algorítmica',
    ubicacion: 'Escápula / Brazo Izq.',
    diametro: 'Perímetro 24.8 mm',
    area: '36.3 mm²',
    scoreTDS: '5.75',
    asimetria: 'Eje 45°',
    bordes: '65%',
    color: '3 tonos',
    estado: 'Segmentación',
    estadoColor: 'bg-[#fafcfa] text-[#0c1512] border-[#d8e0dc]',
    autor: 'Red Neuronal Skinnor v2.4',
    calidad: '100% (Matriz 512x512)',
    dispositivo: 'ISIC Backbone PyTorch',
    roi: '100%',
    colorTonos: 'Máscara binaria con gradiente de contorno radial',
    hallazgos: 'Convergencia diagnóstica del 89.4% en clase Melanoma / Atipia severa.',
    svgHue: '#0d7a63',
    previewUrl: 'dermatoscope-ia-roi'
  }
];
