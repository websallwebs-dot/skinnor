# Especificación — Skinnor: Almacenamiento local de lesiones y fotos (sin backend)

## Objetivo
Permitir al paciente registrar, listar, ver detalle y hacer seguimiento fotográfico de lesiones cutáneas, guardando todo únicamente en el navegador (IndexedDB), sin necesidad de backend.

## Historias de usuario

### US1 — Registrar una nueva lesión con foto base (P1)
Como paciente quiero crear una ficha de lesión con nombre, zona del cuerpo, ubicación exacta, tamaño, colores, síntomas y una fotografía base, para tener un perfil inicial de monitoreo.
- Criterios de aceptación:
  - El formulario valida que nombre y zona estén completos antes de guardar.
  - Es obligatoria la fotografía base (cámara o archivo).
  - Al guardar, la lesión y su foto se persisten en IndexedDB del navegador.
  - Se muestra confirmación visual (toast) al guardar exitosamente.
  - Al guardar se navega al catálogo de lesiones.

### US2 — Ver el catálogo de lesiones guardadas (P1)
Como paciente quiero ver todas mis lesiones registradas con su foto base, zona y fecha de creación, para saber qué estoy monitoreando.
- Criterios de aceptación:
  - Se listan todas las lesiones de IndexedDB ordenadas por fecha (más reciente primero).
  - Cada tarjeta muestra la foto base (o "Sin fotografía"), nombre, zona y fecha.
  - Se puede buscar por nombre o ubicación.
  - Si no hay lesiones, se muestra estado vacío con llamada a acción para crear una.
  - Cada tarjeta tiene botones para "Añadir foto" (nuevo seguimiento) y "Historial" (detalle).

### US3 — Ver el detalle de una lesión y su historial (P1)
Como paciente quiero abrir una lesión para ver su perfil completo, la foto base y el historial de registros con fotos, para observar cambios a lo largo del tiempo.
- Criterios de aceptación:
  - Muestra nombre, ID, zona, tamaño, colores, síntomas, fecha de creación.
  - Muestra la fotografía base almacenada.
  - Muestra lista de registros de seguimiento con fecha, día, foto (si la tiene), cambios y síntomas.
  - Botón para añadir un registro nuevo vinculado a esta lesión.

### US4 — Añadir un registro de seguimiento con foto (P1)
Como paciente quiero registrar el estado actual de una lesión con fotografía, evaluación de cambios (tamaño, color, síntomas) y notas opcionales, para hacer seguimiento periódico.
- Criterios de aceptación:
  - Se selecciona una lesión existente de la lista (preseleccionada si viene desde detalle).
  - Es obligatoria una fotografía actual (cámara o archivo).
  - Se graba fecha automática al guardar.
  - Se guardan respuestas de cambios de tamaño/forma, color y síntomas (Sí/No).
  - Se guardan notas opcionales.
  - Al guardar se navega al detalle de la lesión con el nuevo registro visible.

### US5 — Exportar e importar respaldo de datos (P2)
Como paciente quiero exportar todas mis lesiones y fotos a un archivo JSON y volver a importarlas, para no perder la información si limpio el navegador o cambio de dispositivo.
- Criterios de aceptación:
  - Botón "Exportar respaldo" descarga un `.json` con todas las lesiones y seguimientos (fotos como data URLs).
  - Botón "Importar respaldo" lee un `.json` y restaura todo en IndexedDB (reemplazando lo existente).
  - Se muestra toast de éxito o error según corresponda.

### US6 — Captura y subida de imágenes sin backend (P1)
Como paciente quiero tomar fotos con la cámara del dispositivo o subir un archivo existente, para usarlas como foto base o de seguimiento sin depender de un servidor.
- Criterios de aceptación:
  - Componente de cámara reutilizable con acceso a cámara trasera (fallback a cámara frontal/única).
  - Opción de subir archivo de imagen desde el dispositivo.
  - Vista previa de la foto capturada antes de confirmar.
  - Las imágenes se almacenan como Blob en IndexedDB (no se envían a ningún servidor).

## Restricciones y supuestos
- No hay backend ni autenticación de terceros requerida para el almacenamiento de fotos.
- Los datos persisten solo en el navegador/origen donde se crean (IndexedDB).
- No hay sincronización entre dispositivos ni entre navegadores.
- El usuario es responsable de exportar respaldos periódicamente para no perder datos.