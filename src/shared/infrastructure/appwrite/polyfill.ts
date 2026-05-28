const store: Record<string, string> = {};

class MemoryStorage {
  getItem(key: string): string | null {
    return store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    store[key] = value;
  }

  removeItem(key: string): void {
    delete store[key];
  }
}

declare const window: any;
if (typeof window === "undefined") {
  (globalThis as any).window = {};
}
window.localStorage = new MemoryStorage();
