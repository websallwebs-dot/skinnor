# Skinnor — guía de montaje para agentes

Plataforma de telemonitoreo dermatológico. Monorepo con 3 servicios que deben
correr en paralelo:

| Servicio | Tecnología | Puerto | Comando |
|---|---|---|---|
| Frontend | React + Vite + TS | 3000 | `npm run dev` |
| Backend API | Express + TS (tsx) + SQLite | 4000 | `npm run server` |
| Análisis IA | FastAPI + OpenCV + TensorFlow | 8003 | `uvicorn main:app --port 8003` |

O `npm run dev:full` levanta frontend + backend juntos.

## 1. Dependencias

```bash
npm install                 # frontend + backend (Node 18+)
python -m venv .venv-python # o usar el Python del sistema
.venv-python\Scripts\pip install -r requirements.txt   # Windows
# Linux/Mac: .venv-python/bin/pip install -r requirements.txt
```

## 2. Variables de entorno

```bash
cp .env.example .env        # Windows: copy .env.example .env
```

Completar en `.env`:

- `PINECONE_API_KEY` y `PINECONE_HOST` — credenciales del índice vectorial
  (necesarias para "Buscar casos similares"; el resto funciona sin ellas).
- `HAM_IMAGES_DIR` — carpeta que contiene `HAM10000_images_part_1/` y
  `HAM10000_images_part_2/`. **Buscar el dataset en `Downloads` del usuario**
  (puede estar como `HAM10000`, `HAM10000_images_part_1`, etc.). Si no se
  define, el default es `C:\Users\<usuario>\Downloads\HAM10000`.
- `DERM_MODEL_PATH` — carpeta local del modelo `google/derm-foundation`
  (debe contener `saved_model.pb`). En el equipo de desarrollo está en
  `C:\Users\mati1\Skinnor\googlederm` — **verificar la ruta real en esta
  máquina** (buscar en `C:\Users\<usuario>\Skinnor` o en el cache de
  Hugging Face `~/.cache/huggingface`). Si se deja vacío, `main.py` descarga
  el modelo desde Hugging Face automáticamente (~varios GB).

## 3. Base de datos

`server/skinnor.db` ya viene commiteada con los datos demo:

- Profesional: `drcarlos@gmail.com`
- Paciente: `juanpaciente@gmail.com`
- 2 lesiones con seguimientos y fotos (blobs dentro de la BD).
- Consultas y casos de estudio de demostración.

La contraseña NO se valida en modo desarrollo (cualquier texto entra); el
login redirige según el rol del email. `server/migrate.ts` crea el esquema
si la BD falta, pero NO siembra datos demo.

## 4. Levantar los 3 servicios

```bash
npm run dev:full                                        # frontend :3000 + API :4000
.venv-python/Scripts/python -m uvicorn main:app --port 8003   # análisis IA
```

Verificación:

- `curl http://localhost:4000/api/health` (o la ruta de health del server)
- `curl http://127.0.0.1:8003/health` → `{"status":"online","model":"google/derm-foundation"}`
  (la primera carga del modelo tarda varios minutos)
- Abrir `http://localhost:3000` → landing → login con las credenciales demo.

## 5. Notas

- El análisis de evolución (`/api/lesiones/:id/evolucion/analisis`) y la
  búsqueda de casos similares requieren el servicio FastAPI en :8003 y
  Pinecone configurado respectivamente; sin ellos la UI lo indica.
- `data/` (dataset HAM10000 completo) está en `.gitignore` — no se commitea.
- Credenciales reales de Pinecone/JWT nunca se commitean; usar `.env`.
