import { Router } from 'express';
import { get, all } from '../db';

const router = Router();

const FASTAPI_URL = (process.env.FASTAPI_EMBED_URL || 'http://127.0.0.1:8003').replace(/\/$/, '');
const FASTAPI_TIMEOUT_MS = Number(process.env.FASTAPI_TIMEOUT_MS || 120000);
const PINECONE_HOST = process.env.PINECONE_HOST || '';
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'skin222';
const PINECONE_TOP_K = Number(process.env.PINECONE_TOP_K || 12);
const PINECONE_TIMEOUT_MS = Number(process.env.PINECONE_TIMEOUT_MS || 30000);

interface ImagenFuente {
  buffer: Buffer;
  mime: string;
  captura: Record<string, unknown>;
}

// Resuelve la imagen fuente desde la BD (nunca se confía en URLs del cliente)
// y verifica que el profesional esté vinculado al paciente.
function resolverImagen(body: any): { imagen: ImagenFuente } | { error: string; status: number } {
  const { profesional_id, paciente_id, tipo, lesion_id, seguimiento_id, foto_id } = body || {};

  if (!profesional_id || !paciente_id || !tipo) {
    return { error: 'Faltan parámetros: profesional_id, paciente_id, tipo', status: 400 };
  }

  const vinculo = get(
    'SELECT id FROM vinculaciones WHERE profesional_id = ? AND paciente_id = ?',
    [profesional_id, paciente_id]
  );
  if (!vinculo) {
    return { error: 'El profesional no está vinculado a este paciente', status: 403 };
  }

  if (tipo === 'lesion') {
    const lesion = get(
      'SELECT id, nombre, zona, foto_base FROM lesiones WHERE id = ? AND paciente_id = ?',
      [lesion_id, paciente_id]
    );
    if (!lesion || !lesion.foto_base) {
      return { error: 'La lesión no existe o no tiene foto base', status: 404 };
    }
    return {
      imagen: {
        buffer: lesion.foto_base as Buffer,
        mime: 'image/jpeg',
        captura: { tipo: 'lesion', lesion_id: lesion.id, lesion: lesion.nombre, zona: lesion.zona },
      },
    };
  }

  if (tipo === 'seguimiento_foto') {
    const foto = get(
      `SELECT sf.id AS foto_id, sf.foto, sf.mime, s.id AS seguimiento_id, s.fecha, s.notas,
              l.id AS lesion_id, l.nombre AS lesion, l.zona
       FROM seguimiento_fotos sf
       JOIN seguimientos s ON s.id = sf.seguimiento_id
       JOIN lesiones l ON l.id = s.lesion_id
       WHERE sf.id = ? AND l.paciente_id = ?`,
      [foto_id, paciente_id]
    );
    if (!foto || !foto.foto) {
      return { error: 'La foto de seguimiento no existe', status: 404 };
    }
    return {
      imagen: {
        buffer: foto.foto as Buffer,
        mime: (foto.mime as string) || 'image/jpeg',
        captura: {
          tipo: 'seguimiento_foto',
          foto_id: foto.foto_id,
          seguimiento_id: foto.seguimiento_id,
          lesion_id: foto.lesion_id,
          lesion: foto.lesion,
          zona: foto.zona,
          fecha: foto.fecha,
        },
      },
    };
  }

  return { error: "tipo debe ser 'lesion' o 'seguimiento_foto'", status: 400 };
}

async function embedImage(imagen: ImagenFuente): Promise<number[]> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(imagen.buffer)], { type: imagen.mime }), 'captura.jpg');

  const res = await fetch(`${FASTAPI_URL}/predict`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(FASTAPI_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Embedding service error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
    throw new Error('El servicio de embeddings no devolvió un vector válido');
  }
  return data.embedding;
}

async function queryPinecone(vector: number[]): Promise<any[]> {
  if (!PINECONE_HOST || !PINECONE_API_KEY) {
    throw new Error('Pinecone no está configurado (PINECONE_HOST / PINECONE_API_KEY)');
  }
  const res = await fetch(`https://${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vector,
      topK: PINECONE_TOP_K,
      includeMetadata: true,
      includeValues: false,
    }),
    signal: AbortSignal.timeout(PINECONE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Pinecone query error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  return data.matches || [];
}

// POST /api/similares/buscar — imagen del paciente → embedding → Pinecone top-K
router.post('/buscar', async (req, res) => {
  try {
    const resolved = resolverImagen(req.body);
    if ('error' in resolved) {
      return res.status(resolved.status).json({ error: resolved.error });
    }

    const vector = await embedImage(resolved.imagen);
    const matches = await queryPinecone(vector);

    // Enriquecer con metadata local de ham_images y URL de imagen servible
    const imageIds = matches.map((m: any) => m?.metadata?.image_id || m?.id).filter(Boolean);
    const placeholders = imageIds.map(() => '?').join(',');
    const hamRows = imageIds.length
      ? all(`SELECT * FROM ham_images WHERE image_id IN (${placeholders})`, imageIds)
      : [];
    const hamById = new Map(hamRows.map((r: any) => [r.image_id, r]));

    const resultados = matches.map((m: any) => {
      const meta = m?.metadata || {};
      const imageId = meta.image_id || m?.id;
      const ham = hamById.get(imageId);
      return {
        id: m?.id,
        score: typeof m?.score === 'number' ? m.score : null,
        image_id: imageId,
        lesion_id: meta.lesion_id || ham?.lesion_id || null,
        dx: meta.dx || ham?.dx || null,
        dx_type: meta.dx_type || ham?.dx_type || null,
        age: meta.age || ham?.age || null,
        sex: meta.sex || ham?.sex || null,
        localization: meta.localization || ham?.localization || null,
        prediccion_modelo: meta.Prediccion_de_modelo || null,
        image_url: imageId ? `/ham10000/${imageId}/image` : null,
      };
    });

    res.json({
      ok: true,
      index: PINECONE_INDEX,
      top_k: PINECONE_TOP_K,
      embedding_dim: vector.length,
      captura: resolved.imagen.captura,
      resultados,
    });
  } catch (err: any) {
    console.error('[similares] error:', err?.message || err);
    res.status(502).json({ error: err?.message || 'Error al buscar casos similares' });
  }
});

export default router;
