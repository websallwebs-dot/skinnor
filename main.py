import base64
import cv2
import numpy as np
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


# ---------------------------------------------------------------------------
# Analisis de evolucion: registro + differencing + metricas ABCD computadas.
# Basado en: DermaViz (JAMA Dermatol 2023, registro mejora deteccion OR 4.85),
# arXiv:2110.05976 (registro rigido/similarity + differencing), PLOS ONE
# (computo automatico de asimetria/color/diametro) y Patterns of Change.
# ---------------------------------------------------------------------------

MAX_DIM = 512


def _flatten_illumination(img_bgr: np.ndarray) -> np.ndarray:
    """Correccion de sombreado/iluminacion no uniforme (CIC 2012, pre-procesado
    dermoscopico): estima el fondo con Gaussiano amplio y lo resta del canal L."""
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    L = lab[:, :, 0].astype(np.float32)
    sigma = max(img_bgr.shape[:2]) / 8.0
    background = cv2.GaussianBlur(L, (0, 0), sigmaX=sigma)
    corrected = L - background + float(np.mean(L))
    lab[:, :, 0] = np.clip(corrected, 0, 255).astype(np.uint8)
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _remove_hairs(img_bgr: np.ndarray) -> np.ndarray:
    """Remocion de vello: black-hat morfologico para detectar lineas oscuras
    finas + inpainting Telea (Abbas 2013 / enfoque Toossi simplificado)."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    k = max(9, img_bgr.shape[1] // 34) | 1  # kernel impar
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k, k))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    _, hair = cv2.threshold(blackhat, 20, 255, cv2.THRESH_BINARY)
    hair = cv2.morphologyEx(hair, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    if cv2.countNonZero(hair) < 15:
        return img_bgr
    return cv2.inpaint(img_bgr, hair, 4, cv2.INPAINT_TELEA)


def _preprocess(img_bgr: np.ndarray) -> np.ndarray:
    return _remove_hairs(_flatten_illumination(img_bgr))


def _match_skin_color(base_lab: np.ndarray, follow_lab: np.ndarray,
                      mask_base: np.ndarray, mask_follow: np.ndarray) -> np.ndarray:
    """Calibracion de color entre imagenes (Celebi 2011): ajusta el Lab del
    seguimiento para que la piel circundante tenga la misma media que la base,
    reduciendo diferencias de iluminacion/temperatura antes del differencing."""
    skin_b = base_lab[mask_base == 0]
    skin_f = follow_lab[mask_follow == 0]
    if len(skin_b) < 100 or len(skin_f) < 100:
        return follow_lab
    delta = np.mean(skin_b, axis=0) - np.mean(skin_f, axis=0)
    matched = follow_lab.astype(np.float32) + delta[None, None, :]
    return np.clip(matched, 0, 255).astype(np.uint8)


async def _decode_cv2(file: UploadFile) -> np.ndarray:
    contents = await file.read()
    arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="No se pudo decodificar la imagen.")
    h, w = img.shape[:2]
    scale = MAX_DIM / max(h, w)
    if scale < 1:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def _lesion_mask(img_bgr: np.ndarray) -> np.ndarray:
    """Mascara de la lesion: region pigmentada/oscura sobre piel.
    Otsu sobre canal L de LAB + limpieza morfologica; fallback: ROI central."""
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    L = lab[:, :, 0]
    _, dark = cv2.threshold(L, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(dark)
    h, w = dark.shape
    img_area = h * w
    best = None
    best_score = 0
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < img_area * 0.005 or area > img_area * 0.6:
            continue
        cx, cy = stats[i, cv2.CC_STAT_LEFT] + stats[i, cv2.CC_STAT_WIDTH] / 2, stats[i, cv2.CC_STAT_TOP] + stats[i, cv2.CC_STAT_HEIGHT] / 2
        # preferir componentes cercanos al centro y de tamano moderado
        center_dist = abs(cx - w / 2) / w + abs(cy - h / 2) / h
        score = area * (1 - min(center_dist, 1))
        if score > best_score:
            best_score = score
            best = i
    if best is None:
        mask = np.zeros((h, w), np.uint8)
        cv2.ellipse(mask, (w // 2, h // 2), (int(w * 0.22), int(h * 0.22)), 0, 0, 360, 255, -1)
        return mask
    return (labels == best).astype(np.uint8) * 255


def _feret_diameter(mask: np.ndarray) -> float:
    """Diametro de Feret aproximado: lado mayor del rectangulo rotado minimo."""
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.0
    c = max(contours, key=cv2.contourArea)
    (_, _), (rw, rh), _ = cv2.minAreaRect(c)
    return float(max(rw, rh))


def _asymmetry_index(mask: np.ndarray) -> float:
    """A: divide la mascara por su eje principal y compara areas de mitades.
    Indice 0-1 (0 = simetrico)."""
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.0
    c = max(contours, key=cv2.contourArea)
    if len(c) < 5:
        return 0.0
    (_, _), (rw, rh), angle = cv2.minAreaRect(c)
    rot = cv2.getRotationMatrix2D((mask.shape[1] / 2, mask.shape[0] / 2), angle, 1.0)
    rot_mask = cv2.warpAffine(mask, rot, (mask.shape[1], mask.shape[0]), flags=cv2.INTER_NEAREST)
    h, w = rot_mask.shape
    left = cv2.countNonZero(rot_mask[:, : w // 2])
    right = cv2.countNonZero(rot_mask[:, w // 2:])
    total = left + right
    if total == 0:
        return 0.0
    return float(abs(left - right) / total)


def _border_irregularity(mask: np.ndarray) -> float:
    """B: irregularidad de borde = 1 - circularidad (4*pi*A/P^2).
    Indice 0-1 (0 = circulo perfecto)."""
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.0
    c = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(c)
    peri = cv2.arcLength(c, True)
    if peri == 0:
        return 0.0
    circularity = 4 * np.pi * area / (peri * peri)
    return float(max(0.0, min(1.0, 1.0 - circularity)))


def _color_metrics(img_bgr: np.ndarray, mask: np.ndarray) -> dict:
    """C: variegacion de color en LAB + n de clusters de color (k-means k=5).
    Reporta colores_detectados y variegacion (desv std de canales a*,b*)."""
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    pix = lab[mask > 0]
    if len(pix) < 10:
        return {"colores_detectados": 0, "variegacion": 0.0, "clustering_ok": False}
    # variegacion cromatica (canales a* y b*)
    ab = pix[:, 1:3]
    variegacion = float(np.sqrt(np.var(ab[:, 0]) + np.var(ab[:, 1])))
    # k-means sobre Lab completo para contar colores dominantes
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    K = 5
    _, labels, centers = cv2.kmeans(pix, K, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.flatten(), minlength=K)
    colores = int(np.sum(counts > len(pix) * 0.03))

    # matices y varianza de tono en HSV (Coll et al.: >=6 matices sugiere M)
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    hues = hsv[:, :, 0][mask > 0].astype(np.float32)
    matices = 0
    varianza_tono = 0.0
    if len(hues) > 10:
        hist = np.bincount(hues.astype(int), minlength=180).astype(np.float32)
        hist /= hist.sum()
        matices = int(np.sum(hist > 0.05))
        # varianza circular del tono (resultante media R -> 1-R)
        rad = hues * (np.pi / 90.0)
        R = np.sqrt(np.mean(np.cos(rad)) ** 2 + np.mean(np.sin(rad)) ** 2)
        varianza_tono = round(float(1.0 - R), 3)
    return {
        "colores_detectados": max(1, colores),
        "variegacion": round(variegacion, 2),
        "matices_color": matices,
        "varianza_tono": varianza_tono,
        "clustering_ok": True,
        "centros_lab": centers.tolist(),
    }


def _image_metrics(img_bgr: np.ndarray) -> dict:
    mask = _lesion_mask(img_bgr)
    area = float(cv2.countNonZero(mask))
    m = {
        "area_px": round(area, 1),
        "diametro_px": round(_feret_diameter(mask), 1),
        "perimetro_px": round(_perimeter(mask), 1),
        "asimetria": round(_asymmetry_index(mask), 3),
        "borde_irregularidad": round(_border_irregularity(mask), 3),
    }
    m.update(_color_metrics(img_bgr, mask))
    m["mask_area_ratio"] = round(area / (mask.shape[0] * mask.shape[1]), 4)
    return m, mask


def _perimeter(mask: np.ndarray) -> float:
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.0
    return float(max(cv2.arcLength(c, True) for c in contours))


def _register(base_gray: np.ndarray, follow_gray: np.ndarray):
    """Registro por features: SIFT + ratio test + RANSAC (transformacion
    parcial afin = rotacion + traslacion + escala uniforme).
    Devuelve (M, inliers, confianza). Si falla, M=None."""
    sift = cv2.SIFT_create(nfeatures=800)
    kp1, des1 = sift.detectAndCompute(base_gray, None)
    kp2, des2 = sift.detectAndCompute(follow_gray, None)
    if des1 is None or des2 is None or len(kp1) < 8 or len(kp2) < 8:
        return None, 0, 0.0
    bf = cv2.BFMatcher(cv2.NORM_L2)
    matches = bf.knnMatch(des1, des2, k=2)
    good = [m for m, n in matches if m.distance < 0.75 * n.distance]
    if len(good) < 8:
        return None, len(good), 0.0
    src = np.float32([kp2[m.trainIdx].pt for m in good])
    dst = np.float32([kp1[m.queryIdx].pt for m in good])
    M, inliers = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=5.0)
    if M is None or inliers is None:
        return None, len(good), 0.0
    n_in = int(inliers.sum())
    confianza = round(n_in / len(good), 3)
    return M, n_in, confianza


def _viz_panels(img_bgr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Genera un panel 2x2 con la evidencia visual del analisis:
    [mascara+contorno] [eje de simetria con mitades] [bordes Canny]
    [clusters de color k-means]. Sirve para documentar el calculo."""
    h, w = mask.shape
    base = cv2.resize(img_bgr, (w, h))

    # Panel 1: mascara de lesion con contorno
    p1 = base.copy()
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(p1, contours, -1, (0, 255, 0), 2)
    overlay = p1.copy()
    overlay[mask > 0] = (overlay[mask > 0] * 0.55 + np.array([0, 0, 120]) * 0.45).astype(np.uint8)
    cv2.drawContours(overlay, contours, -1, (0, 255, 0), 2)
    p1 = overlay

    # Panel 2: eje principal + mitades (evidencia de asimetria)
    p2 = base.copy()
    if contours:
        c = max(contours, key=cv2.contourArea)
        if len(c) >= 5:
            (cx, cy), (rw, rh), angle = cv2.minAreaRect(c)
            theta = np.deg2rad(angle)
            length = int(max(rw, rh) * 1.2)
            dx, dy = np.cos(theta) * length / 2, np.sin(theta) * length / 2
            p1pt = (int(cx - dx), int(cy - dy))
            p2pt = (int(cx + dx), int(cy + dy))
            cv2.line(p2, p1pt, p2pt, (255, 255, 255), 1, cv2.LINE_AA)
            # tinte por mitades usando la linea como divisor
            left = np.zeros((h, w), np.uint8)
            right = np.zeros((h, w), np.uint8)
            # lado por producto vectorial punto-linea
            vx, vy = p2pt[0] - p1pt[0], p2pt[1] - p1pt[1]
            ys, xs = np.mgrid[0:h, 0:w]
            cross = (xs - p1pt[0]) * vy - (ys - p1pt[1]) * vx
            side = (cross > 0).astype(np.uint8) * 255
            tint_r = np.zeros_like(base); tint_r[:, :, 2] = 60
            tint_b = np.zeros_like(base); tint_b[:, :, 0] = 60
            p2 = np.where(side[:, :, None] == 255, cv2.addWeighted(base, 0.7, tint_r, 0.3, 0),
                          cv2.addWeighted(base, 0.7, tint_b, 0.3, 0)).astype(np.uint8)
            cv2.line(p2, p1pt, p2pt, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.drawContours(p2, contours, -1, (0, 255, 0), 1)

    # Panel 3: bordes (Canny sobre L de Lab)
    p3 = base.copy()
    lab_e = cv2.cvtColor(base, cv2.COLOR_BGR2LAB)
    edges = cv2.Canny(lab_e[:, :, 0], 40, 120)
    edge_vis = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    p3 = cv2.addWeighted(base, 0.45, edge_vis, 0.55, 0)
    cv2.drawContours(p3, contours, -1, (0, 255, 255), 1)

    # Panel 4: clusters de color k-means (evidencia de variegacion)
    p4 = np.zeros_like(base)
    lab = cv2.cvtColor(base, cv2.COLOR_BGR2LAB).astype(np.float32)
    pix = lab[mask > 0]
    if len(pix) >= 10:
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
        _, labels, centers = cv2.kmeans(pix, 5, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
        pal = [
            [200, 60, 60], [60, 180, 60], [60, 90, 220], [220, 200, 40], [200, 40, 200],
        ]
        lab_img = lab.copy()
        out = base.copy()
        for k in range(5):
            sel = labels.flatten() == k
            if not np.any(sel):
                continue
            m = np.zeros(mask.shape, np.uint8)
            flat = m.ravel()
            idx = np.where(mask.ravel() > 0)[0]
            flat[idx[sel]] = 255
            color = np.uint8(pal[k][::-1])  # Lab aprox -> BGR aprox
            out[m > 0] = (out[m > 0] * 0.35 + color * 0.65).astype(np.uint8)
        p4 = out
    else:
        p4 = base.copy()

    # ensamblar 2x2
    tw, th = w // 2, h // 2
    panels = [cv2.resize(p, (tw, th), interpolation=cv2.INTER_AREA) for p in (p1, p2, p3, p4)]
    top = np.hstack([panels[0], panels[1]])
    bot = np.hstack([panels[2], panels[3]])
    return np.vstack([top, bot])


def _heatmap_png(base_bgr, follow_aligned, mask_union, diff_mask):
    """Heatmap del differencing: imagen base atenuada + mascara de cambio."""
    canvas = base_bgr.copy()
    overlay = np.zeros_like(canvas)
    overlay[diff_mask > 0] = (0, 0, 255)  # rojo BGR = region de cambio
    heat = cv2.addWeighted(canvas, 0.55, overlay, 0.45, 0)
    # marcar borde de la lesion
    contours, _ = cv2.findContours(mask_union, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(heat, contours, -1, (0, 200, 0), 1)
    ok, buf = cv2.imencode('.png', heat)
    if not ok:
        return None
    return base64.b64encode(buf.tobytes()).decode()


@app.post("/analyze_pair")
async def analyze_pair(base: UploadFile = File(...), follow: UploadFile = File(...)):
    """Compara imagen basal vs seguimiento: registro, differencing y metricas."""
    try:
        base_img = await _decode_cv2(base)
        follow_img = await _decode_cv2(follow)
        # mismo tamano para registro/diff
        fh, fw = follow_img.shape[:2]
        bh, bw = base_img.shape[:2]
        if (fw, fh) != (bw, bh):
            follow_img = cv2.resize(follow_img, (bw, bh), interpolation=cv2.INTER_AREA)

        # pre-procesado: correccion de iluminacion + remocion de vello
        base_proc = _preprocess(base_img)
        follow_proc = _preprocess(follow_img)

        base_gray = cv2.cvtColor(base_proc, cv2.COLOR_BGR2GRAY)
        follow_gray = cv2.cvtColor(follow_proc, cv2.COLOR_BGR2GRAY)

        m_base, mask_base = _image_metrics(base_proc)
        m_follow, mask_follow_raw = _image_metrics(follow_proc)

        # registro: alinear follow -> base (similarity rigida+escala uniforme)
        M, n_inliers, confianza = _register(base_gray, follow_gray)
        if M is not None:
            follow_aligned = cv2.warpAffine(follow_proc, M, (bw, bh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            follow_gray_al = cv2.cvtColor(follow_aligned, cv2.COLOR_BGR2GRAY)
            _, mask_follow = _image_metrics(follow_aligned)
        else:
            follow_aligned = follow_proc
            follow_gray_al = follow_gray
            mask_follow = mask_follow_raw
            confianza = 0.0

        # calibracion de color: igualar estadisticos de piel circundante
        lab_b = cv2.cvtColor(base_proc, cv2.COLOR_BGR2LAB)
        lab_f_al = cv2.cvtColor(follow_aligned, cv2.COLOR_BGR2LAB)
        lab_f_matched = _match_skin_color(lab_b, lab_f_al, mask_base, mask_follow)
        follow_cal = cv2.cvtColor(lab_f_matched, cv2.COLOR_LAB2BGR)
        follow_gray_cal = cv2.cvtColor(follow_cal, cv2.COLOR_BGR2GRAY)

        # differencing dentro de la union de mascaras (dilatada), sobre imagen
        # calibrada en color (Celebi) para reducir falsos cambios por iluminacion
        union = cv2.bitwise_or(mask_base, mask_follow)
        union_d = cv2.dilate(union, np.ones((15, 15), np.uint8))
        base_gray_cal = cv2.cvtColor(base_proc, cv2.COLOR_BGR2GRAY)
        diff = cv2.absdiff(base_gray_cal, follow_gray_cal)
        _, diff_bin = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        diff_bin = cv2.bitwise_and(diff_bin, union_d)
        union_area = max(cv2.countNonZero(union_d), 1)
        changed_px = cv2.countNonZero(diff_bin)
        cambio_pct = round(100.0 * changed_px / union_area, 2)

        # color nuevo: fraccion de pixeles del follow cuya distancia Lab al
        # centroide mas cercano de la base supera 18 (DeltaE aprox CIE76)
        roi_b = lab_b[mask_base > 0].astype(np.float32)
        roi_f = lab_f_matched[mask_follow > 0].astype(np.float32)
        color_nuevo_pct = 0.0
        if len(roi_b) > 20 and len(roi_f) > 20:
            _, _, centers_b = cv2.kmeans(roi_b, 5, None,
                (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 3, cv2.KMEANS_PP_CENTERS)
            # distancia al centroide mas cercano
            d_b = np.linalg.norm(roi_b[:, None, :] - centers_b[None, :, :], axis=2).min(axis=1)
            d = np.linalg.norm(roi_f[:, None, :] - centers_b[None, :, :], axis=2)
            min_d = d.min(axis=1)
            # umbral auto-referenciado: la propia base tiene error de
            # cuantizacion k-means; "color nuevo" debe superarlo con margen
            thr = max(18.0, float(np.percentile(d_b, 95)) * 1.25)
            color_nuevo_pct = round(100.0 * float(np.mean(min_d > thr)), 2)

        d_delta = round(m_follow["diametro_px"] - m_base["diametro_px"], 1)
        d_pct = round(100.0 * d_delta / m_base["diametro_px"], 1) if m_base["diametro_px"] else 0.0

        heat_b64 = _heatmap_png(base_proc, follow_cal, union, diff_bin)
        viz = _viz_panels(follow_cal, mask_follow)
        ok, vbuf = cv2.imencode('.png', viz)
        viz_b64 = base64.b64encode(vbuf.tobytes()).decode() if ok else None

        return {
            "success": True,
            "base": m_base,
            "follow": {**m_follow, "registro_ok": M is not None},
            "par": {
                "registro_inliers": n_inliers,
                "registro_confianza": confianza,
                "cambio_pct": cambio_pct,
                "pixeles_cambio": int(changed_px),
                "diametro_delta_px": d_delta,
                "diametro_delta_pct": d_pct,
                "color_nuevo_pct": color_nuevo_pct,
            },
            "heatmap_b64": heat_b64,
            "viz_b64": viz_b64,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en analisis de imagen: {str(e)}")
