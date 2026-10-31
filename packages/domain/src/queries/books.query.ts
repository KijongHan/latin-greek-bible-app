import type { UseQueryOptions } from "@tanstack/react-query";
import { Book } from "../types";
import { BibleStorage } from "../storage/types";
import { biblesQueryKey } from "./bibles.query";
import { BibleQueries } from "./types";

export const bookQueryKey = (bibleId: string, bookId: string) =>
  [...biblesQueryKey, bibleId, "books", bookId] as const;

export const createBookQuery = (
  queries: BibleQueries,
  // Persistent cache, eg IndexedDB; TanStack's own cache covers the session
  storage?: BibleStorage,
) => {
  const loadOrFetchBook = async (bibleId: string, bookId: string): Promise<Book> => {
    const cached = await storage?.loadBook(bibleId, bookId);
    if (cached) return cached;
    const fetched = await queries.getBook(bibleId, bookId);
    await storage?.saveBook(fetched);
    return fetched;
  };

  return (bibleId: string, bookId: string) =>
    ({
      queryKey: bookQueryKey(bibleId, bookId),
      queryFn: () => loadOrFetchBook(bibleId, bookId),
      staleTime: Infinity,
      gcTime: Infinity,
    }) satisfies UseQueryOptions<Book>;
};
