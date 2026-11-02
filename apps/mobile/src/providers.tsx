import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BibleAudioStoreProvider,
  ReaderProvider,
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
      <ReaderProvider queries={firebaseBibleQueries} storage={bibleStorage} uuidProvider={simpleUuidProvider}>
        <BibleAudioStoreProvider
          queries={firebaseAudioQueries}
          storage={bibleAudioStorage}
        >
          {children}
        </BibleAudioStoreProvider>
      </ReaderProvider>
    </QueryClientProvider>
  );
}
