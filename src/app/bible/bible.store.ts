import { create } from "zustand";
import {
  getAncientBibles,
  getBook,
  getChapter,
  getEnglishBibles,
} from "./bible.queries";
import { Bible, Book, Chapter } from "./bible.model";

interface BibleSource {
  bible?: Bible;
  chapter?: Chapter;
  book?: Book;
}

interface BibleStore {
  isLoading: boolean;
  isLoadingSharedChapters: boolean;
  ancientBibles: Bible[];
  englishBibles: Bible[];
  sharedChapters: Record<string, string[]>;
  sharedBooks: string[];
  ancientSource: BibleSource | undefined;
  englishSource: BibleSource | undefined;

  initialize: () => Promise<void>;
  nextChapter: () => Promise<void>;
  previousChapter: () => Promise<void>;

  setAncientBible: (bibleId: string) => void;
  setEnglishBible: (bibleId: string) => void;
  setBook: (bookId: string) => Promise<void>;
  setChapter: (chapterId: string) => Promise<void>;
  clear: () => void;
}

export const useBibleStore = create<BibleStore>((set, get) => ({
  isLoading: true,
  isLoadingSharedChapters: false,
  ancientBibles: [],
  englishBibles: [],
  sharedChapters: {},
  sharedBooks: [],
  ancientSource: undefined,
  englishSource: undefined,

  clear: () => {
    set({
      ancientSource: {
        ...get().ancientSource,
        book: undefined,
        chapter: undefined,
      },
      englishSource: {
        ...get().englishSource,
        book: undefined,
        chapter: undefined,
      },
    });
  },

  initialize: async () => {
    set({ isLoading: true });
    const ancientBibles = await getAncientBibles();
    const englishBibles = await getEnglishBibles();

    const ancientBible =
      ancientBibles.find((bible) => bible.abbreviation === "VLG") ??
      ancientBibles[0];
    const englishBible =
      englishBibles.find((bible) => bible.abbreviation === "KJV") ??
      englishBibles[0];

    const sharedBooks = ancientBible.books.filter((book) =>
      englishBible.books.includes(book)
    );

    set({
      ancientBibles,
      englishBibles,
      ancientSource: {
        bible: ancientBible,
      },
      englishSource: {
        bible: englishBible,
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
        return getBook(ancientBible.id, book);
      })
    );
    const sharedChapters = books.reduce((acc, book) => {
      acc[book.id] = book.chapters;
      return acc;
    }, {} as Record<string, string[]>);
    console.log(sharedChapters);
    set({ sharedChapters, isLoadingSharedChapters: false });
  },

  nextChapter: async () => {
    set({ isLoading: true });
    if (!get().ancientSource?.bible) {
      console.error("No ancient bible selected");
      set({ isLoading: false });
      return;
    }
    if (!get().ancientSource?.book) {
      get().setBook(get().ancientSource?.bible?.books[0] ?? "");
      set({ isLoading: false });
      return;
    }

    let chapterNumber = get().ancientSource?.chapter?.number ?? 0;
    chapterNumber++;
    let book = get().ancientSource?.book!.id;
    let books = get().sharedBooks ?? [];
    let bookChapters = get().ancientSource?.book!.chapters ?? [];

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
    if (!get().ancientSource?.bible) {
      console.error("No ancient bible selected");
      set({ isLoading: false });
      return;
    }
    if (!get().ancientSource?.book) {
      get().setBook(get().ancientSource?.bible?.books[0] ?? "");
      set({ isLoading: false });
      return;
    }

    let chapterNumber = get().ancientSource?.chapter?.number ?? 0;
    chapterNumber--;
    let book = get().ancientSource?.book!.id;
    let books = get().sharedBooks ?? [];

    if (chapterNumber <= 0) {
      const bookIndex = books.findIndex((b) => b === book);
      if (bookIndex === 0) {
        set({
          ancientSource: {
            ...get().ancientSource,
            book: undefined,
            chapter: undefined,
          },
          englishSource: {
            ...get().englishSource,
            book: undefined,
            chapter: undefined,
          },
          isLoading: false,
        });
        return;
      } else {
        book = books.at(bookIndex - 1) ?? books[0];
        const bookData = await getBook(
          get().ancientSource?.bible?.id ?? "",
          book
        );
        chapterNumber = bookData.chapters.length;
      }
    }

    await get().setChapter(`${book}.${chapterNumber}`);
    set({ isLoading: false });
  },

  setAncientBible: (bibleId: string) =>
    set({
      ancientSource: {
        ...get().ancientSource,
        bible: get().ancientBibles.find((bible) => bible.id === bibleId),
      },
    }),
  setEnglishBible: (bibleId: string) =>
    set({
      englishSource: {
        ...get().englishSource,
        bible: get().englishBibles.find((bible) => bible.id === bibleId),
      },
    }),
  setBook: async (bookId: string) => {
    set({ isLoading: true });
    const ancientBook = await getBook(
      get().ancientSource?.bible?.id ?? "",
      bookId
    );
    const englishBook = await getBook(
      get().englishSource?.bible?.id ?? "",
      bookId
    );

    set({
      ancientSource: {
        ...get().ancientSource,
        book: ancientBook,
      },
      englishSource: {
        ...get().englishSource,
        book: englishBook,
      },
    });
    get().setChapter(ancientBook.chapters[0]);
    set({ isLoading: false });
  },
  setChapter: async (chapterId: string) => {
    set({ isLoading: true });
    let ancientBook = get().ancientSource?.book;
    let englishBook = get().englishSource?.book;

    const ancientChapter = await getChapter(
      get().ancientSource?.bible?.id ?? "",
      chapterId
    );
    const englishChapter = await getChapter(
      get().englishSource?.bible?.id ?? "",
      chapterId
    );

    if (ancientChapter.bookId !== ancientBook?.id) {
      ancientBook = await getBook(
        get().ancientSource?.bible?.id ?? "",
        ancientChapter.bookId
      );
      englishBook = await getBook(
        get().englishSource?.bible?.id ?? "",
        englishChapter.bookId
      );
    }
    set({
      ancientSource: {
        ...get().ancientSource,
        book: ancientBook,
        chapter: ancientChapter,
      },
      englishSource: {
        ...get().englishSource,
        book: englishBook,
        chapter: englishChapter,
      },
    });
    set({ isLoading: false });
  },
}));
