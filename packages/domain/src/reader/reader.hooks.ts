import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { useBibleStore } from "../stores/bible.provider";
import { Bible, BibleSource } from "../types";
import { useBibleQueryOptions } from "./bible.queries.provider";
import { buildPresets, sharedBooks } from "./reader.helpers";

// The only place the reader hooks learn what is being read. Until the old
// bible store is removed it reads the selection from that store; afterwards
// it will read the route.
export const useReaderIds = () =>
  useBibleStore(
    useShallow((s) => ({
      mainBibleId: s.mainSource?.bible?.id,
      glossBibleId: s.glossSource?.bible?.id,
      chapterId: s.mainSource?.chapter?.id,
      showGlossText: s.showGlossText,
    })),
  );

export function useBibles() {
  const { biblesQuery } = useBibleQueryOptions();
  const { data, isLoading } = useQuery(biblesQuery());
  const bibles = data ?? [];
  const presets = useMemo(() => buildPresets(data ?? []), [data]);
  return { bibles, presets, isLoading };
}

// One side of the reader: its bible, and the selected chapter's book,
// chapter and verses. undefined until a bible is selected.
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

  const source = useMemo<BibleSource | undefined>(
    () =>
      bibleId
        ? {
            bible: bibles.find((bible) => bible.id === bibleId),
            book: enabled ? book.data : undefined,
            chapter: enabled ? chapter.data : undefined,
            verses: enabled ? verses.data : undefined,
          }
        : undefined,
    [bibles, bibleId, enabled, book.data, chapter.data, verses.data],
  );
  return {
    source,
    isLoading: book.isLoading || chapter.isLoading || verses.isLoading,
  };
}

// The main and gloss sides, in the old store's BibleSource shape
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

// Reader actions. Until the old bible store is removed these call its
// actions, which fetch through the shared QueryClient before changing the
// selection; isNavigating is true meanwhile. Afterwards they will change
// the route instead.
export const useReaderNavigation = () =>
  useBibleStore(
    useShallow((s) => ({
      initialize: s.initialize,
      openBook: s.setBook,
      openChapter: s.setChapter,
      next: s.nextChapter,
      previous: s.previousChapter,
      home: s.clear,
      setMainBible: s.setMainBible,
      setGlossBible: s.setGlossBible,
      setShowGlossText: s.setShowGlossText,
      isNavigating: s.isLoading,
    })),
  );
