"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import {
  createBibleAudioStore,
  type BibleAudioStore,
} from "./bibleaudio.store";
import type { BibleAudioQueries } from "../queries/bibleaudio.queries";

const BibleAudioStoreContext = createContext<StoreApi<BibleAudioStore> | null>(
  null
);

export function BibleAudioStoreProvider({
  queries,
  children,
}: {
  queries: BibleAudioQueries;
  children: ReactNode;
}) {
  const [store] = useState(() => createBibleAudioStore(queries));
  return (
    <BibleAudioStoreContext.Provider value={store}>
      {children}
    </BibleAudioStoreContext.Provider>
  );
}

export function useBibleAudioStore(): BibleAudioStore;
export function useBibleAudioStore<T>(
  selector: (state: BibleAudioStore) => T
): T;
export function useBibleAudioStore<T>(
  selector?: (state: BibleAudioStore) => T
) {
  const store = useContext(BibleAudioStoreContext);
  if (!store) {
    throw new Error(
      "useBibleAudioStore must be used within a BibleAudioStoreProvider"
    );
  }
  return useStore(store, (selector ?? ((s) => s)) as (s: BibleAudioStore) => T);
}
