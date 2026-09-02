const DB_NAME = "appStorage";
const DB_VERSION = 7;
export const CHAPTERS_STORE = "chapters";
export const BOOKS_STORE = "books";
export const VERSES_STORE = "verses";
export const CHAPTER_AUDIO_STORE = "chapterAudio";
export const SESSIONS_STORE = "sessions";

class IndexedDBRepository {
  db: IDBDatabase | undefined;

  constructor() {
    if (typeof window === "undefined") {
      console.error("window is undefined, IndexedDB not initialized");
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      throw new Error("IndexedDB access denied");
    };
    request.onupgradeneeded = () => {
      console.log("IndexedDB upgrading");
      const db = request.result;

      for (const store of [
        CHAPTERS_STORE,
        BOOKS_STORE,
        VERSES_STORE,
        CHAPTER_AUDIO_STORE,
        SESSIONS_STORE,
      ]) {
        if (db.objectStoreNames.contains(store)) db.deleteObjectStore(store);
      }

      const chapterStore = db.createObjectStore(CHAPTERS_STORE, {
        keyPath: "chapterRecordKey",
      });
      chapterStore.createIndex("bookId", "bookId", { unique: false });
      chapterStore.createIndex("bibleId", "bibleId", { unique: false });

      const booksStore = db.createObjectStore(BOOKS_STORE, {
        keyPath: "bookRecordKey",
      });
      booksStore.createIndex("bibleId", "bibleId", { unique: false });

      const versesStore = db.createObjectStore(VERSES_STORE, {
        keyPath: "verseRecordKey",
      });
      versesStore.createIndex("bibleId", "bibleId", { unique: false });
      versesStore.createIndex("chapterId", "chapterId", { unique: false });
      versesStore.createIndex("bibleChapterId", ["bibleId", "chapterId"], {
        unique: false,
      });

      const chapterAudioStore = db.createObjectStore(CHAPTER_AUDIO_STORE, {
        keyPath: "chapterRecordKey",
      });
      chapterAudioStore.createIndex("bibleId", "bibleId", { unique: false });
      chapterAudioStore.createIndex("chapterId", "chapterId", {
        unique: false,
      });

      const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
        keyPath: "sessionId",
      });
      sessionsStore.createIndex("sessionId", "sessionId", { unique: false });
      sessionsStore.createIndex("sessionDate", "sessionDate", {
        unique: false,
      });

      this.db = db;
    };
    request.onsuccess = () => {
      console.log("IndexedDB initialized");
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
      try {
        const request = store.add(data);
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        console.error(
          `Error saving to IndexedDB for ${JSON.stringify(data)}:`,
          error,
        );
        reject(error);
      }

      transaction.oncomplete = () => {
        console.log(`Saved to IndexedDB for ${JSON.stringify(data)}`);
        resolve();
      };

      transaction.onerror = (event) => {
        console.error(
          `Error saving to IndexedDB for ${JSON.stringify(data)}:`,
          event,
        );
        reject(event);
      };
    });
  }

  public update<T>(data: T, storeId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        console.error("IndexedDB not initialized");
        return resolve();
      }

      const transaction = this.db.transaction(storeId, "readwrite");
      const store = transaction.objectStore(storeId);
      const request = store.put(data);

      transaction.oncomplete = () => {
        console.log(`Updated in IndexedDB for ${JSON.stringify(data)}`);
        resolve();
      };
      transaction.onerror = (event) => {
        console.error(
          `Error updating in IndexedDB for ${JSON.stringify(data)}:`,
          event,
        );
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
        console.log(
          `Loaded from IndexedDB for ${indexId} ${JSON.stringify(request.result)}`,
        );
        resolve(request.result);
      };
      request.onerror = (event) => {
        console.error(
          `Error loading from IndexedDB for ${indexId} ${JSON.stringify(request.result)}:`,
          event,
        );
        reject(undefined);
      };
    });
  }

  public saveMany<T>(items: T[], storeId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        console.error("IndexedDB not initialized");
        return resolve();
      }
      if (items.length === 0) return resolve();

      const transaction = this.db.transaction(storeId, "readwrite");
      const store = transaction.objectStore(storeId);
      try {
        for (const item of items) {
          store.put(item);
        }
      } catch (error) {
        console.error(`Error saving batch to IndexedDB for ${storeId}:`, error);
        reject(error);
        return;
      }

      transaction.oncomplete = () => {
        console.log(
          `Saved ${items.length} items to IndexedDB for ${storeId} ${JSON.stringify(items)}`,
        );
        resolve();
      };

      transaction.onerror = (event) => {
        console.error(
          `Error saving batch to IndexedDB for ${storeId} ${JSON.stringify(items)}:`,
          event,
        );
        reject(event);
      };
    });
  }

  public loadAllByIndex<T>(
    storeId: string,
    indexName: string,
    indexValue: IDBValidKey | IDBKeyRange,
  ): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      if (!this.db) {
        console.error("IndexedDB not initialized");
        return reject(undefined);
      }

      const transaction = this.db.transaction(storeId, "readonly");
      const store = transaction.objectStore(storeId);
      const index = store.index(indexName);
      const request = index.getAll(indexValue);

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        console.error(
          `Error loading by index ${indexName} from IndexedDB for ${storeId}:`,
          event,
        );
        reject(undefined);
      };
    });
  }

  public loadAll<T>(storeId: string): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      if (!this.db) {
        console.error("IndexedDB not initialized");
        return reject(undefined);
      }

      const transaction = this.db.transaction(storeId, "readonly");
      const store = transaction.objectStore(storeId);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(`Loaded all from IndexedDB for ${storeId}`);
        resolve(request.result);
      };
      request.onerror = (event) => {
        console.error(
          `Error loading all from IndexedDB for ${storeId}:`,
          event,
        );
        reject(undefined);
      };
    });
  }
}

export const indexedDBRepository = new IndexedDBRepository();
