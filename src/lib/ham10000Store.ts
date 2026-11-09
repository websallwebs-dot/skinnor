const DB_NAME = 'skinnor_ham10000';
const DB_VERSION = 1;

export type HamImage = {
  image_id: string;
  lesion_id: string;
  dx: string;
  dx_type: string;
  age: string;
  sex: string;
  localization: string;
  imagePath: string;
  part: 1 | 2;
};

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
      if (!db.objectStoreNames.contains('hamImages')) {
        const store = db.createObjectStore('hamImages', { keyPath: 'image_id' });
        store.createIndex('lesion_id', 'lesion_id', { unique: false });
        store.createIndex('dx', 'dx', { unique: false });
        store.createIndex('sex', 'sex', { unique: false });
        store.createIndex('localization', 'localization', { unique: false });
      }
    };
  });
}

function transact<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => T): Promise<T> {
  return openDb().then((db) => {
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction('hamImages', mode);
      const store = tx.objectStore('hamImages');
      const result = work(store);
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve(result);
    });
  });
}

export const ham10000Store = {
  addImage(image: HamImage): Promise<void> {
    return transact('readwrite', (store) => {
      store.add(image);
    });
  },

  addImages(images: HamImage[]): Promise<void> {
    return transact('readwrite', (store) => {
      for (const img of images) {
        store.add(img);
      }
    });
  },

  getAllImages(): Promise<HamImage[]> {
    return transact('readonly', (store) => {
      const req = store.getAll();
      return req;
    }).then((req) => req.result as HamImage[]);
  },

  getImage(image_id: string): Promise<HamImage | undefined> {
    return transact('readonly', (store) => {
      const req = store.get(image_id);
      return req;
    }).then((req) => req.result as HamImage | undefined);
  },

  searchByDx(dx: string): Promise<HamImage[]> {
    return transact('readonly', (store) => {
      const index = store.index('dx');
      const req = index.getAll(IDBKeyRange.only(dx));
      return req;
    }).then((req) => req.result as HamImage[]);
  },

  searchByText(query: string): Promise<HamImage[]> {
    return transact('readonly', (store) => {
      const all = store.getAll();
      return all;
    }).then((req) => {
      const q = query.toLowerCase();
      return (req.result as HamImage[]).filter(
        (img) =>
          img.lesion_id.toLowerCase().includes(q) ||
          img.image_id.toLowerCase().includes(q) ||
          img.dx.toLowerCase().includes(q) ||
          img.localization.toLowerCase().includes(q) ||
          img.sex.toLowerCase().includes(q)
      );
    });
  },

  clearAll(): Promise<void> {
    return transact('readwrite', (store) => {
      store.clear();
    });
  },

  count(): Promise<number> {
    return transact('readonly', (store) => {
      const req = store.count();
      return req;
    }).then((req) => req.result as number);
  },
};
