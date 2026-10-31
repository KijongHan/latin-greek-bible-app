import type { QueryClient } from "@tanstack/react-query";
import { createStore, StoreApi } from "zustand/vanilla";
import { BibleQueries } from "../queries/types";
import { createBiblesQuery } from "../queries/bibles.query";
import { createBookQuery } from "../queries/books.query";
import {
  createChapterQuery,
  createVersesQuery,
} from "../queries/chapters.query";
import { BibleStorage } from "../storage/types";
import {
  Bible,
  BiblePreset,
  BibleSource,
  Book,
  Chapter,
  Session,
  Verse,
} from "../types";
import { UuidProvider } from "../providers/types";
import {
  adjacentChapter,
  buildPresets,
  pickBiblePair,
  sharedBooks,
} from "../reader/reader.helpers";

export interface BibleStore {
  currentSession: Session | undefined;
  lastSessions: Session[];

  isLoading: boolean;
  isLoadingSharedChapters: boolean;
  showGlossText: boolean;
  bibles: Bible[];
  presets: BiblePreset[];
  sharedChapters: Record<string, string[]>;
  sharedBooks: string[];
  mainSource: BibleSource | undefined;
  glossSource: BibleSource | undefined;

  initialize: () => Promise<void>;
  nextChapter: () => Promise<void>;
  previousChapter: () => Promise<void>;

  setMainBible: (bibleId: string) => void;
  setGlossBible: (bibleId: string) => void;
  setBook: (bookId: string) => Promise<void>;
  setChapter: (chapterId: string) => Promise<void>;
  setShowGlossText: (showGlossText: boolean) => void;
  clear: () => void;
}

type StoreGet = () => BibleStore;
type StoreSet = (state: Partial<BibleStore>) => void;

// Selects a bible for one side, keeping the two sides on different bibles
const setBiblePair = (
  get: StoreGet,
  set: StoreSet,
  side: "main" | "gloss",
  bibleId: string,
) => {
  const { mainBible, glossBible } = pickBiblePair(get().bibles, side, bibleId, {
    mainBible: get().mainSource?.bible,
    glossBible: get().glossSource?.bible,
  });
  set({
    sharedBooks: sharedBooks(mainBible, glossBible),
    glossSource: {
      ...get().glossSource,
      bible: glossBible,
    },
    mainSource: {
      ...get().mainSource,
      bible: mainBible,
    },
  });
};

// Data is fetched through TanStack Query, so it shares one cache with any
// component that queries the same bible, book or chapter
export const createBibleStore = (
  queries: BibleQueries,
  storage: BibleStorage,
  uuidProvider: UuidProvider,
  queryClient: QueryClient,
): StoreApi<BibleStore> => {
  const biblesQuery = createBiblesQuery(queries);
  const bookQuery = createBookQuery(queries, storage);
  const chapterQuery = createChapterQuery(queries, storage);
  const versesQuery = createVersesQuery(queries, storage);

  const loadOrFetchBook = (bibleId: string, bookId: string): Promise<Book> =>
    queryClient.query(bookQuery(bibleId, bookId));

  const loadOrFetchChapter = (
    bibleId: string,
    chapterId: string,
  ): Promise<Chapter> => queryClient.query(chapterQuery(bibleId, chapterId));

  const loadOrFetchVerses = (
    bibleId: string,
    chapterId: string,
  ): Promise<Verse[]> => queryClient.query(versesQuery(bibleId, chapterId));

  return createStore<BibleStore>((set, get) => ({
    currentSession: undefined,
    lastSessions: [],
    isLoading: true,
    isLoadingSharedChapters: false,
    showGlossText: true,
    bibles: [],
    presets: [],
    sharedChapters: {},
    sharedBooks: [],
    mainSource: undefined,
    glossSource: undefined,

    clear: () => {
      set({
        mainSource: {
          ...get().mainSource,
          book: undefined,
          chapter: undefined,
          verses: undefined,
        },
        glossSource: {
          ...get().glossSource,
          book: undefined,
          chapter: undefined,
          verses: undefined,
        },
      });
    },

    initialize: async () => {
      set({ isLoading: true });
      const bibles = await queryClient.query(biblesQuery());

      const presets = buildPresets(bibles);
      const mainBible =
        bibles.find((bible) => bible.id === presets[0].mainBibleId) ??
        bibles[0];
      const glossBible =
        bibles.find((bible) => bible.id === presets[0].glossBibleId) ??
        bibles[0];

      const shared = sharedBooks(mainBible, glossBible);

      set({
        currentSession: {
          sessionId: uuidProvider.generateUuid(),
          sessionDate: new Date().toISOString(),
          visits: [],
        },
        bibles,
        presets,
        mainSource: {
          bible: mainBible,
        },
        glossSource: {
          bible: glossBible,
        },
        sharedBooks: shared,
        isLoading: false,
      });

      set({ isLoadingSharedChapters: true });
      const books = await Promise.all(
        shared.map(async (book) => {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 1500),
          );
          return loadOrFetchBook(mainBible.id, book);
        }),
      );
      const sharedChapters = books.reduce(
        (acc, book) => {
          acc[book.id] = book.chapters;
          return acc;
        },
        {} as Record<string, string[]>,
      );
      const sessions = await storage.loadAllSessions();
      set({
        sharedChapters,
        isLoadingSharedChapters: false,
        lastSessions: sessions
          .sort(
            (a, b) =>
              new Date(b.sessionDate).getTime() -
              new Date(a.sessionDate).getTime(),
          )
          .slice(0, 1),
      });
    },

    nextChapter: async () => {
      set({ isLoading: true });
      if (!get().mainSource?.bible) {
        set({ isLoading: false });
        return;
      }
      if (!get().mainSource?.book) {
        get().setBook(get().mainSource?.bible?.books[0] ?? "");
        set({ isLoading: false });
        return;
      }

      const next = adjacentChapter(
        get().mainSource!.book!,
        get().mainSource?.chapter?.number ?? 0,
        get().sharedBooks ?? [],
        "next",
      );
      if (next.type === "chapter") await get().setChapter(next.chapterId);
      set({ isLoading: false });
    },

    previousChapter: async () => {
      set({ isLoading: true });
      if (!get().mainSource?.bible) {
        set({ isLoading: false });
        return;
      }
      if (!get().mainSource?.book) {
        get().setBook(get().mainSource?.bible?.books[0] ?? "");
        set({ isLoading: false });
        return;
      }

      const previous = adjacentChapter(
        get().mainSource!.book!,
        get().mainSource?.chapter?.number ?? 0,
        get().sharedBooks ?? [],
        "previous",
      );
      if (previous.type === "home") {
        set({
          mainSource: {
            ...get().mainSource,
            book: undefined,
            chapter: undefined,
            verses: undefined,
          },
          glossSource: {
            ...get().glossSource,
            book: undefined,
            chapter: undefined,
            verses: undefined,
          },
          isLoading: false,
        });
        return;
      }
      if (previous.type === "lastChapterOf") {
        const bookData = await loadOrFetchBook(
          get().mainSource?.bible?.id ?? "",
          previous.bookId,
        );
        await get().setChapter(
          `${previous.bookId}.${bookData.chapters.length}`,
        );
      } else {
        await get().setChapter(previous.chapterId);
      }
      set({ isLoading: false });
    },

    setShowGlossText: (showGlossText: boolean) => {
      set({ showGlossText });
    },

    setMainBible: (bibleId: string) => {
      setBiblePair(get, set, "main", bibleId);
    },
    setGlossBible: (bibleId: string) => {
      setBiblePair(get, set, "gloss", bibleId);
    },
    setBook: async (bookId: string) => {
      set({ isLoading: true });
      const mainBook = await loadOrFetchBook(
        get().mainSource?.bible?.id ?? "",
        bookId,
      );
      const glossBook = await loadOrFetchBook(
        get().glossSource?.bible?.id ?? "",
        bookId,
      );

      set({
        mainSource: {
          ...get().mainSource,
          book: mainBook,
        },
        glossSource: {
          ...get().glossSource,
          book: glossBook,
        },
      });
      get().setChapter(mainBook.chapters[0]);
      set({ isLoading: false });
    },
    setChapter: async (chapterId: string) => {
      set({ isLoading: true });
      let mainBook = get().mainSource?.book;
      let glossBook = get().glossSource?.book;
      const mainBibleId = get().mainSource?.bible?.id ?? "";
      const glossBibleId = get().glossSource?.bible?.id ?? "";

      const [mainChapter, glossChapter, mainVerses, glossVerses] =
        await Promise.all([
          loadOrFetchChapter(mainBibleId, chapterId),
          loadOrFetchChapter(glossBibleId, chapterId),
          loadOrFetchVerses(mainBibleId, chapterId),
          loadOrFetchVerses(glossBibleId, chapterId),
        ]);

      if (mainChapter.bookId !== mainBook?.id) {
        mainBook = await loadOrFetchBook(mainBibleId, mainChapter.bookId);
        glossBook = await loadOrFetchBook(glossBibleId, glossChapter.bookId);
      }

      const updatedSession = {
        ...(get().currentSession ?? {
          sessionId: uuidProvider.generateUuid(),
          sessionDate: new Date().toISOString(),
          visits: [],
        }),
        visits: [
          ...(get().currentSession?.visits ?? []),
          {
            visitedAt: new Date().toISOString(),
            main: {
              bibleId: get().mainSource?.bible?.id ?? "",
              bibleName: get().mainSource?.bible?.name ?? "",
              bookId: get().mainSource?.book?.id ?? "",
              chapterId: chapterId,
            },
            gloss: {
              bibleId: get().glossSource?.bible?.id ?? "",
              bibleName: get().glossSource?.bible?.name ?? "",
              bookId: get().glossSource?.book?.id ?? "",
              chapterId: chapterId,
            },
          },
        ],
      };
      set({
        mainSource: {
          ...get().mainSource,
          book: mainBook,
          chapter: mainChapter,
          verses: mainVerses,
        },
        glossSource: {
          ...get().glossSource,
          book: glossBook,
          chapter: glossChapter,
          verses: glossVerses,
        },
        currentSession: updatedSession,
      });
      await storage.saveSession(updatedSession);
      set({ isLoading: false });
    },
  }));
};
