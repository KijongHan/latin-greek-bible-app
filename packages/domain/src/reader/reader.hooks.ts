import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { sessionsQueryKey } from "../queries/sessions.query";
import { Bible, BibleSource, Session } from "../types";
import { useBibleQueryOptions } from "./bible.queries.provider";
import {
  adjacentChapter,
  buildPresets,
  defaultBiblePair,
  pickBiblePair,
  sharedBooks,
} from "./reader.helpers";
import { useReaderStore } from "./reader.store";

export function useBibles() {
  const { biblesQuery } = useBibleQueryOptions();
  const { data, isLoading } = useQuery(biblesQuery());
  const bibles = useMemo(() => data ?? [], [data]);
  const presets = useMemo(() => buildPresets(bibles), [bibles]);
  return { bibles, presets, isLoading };
}

// The only place the reader hooks learn what is being read. Bibles not yet
// chosen fall back to the first preset.
export function useReaderIds() {
  const { bibles } = useBibles();
  const { mainBibleId, glossBibleId, chapterId, showGlossText } =
    useReaderStore(
      useShallow((s) => ({
        mainBibleId: s.mainBibleId,
        glossBibleId: s.glossBibleId,
        chapterId: s.chapterId,
        showGlossText: s.showGlossText,
      })),
    );
  const defaults = useMemo(() => defaultBiblePair(bibles), [bibles]);
  return {
    mainBibleId: mainBibleId ?? defaults.mainBible?.id,
    glossBibleId: glossBibleId ?? defaults.glossBible?.id,
    chapterId,
    showGlossText,
  };
}

// One side of the reader: its bible, and the selected chapter's book,
// chapter and verses. undefined until the bibles have loaded.
function useBibleSource(
  bibles: Bible[],
  bibleId: string | undefined,
  chapterId: string | undefined,
) {
  const { bookQuery, chapterQuery, versesQuery } = useBibleQueryOptions();
  const bookId = chapterId?.split(".")[0];
  const enabled = !!bibleId && !!chapterId;
  const book = useQuery({
    ...bookQuery(bibleId ?? "", bookId ?? ""),
    enabled,
  });
  const chapter = useQuery({
    ...chapterQuery(bibleId ?? "", chapterId ?? ""),
    enabled,
  });
  const verses = useQuery({
    ...versesQuery(bibleId ?? "", chapterId ?? ""),
    enabled,
  });

  const bible = bibles.find((b) => b.id === bibleId);
  const source = useMemo<BibleSource | undefined>(
    () =>
      bible
        ? {
            bible,
            book: enabled ? book.data : undefined,
            chapter: enabled ? chapter.data : undefined,
            verses: enabled ? verses.data : undefined,
          }
        : undefined,
    [bible, enabled, book.data, chapter.data, verses.data],
  );
  return {
    source,
    isLoading: book.isLoading || chapter.isLoading || verses.isLoading,
  };
}

// The main and gloss sides, in the BibleSource shape the components use
export function useBibleSources() {
  const { mainBibleId, glossBibleId, chapterId } = useReaderIds();
  const { bibles } = useBibles();
  const main = useBibleSource(bibles, mainBibleId, chapterId);
  const gloss = useBibleSource(bibles, glossBibleId, chapterId);
  return {
    mainSource: main.source,
    glossSource: gloss.source,
    isLoading: main.isLoading || gloss.isLoading,
  };
}

// Books in both selected bibles
export function useSharedBooks(): string[] {
  const { mainBibleId, glossBibleId } = useReaderIds();
  const { bibles } = useBibles();
  return useMemo(
    () =>
      sharedBooks(
        bibles.find((bible) => bible.id === mainBibleId),
        bibles.find((bible) => bible.id === glossBibleId),
      ),
    [bibles, mainBibleId, glossBibleId],
  );
}

// The session being read now, and the most recent earlier one
export function useSessions() {
  const { sessionsQuery } = useBibleQueryOptions();
  const currentSession = useReaderStore((s) => s.currentSession);
  const { data } = useQuery(sessionsQuery());
  const lastSessions = useMemo(
    () =>
      (data ?? [])
        .filter((session) => session.sessionId !== currentSession?.sessionId)
        .slice(0, 1),
    [data, currentSession?.sessionId],
  );
  return { currentSession, lastSessions };
}

// Reader actions. Each one loads what the next chapter needs through the
// shared QueryClient, then changes the ids, so the pages render from cache.
export function useReaderNavigation() {
  const queryClient = useQueryClient();
  const { bookQuery, chapterQuery, versesQuery, saveSession, newSessionId } =
    useBibleQueryOptions();
  const { bibles, isLoading: isLoadingBibles } = useBibles();
  const { mainBibleId, glossBibleId, chapterId } = useReaderIds();
  const books = useSharedBooks();
  const store = useReaderStore(
    useShallow((s) => ({
      isNavigating: s.isNavigating,
      setBibles: s.setBibles,
      setChapter: s.setChapter,
      setShowGlossText: s.setShowGlossText,
      setIsNavigating: s.setIsNavigating,
      setCurrentSession: s.setCurrentSession,
    })),
  );

  const { mutate: recordVisit } = useMutation({
    mutationFn: saveSession,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey }),
  });

  const loadBook = useCallback(
    (bibleId: string, bookId: string) =>
      queryClient.query(bookQuery(bibleId, bookId)),
    [queryClient, bookQuery],
  );

  const openChapter = useCallback(
    async (nextChapterId: string) => {
      if (!mainBibleId || !glossBibleId) return;
      const bookId = nextChapterId.split(".")[0];
      store.setIsNavigating(true);
      try {
        await Promise.all(
          [mainBibleId, glossBibleId].flatMap((bibleId) => [
            loadBook(bibleId, bookId),
            queryClient.query(chapterQuery(bibleId, nextChapterId)),
            queryClient.query(versesQuery(bibleId, nextChapterId)),
          ]),
        );
        store.setChapter(nextChapterId);

        const visit = (bibleId: string) => ({
          bibleId,
          bibleName: bibles.find((b) => b.id === bibleId)?.name ?? "",
          bookId,
          chapterId: nextChapterId,
        });
        const current = useReaderStore.getState().currentSession;
        const session: Session = {
          ...(current ?? {
            sessionId: newSessionId(),
            sessionDate: new Date().toISOString(),
            visits: [],
          }),
          visits: [
            ...(current?.visits ?? []),
            {
              visitedAt: new Date().toISOString(),
              main: visit(mainBibleId),
              gloss: visit(glossBibleId),
            },
          ],
        };
        store.setCurrentSession(session);
        recordVisit(session);
      } finally {
        store.setIsNavigating(false);
      }
    },
    [
      mainBibleId,
      glossBibleId,
      bibles,
      store,
      loadBook,
      queryClient,
      chapterQuery,
      versesQuery,
      newSessionId,
      recordVisit,
    ],
  );

  const openBook = useCallback(
    async (bookId: string) => {
      if (!mainBibleId) return;
      const book = await loadBook(mainBibleId, bookId);
      await openChapter(book.chapters[0]);
    },
    [mainBibleId, loadBook, openChapter],
  );

  const step = useCallback(
    async (direction: "next" | "previous") => {
      if (!mainBibleId) return;
      const mainBible = bibles.find((b) => b.id === mainBibleId);
      if (!chapterId) {
        if (mainBible?.books[0]) await openBook(mainBible.books[0]);
        return;
      }
      const book = await loadBook(mainBibleId, chapterId.split(".")[0]);
      const chapterNumber = Number(chapterId.split(".")[1]);
      const target = adjacentChapter(book, chapterNumber, books, direction);
      if (target.type === "home") {
        store.setChapter(undefined);
      } else if (target.type === "lastChapterOf") {
        const previousBook = await loadBook(mainBibleId, target.bookId);
        await openChapter(`${target.bookId}.${previousBook.chapters.length}`);
      } else {
        await openChapter(target.chapterId);
      }
    },
    [
      mainBibleId,
      bibles,
      chapterId,
      books,
      store,
      loadBook,
      openBook,
      openChapter,
    ],
  );

  const setBible = useCallback(
    (side: "main" | "gloss", bibleId: string) => {
      const pair = pickBiblePair(bibles, side, bibleId, {
        mainBible: bibles.find((b) => b.id === mainBibleId),
        glossBible: bibles.find((b) => b.id === glossBibleId),
      });
      store.setBibles(pair.mainBible?.id, pair.glossBible?.id);
    },
    [bibles, mainBibleId, glossBibleId, store],
  );

  return {
    openBook,
    openChapter,
    next: useCallback(() => step("next"), [step]),
    previous: useCallback(() => step("previous"), [step]),
    home: useCallback(() => store.setChapter(undefined), [store]),
    setMainBible: useCallback(
      (bibleId: string) => setBible("main", bibleId),
      [setBible],
    ),
    setGlossBible: useCallback(
      (bibleId: string) => setBible("gloss", bibleId),
      [setBible],
    ),
    setShowGlossText: store.setShowGlossText,
    // Also true while the bibles first load, for the startup spinner
    isNavigating: store.isNavigating || isLoadingBibles,
  };
}
