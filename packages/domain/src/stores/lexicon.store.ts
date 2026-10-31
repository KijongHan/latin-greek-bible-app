import { createStore, StoreApi } from "zustand/vanilla";
import { AnyLexiconEntry } from "../types";
import { LexiconStorage } from "../storage/types";
import { LexiconQueries } from "../queries/types";

export interface LexiconStore {
  // Entries fetched so far, by id. Read one with a selector, eg
  // useLexiconStore((s) => s.entries[id]), so only its reader re-renders.
  entries: Record<string, AnyLexiconEntry>;
  // Ids being fetched
  loading: Record<string, true>;
  // Ids with no entry, so they aren't fetched again
  missing: Record<string, true>;

  // Fetches the entries for a token's lexiconEntryIds, eg when its word is
  // opened. Ids already fetched, being fetched or missing are skipped.
  loadEntries: (ids: string[]) => Promise<void>;
}

export const createLexiconStore = (
  queries: LexiconQueries,
  storage: LexiconStorage,
): StoreApi<LexiconStore> => {
  const loadOrFetchEntries = async (
    ids: string[],
  ): Promise<AnyLexiconEntry[]> => {
    const cached = await storage.loadLexiconEntries(ids);
    const cachedIds = new Set(cached.map((entry) => entry.id));
    const uncached = ids.filter((id) => !cachedIds.has(id));
    if (uncached.length === 0) return cached;
    const fetched = await queries.getLexiconEntries(uncached);
    await storage.saveLexiconEntries(fetched);
    return [...cached, ...fetched];
  };

  return createStore<LexiconStore>((set, get) => ({
    entries: {},
    loading: {},
    missing: {},

    loadEntries: async (ids) => {
      const { entries, loading, missing } = get();
      const toLoad = [...new Set(ids)].filter(
        (id) => !entries[id] && !loading[id] && !missing[id],
      );
      if (toLoad.length === 0) return;

      set({
        loading: {
          ...loading,
          ...Object.fromEntries(toLoad.map((id) => [id, true as const])),
        },
      });

      let loaded: AnyLexiconEntry[] = [];
      let fetched = false;
      try {
        loaded = await loadOrFetchEntries(toLoad);
        fetched = true;
      } finally {
        const loadedIds = new Set(loaded.map((entry) => entry.id));
        // Only after a fetch that succeeded, so a failed one can be retried
        const notFound = fetched ? toLoad.filter((id) => !loadedIds.has(id)) : [];
        const state = get();
        const stillLoading = { ...state.loading };
        for (const id of toLoad) delete stillLoading[id];
        set({
          loading: stillLoading,
          entries: {
            ...state.entries,
            ...Object.fromEntries(loaded.map((entry) => [entry.id, entry])),
          },
          missing: {
            ...state.missing,
            ...Object.fromEntries(notFound.map((id) => [id, true as const])),
          },
        });
      }
    },
  }));
};
