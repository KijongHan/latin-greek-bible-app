"use client";
import type { ReactNode } from "react";
import {
  BibleAudioStoreProvider,
  BibleStoreProvider,
} from "@bible-app/domain";
import {
  firebaseBibleAudioQueries,
  firebaseBibleQueries,
} from "@bible-app/infrastructure";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BibleStoreProvider queries={firebaseBibleQueries}>
      <BibleAudioStoreProvider queries={firebaseBibleAudioQueries}>
        {children}
      </BibleAudioStoreProvider>
    </BibleStoreProvider>
  );
}
