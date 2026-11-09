const DB_NAME = 'skinnor';
const DB_VERSION = 1;

export type Lesion = {
  id: number;
  nombre: string;
  zona: string;
  ubicacion: string;
  tamaño: string;
  colores: string[];
  sintomas: string[];
  creadoEn: string;
  fotoBase: Blob;
};

export type LesionInput = Omit<Lesion, 'id'>;

export type Seguimiento = {
  id: number;
  lesionId: number;
  fecha: string;
  cambios: 'si' | 'no';
  color: 'si' | 'no';
  sintomas: 'si' | 'no';
  notas: string;
  foto: Blob;
};

export type SeguimientoInput = Omit<Seguimiento, 'id'>;

let dbInstance: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('lesiones')) {
        const store = db.createObjectStore('lesiones', { keyPath: 'id', autoIncrement: true });
        store.createIndex('creadoEn', 'creadoEn', { unique: false });
      }
      if (!db.objectStoreNames.contains('seguimientos')) {
        const store = db.createObjectStore('seguimientos', { keyPath: 'id', autoIncrement: true });
        store.createIndex('lesionId', 'lesionId', { unique: false });
      }
    };
  });
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function transact<T>(storeNames: string | string[], mode: IDBTransactionMode, work: (stores: { lesiones?: IDBObjectStore; seguimientos?: IDBObjectStore }) => T): Promise<T> {
  return openDb().then((db) => {
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(storeNames, mode);
      const stores: { lesiones?: IDBObjectStore; seguimientos?: IDBObjectStore } = {};
      if (typeof storeNames === 'string') {
        stores[storeNames as 'lesiones'] = tx.objectStore(storeNames as 'lesiones');
      } else {
        if (storeNames.includes('lesiones')) stores.lesiones = tx.objectStore('lesiones');
        if (storeNames.includes('seguimientos')) stores.seguimientos = tx.objectStore('seguimientos');
      }
      const result = work(stores);
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve(result);
    });
  });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

export const photoStore = {
  addLesion(input: LesionInput): Promise<number> {
    return transact('lesiones', 'readwrite', ({ lesiones }) => {
      const req = lesiones!.add(input);
      return req;
    }).then((req) => req.result as number);
  },

  getLesions(): Promise<Lesion[]> {
    return transact('lesiones', 'readonly', ({ lesiones }) => {
      const req = lesiones!.getAll();
      return req;
    }).then((req) => req.result as Lesion[]);
  },

  getLesion(id: number): Promise<Lesion | undefined> {
    return transact('lesiones', 'readonly', ({ lesiones }) => {
      const req = lesiones!.get(id);
      return req;
    }).then((req) => req.result as Lesion | undefined);
  },

  updateLesion(id: number, patch: Partial<LesionInput>): Promise<void> {
    return this.getLesion(id).then((existing) => {
      if (!existing) return Promise.reject(new Error('Lesión no encontrada'));
      return transact('lesiones', 'readwrite', ({ lesiones }) => {
        const req = lesiones!.put({ ...existing, ...patch });
        return req;
      }).then(() => undefined);
    });
  },

  deleteLesion(id: number): Promise<void> {
    return transact(['lesiones', 'seguimientos'], 'readwrite', ({ lesiones, seguimientos }) => {
      lesiones!.delete(id);
      if (seguimientos) {
        const index = seguimientos.index('lesionId');
        const req = index.getAll(id);
        return req;
      }
      return undefined;
    }).then((result) => {
      if (Array.isArray(result)) {
        return transact('seguimientos', 'readwrite', ({ seguimientos }) => {
          for (const row of result) {
            seguimientos!.delete(row.id);
          }
        });
      }
    });
  },

  addSeguimiento(input: SeguimientoInput): Promise<number> {
    return transact('seguimientos', 'readwrite', ({ seguimientos }) => {
      const req = seguimientos!.add(input);
      return req;
    }).then((req) => req.result as number);
  },

  getSeguimientos(lesionId: number): Promise<Seguimiento[]> {
    return transact('seguimientos', 'readonly', ({ seguimientos }) => {
      const index = seguimientos!.index('lesionId');
      const req = index.getAll(lesionId);
      return req;
    }).then((req) => req.result as Seguimiento[]);
  },

  deleteSeguimiento(id: number): Promise<void> {
    return transact('seguimientos', 'readwrite', ({ seguimientos }) => {
      seguimientos!.delete(id);
    });
  },

  clearAll(): Promise<void> {
    return transact(['lesiones', 'seguimientos'], 'readwrite', ({ lesiones, seguimientos }) => {
      lesiones!.clear();
      seguimientos!.clear();
    });
  },

  async exportData(): Promise<string> {
    const lesiones = await this.getLesions();
    const allSeguimientos: Seguimiento[] = [];
    for (const lesion of lesiones) {
      const segs = await this.getSeguimientos(lesion.id);
      allSeguimientos.push(...segs);
    }
    const rows = lesiones.map((l) => ({ ...l, fotoBase: l.fotoBase }));
    const serialized: Array<Record<string, unknown>> = [];
    for (const row of rows) {
      const copy: Record<string, unknown> = { ...row };
      copy.fotoBase = await blobToDataURL(row.fotoBase);
      serialized.push(copy);
    }
    const segSerialized: Array<Record<string, unknown>> = [];
    for (const row of allSeguimientos) {
      const copy: Record<string, unknown> = { ...row };
      copy.foto = await blobToDataURL(row.foto);
      segSerialized.push(copy);
    }
    return JSON.stringify({ lesiones: serialized, seguimientos: segSerialized, exportedAt: new Date().toISOString() });
  },

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    await this.clearAll();
    if (data.lesiones) {
      for (const row of data.lesiones) {
        const input: LesionInput = {
          nombre: row.nombre as string,
          zona: row.zona as string,
          ubicacion: row.ubicacion as string,
          tamaño: row.tamaño as string,
          colores: row.colores as string[],
          sintomas: row.sintomas as string[],
          creadoEn: row.creadoEn as string,
          fotoBase: dataURLtoBlob(row.fotoBase as string),
        };
        await this.addLesion(input);
      }
    }
    if (data.seguimientos) {
      for (const row of data.seguimientos) {
        const input: SeguimientoInput = {
          lesionId: row.lesionId as number,
          fecha: row.fecha as string,
          cambios: row.cambios as 'si' | 'no',
          color: row.color as 'si' | 'no',
          sintomas: row.sintomas as 'si' | 'no',
          notas: row.notas as string,
          foto: dataURLtoBlob(row.foto as string),
        };
        await this.addSeguimiento(input);
      }
    }
  },
};
