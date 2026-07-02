"use client";
import type { ReactNode } from "react";
import {
  BibleAudioStoreProvider,
  BibleStoreProvider,
} from "@bible-app/domain";
import { firebaseBibleQueries } from "./bible/bible.queries";
import { firebaseBibleAudioQueries } from "./bible/bibleaudio.queries";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BibleStoreProvider queries={firebaseBibleQueries}>
      <BibleAudioStoreProvider queries={firebaseBibleAudioQueries}>
        {children}
      </BibleAudioStoreProvider>
    </BibleStoreProvider>
  );
}
