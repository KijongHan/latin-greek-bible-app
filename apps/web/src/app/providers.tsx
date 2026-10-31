"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BibleAudioStoreProvider,
  BibleQueriesProvider,
} from "@bible-app/domain";
import {
  indexedDbBibleAudioStorage,
  indexedDbBibleStorage,
} from "@bible-app/indexeddb";
import {
  firebaseAudioQueries,
  firebaseBibleQueries,
} from "@bible-app/firebase";
import { cryptoUuidProvider } from "@bible-app/providers";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <BibleQueriesProvider
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
      </BibleQueriesProvider>
    </QueryClientProvider>
  );
}
