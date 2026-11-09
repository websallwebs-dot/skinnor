# Marco de Trabajo — Skinnor (Teledermatología)

Estado: activo. Stack: React 19 + TS + Vite 6 + Tailwind 4 + IndexedDB + shadcn/ui.

## 1. Skills cargadas (marco de referencia)

| Skill | Rol en el marco |
|-------|-----------------|
| `react-senior-code-review` | Revisión de arquitectura de una feature React (5 dimensiones). Fuente de reglas: `references/`. |
| `react-best-practices` | Effects como escape hatch, composición > prop drilling, hooks `use*`, refs. |
| `vercel-react-best-practices` | Rendimiento: eliminar waterfalls, bundle size, re-renders, memo disciplinada. |
| `tailwindcss` | Utilidades, tokens CSS, diseño mobile-first, variantes. |
| `security-best-practices` | Detección de vulnerabilidades frontend (XSS, tokens en localStorage, datos no confiables). |

## 2. Entendimiento del proyecto (Skinnor)

**Objetivo:** Paciente registra, lista y hace seguimiento fotográfico de lesiones cutáneas, todo en IndexedDB del navegador (sin backend). Fachadas: paciente, profesional, clínica, superadmin.

**Rutas clave (paciente):**
- `/dashboard/lesiones` — catálogo (IndexedDB vía `photoStore`)
- `/dashboard/lesiones/crear` — crear lesión con foto base (`CameraCapture`)
- `/dashboard/lesiones/:id` — detalle + historial de seguimientos
- `/dashboard/seguimientos/crear` — nuevo seguimiento vinculado a lesión

**Capas de datos:**
- `src/lib/photoStore.ts` — IndexedDB: stores `lesiones` y `seguimientos`, export/import JSON (data URLs).
- `src/lib/ham10000Store.ts` — IndexedDB: índice HAM10000 (imágenes del dataset).
- `src/lib/api.ts` — cliente fetch con token en `localStorage` (skinnor_token, skinnor_user). Sirve de puerta de API remota aunque el MVP es local.
- `src/AuthContext.tsx` — auth por rol (patient/professional/clinic_admin/super_admin), token + usuario en localStorage.
- `src/components/CameraCapture.tsx` — cámara (trasera con fallback) + subida de archivo, devuelve Blob.

**Problemas arquitectónicos observados (resumen):**
- Datos del servidor (`api.ts`) mezclados con datos locales (`photoStore`) sin una capa de datos única. Violación B.5 (server state en `useState`+`useEffect` fetch pairs).
- `LesionesList.tsx`, `LesionDetail.tsx`, `SeguimientosCreate.tsx` leen de `api.ts` (endpoints remotos) mientras el plan especifica IndexedDB local. Capa de datos inconsistente.
- `useEffect` para leer `localStorage` del usuario logueado en varios componentes (efecto de sincronización a externo, derivado de auth).
- Formularios sin validación de esquema (Zod). Violación D.4.
- `div onClick` en acciones interactivas (p.ej. importación). Violación D.10.
- Valores mágicos (`#0c1512`, `#5f7b6f`) repetidos en componentes. Violación E.1.
- `recharts` importado de forma síncrona en `Evolucion.tsx` (gráfico pesado en ruta crítica). Violación C.6.

## 3. Cómo usar este marco (flujo de trabajo)

1. **Elegir una feature** — ej. `src/pages/patient/LesionesCreate.tsx` o su directorio padre.
2. **Mapear la feature** — entrada, grafo de componentes, estado (server vs client), efectos, flujo de datos, cruces de frontera (5–10 líneas).
3. **Aplicar las reglas** — recorrer `references/` en orden; capturar hallazgos con severidad (CRITICAL/MAJOR/MINOR/NIT), `file:line`, por qué y fix concreto.
4. **Producir el reporte** — forma exacta del skill (`## Feature Map`, `## Findings`, `## Apply`).
5. **Aplicar interactivamente** — el usuario elige hallazgos (`F-01, F-03` o `all critical`), se aplican como Edits reales agrupados por archivo, luego se corren `npm run lint` y `npm run build`.

## 4. Reglas activas (resumen de `references/`)

A. Structure & boundaries — API pública en el seam (index/barrel), composición sobre prop drilling, colocation > centralización, un componente por archivo, helpers puros fuera del componente, early returns, claridad sobre cleverness.
B. State & data flow — Rules of Hooks (siempre CRITICAL), esencial vs derivado, localidad de estado, server state nunca en `useState`+`useEffect`, efectos sin cleanup, stale closures, URL como estado.
C. Performance & rendering — cascadas de re-render, `useMemo`/`useCallback`/`memo` justificados, Suspense por granularidad de carga, code splitting de libs pesadas, virtualización de listas >100 items, no waterfalls.
D. Types, forms, testability, a11y — tipos en la frontera, Zod en formularios, errores del servidor al form, HTML semántico, focus management, teclado, labels, WCAG SC.
E. Styling & motion — tokens no valores mágicos, sin `style={{}}` estático, CSS animations sobre JS, solo transform/opacity de alta frecuencia, `will-change` con parsimonia, `prefers-reduced-motion`, sin selectores globales que filtren.

## 5. Archivos de referencia del skill

`C:\Users\munoz\.agents\skills\react-senior-code-review\references/` — `principles.md`, `structure-boundaries.md`, `state-data-flow.md`, `performance.md`, `types-forms-a11y.md`, `styling-motion.md`, `react-docs.md`, `rules-of-hooks.md`, `severity-rubric.md`, `patterns-playbook.md`.

## 6. Comando de verificación del proyecto

- `npm run lint` = `tsc --noEmit`
- `npm run build` = Vite build
- `npm run dev` = Vite dev (puerto 3000)

## 7. Siguiente paso

Indicame la ruta de la feature a revisar (ej. `src/pages/patient`) y produzco el reporte de arquitectura siguiendo el marco anterior.
