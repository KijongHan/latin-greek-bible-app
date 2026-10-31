"use client";
import type { ReactNode } from "react";
import {
  BibleAudioStoreProvider,
  BibleStoreProvider,
  LexiconStoreProvider,
} from "@bible-app/domain";
import {
  indexedDbBibleAudioStorage,
  indexedDbBibleStorage,
  indexedDbLexiconStorage,
} from "@bible-app/indexeddb";
import {
  firebaseAudioQueries,
  firebaseBibleQueries,
  firebaseLexiconQueries,
} from "@bible-app/firebase";
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
        <LexiconStoreProvider
          queries={firebaseLexiconQueries}
          storage={indexedDbLexiconStorage}
        >
          {children}
        </LexiconStoreProvider>
      </BibleAudioStoreProvider>
    </BibleStoreProvider>
  );
}
