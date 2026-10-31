import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BibleAudioStoreProvider,
  BibleQueriesProvider,
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
import { simpleUuidProvider } from "@bible-app/providers";

const bibleStorage = createMemoryBibleStorage();
const bibleAudioStorage = createMemoryBibleAudioStorage();

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <BibleQueriesProvider queries={firebaseBibleQueries} storage={bibleStorage}>
        <BibleStoreProvider queries={firebaseBibleQueries} storage={bibleStorage} uuidProvider={simpleUuidProvider} queryClient={queryClient}>
          <BibleAudioStoreProvider
            queries={firebaseAudioQueries}
            storage={bibleAudioStorage}
          >
            {children}
          </BibleAudioStoreProvider>
        </BibleStoreProvider>
      </BibleQueriesProvider>
    </QueryClientProvider>
  );
}
