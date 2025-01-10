import { create } from "zustand";
import {
  getBibles,
  getBook,
  getChapter,
  getSessions,
  saveSession,
} from "./bible.queries";
import { Bible, BiblePreset, BibleSource, Session } from "./bible.model";

interface BibleStore {
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

export const useBibleStore = create<BibleStore>((set, get) => ({
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
    const bibles = await getBibles();

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
      bibles.find((bible) => bible.id === presets[0].mainBibleId) ?? bibles[0];
    const glossBible =
      bibles.find((bible) => bible.id === presets[0].glossBibleId) ?? bibles[0];

    const sharedBooks = mainBible.books.filter((book) =>
      glossBible.books.includes(book)
    );

    set({
      currentSession: {
        sessionId: crypto.randomUUID(),
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
          setTimeout(resolve, Math.random() * 1500)
        );
        return getBook(mainBible.id, book);
      })
    );
    const sharedChapters = books.reduce((acc, book) => {
      acc[book.id] = book.chapters;
      return acc;
    }, {} as Record<string, string[]>);
    const sessions = (await getSessions()).slice(0, 1);
    set({
      sharedChapters,
      isLoadingSharedChapters: false,
      lastSessions: sessions,
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
        const bookData = await getBook(get().mainSource?.bible?.id ?? "", book);
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
        glossBible?.books.includes(book)
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
        glossBible?.books.includes(book)
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
    const mainBook = await getBook(get().mainSource?.bible?.id ?? "", bookId);
    const glossBook = await getBook(get().glossSource?.bible?.id ?? "", bookId);

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

    const mainChapter = await getChapter(
      get().mainSource?.bible?.id ?? "",
      chapterId
    );
    const glossChapter = await getChapter(
      get().glossSource?.bible?.id ?? "",
      chapterId
    );

    if (mainChapter.bookId !== mainBook?.id) {
      mainBook = await getBook(
        get().mainSource?.bible?.id ?? "",
        mainChapter.bookId
      );
      glossBook = await getBook(
        get().glossSource?.bible?.id ?? "",
        glossChapter.bookId
      );
    }
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
    });
    await saveSession({
      ...(get().currentSession ?? {
        sessionId: crypto.randomUUID(),
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
            chapterId: get().mainSource?.chapter?.id ?? "",
          },
          gloss: {
            bibleId: get().glossSource?.bible?.id ?? "",
            bibleName: get().glossSource?.bible?.name ?? "",
            bookId: get().glossSource?.book?.id ?? "",
            chapterId: get().glossSource?.chapter?.id ?? "",
          },
        },
      ],
    });
    set({ isLoading: false });
  },
}));
