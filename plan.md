# Plan técnico — Skinnor (almacenamiento local sin backend)

## Stack tecnológico
- Framework: React 19 + TypeScript
- Bundler: Vite 6
- Rutas: react-router-dom 7
- Estilos: Tailwind CSS 4 + shadcn/ui (componentes UI en `src/components/ui`)
- Iconos: lucide-react
- Notificaciones: sonner
- Gráficos: recharts (página de evolución)
- Almacenamiento: IndexedDB API nativa del navegador (vía `src/lib/photoStore.ts`)
- Build: `npm run build` (Vite), `npm run lint` (`tsc --noEmit`)

## Estructura de archivos relevante
```
src/
  lib/
    photoStore.ts          # Capa IndexedDB: lesiones, seguimientos, export/import
  components/
    CameraCapture.tsx      # Cámara web + subida de archivo, devuelve Blob
    ui/                    # shadcn/ui primitives (button, card, input, etc.)
  pages/
    patient/
      LesionesList.tsx     # Catálogo con export/import respaldo
      LesionesCreate.tsx   # Crear lesión con foto base
      LesionDetail.tsx     # Detalle + historial de seguimientos
      SeguimientosCreate.tsx # Nuevo seguimiento vinculado a lesión
      Evolucion.tsx        # Gráficos ABCDE (solo lectura, mock)
      Profile.tsx          # Perfil de salud del paciente
      ConsultasList.tsx
      DashboardHome.tsx
  App.tsx                  # Rutas + <Toaster />
```

## Alcance de este plan
Solo cubre el flujo de paciente (lesiones + seguimientos + fotos) con almacenamiento local. No incluye backend, autenticación real, sincronización entre dispositivos ni despliegue en servidor.

## Decisiones de arquitectura
1. **IndexedDB como única base de datos**: soporta blobs de imagen grandes y cuota mucho mayor que localStorage.
2. **Fotos como Blob en memoria del navegador**: se convierten a data URL solo para mostrar en `<img src>` y se revocan al desmontar para evitar fugas de memoria.
3. **Sin redimensionado automático en v1**: las imágenes se guardan tal cual vienen de la cámara/archivo. (Pendiente: downscale a max 1024 px como mejora futura.)
4. **Export/Import JSON**: mecanismo de respaldo y migración entre dispositivos/navegadores.