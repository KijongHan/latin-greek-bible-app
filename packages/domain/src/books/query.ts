import type { UseQueryOptions } from "@tanstack/react-query";
import { biblesQueryKey } from "../bible/query";
import { BookQueries, BookStorage } from "./ports";
import { Book } from "./types";

export const bookQueryKey = (bibleId: string, bookId: string) =>
  [...biblesQueryKey, bibleId, "books", bookId] as const;

export const createBookQuery = (
  queries: BookQueries,
  // Persistent cache, eg IndexedDB; TanStack's own cache covers the session
  storage?: BookStorage,
) => {
  const loadOrFetchBook = async (
    bibleId: string,
    bookId: string,
  ): Promise<Book> => {
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
