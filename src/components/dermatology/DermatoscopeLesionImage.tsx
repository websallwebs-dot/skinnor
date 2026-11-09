import React, { useMemo } from 'react';

export interface DermatoscopeLesionProps {
  tag?: string; // 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'MACRO' | 'IA-ROI' | string
  lesionName?: string;
  showReticle?: boolean;
  showRoiContour?: boolean;
  showHeatmap?: boolean;
  isPolarized?: boolean;
  zoom?: number;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  highlightAsymmetry?: boolean;
}

/**
 * DermatoscopeLesionImage
 * Procedural high-fidelity medical dermatoscopy & epiluminescence skin lesion generator.
 * Accurately models pigment networks, globules, streaks, blue-white veil, and calibration reticles.
 */
export const DermatoscopeLesionImage: React.FC<DermatoscopeLesionProps> = ({
  tag = 'T0',
  lesionName = 'Nevo Melanocítico',
  showReticle = true,
  showRoiContour = false,
  showHeatmap = false,
  isPolarized = true,
  zoom = 1,
  className = '',
  aspectRatio = 'square',
  highlightAsymmetry = false
}) => {
  const normTag = tag.toUpperCase().trim();

  // Morphological parameters according to evolutionary timeline
  const params = useMemo(() => {
    switch (normTag) {
      case 'T0':
        return {
          scale: 0.44,
          baseColor: '#5c3a26',
          secColor: '#7a4e32',
          highlightColor: '#3a2114',
          veilOpacity: 0,
          irregularity: 0.15,
          radialStreaks: false,
          dotsCount: 8,
          tds: 3.85,
          diameter: '5.2 mm',
          area: '21.2 mm²',
          symmetry: 'Alta (42% asim)',
          pattern: 'Reticular Homogéneo'
        };
      case 'T1':
        return {
          scale: 0.48,
          baseColor: '#4f301e',
          secColor: '#6e432a',
          highlightColor: '#321b0f',
          veilOpacity: 0.05,
          irregularity: 0.22,
          radialStreaks: false,
          dotsCount: 14,
          tds: 4.20,
          diameter: '5.5 mm',
          area: '23.7 mm²',
          symmetry: 'Leve elongación',
          pattern: 'Reticular Regular'
        };
      case 'T2':
        return {
          scale: 0.53,
          baseColor: '#432616',
          secColor: '#633920',
          highlightColor: '#281308',
          veilOpacity: 0.12,
          irregularity: 0.38,
          radialStreaks: false,
          dotsCount: 22,
          tds: 4.65,
          diameter: '5.9 mm',
          area: '27.3 mm²',
          symmetry: 'Asimetría Eje 1',
          pattern: 'Reticular Heterogéneo'
        };
      case 'T3':
        return {
          scale: 0.58,
          baseColor: '#361c0e',
          secColor: '#542914',
          highlightColor: '#1d0b04',
          veilOpacity: 0.22,
          irregularity: 0.52,
          radialStreaks: true,
          dotsCount: 32,
          tds: 5.15,
          diameter: '6.2 mm',
          area: '30.2 mm²',
          symmetry: 'Asimetría Dual',
          pattern: 'Policromático / Glóbulos'
        };
      case 'T4':
        return {
          scale: 0.63,
          baseColor: '#2b1307',
          secColor: '#471d09',
          highlightColor: '#140601',
          veilOpacity: 0.38,
          irregularity: 0.68,
          radialStreaks: true,
          dotsCount: 45,
          tds: 5.50,
          diameter: '6.5 mm',
          area: '33.1 mm²',
          symmetry: 'Asimetría Marcada',
          pattern: 'Red Atípica + Proyecciones'
        };
      case 'T5':
      case 'ACTUAL':
      case 'BIOPSIA':
        return {
          scale: 0.69,
          baseColor: '#1f0c04',
          secColor: '#3b1406',
          highlightColor: '#0a0200',
          veilOpacity: 0.55,
          irregularity: 0.82,
          radialStreaks: true,
          dotsCount: 58,
          tds: 5.75,
          diameter: '6.8 mm',
          area: '36.3 mm²',
          symmetry: 'Asimetría Severa (78%)',
          pattern: 'Multicomponente / Velo Azul-Blanco'
        };
      case 'IA-ROI':
        return {
          scale: 0.69,
          baseColor: '#1f0c04',
          secColor: '#3b1406',
          highlightColor: '#0a0200',
          veilOpacity: 0.55,
          irregularity: 0.82,
          radialStreaks: true,
          dotsCount: 58,
          tds: 5.75,
          diameter: '6.8 mm',
          area: '36.3 mm²',
          symmetry: 'Segmentado 100%',
          pattern: 'Máscara ROI Algorítmica'
        };
      case 'MACRO':
      default:
        return {
          scale: 0.22,
          baseColor: '#5c3a26',
          secColor: '#7a4e32',
          highlightColor: '#3a2114',
          veilOpacity: 0,
          irregularity: 0.4,
          radialStreaks: false,
          dotsCount: 10,
          tds: 5.75,
          diameter: '6.8 mm',
          area: 'Escápula',
          symmetry: 'Topografía',
          pattern: 'Foto Clínica Panorámica'
        };
    }
  }, [normTag]);

  // Is this the panoramic macro photo view?
  const isMacro = normTag === 'MACRO';
  const isIaRoi = normTag === 'IA-ROI' || showRoiContour;

  return (
    <div
      className={`relative w-full overflow-hidden select-none bg-[#110d0a] ${
        aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : 'h-full'
      } ${className}`}
    >
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full object-cover"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.25s ease-out'
        }}
      >
        <defs>
          {/* Base human skin gradient under epiluminescence fluid */}
          <radialGradient id={`skinGrad-${normTag}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f3d0bb" />
            <stop offset="50%" stopColor="#eec4ad" />
            <stop offset="85%" stopColor="#dda990" />
            <stop offset="100%" stopColor="#c79178" />
          </radialGradient>

          {/* Dermal vascular erythema */}
          <radialGradient id={`erythema-${normTag}`} cx="53%" cy="48%" r="40%">
            <stop offset="0%" stopColor="#d96b6b" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#c95050" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#c95050" stopOpacity="0" />
          </radialGradient>

          {/* Melanin lesion primary volume */}
          <radialGradient id={`lesionGrad-${normTag}`} cx="46%" cy="44%" r="48%">
            <stop offset="0%" stopColor={params.highlightColor} />
            <stop offset="35%" stopColor={params.baseColor} />
            <stop offset="70%" stopColor={params.secColor} />
            <stop offset="95%" stopColor="#a3633e" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c78c6b" stopOpacity="0" />
          </radialGradient>

          {/* Blue-white veil characteristic of dysplastic nevus / melanoma */}
          <radialGradient id={`blueWhiteVeil-${normTag}`} cx="42%" cy="40%" r="35%">
            <stop offset="0%" stopColor="#dce8f2" stopOpacity={params.veilOpacity * 0.75} />
            <stop offset="45%" stopColor="#96b4cf" stopOpacity={params.veilOpacity * 0.55} />
            <stop offset="80%" stopColor="#557591" stopOpacity={params.veilOpacity * 0.25} />
            <stop offset="100%" stopColor="#557591" stopOpacity="0" />
          </radialGradient>

          {/* AI Risk Heatmap gradient */}
          <radialGradient id={`heatmapGrad-${normTag}`} cx="48%" cy="46%" r="45%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
            <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>

          {/* Reticular pigment network pattern */}
          <pattern id={`pigmentGrid-${normTag}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path
              d="M 0 4 L 4 0 L 8 4 L 4 8 Z"
              fill="none"
              stroke={params.highlightColor}
              strokeWidth={normTag === 'T4' || normTag === 'T5' ? '0.75' : '0.45'}
              strokeOpacity={normTag === 'T4' || normTag === 'T5' ? '0.45' : '0.28'}
            />
          </pattern>

          {/* Micro epidermal texture */}
          <pattern id="skinTexture" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.6" fill="#8f573c" fillOpacity="0.12" />
            <circle cx="0" cy="0" r="0.4" fill="#ffffff" fillOpacity="0.08" />
          </pattern>

          {/* Polarized lens contact glass reflection */}
          <linearGradient id="lensGlint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isPolarized ? '0.04' : '0.22'} />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={isPolarized ? '0.06' : '0.28'} />
          </linearGradient>

          {/* Vignette border */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#000000" stopOpacity="0" />
            <stop offset="90%" stopColor="#000000" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
          </radialGradient>
        </defs>

        {/* 1. BASE BACKGROUND: CLINICAL SKIN FIELD */}
        <rect width="400" height="400" fill={`url(#skinGrad-${normTag})`} />
        <rect width="400" height="400" fill="url(#skinTexture)" />

        {/* Micro-capillaries & Erythema */}
        <circle cx="200" cy="195" r="160" fill={`url(#erythema-${normTag})`} />

        {/* MACRO VIEW: Panoramic skin with anatomical scapula landmark */}
        {isMacro ? (
          <g>
            {/* Skin pores & anatomical landmarks */}
            <circle cx="120" cy="90" r="1.5" fill="#7a422b" fillOpacity="0.4" />
            <circle cx="290" cy="110" r="1.2" fill="#7a422b" fillOpacity="0.4" />
            <circle cx="85" cy="280" r="1.8" fill="#7a422b" fillOpacity="0.5" />
            <circle cx="310" cy="290" r="1.4" fill="#7a422b" fillOpacity="0.4" />
            <circle cx="190" cy="330" r="1.2" fill="#7a422b" fillOpacity="0.3" />

            {/* Small satellite nevus */}
            <ellipse cx="110" cy="130" rx="4" ry="3" fill="#6d3e26" />
            <ellipse cx="320" cy="240" rx="3" ry="2.5" fill="#7d4e36" />

            {/* Target Primary Lesion (Escápula Izquierda) */}
            <g transform="translate(200, 200)">
              <ellipse cx="0" cy="0" rx="16" ry="13" fill="#2d1206" />
              <ellipse cx="-2" cy="-1" rx="10" ry="8" fill="#140601" />
              {/* Target Aiming Box with 10mm guide */}
              <rect x="-35" y="-35" width="70" height="70" fill="none" stroke="#0d7a63" strokeWidth="1.5" strokeDasharray="4 2" />
              <circle cx="0" cy="0" r="3" fill="#0d7a63" />
              <text x="0" y="48" textAnchor="middle" fill="#0c1512" fontSize="10" fontWeight="bold" fontFamily="monospace">
                10 mm Calibración
              </text>
            </g>

            {/* Medical Anatomical Scale Guide Bar in corner */}
            <g transform="translate(20, 370)">
              <rect x="0" y="-12" width="120" height="16" fill="rgba(255,255,255,0.85)" rx="3" />
              <line x1="10" y1="-4" x2="110" y2="-4" stroke="#0c1512" strokeWidth="2" />
              <line x1="10" y1="-8" x2="10" y2="0" stroke="#0c1512" strokeWidth="2" />
              <line x1="60" y1="-7" x2="60" y2="-1" stroke="#0c1512" strokeWidth="1.5" />
              <line x1="110" y1="-8" x2="110" y2="0" stroke="#0c1512" strokeWidth="2" />
              <text x="60" y="2" textAnchor="middle" fill="#0c1512" fontSize="8" fontWeight="bold" fontFamily="monospace">
                Escala 1:1 (10mm)
              </text>
            </g>
          </g>
        ) : (
          /* DERMATOSCOPY CLOSE-UP VIEW (T0 through T5, IA-ROI) */
          <g id="dermatoscopeLesionGroup">
            {/* Fine follicular openings */}
            <circle cx="80" cy="110" r="1.5" fill="#7a422b" fillOpacity="0.3" />
            <circle cx="310" cy="95" r="1.2" fill="#7a422b" fillOpacity="0.3" />
            <circle cx="95" cy="310" r="1.8" fill="#7a422b" fillOpacity="0.35" />
            <circle cx="320" cy="305" r="1.4" fill="#7a422b" fillOpacity="0.3" />

            {/* Main Melanin Lesion Morphology */}
            <g transform="translate(200, 200)">
              {/* Dynamic Lesion Body Shape with realistic asymmetric contours */}
              {normTag === 'T0' && (
                <path
                  d="M 0,-52 C 32,-50 54,-28 53,0 C 52,30 28,52 0,52 C -30,52 -52,30 -52,0 C -52,-28 -28,-50 0,-52 Z"
                  fill={`url(#lesionGrad-${normTag})`}
                />
              )}

              {normTag === 'T1' && (
                <path
                  d="M 2,-57 C 36,-54 59,-30 58,4 C 56,36 32,58 -2,58 C -34,58 -58,32 -58,-3 C -58,-34 -32,-56 2,-57 Z"
                  fill={`url(#lesionGrad-${normTag})`}
                />
              )}

              {normTag === 'T2' && (
                <path
                  d="M 5,-64 C 42,-60 67,-28 65,10 C 62,44 32,66 -8,65 C -44,64 -66,32 -65,-10 C -64,-44 -30,-64 5,-64 Z"
                  fill={`url(#lesionGrad-${normTag})`}
                />
              )}

              {normTag === 'T3' && (
                <path
                  d="M 8,-72 C 49,-68 76,-28 73,16 C 70,52 32,74 -16,73 C -54,72 -76,34 -74,-16 C -72,-52 -32,-74 8,-72 Z"
                  fill={`url(#lesionGrad-${normTag})`}
                />
              )}

              {normTag === 'T4' && (
                <path
                  d="M 12,-80 C 58,-76 86,-25 82,24 C 77,63 32,84 -24,82 C -66,80 -88,34 -85,-24 C -82,-63 -36,-84 12,-80 Z"
                  fill={`url(#lesionGrad-${normTag})`}
                />
              )}

              {(normTag === 'T5' || normTag === 'ACTUAL' || normTag === 'BIOPSIA' || normTag === 'IA-ROI') && (
                <path
                  d="M 16,-92 C 68,-86 98,-24 93,32 C 87,76 34,96 -32,94 C -78,92 -102,36 -98,-32 C -94,-74 -38,-96 16,-92 Z"
                  fill={`url(#lesionGrad-${normTag})`}
                />
              )}

              {/* Reticular Pigment Network Overlay (Honey-comb structure) */}
              <circle
                cx="0"
                cy="0"
                r={normTag === 'T0' ? 50 : normTag === 'T1' ? 56 : normTag === 'T2' ? 62 : normTag === 'T3' ? 70 : normTag === 'T4' ? 78 : 88}
                fill={`url(#pigmentGrid-${normTag})`}
                style={{ mixBlendMode: 'multiply' }}
              />

              {/* Atypical Eccentric Melanin Clumps (Dark blotches in high-risk sessions) */}
              {(normTag === 'T3' || normTag === 'T4' || normTag === 'T5' || normTag === 'IA-ROI') && (
                <g>
                  {/* Eccentric hyperpigmented nucleus */}
                  <ellipse cx="-16" cy="-14" rx="22" ry="18" fill="#0d0401" opacity="0.88" />
                  <ellipse cx="24" cy="18" rx="16" ry="12" fill="#140602" opacity="0.75" />
                  <ellipse cx="-28" cy="22" rx="14" ry="10" fill="#1a0802" opacity="0.7" />
                </g>
              )}

              {/* Blue-White Veil (Characteristic of melanoma / marked dysplasia) */}
              {params.veilOpacity > 0 && (
                <ellipse
                  cx="-8"
                  cy="-6"
                  rx={normTag === 'T5' || normTag === 'IA-ROI' ? 44 : normTag === 'T4' ? 34 : 24}
                  ry={normTag === 'T5' || normTag === 'IA-ROI' ? 36 : normTag === 'T4' ? 26 : 18}
                  fill={`url(#blueWhiteVeil-${normTag})`}
                />
              )}

              {/* Radial Pigment Streaks & Pseudopods in T4 / T5 */}
              {params.radialStreaks && (
                <g stroke="#1a0701" strokeWidth="1.6" strokeLinecap="round" opacity="0.75">
                  <path d="M 60,-40 Q 75,-48 85,-46" />
                  <path d="M 68,-20 Q 84,-24 94,-18" />
                  <path d="M 66,10 Q 82,14 90,22" />
                  <path d="M 40,65 Q 46,78 44,88" />
                  <path d="M -50,60 Q -62,72 -68,80" />
                  <path d="M -70,10 Q -84,12 -92,8" />
                </g>
              )}

              {/* Peripheral Melanin Dots and Globules */}
              <g fill="#1a0701" opacity="0.8">
                <circle cx="34" cy="-38" r="1.8" />
                <circle cx="48" cy="-22" r="2.2" />
                <circle cx="52" cy="12" r="1.6" />
                <circle cx="38" cy="44" r="2.0" />
                <circle cx="-38" cy="46" r="1.8" />
                <circle cx="-52" cy="18" r="2.2" />
                <circle cx="-46" cy="-30" r="1.6" />
                {params.dotsCount > 20 && (
                  <>
                    <circle cx="18" cy="-56" r="1.4" />
                    <circle cx="62" cy="-8" r="1.8" />
                    <circle cx="28" cy="62" r="1.5" />
                    <circle cx="-60" cy="-14" r="1.9" />
                    <circle cx="-24" cy="-54" r="1.6" />
                    <circle cx="58" cy="36" r="1.4" />
                  </>
                )}
                {params.dotsCount > 40 && (
                  <>
                    <circle cx="74" cy="-28" r="1.6" />
                    <circle cx="78" cy="8" r="1.8" />
                    <circle cx="-76" cy="24" r="2.0" />
                    <circle cx="-68" cy="-36" r="1.5" />
                    <circle cx="10" cy="78" r="1.7" />
                    <circle cx="-36" cy="74" r="1.8" />
                  </>
                )}
              </g>

              {/* Heatmap Overlay (if active) */}
              {showHeatmap && (
                <circle
                  cx="0"
                  cy="0"
                  r={normTag === 'T5' || normTag === 'IA-ROI' ? 95 : 75}
                  fill={`url(#heatmapGrad-${normTag})`}
                  style={{ mixBlendMode: 'screen' }}
                />
              )}

              {/* AI Segmentation Contour (IA-ROI or active toggle) */}
              {isIaRoi && (
                <g>
                  {/* Algorithmic Boundary Line */}
                  <path
                    d="M 16,-92 C 68,-86 98,-24 93,32 C 87,76 34,96 -32,94 C -78,92 -102,36 -98,-32 C -94,-74 -38,-96 16,-92 Z"
                    fill="rgba(13, 122, 99, 0.18)"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                  />

                  {/* Asymmetry Orthogonal Axes */}
                  <line x1="-120" y1="-30" x2="120" y2="30" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="-30" y1="120" x2="30" y2="-120" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Centroid Cross */}
                  <circle cx="0" cy="0" r="4" fill="#ef4444" />
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" strokeWidth="1.5" />

                  {/* Bounding Box corners */}
                  <g stroke="#10b981" strokeWidth="2" fill="none">
                    <path d="M -110,-105 L -100,-105 M -110,-105 L -110,-95" />
                    <path d="M 110,-105 L 100,-105 M 110,-105 L 110,-95" />
                    <path d="M -110,105 L -100,105 M -110,105 L -110,95" />
                    <path d="M 110,105 L 100,105 M 110,105 L 110,95" />
                  </g>

                  {/* Confidence tag */}
                  <rect x="-45" y="112" width="90" height="18" fill="rgba(12,21,18,0.92)" rx="4" />
                  <text x="0" y="124" textAnchor="middle" fill="#10b981" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                    IoU 99.4% • ABCD
                  </text>
                </g>
              )}

              {/* Asymmetry Highlight Guides (if active) */}
              {highlightAsymmetry && (
                <g>
                  <line x1="-110" y1="0" x2="110" y2="0" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                  <line x1="0" y1="-110" x2="0" y2="110" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="75" y="-10" fill="#f59e0b" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    Eje X Asim
                  </text>
                  <text x="5" y="95" fill="#f59e0b" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    Eje Y Asim
                  </text>
                </g>
              )}
            </g>
          </g>
        )}

        {/* 2. OPTICAL DERMATOSCOPE RETICLE & CALIBRATION MARKINGS */}
        {showReticle && !isMacro && (
          <g id="dermatoscopeReticle">
            {/* Outer Circular Lens Contact Edge */}
            <circle cx="200" cy="200" r="185" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="182" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

            {/* Inner Concentric Metric Rings (3mm, 6mm, 9mm) */}
            <circle cx="200" cy="200" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeDasharray="2 4" />
            <circle cx="200" cy="200" r="90" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeDasharray="3 4" />
            <circle cx="200" cy="200" r="135" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeDasharray="4 4" />

            {/* Millimeter Scale Ticks around Circumference (0 to 10 mm) */}
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 10 * Math.PI) / 180;
              const isMajor = i % 3 === 0;
              const r1 = isMajor ? 172 : 177;
              const r2 = 184;
              const x1 = 200 + r1 * Math.cos(angle);
              const y1 = 200 + r1 * Math.sin(angle);
              const x2 = 200 + r2 * Math.cos(angle);
              const y2 = 200 + r2 * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth={isMajor ? 1.5 : 0.8}
                />
              );
            })}

            {/* Orthogonal Crosshair Ticks */}
            <line x1="200" y1="12" x2="200" y2="30" stroke="#ffffff" strokeWidth="2" />
            <line x1="200" y1="370" x2="200" y2="388" stroke="#ffffff" strokeWidth="2" />
            <line x1="12" y1="200" x2="30" y2="200" stroke="#ffffff" strokeWidth="2" />
            <line x1="370" y1="200" x2="388" y2="200" stroke="#ffffff" strokeWidth="2" />

            {/* Scale Numerals */}
            <text x="200" y="42" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="9" fontWeight="bold" fontFamily="monospace">
              0 mm
            </text>
            <text x="358" y="203" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="9" fontWeight="bold" fontFamily="monospace">
              5 mm
            </text>
            <text x="200" y="365" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="9" fontWeight="bold" fontFamily="monospace">
              10 mm
            </text>
            <text x="42" y="203" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="9" fontWeight="bold" fontFamily="monospace">
              15 mm
            </text>
          </g>
        )}

        {/* 3. POLARIZED OPTIC GLASS REFLECTION & VIGNETTE */}
        <rect width="400" height="400" fill="url(#lensGlint)" pointerEvents="none" />
        <rect width="400" height="400" fill="url(#vignette)" pointerEvents="none" />

        {/* Optical Mode Badge in Top Left Corner */}
        <g transform="translate(18, 22)">
          <rect
            x="0"
            y="0"
            width={isMacro ? 84 : isPolarized ? 96 : 108}
            height="18"
            fill="rgba(12, 21, 18, 0.75)"
            rx="4"
            stroke="rgba(255,255,255,0.18)"
          />
          <text x="6" y="12.5" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
            {isMacro ? '📷 1x MACRO' : isPolarized ? '⚡ POLARIZADO' : '🔍 NO POLARIZ.'}
          </text>
        </g>

        {/* Morphometric Diameter Label in Bottom Right Corner */}
        <g transform="translate(305, 362)">
          <rect x="0" y="0" width="78" height="18" fill="rgba(12, 21, 18, 0.85)" rx="4" stroke="rgba(255,255,255,0.18)" />
          <text x="39" y="12.5" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
            Ø {params.diameter}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default DermatoscopeLesionImage;
