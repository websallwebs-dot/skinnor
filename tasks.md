# tasks.md — Skinnor: Almacenamiento local + Explorador HAM10000

## Fase 1: Setup (inicialización del proyecto)

- [ ] T001 Verificar dependencias instaladas (react, react-router-dom, lucide-react, sonner, tailwind, vite) en package.json
- [ ] T002 Confirmar estructura de carpetas: src/lib/, src/components/, src/pages/patient/, src/pages/professional/
- [ ] T003 Verificar que `npm run lint` (tsc --noEmit) y `npm run build` pasen antes de agregar nuevas tareas

## Fase 2: Foundational (prerrequisitos bloqueantes para todas las historias)

- [X] T004 [P] Crear `src/lib/photoStore.ts` con capa IndexedDB: object stores `lesiones` y `seguimientos`, funciones add/get/update/delete para ambas entidades
- [X] T005 [P] Crear `src/lib/ham10000Store.ts` con capa IndexedDB para el índice del dataset HAM10000: object store `hamImages` con campos `image_id`, `lesion_id`, `dx`, `dx_type`, `age`, `sex`, `localization`, `imagePath`, `part` (1 o 2)
- [X] T006 [P] Crear `src/components/CameraCapture.tsx`: componente reutilizable con acceso a cámara web (trasera con fallback), subida de archivo, vista previa y devolución de Blob
- [X] T007 [P] Agregar `<Toaster />` de sonner en `src/App.tsx` para notificaciones de guardar/exportar/importar

## Fase 3: US1 — Registrar una nueva lesión con foto base (P1)

- [ ] T008 [US1] Reescribir `src/pages/patient/LesionesCreate.tsx`: formulario controlado con nombre, zona, ubicación, tamaño, colores, síntomas, cámara/subida de foto base, validación de campos requeridos y guardado en `photoStore`
- [ ] T009 [US1] Navegación: al guardar con éxito, redirigir a `/dashboard/lesiones` y mostrar toast de confirmación

## Fase 4: US2 — Ver el catálogo de lesiones guardadas (P1)

- [ ] T010 [US1] Reescribir `src/pages/patient/LesionesList.tsx`: leer lesiones de `photoStore`, mostrar grid con foto base (o "Sin fotografía"), nombre, zona, fecha; campo de búsqueda por nombre o ubicación; estado vacío si no hay lesiones; botones "Añadir foto" y "Historial" por tarjeta
- [ ] T011 [US1] Botones "Exportar respaldo" (descarga JSON con todas las lesiones y fotos como data URLs) y "Importar respaldo" (lee JSON y restaura en IndexedDB) en `src/pages/patient/LesionesList.tsx`
- [ ] T012 [US1] Toast de éxito/error para exportar e importar

## Fase 5: US3 — Ver detalle de una lesión y su historial (P1)

- [ ] T013 [US1] Reescribir `src/pages/patient/LesionDetail.tsx`: leer lesión por ID de `photoStore`, mostrar perfil completo (nombre, ID, zona, tamaño, colores, síntomas, fecha), fotografía base, historial de seguimientos con fecha, día, foto, cambios y síntomas; botón "Añadir registro de hoy"
- [ ] T014 [US1] Manejo de lesión no encontrada: mostrar mensaje y enlace para volver al catálogo

## Fase 6: US4 — Añadir un registro de seguimiento con foto (P1)

- [ ] T015 [US1] Reescribir `src/pages/patient/SeguimientosCreate.tsx`: selección de lesión existente (preseleccionada si viene desde detalle o listado), captura/subida de fotografía actual, evaluación de cambios (tamaño/forma, color, síntomas Sí/No), notas opcionales, guardado en `photoStore` vinculado a la lesión
- [ ] T016 [US1] Parámetro de URL `?lesion=<id>` para preseleccionar lesión desde el listado o detalle
- [ ] T017 [US1] Al guardar, redirigir al detalle de la lesión con el nuevo registro visible

## Fase 7: US7 — Explorador HAM10000 para especialista (P1)

- [X] T018 [US7] Crear `src/pages/professional/HamExplorer.tsx`: componente principal del explorador con `window.showDirectoryPicker()` para acceder a `C:\Users\munoz\Downloads\HAM10000` localmente
- [X] T019 [US7] Función para leer `HAM10000_metadata.csv` desde el handle de carpeta y parsear filas: `lesion_id, image_id, dx, dx_type, age, sex, localization`
- [X] T020 [US7] Función para indexar imágenes cruzando `image_id` con el CSV y guardando metadata en `ham10000Store` (IndexedDB)
- [X] T021 [US7] Grid de miniaturas con metadata resumida; al hacer clic se abre detalle con imagen real (URL.createObjectURL desde handle de archivo local)
- [X] T022 [US7] Ruta `/pro/ham-explorer` en `src/App.tsx` dentro del portal profesional, protegida por `ProtectedRoute`
- [X] T023 [US7] Estado vacío y mensaje de instrucción si no se ha seleccionado la carpeta del dataset aún

## Fase 8: US5 — Exportar e importar respaldo de datos (P2)

- [ ] T024 [US2] (Ya cubierto en T011) Verificar que exportar incluya lesiones, seguimientos y sus fotos; importar restaure todo sin perder datos existentes de otras entidades si corresponde

## Fase 9: US6 — Captura y subida de imágenes sin backend (P1)

- [ ] T025 [US6] (Ya cubierto en T006) Componente `CameraCapture` reutilizable usado en `LesionesCreate` y `SeguimientosCreate`

## Fase 10: Polish & cross-cutting concerns

- [ ] T026 Verificar estilos consistentes (colores `#0c1512`, `#5f7b6f`, fondos `#f4f6f5`) en todas las páginas nuevas y modificadas
- [ ] T027 Ejecutar `npm run lint` (tsc --noEmit) y corregir errores de TypeScript
- [ ] T028 Ejecutar `npm run build` y verificar que no haya errores de compilación
- [ ] T029 Probar flujo end-to-end: crear lesión → ver en catálogo → ver detalle → añadir seguimiento → ver en historial

## Dependencias y orden de completado de historias

Orden sugerido:
1. US1 (Crear lesión) → depende de Foundational (T004–T007)
2. US2 (Catálogo) → depende de US1
3. US3 (Detalle) → depende de US1, US2
4. US4 (Seguimiento) → depende de US1, US3
5. US7 (Explorador HAM10000) → independiente, depende de Foundational (T005)
6. US5 (Exportar/importar) → depende de US1, US2

## Ejemplos de ejecución en paralelo

- T004, T005, T006, T007 pueden ejecutarse en paralelo (archivos distintos, sin dependencias entre sí)
- T008 y T018 pueden ejecutarse en paralelo una vez completado Foundational (páginas distintas)
- T010 y T013 pueden ejecutarse en paralelo una vez completado US1

## Alcance MVP sugerido

Historias P1: US1, US2, US3, US4, US6, US7. US5 (exportar/importar) es P2 y puede dejarse para una entrega posterior si se necesita acortar tiempo.

## Validación de formato

Todas las tareas siguen el formato estricto: `- [ ] T### [P?] [US#] Descripción con ruta de archivo`.
