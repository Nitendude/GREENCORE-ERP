const DB_NAME = 'greencore-erp-files';
const STORE_NAME = 'cad-pdfs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const storageKey = (id: string, version?: string) => version ? `${id}::${version}` : id;

export async function saveCadPdf(id: string, file: File, version?: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(file, storageKey(id, version));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function loadByKey(db: IDBDatabase, key: string): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error);
  });
}

export async function loadCadPdf(id: string, version?: string): Promise<Blob | null> {
  const db = await openDB();
  // Fall back to the legacy unversioned key for PDFs uploaded before revision tracking was added.
  const result = version ? await loadByKey(db, storageKey(id, version)) ?? await loadByKey(db, id) : await loadByKey(db, id);
  db.close();
  return result;
}
