import { createStore, StoreApi } from "zustand/vanilla";
import { BibleQueries } from "../queries/types";
import { BibleStorage } from "../storage/types";
import {
  Bible,
  BiblePreset,
  BibleSource,
  Book,
  Chapter,
  Session,
} from "../types";
import { UuidProvider } from "../providers/types";

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

export const createBibleStore = (
  queries: BibleQueries,
  storage: BibleStorage,
  uuidProvider: UuidProvider,
): StoreApi<BibleStore> => {
  const loadOrFetchBook = async (
    bibleId: string,
    bookId: string,
  ): Promise<Book> => {
    const cached = await storage.loadBook(bibleId, bookId);
    if (cached) return cached;
    const fetched = await queries.getBook(bibleId, bookId);
    await storage.saveBook(fetched);
    return fetched;
  };

  const loadOrFetchChapter = async (
    bibleId: string,
    chapterId: string,
  ): Promise<Chapter> => {
    const cached = await storage.loadChapter(bibleId, chapterId);
    if (cached) return cached;
    const fetched = await queries.getChapter(bibleId, chapterId);
    await storage.saveChapter(fetched);
    return fetched;
  };

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
        },
        glossSource: {
          ...get().glossSource,
          book: undefined,
          chapter: undefined,
        },
      });
    },

    initialize: async () => {
      set({ isLoading: true });
      const bibles = await queries.getBibles();

      const presets = [
        {
          name: "Vulgate - Douay Rheims",
          mainBibleId:
            bibles.find((bible) => bible.abbreviation === "VLG")?.id ?? "",
          glossBibleId:
            bibles.find((bible) => bible.abbreviation === "DRC")?.id ?? "",
        },
        {
          name: "Clementine Vulgate - Douay Rheims",
          mainBibleId:
            bibles.find((bible) => bible.abbreviation === "CLVLG")?.id ?? "",
          glossBibleId:
            bibles.find((bible) => bible.abbreviation === "DRC")?.id ?? "",
        },
        {
          name: "King James - Vulgate",
          mainBibleId:
            bibles.find((bible) => bible.abbreviation === "KJV")?.id ?? "",
          glossBibleId:
            bibles.find((bible) => bible.abbreviation === "VLG")?.id ?? "",
        },
        {
          name: "King James - Textus Receptus",
          mainBibleId:
            bibles.find((bible) => bible.abbreviation === "KJV")?.id ?? "",
          glossBibleId:
            bibles.find((bible) => bible.abbreviation === "GRCTR")?.id ?? "",
        },
        {
          name: "Custom",
          mainBibleId: "",
          glossBibleId: "",
        },
      ];
      const mainBible =
        bibles.find((bible) => bible.id === presets[0].mainBibleId) ??
        bibles[0];
      const glossBible =
        bibles.find((bible) => bible.id === presets[0].glossBibleId) ??
        bibles[0];

      const sharedBooks = mainBible.books.filter((book) =>
        glossBible.books.includes(book),
      );

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
        sharedBooks,
        isLoading: false,
      });

      set({ isLoadingSharedChapters: true });
      const books = await Promise.all(
        sharedBooks.map(async (book) => {
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
      console.log(sessions);
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
        console.error("No ancient bible selected");
        set({ isLoading: false });
        return;
      }
      if (!get().mainSource?.book) {
        get().setBook(get().mainSource?.bible?.books[0] ?? "");
        set({ isLoading: false });
        return;
      }

      let chapterNumber = get().mainSource?.chapter?.number ?? 0;
      chapterNumber++;
      let book = get().mainSource?.book!.id;
      const books = get().sharedBooks ?? [];
      const bookChapters = get().mainSource?.book!.chapters ?? [];

      if (
        !bookChapters.some((chapter) => chapter === `${book}.${chapterNumber}`)
      ) {
        chapterNumber = 1;
        const bookIndex = books.findIndex((b) => b === book);
        book = books.at(bookIndex + 1) ?? books[0];
      }

      await get().setChapter(`${book}.${chapterNumber}`);
      set({ isLoading: false });
    },

    previousChapter: async () => {
      set({ isLoading: true });
      if (!get().mainSource?.bible) {
        console.error("No ancient bible selected");
        set({ isLoading: false });
        return;
      }
      if (!get().mainSource?.book) {
        get().setBook(get().mainSource?.bible?.books[0] ?? "");
        set({ isLoading: false });
        return;
      }

      let chapterNumber = get().mainSource?.chapter?.number ?? 0;
      chapterNumber--;
      let book = get().mainSource?.book!.id;
      const books = get().sharedBooks ?? [];

      if (chapterNumber <= 0) {
        const bookIndex = books.findIndex((b) => b === book);
        if (bookIndex === 0) {
          set({
            mainSource: {
              ...get().mainSource,
              book: undefined,
              chapter: undefined,
            },
            glossSource: {
              ...get().glossSource,
              book: undefined,
              chapter: undefined,
            },
            isLoading: false,
          });
          return;
        } else {
          book = books.at(bookIndex - 1) ?? books[0];
          const bookData = await loadOrFetchBook(
            get().mainSource?.bible?.id ?? "",
            book,
          );
          chapterNumber = bookData.chapters.length;
        }
      }

      await get().setChapter(`${book}.${chapterNumber}`);
      set({ isLoading: false });
    },

    setShowGlossText: (showGlossText: boolean) => {
      set({ showGlossText });
    },

    setMainBible: (bibleId: string) => {
      const mainBible = get().bibles.find((bible) => bible.id === bibleId);
      const glossBible =
        bibleId === get().glossSource?.bible?.id
          ? get().bibles.find((bible) => bible.id !== bibleId)
          : get().glossSource?.bible;
      set({
        sharedBooks: mainBible?.books.filter((book) =>
          glossBible?.books.includes(book),
        ),
        glossSource: {
          ...get().glossSource,
          bible: glossBible,
        },
        mainSource: {
          ...get().mainSource,
          bible: mainBible,
        },
      });
    },
    setGlossBible: (bibleId: string) => {
      const glossBible = get().bibles.find((bible) => bible.id === bibleId);
      const mainBible =
        bibleId === get().mainSource?.bible?.id
          ? get().bibles.find((bible) => bible.id !== bibleId)
          : get().mainSource?.bible;
      set({
        sharedBooks: mainBible?.books.filter((book) =>
          glossBible?.books.includes(book),
        ),
        glossSource: {
          ...get().glossSource,
          bible: glossBible,
        },
        mainSource: {
          ...get().mainSource,
          bible: mainBible,
        },
      });
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

      const mainChapter = await loadOrFetchChapter(
        get().mainSource?.bible?.id ?? "",
        chapterId,
      );
      const glossChapter = await loadOrFetchChapter(
        get().glossSource?.bible?.id ?? "",
        chapterId,
      );

      if (mainChapter.bookId !== mainBook?.id) {
        mainBook = await loadOrFetchBook(
          get().mainSource?.bible?.id ?? "",
          mainChapter.bookId,
        );
        glossBook = await loadOrFetchBook(
          get().glossSource?.bible?.id ?? "",
          glossChapter.bookId,
        );
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
        },
        glossSource: {
          ...get().glossSource,
          book: glossBook,
          chapter: glossChapter,
        },
        currentSession: updatedSession,
      });
      await storage.saveSession(updatedSession);
      set({ isLoading: false });
    },
  }));
};
