"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import { createLexiconStore, type LexiconStore } from "./lexicon.store";
import type { LexiconQueries } from "../queries/types";
import type { LexiconStorage } from "../storage/types";

const LexiconStoreContext = createContext<StoreApi<LexiconStore> | null>(null);

export function LexiconStoreProvider({
  queries,
  storage,
  children,
}: {
  queries: LexiconQueries;
  storage: LexiconStorage;
  children: ReactNode;
}) {
  const [store] = useState(() => createLexiconStore(queries, storage));
  return (
    <LexiconStoreContext.Provider value={store}>
      {children}
    </LexiconStoreContext.Provider>
  );
}

export function useLexiconStore(): LexiconStore;
export function useLexiconStore<T>(selector: (state: LexiconStore) => T): T;
export function useLexiconStore<T>(selector?: (state: LexiconStore) => T) {
  const store = useContext(LexiconStoreContext);
  if (!store) {
    throw new Error("useLexiconStore must be used within a LexiconStoreProvider");
  }
  return useStore(store, (selector ?? ((s) => s)) as (s: LexiconStore) => T);
}
