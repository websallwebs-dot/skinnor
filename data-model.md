# Modelo de datos — Skinnor (IndexedDB)

## Entidad: Lesion
Almacenada en el object store `lesiones` (keyPath `id`, autoIncrement).

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | number | PK, autoIncrement | Identificador único |
| nombre | string | required, no vacío | Nombre identificador de la lesión |
| zona | string | required, uno de: cabeza, cuello, torso_frente, espalda, brazo_izq, brazo_der, pierna_izq, pierna_der, manos_pies | Parte del cuerpo |
| ubicacion | string | opcional | Ubicación exacta detallada |
| tamaño | string | opcional | Tamaño aproximado en mm |
| colores | string[] | opcional | Lista de colores presentes |
| sintomas | string[] | opcional | Lista de síntomas actuales |
| creadoEn | string (ISO) | required | Fecha y hora de creación |
| fotoBase | Blob | required | Fotografía base de la lesión |

## Entidad: Seguimiento
Almacenada en el object store `seguimientos` (keyPath `id`, autoIncrement). Índice en `lesionId`.

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | number | PK, autoIncrement | Identificador único |
| lesionId | number | required, FK → lesiones.id | Lesión a la que pertenece |
| fecha | string (ISO) | required | Fecha y hora del registro |
| cambios | 'si' | 'no' | required | ¿Cambió de tamaño o forma? |
| color | 'si' | 'no' | required | ¿Cambió de color? |
| sintomas | 'si' | 'no' | required | ¿Presenta síntomas nuevos? |
| notas | string | opcional | Notas adicionales del usuario |
| foto | Blob | required | Fotografía del seguimiento |

## Relaciones
- Una `Lesion` tiene cero o más `Seguimiento` (1:N).
- Al eliminar una `Lesion`, se eliminan en cascada todos sus `Seguimiento` asociados.

## Serialización para respaldo (export/import)
- Los `Blob` se serializan a data URL (`blobToDataURL`) antes de escribir el JSON.
- Al importar, los data URL se convierten nuevamente a `Blob` (`dataURLtoBlob`).