"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { createBiblesQuery } from "../queries/bibles.query";
import { createBookQuery } from "../queries/books.query";
import {
  createChapterQuery,
  createVersesQuery,
} from "../queries/chapters.query";
import type { BibleQueries } from "../queries/types";
import type { BibleStorage } from "../storage/types";

const createBibleQueryOptions = (
  queries: BibleQueries,
  storage: BibleStorage,
) => ({
  biblesQuery: createBiblesQuery(queries),
  bookQuery: createBookQuery(queries, storage),
  chapterQuery: createChapterQuery(queries, storage),
  versesQuery: createVersesQuery(queries, storage),
});

export type BibleQueryOptions = ReturnType<typeof createBibleQueryOptions>;

const BibleQueriesContext = createContext<BibleQueryOptions | null>(null);

// Gives the reader hooks their query options, bound to the app's queries and
// storage. Needs a QueryClientProvider above it.
export function BibleQueriesProvider({
  queries,
  storage,
  children,
}: {
  queries: BibleQueries;
  storage: BibleStorage;
  children: ReactNode;
}) {
  const [options] = useState(() => createBibleQueryOptions(queries, storage));
  return (
    <BibleQueriesContext.Provider value={options}>
      {children}
    </BibleQueriesContext.Provider>
  );
}

export function useBibleQueryOptions(): BibleQueryOptions {
  const options = useContext(BibleQueriesContext);
  if (!options) {
    throw new Error(
      "useBibleQueryOptions must be used within a BibleQueriesProvider",
    );
  }
  return options;
}
