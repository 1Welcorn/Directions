
const DB_NAME = 'PolyglotMemoryDB';
const DB_VERSION = 1;
const STORE_ASSETS = 'assets';

export class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          db.createObjectStore(STORE_ASSETS, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject('Failed to open IndexedDB');
      };
    });
  }

  async setAsset(key: string, data: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ASSETS], 'readwrite');
      const store = transaction.objectStore(STORE_ASSETS);
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to store asset');
    });
  }

  async getAsset(key: string): Promise<string | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ASSETS], 'readonly');
      const store = transaction.objectStore(STORE_ASSETS);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };
      request.onerror = () => reject('Failed to retrieve asset');
    });
  }

  async clearAssets(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_ASSETS], 'readwrite');
      const store = transaction.objectStore(STORE_ASSETS);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to clear assets');
    });
  }
}

export const storage = new StorageService();
