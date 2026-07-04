"use client";
import type { ReactNode } from "react";
import {
  BibleAudioStoreProvider,
  BibleStoreProvider,
} from "@bible-app/domain";
import {
  indexedDbBibleAudioStorage,
  indexedDbBibleStorage,
} from "@bible-app/indexeddb";
import { firebaseAudioQueries, firebaseBibleQueries } from "@bible-app/firebase";
import { cryptoUuidProvider } from "@bible-app/providers";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BibleStoreProvider
      queries={firebaseBibleQueries}
      storage={indexedDbBibleStorage}
      uuidProvider={cryptoUuidProvider}
    >
      <BibleAudioStoreProvider
        queries={firebaseAudioQueries}
        storage={indexedDbBibleAudioStorage}
      >
        {children}
      </BibleAudioStoreProvider>
    </BibleStoreProvider>
  );
}
