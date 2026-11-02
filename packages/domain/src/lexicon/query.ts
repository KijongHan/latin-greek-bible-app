import type { UseQueryOptions } from "@tanstack/react-query";
import { LexiconQueries, LexiconStorage } from "./ports";
import { AnyLexiconEntry } from "./types";

export const lexiconEntryQueryKey = (id: string) => ["lexiconEntry", id] as const;

// TanStack Query options for one lexicon entry, eg for a token's
// lexiconEntryIds: useQueries({ queries: ids.map(lexiconEntryQuery) }).
// Only types are imported from TanStack, so each app's own copy runs the
// queries. The data is null when there is no entry for the id.
export const createLexiconEntryQuery = (
  queries: LexiconQueries,
  // Persistent cache, eg IndexedDB; TanStack's own cache covers the session
  storage?: LexiconStorage,
) => {
  const loadOrFetchEntry = async (id: string): Promise<AnyLexiconEntry | null> => {
    const [cached] = (await storage?.loadLexiconEntries([id])) ?? [];
    if (cached) return cached;
    const [fetched] = await queries.getLexiconEntries([id]);
    if (!fetched) return null;
    await storage?.saveLexiconEntries([fetched]);
    return fetched;
  };

  return (id: string) =>
    ({
      queryKey: lexiconEntryQueryKey(id),
      queryFn: () => loadOrFetchEntry(id),
      // Lexicons only change on re-upload, so keep entries for the session
      staleTime: Infinity,
      gcTime: Infinity,
    }) satisfies UseQueryOptions<AnyLexiconEntry | null>;
};
