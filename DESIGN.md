---
name: Skinnor
description: Living teledermatology consultation — lesion tracking with mathematical analysis, bilingual ES/EN.
colors:
  primary: "#0d7a63"
  primary-deep: "#0a4539"
  mid-teal: "#2e9c81"
  signal: "#c77a0b"
  ink: "#0c1512"
  ink-soft: "#3f4f49"
  neutral-bg: "#f4f6f5"
  neutral-bg-deep: "#e9efec"
  panel: "#ffffff"
  line: "#d8e0dc"
  line-strong: "#b9c6c0"
  dark-surface: "#08231c"
  dark-panel: "#0c2c23"
  dark-line: "#14503f"
  mint-dark: "#8fd6c2"
  gold-dark: "#ffd58a"
  gold-status: "#ffce6e"
  live-green: "#54d9a8"
  pale-mint: "#cfe6dd"
  dark-muted: "#5f7b6f"
  teal-muted: "#8fb8aa"
typography:
  display:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5.4vw, 4.3rem)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 4vw, 3.1rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.18rem"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "11.5px"
    fontWeight: 500
    letterSpacing: "0.14em"
    textTransform: "uppercase"
  scale:
    display: "clamp(2.5rem, 5.4vw, 4.3rem)"
    final: "clamp(2rem, 4.6vw, 3.4rem)"
    callout: "clamp(1.35rem, 2.6vw, 2rem)"
    clin-metric: "clamp(2rem, 4vw, 3.2rem)"
    headline: "clamp(1.9rem, 4vw, 3.1rem)"
    metric: "clamp(1.7rem, 3vw, 2.5rem)"
    stat: "1.7rem"
    arrow: "1.6rem"
    arrow-sm: "1.2rem"
    title: "1.18rem"
    lead: "1.12rem"
    sub-lead: "1.08rem"
    body: "1.0625rem"
    fluid-a: "1.35rem"
    fluid-b: "2rem"
    fluid-c: "3.2rem"
    fluid-d: "3.4rem"
    button: "1rem"
    item-title: "1.02rem"
    small: "0.95rem"
    small-2: "0.93rem"
    small-3: "0.92rem"
    small-4: "0.9rem"
    small-5: "0.88rem"
    small-6: "0.86rem"
    small-7: "0.85rem"
    small-8: "0.84rem"
    small-9: "0.82rem"
    small-10: "0.8rem"
    mobile-body: "16px"
    mono-1: "10.5px"
    mono-2: "10px"
    mono-3: "9.5px"
    mono-4: "8.5px"
    mono-5: "8px"
rounded:
  bar: "2px"
  track: "3px"
  thumb: "4px"
  chip: "5px"
  sm: "6px"
  banner: "8px"
  md: "10px"
  pill: "20px"
  island: "16px"
  screen: "38px"
  phone: "48px"
spacing:
  section: "clamp(84px, 10vw, 128px)"
  container: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "15px 26px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "15px 26px"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "20px"
    padding: "4px 10px"
---

# Design System: Skinnor

## Overview

**Creative North Star: "The Living Consultation"**

Skinnor is the medical instrument that feels like a consultorio in your pocket: a light, clinical ground built from cool near-white surfaces and hairline rules, where every measurement is a real number in monospace and every change is an amber signal. The system dramatizes the teledermatology consultation — patient and doctor sharing one lesion, one timeline, one access code — by showing analysis happening, not describing it: contour overlays trace borders, metric bars quantify the ABCDE rule, a similarity atlas finds the closest real cases, and a monitoring board keeps the doctor connected. Restrained and serious by design: teal is reserved for measurement and connection, amber for change, and the page leans on precision typography and negative space rather than decoration. The tone is clinical credibility, never hype.

**Key Characteristics:**
- Instrument panels (white, hairline-bordered, precise mono readouts) instead of decorative cards.
- Measurement and connection live in teal; change detection lives in amber; both are rare, meaningful accents on a neutral ground.
- A structured grotesque display (Schibsted Grotesk) over a neutral professional body (Golos Text), with mono (IBM Plex Mono) reserved for data, labels, and codes.
- One authored motion moment per surface (contour draw, metric bars scaling in), otherwise quiet reveals.

## Colors

A restrained, clinical palette: neutral cool grounds, one measurement/connection accent, one change signal, and ink text. Secondary text is tinted from ink, never gray.

### Primary
- **Medical Teal** (#0d7a63): Measurement, analysis overlays, contour strokes, primary buttons, links, the code-link connector, and the "match" highlight. Appears on ≤10% of any surface; its rarity is the point.
- **Deep Teal** (#0a4539): Primary button hover, dark CTA band backgrounds.

### Secondary
- **Signal Amber** (#c77a0b, text-safe #8a5a0a): The single "change detected" register — the T1 ring, the evolution bar, change badges and the alert callout highlight.
- **Mid Teal** (#2e9c81): The tertiary signal-bar tint for the "similar cases" capability readout.
- **Gold on Dark** (#ffd58a): Emphasized numbers and words inside the dark problem/final bands.
- **Gold Status** (#ffce6e): The "Change" status pills and risk values on the monitoring board.
- **Live Green** (#54d9a8): The live-monitoring dot and "Estable/Stable" status pills on the dark board.
- **Critical Red** (#a83b2b): Reserved for critical risk states (defined, used sparingly).

### Neutral
- **Cool Paper** (#f4f6f5): Page ground.
- **Deep Paper** (#e9efec): Track fills, tonal bands (technology section).
- **Panel White** (#ffffff): Instrument panels, boards, tables.
- **Hairline** (#d8e0dc) / **Hairline Strong** (#b9c6c0): 1px borders, dividers, ghost-button borders.
- **Ink** (#0c1512): Primary text.
- **Ink Soft** (#3f4f49): Secondary text on light.
- **Dark Surface** (#08231c): The problem band, professional panel, final CTA.
- **Dark Panel** (#0c2c23): The monitoring board surface inside the professional band.
- **Dark Line** (#14503f): Hairlines and row separators on dark.
- **Mint on Dark** (#8fd6c2): Kickers, section eyebrows and feature icons on dark bands.
- **Pale Mint Text** (#cfe6dd): Mono text on dark chips (similarity percentages).
- **Dark Muted** (#5f7b6f): Source/small print on the dark band.
- **Teal Muted** (#8fb8aa): Muted text on the deep-teal final CTA and board notes.
- **Status Fills** (rgba of Live Green / Gold Status at .12–.4 alpha): Pill backgrounds and the live-dot halo on dark.

### Named Rules
**The Rarity Rule.** Teal and amber appear only where they mean measurement or change; an unmeasuring teal element is removed, not tolerated.
**The No-Gray Secondary Rule.** Secondary text is always tinted from the surface it sits on — ink-soft on light, muted teal-green on dark. Gray is never used.

## Typography

**Display Font:** Schibsted Grotesk (weights 600–900)
**Body Font:** Golos Text (400/500/600)
**Label/Mono Font:** IBM Plex Mono (400/500/600)

**Character:** A structured, engineered grotesque speaking over a neutral professional body, with monospace reserved strictly for measurement, data, and micro-labels. The pairing reads as a precision instrument, not a lifestyle brand.

### Hierarchy
- **Display** (800, clamp(2.5rem, 5.4vw, 4.3rem), 1.06, -0.03em): Hero headline only; the teal `<em>` carries the second clause.
- **Headline** (700, clamp(1.9rem, 4vw, 3.1rem), 1.06, -0.02em): Section titles, always with a mono kicker above.
- **Callout** (700, clamp(1.35rem, 2.6vw, 2rem), 1.2): The problem-band statement.
- **Final CTA** (800, clamp(2rem, 4.6vw, 3.4rem), 1.06): Closing headline.
- **Metric Number** (800, clamp(1.7rem, 3vw, 2.5rem)): Problem-band stat figures; clinic metric figures use clamp(2rem, 4vw, 3.2rem).
- **Title** (700, 1.18rem, 1.15): Panel, step, and item titles; the nav wordmark.
- **Body Lead** (400, 1.08–1.12rem, 1.6): Hero and section ledes, 52–60ch.
- **Body** (400, 1.0625rem, 1.6): Copy at 65–75ch max measure.
- **Small** (400–600, 0.8–0.95rem, 1.45): Captions, card copy, tags, footnotes, notes.
- **Label/Mono** (500, 11.5px, 0.14em, uppercase): Kickers, panel bars, captions, table headers, codes.
- **Tiny Mono** (400–600, 8–10.5px, 0.08–0.14em, uppercase): Similarity percentages, thumb captions, board headers, status pills.

### Named Rules
**The Mono Means Measure Rule.** IBM Plex Mono is used only for numbers, data readouts, micro-labels, codes and headers — never as a "technical" costume for prose.

## Layout

- 1200px container, 28px gutters (20px under 560px).
- Section padding clamp(84px, 10vw, 128px); more space above a heading than below it.
- Hero: two-column 1fr / 1.06fr narrative + phone mockup; stacks below 1080px, the phone zooms to ~86% under 640px.
- Dense instrument panels alternate with quiet narrative bands; the dark problem/professional bands break the light rhythm.
- Responsive: grids collapse to one column at 1080px; the monitoring table becomes a horizontal scroll container (min-width 520px) under 820px; the process line becomes a vertical list.

## Elevation & Depth

Flat by default; depth comes from hairline structure and tonal layering, not shadows. Elevation is reserved for the instrument panels that hold working analysis: one soft, neutral, offset shadow with a large blur and a steep negative spread (e.g. `0 30px 60px -30px rgba(12,21,18,.18)`). Hover lift on buttons uses a neutral shadow (`0 12px 24px -12px rgba(12,21,18,.35)`).

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only under interactive or content-bearing instrument panels — never colored, never as a glow.

## Shapes

- Small, precise radius: 2px (signal bars), 3px (metric tracks), 4px (thumbnails), 5px (code chips), 6px (buttons/chips), 8px (in-app banners, history cells), 10px (panels), 20px (status pills). Sharp corners are the natural state; radius is a quiet accommodation, not a brand.
- The phone mockup uses device radii that break the UI scale on purpose: 48px bezel, 38px screen, 16px dynamic island — a physical device, not a surface.
- Hairlines (1px, `--line`) are the primary shape language: they border panels, divide metric rows, grid the similarity atlas.
- Dermoscopic imagery is circular and generated in-SVG; the lesion contour is a dashed teal stroke that draws itself on the T1 view.

## Components

### Buttons
- **Shape:** 6px radius, tight padding (15px 26px).
- **Primary:** Teal fill, white text, weight 700 grotesque. Hover → deep teal, 1px lift, neutral shadow. Arrow glyph nudges 3px right on hover.
- **Ghost:** Transparent, 1px `--line-strong` border, ink text; hover darkens the border.
- **Light (on dark):** White fill, deep-teal text, used on the professional and final CTA bands.

### Tags / Chips
- 20px pill radius, mono 10px uppercase, 1px border.
- Teal variants for product attributes (Gratis, Seguro, ABCDE, Vinculado); amber/gold variants for state (Cambio/Change); green variants for stable monitoring status.

### Instrument Panel (signature)
- The hero stages the analysis inside a **phone mockup with the app open**: dark bezel (48px), dynamic island, status bar, app header with the access code chip, a live-analysis mono status line, a large T1 dermoscopy with the amber ring and auto-drawn contour, the detected-change banner (amber), compact ABCDE metric rows, a T0→T1→T2 history strip, and a four-tab bottom bar.
- The **patient↔doctor link card** closes the hero below the phone: patient chip, dashed connector, and the access code (mono, dashed teal border, `--teal-soft` fill).

### Monitoring Board
- Dark surface (#0c2c23) inside a #08231c section; mono bar header with a pulsing live dot; four-column table (Paciente / Última foto / ABCDE / Estado); rows carry a circular lesion thumbnail and mono data; status pills are green (stable) or gold (change). Scrolls horizontally under 820px.

### Navigation
- Sticky bar, 86% background blend + 12px backdrop blur, hairline bottom border. Brand mark: a ring with a teal core. Mono ES/EN switch with a filled active state. Desktop links collapse below 820px, keeping the language switch and CTA.

## Do's and Don'ts

### Do:
- **Do** show the analysis working (contour overlays, metric bars, similarity atlas) rather than describing it in copy.
- **Do** keep teal and amber scarce and meaningful; when an element can't say measurement or change, keep it neutral.
- **Do** set every number, label, code, and table header in mono uppercase with the 0.14em track.
- **Do** tint secondary text from the local surface — ink-soft on light, muted teal on dark.
- **Do** label synthetic demonstration imagery (the SVG dermoscopy) so it can never be mistaken for a real patient photo.

### Don't:
- **Don't** use colored side-borders, glow shadows, gradient text, or glass as decoration.
- **Don't** animate layout properties (width/height); scale and transform only.
- **Don't** use mono type as a costume; every mono glyph is a number, label, or code.
- **Don't** imply the platform is a diagnosis; every CTA area carries the support-tool disclaimer.
- **Don't** add ornament — this system's richness lives in the hairline grid and the data, not in decoration.