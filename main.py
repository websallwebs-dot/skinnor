from contextlib import asynccontextmanager
from io import BytesIO
from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
import tensorflow as tf
from huggingface_hub import snapshot_download

# Estado global para almacenar el modelo en memoria
model_assets = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Descargando/verificando cache del modelo google/derm-foundation...")
    # Descarga el repositorio localmente y devuelve la ruta del folder
    model_dir = snapshot_download(repo_id="google/derm-foundation")
    
    print("Cargando modelo SavedModel en memoria...")
    loaded_model = tf.saved_model.load(model_dir)
    model_assets["infer"] = loaded_model.signatures["serving_default"]
    print("Modelo cargado y listo para inferencia!")
    yield
    # Limpieza al cerrar la aplicacion
    model_assets.clear()

app = FastAPI(
    title="Skinnor Derm Foundation API",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
def read_root():
    return {"status": "online", "model": "google/derm-foundation"}

@app.get("/health")
def health():
    ready = "infer" in model_assets
    return {"status": "ok" if ready else "loading", "model_ready": ready}

@app.post("/predict")
async def predict_embedding(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Formato de imagen no soportado.")

    try:
        # 1. Leer contenido de la imagen enviada
        contents = await file.read()
        img = Image.open(BytesIO(contents))

        # 2. Convertir y dar formato PNG/RGB
        buf = BytesIO()
        img.convert('RGB').save(buf, format='PNG')
        image_bytes = buf.getvalue()

        # 3. Empaquetar como tf.train.Example
        input_tensor = tf.train.Example(
            features=tf.train.Features(
                feature={
                    'image/encoded': tf.train.Feature(
                        bytes_list=tf.train.BytesList(value=[image_bytes])
                    )
                }
            )
        ).SerializeToString()

        # 4. Inferencia con el modelo guardado en memoria
        infer = model_assets["infer"]
        output = infer(inputs=tf.constant([input_tensor]))

        # 5. Extraer embedding (6144 dimensiones)
        embedding_vector = output['embedding'].numpy().flatten().tolist()

        return {
            "success": True,
            "embedding_dim": len(embedding_vector),
            "embedding": embedding_vector
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante el procesamiento: {str(e)}")
