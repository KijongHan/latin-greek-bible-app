"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import { createBibleStore, type BibleStore } from "./bible.store";
import type { BibleQueries } from "../queries/bible.queries";

const BibleStoreContext = createContext<StoreApi<BibleStore> | null>(null);

export function BibleStoreProvider({
  queries,
  children,
}: {
  queries: BibleQueries;
  children: ReactNode;
}) {
  const [store] = useState(() => createBibleStore(queries));
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
