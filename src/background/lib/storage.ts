/* Utility wrappers around chrome.storage.local with Promise APIs, namespacing, and change listeners */

type Key = string;
type AnyRecord = Record<string, any>;
type StorageChanges = Record<string, chrome.storage.StorageChange>;

function getArea() {
  if (!chrome?.storage?.local) {
    throw new Error('chrome.storage.local is not available in this context');
  }
  return chrome.storage.local;
}

function withLastError<T>(resolve: (v: T) => void, reject: (e: Error) => void, value: T) {
  const err = (chrome.runtime as any)?.lastError as { message?: string } | undefined;
  if (err) {
    reject(new Error(err.message));
  } else {
    resolve(value);
  }
}

export async function get<T = any>(key: Key, defaultValue?: T): Promise<T | undefined> {
  const area = getArea();
  return new Promise<T | undefined>((resolve, reject) => {
    area.get({ [key]: defaultValue } as AnyRecord, (items) => {
      withLastError(resolve, reject, items?.[key] as T | undefined);
    });
  });
}

export async function set<T = any>(key: Key, value: T): Promise<void> {
  const area = getArea();
  return new Promise<void>((resolve, reject) => {
    area.set({ [key]: value } as AnyRecord, () => {
      withLastError(resolve, reject, undefined as unknown as void);
    });
  });
}

export async function getMany(keys: Key[]): Promise<AnyRecord> {
  const area = getArea();
  return new Promise<AnyRecord>((resolve, reject) => {
    area.get(keys, (items) => {
      withLastError(resolve, reject, items as AnyRecord);
    });
  });
}

export async function setMany(values: AnyRecord): Promise<void> {
  const area = getArea();
  return new Promise<void>((resolve, reject) => {
    area.set(values, () => {
      withLastError(resolve, reject, undefined as unknown as void);
    });
  });
}

export async function remove(keys: Key | Key[]): Promise<void> {
  const area = getArea();
  return new Promise<void>((resolve, reject) => {
    area.remove(keys as any, () => {
      withLastError(resolve, reject, undefined as unknown as void);
    });
  });
}

export async function clear(): Promise<void> {
  const area = getArea();
  return new Promise<void>((resolve, reject) => {
    area.clear(() => {
      withLastError(resolve, reject, undefined as unknown as void);
    });
  });
}

/**
 * Get all keys/values from storage.local
 * Note: chrome.storage.local.get(null, cb) returns the entire contents.
 */
export async function getAll(): Promise<AnyRecord> {
  const area = getArea();
  return new Promise<AnyRecord>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (area.get as any)(null, (items: AnyRecord) => {
      withLastError(resolve, reject, items);
    });
  });
}

/**
 * Subscribe to storage changes in the 'local' area.
 * Returns an unsubscribe function.
 */
export function watch(callback: (changes: StorageChanges) => void): () => void {
  const listener = (changes: StorageChanges, areaName: string) => {
    if (areaName === 'local') {
      callback(changes);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/**
 * Create a namespaced storage interface that prefixes all keys.
 */
export function withPrefix(prefix: string) {
  const p = (key: Key) => `${prefix}:${key}`;

  return {
    get: <T = any>(key: Key, def?: T) => get<T>(p(key), def),
    set: <T = any>(key: Key, value: T) => set<T>(p(key), value),
    getMany: (keys: Key[]) => getMany(keys.map(p)),
    setMany: (values: AnyRecord) => {
      const mapped: AnyRecord = {};
      for (const k of Object.keys(values)) mapped[p(k)] = values[k];
      return setMany(mapped);
    },
    remove: (keys: Key | Key[]) => remove(Array.isArray(keys) ? keys.map(p) : p(keys)),
    clear, // global clear (no prefix filtering)
    getAll, // global getAll (no prefix filtering)
    watch,  // same watch helper
  };
}

/**
 * Notion-specific storage interface
 */
export const notionStorage = withPrefix('notion');

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
  isConfigured: boolean;
}

/**
 * Notion configuration store
 */
export const notionConfigStore = createStore<NotionConfig>('notion:config', {
  apiKey: '',
  databaseId: '',
  isConfigured: false
});

/**
 * Tiny "store" helper bound to a single key with get/set/update.
 */
export function createStore<T = any>(key: Key, initial: T) {
  return {
    async get(): Promise<T> {
      const v = await get<T>(key, initial);
      return (v ?? initial) as T;
    },
    async set(value: T): Promise<void> {
      await set<T>(key, value);
    },
    async update(updater: (prev: T) => T | Promise<T>): Promise<T> {
      const prev = await this.get();
      const next = await updater(prev);
      await this.set(next);
      return next;
    },
  };
}