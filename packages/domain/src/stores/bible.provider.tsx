"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import { createBibleStore, type BibleStore } from "./bible.store";
import type { BibleQueries } from "../queries/types";
import type { BibleStorage } from "../storage/types";
import type { UuidProvider } from "../providers/types";

const BibleStoreContext = createContext<StoreApi<BibleStore> | null>(null);

export function BibleStoreProvider({
  queries,
  storage,
  uuidProvider,
  children,
}: {
  queries: BibleQueries;
  storage: BibleStorage;
  uuidProvider: UuidProvider;
  children: ReactNode;
}) {
  const [store] = useState(() => createBibleStore(queries, storage, uuidProvider));
  return (
    <BibleStoreContext.Provider value={store}>
      {children}
    </BibleStoreContext.Provider>
  );
}

export function useBibleStore(): BibleStore;
export function useBibleStore<T>(selector: (state: BibleStore) => T): T;
export function useBibleStore<T>(selector?: (state: BibleStore) => T) {
  const store = useContext(BibleStoreContext);
  if (!store) {
    throw new Error("useBibleStore must be used within a BibleStoreProvider");
  }
  return useStore(store, (selector ?? ((s) => s)) as (s: BibleStore) => T);
}
