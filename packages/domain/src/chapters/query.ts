import type { UseQueryOptions } from "@tanstack/react-query";
import { biblesQueryKey } from "../bible/query";
import { ChapterQueries, ChapterStorage } from "./ports";
import { Chapter, Verse } from "./types";

export const chapterQueryKey = (bibleId: string, chapterId: string) =>
  [...biblesQueryKey, bibleId, "chapters", chapterId] as const;

export const versesQueryKey = (bibleId: string, chapterId: string) =>
  [...chapterQueryKey(bibleId, chapterId), "verses"] as const;

export const createChapterQuery = (
  queries: ChapterQueries,
  // Persistent cache, eg IndexedDB; TanStack's own cache covers the session
  storage?: ChapterStorage,
) => {
  const loadOrFetchChapter = async (
    bibleId: string,
    chapterId: string,
  ): Promise<Chapter> => {
    const cached = await storage?.loadChapter(bibleId, chapterId);
    if (cached) return cached;
    const fetched = await queries.getChapter(bibleId, chapterId);
    await storage?.saveChapter(fetched);
    return fetched;
  };

  return (bibleId: string, chapterId: string) =>
    ({
      queryKey: chapterQueryKey(bibleId, chapterId),
      queryFn: () => loadOrFetchChapter(bibleId, chapterId),
      staleTime: Infinity,
      gcTime: Infinity,
    }) satisfies UseQueryOptions<Chapter>;
};

export const createVersesQuery = (
  queries: ChapterQueries,
  storage?: ChapterStorage,
) => {
  const loadOrFetchVerses = async (
    bibleId: string,
    chapterId: string,
  ): Promise<Verse[]> => {
    const cached = await storage?.loadVerses(bibleId, chapterId);
    if (cached) return cached;
    const fetched = await queries.getVerses(bibleId, chapterId);
    await storage?.saveVerses(fetched);
    return fetched;
  };

  return (bibleId: string, chapterId: string) =>
    ({
      queryKey: versesQueryKey(bibleId, chapterId),
      queryFn: () => loadOrFetchVerses(bibleId, chapterId),
      staleTime: Infinity,
      gcTime: Infinity,
    }) satisfies UseQueryOptions<Verse[]>;
};
