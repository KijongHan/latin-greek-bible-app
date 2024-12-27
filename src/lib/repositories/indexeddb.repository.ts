const DB_NAME = "appStorage";
const DB_VERSION = 1;
export const CHAPTERS_STORE = "chapters";
export const BOOKS_STORE = "books";

class IndexedDBRepository<T> {
  db: IDBDatabase | undefined;

  constructor() {
    if (typeof window === "undefined") return;
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      throw new Error("IndexedDB access denied");
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      const chapterStore = db.createObjectStore(CHAPTERS_STORE, {
        keyPath: "bibleChapterId",
      });
      chapterStore.createIndex("bookId", "bookId", { unique: false });
      chapterStore.createIndex("bibleId", "bibleId", { unique: false });

      const booksStore = db.createObjectStore(BOOKS_STORE, {
        keyPath: "bibleBookId",
      });
      booksStore.createIndex("bibleId", "bibleId", { unique: false });

      this.db = db;
    };
    request.onsuccess = () => {
      this.db = request.result;
    };
  }

  public save<T>(data: T, storeId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        console.error("IndexedDB not initialized");
        return resolve();
      }

      const transaction = this.db.transaction(storeId, "readwrite");
      const store = transaction.objectStore(storeId);
      const request = store.add(data);

      transaction.oncomplete = () => {
        console.log(`Saved to IndexedDB for ${data}`);
        resolve();
      };

      transaction.onerror = (event) => {
        console.error(`Error saving to IndexedDB for ${data}:`, event);
        reject(event);
      };

      request.onerror = (event) => {
        reject(event);
      };
    });
  }

  public load<T>(indexId: string, storeId: string): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve, reject) => {
      if (!this.db) {
        console.error("IndexedDB not initialized");
        return reject(undefined);
      }

      const transaction = this.db.transaction(storeId, "readonly");
      const store = transaction.objectStore(storeId);
      const request = store.get(indexId);

      request.onsuccess = () => {
        console.log(`Loaded from IndexedDB for ${indexId}`);
        resolve(request.result);
      };
      request.onerror = (event) => {
        console.error(`Error loading from IndexedDB for ${indexId}:`, event);
        reject(undefined);
      };
    });
  }
}

export const indexedDBRepository = new IndexedDBRepository();
