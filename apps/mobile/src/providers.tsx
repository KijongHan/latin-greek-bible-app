import type { ReactNode } from "react";
import {
  BibleAudioStoreProvider,
  BibleStoreProvider,
  LexiconStoreProvider,
} from "@bible-app/domain";
import {
  firebaseBibleQueries,
  firebaseAudioQueries,
  firebaseLexiconQueries,
} from "@bible-app/firebase";
import {
  createMemoryBibleStorage,
  createMemoryBibleAudioStorage,
  createMemoryLexiconStorage,
} from "@bible-app/memory";
import { simpleUuidProvider } from "@bible-app/providers";

const bibleStorage = createMemoryBibleStorage();
const bibleAudioStorage = createMemoryBibleAudioStorage();
const lexiconStorage = createMemoryLexiconStorage();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BibleStoreProvider queries={firebaseBibleQueries} storage={bibleStorage} uuidProvider={simpleUuidProvider}>
      <BibleAudioStoreProvider
        queries={firebaseAudioQueries}
        storage={bibleAudioStorage}
      >
        <LexiconStoreProvider
          queries={firebaseLexiconQueries}
          storage={lexiconStorage}
        >
          {children}
        </LexiconStoreProvider>
      </BibleAudioStoreProvider>
    </BibleStoreProvider>
  );
}
