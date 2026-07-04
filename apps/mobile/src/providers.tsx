import type { ReactNode } from "react";
import {
  BibleAudioStoreProvider,
  BibleStoreProvider,
} from "@bible-app/domain";
import {
  firebaseBibleQueries,
  firebaseAudioQueries,
} from "@bible-app/firebase";
import {
  createMemoryBibleStorage,
  createMemoryBibleAudioStorage,
} from "@bible-app/memory";

const bibleStorage = createMemoryBibleStorage();
const bibleAudioStorage = createMemoryBibleAudioStorage();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BibleStoreProvider queries={firebaseBibleQueries} storage={bibleStorage}>
      <BibleAudioStoreProvider
        queries={firebaseAudioQueries}
        storage={bibleAudioStorage}
      >
        {children}
      </BibleAudioStoreProvider>
    </BibleStoreProvider>
  );
}
