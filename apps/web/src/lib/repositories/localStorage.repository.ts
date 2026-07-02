export interface ILocalStorageRepository<T> {
  save(data: T): void;
  load(): T | null;
  remove(): void;
}

export class LocalStorageRepository<T> implements ILocalStorageRepository<T> {
  constructor(private readonly key: string) {}

  public save(data: T): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (error) {
      console.error(
        `Error saving to localStorage for key "${this.key}":`,
        error
      );
    }
  }

  public load(): T | null {
    if (typeof window === "undefined") return null;

    try {
      const item = localStorage.getItem(this.key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(
        `Error loading from localStorage for key "${this.key}":`,
        error
      );
      return null;
    }
  }

  public remove(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error(
        `Error removing from localStorage for key "${this.key}":`,
        error
      );
    }
  }
}
