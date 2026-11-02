"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { createBiblesQuery } from "../bible/query";
import { createBookQuery } from "../books/query";
import { createChapterQuery, createVersesQuery } from "../chapters/query";
import type { BibleQueries, BibleStorage } from "../bible/ports";
import { createSessionsQuery } from "../sessions/query";
import type { Session } from "../sessions/types";
import type { UuidProvider } from "../shared/providers";

const createReaderDeps = (
  queries: BibleQueries,
  storage: BibleStorage,
  uuidProvider: UuidProvider,
) => ({
  biblesQuery: createBiblesQuery(queries),
  bookQuery: createBookQuery(queries, storage),
  chapterQuery: createChapterQuery(queries, storage),
  versesQuery: createVersesQuery(queries, storage),
  sessionsQuery: createSessionsQuery(storage),
  saveSession: (session: Session) => storage.saveSession(session),
  newSessionId: () => uuidProvider.generateUuid(),
});

export type ReaderDeps = ReturnType<typeof createReaderDeps>;

const ReaderContext = createContext<ReaderDeps | null>(null);

// Gives the reader hooks their dependencies: query options and session saving,
// bound to the app's queries, storage and uuid provider. Needs a QueryClientProvider above it.
export function ReaderProvider({
  queries,
  storage,
  uuidProvider,
  children,
}: {
  queries: BibleQueries;
  storage: BibleStorage;
  uuidProvider: UuidProvider;
  children: ReactNode;
}) {
  const [deps] = useState(() =>
    createReaderDeps(queries, storage, uuidProvider),
  );
  return (
    <ReaderContext.Provider value={deps}>{children}</ReaderContext.Provider>
  );
}

export function useReaderDeps(): ReaderDeps {
  const deps = useContext(ReaderContext);
  if (!deps) {
    throw new Error("useReaderDeps must be used within a ReaderProvider");
  }
  return deps;
}
