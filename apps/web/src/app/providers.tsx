"use client";
import type { ReactNode } from "react";
import {
  BibleAudioStoreProvider,
  BibleStoreProvider,
} from "@bible-app/domain";
import {
  firebaseBibleAudioQueries,
  firebaseBibleQueries,
  indexedDbBibleAudioStorage,
  indexedDbBibleStorage,
} from "@bible-app/infrastructure";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BibleStoreProvider
      queries={firebaseBibleQueries}
      storage={indexedDbBibleStorage}
    >
      <BibleAudioStoreProvider
        queries={firebaseBibleAudioQueries}
        storage={indexedDbBibleAudioStorage}
      >
        {children}
      </BibleAudioStoreProvider>
    </BibleStoreProvider>
  );
}
