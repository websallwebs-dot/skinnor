import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { run as dbRun, get as dbGet } from './db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = 'C:\\Users\\munoz\\Downloads\\HAM10000\\HAM10000_metadata.csv';

async function importHam10000() {
  console.log('Leyendo CSV:', csvPath);
  const text = fs.readFileSync(csvPath, 'utf-8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length === 0) {
    console.error('CSV vacío');
    process.exit(1);
  }

  const header = lines[0].split(',').map((h) => h.trim());
  console.log('Columnas:', header);

  // Verificar que la tabla existe
  const tableExists = dbGet(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = 'ham_images'"
  );
  if (!tableExists) {
    console.error('La tabla ham_images no existe. Ejecuta primero la migración.');
    process.exit(1);
  }

  // Contar existentes
  const existing = dbGet('SELECT COUNT(*) as total FROM ham_images') as { total: number };
  if (existing.total > 0) {
    console.log(`La tabla ya tiene ${existing.total} filas. Saltando importación.`);
    process.exit(0);
  }

  let inserted = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const r: Record<string, string> = {};
    header.forEach((h, idx) => {
      r[h] = values[idx]?.trim() ?? '';
    });

    const image_id = r.image_id;
    if (!image_id) {
      skipped++;
      continue;
    }

    // Determinar en qué parte está la imagen (part_1 o part_2)
    let part = 1;
    const p1 = path.join('C:\\Users\\munoz\\Downloads\\HAM10000\\HAM10000_images_part_1', `${image_id}.jpg`);
    const p2 = path.join('C:\\Users\\munoz\\Downloads\\HAM10000\\HAM10000_images_part_2', `${image_id}.jpg`);
    if (fs.existsSync(p2)) part = 2;

    const image_path = `HAM10000_images_part_${part}/${image_id}.jpg`;

    try {
      dbRun(
        `INSERT INTO ham_images (image_id, lesion_id, dx, dx_type, age, sex, localization, image_path, part)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [image_id, r.lesion_id, r.dx, r.dx_type, r.age, r.sex, r.localization, image_path, part]
      );
      inserted++;
    } catch (err: any) {
      skipped++;
      if (skipped <= 5) {
        console.warn(`Saltando ${image_id}: ${err.message}`);
      }
    }

    if (inserted % 1000 === 0) {
      console.log(`Importadas ${inserted} filas...`);
    }
  }

  console.log(`\nCompletado: ${inserted} insertadas, ${skipped} saltadas de ${lines.length - 1} filas de datos`);
}

importHam10000().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
