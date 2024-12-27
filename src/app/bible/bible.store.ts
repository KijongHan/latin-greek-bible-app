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
  ancientBibles: Bible[];
  englishBibles: Bible[];
  sharedBooks: string[];
  ancientSource: BibleSource | undefined;
  englishSource: BibleSource | undefined;

  initialize: () => Promise<void>;
  nextChapter: () => Promise<void>;
  previousChapter: () => Promise<void>;

  setAncientBible: (bible: Bible) => void;
  setEnglishBible: (bible: Bible) => void;
  setBook: (bookId: string) => Promise<void>;
  setChapter: (chapterId: string) => Promise<void>;
}

export const useBibleStore = create<BibleStore>((set, get) => ({
  ancientBibles: [],
  englishBibles: [],
  ancientSource: undefined,
  englishSource: undefined,
  sharedBooks: [],

  initialize: async () => {
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
    });
  },

  nextChapter: async () => {
    if (!get().ancientSource?.bible) {
      console.error("No ancient bible selected");
      return;
    }
    if (!get().ancientSource?.book) {
      get().setBook(get().ancientSource?.bible?.books[0] ?? "");
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

    get().setChapter(`${book}.${chapterNumber}`);
  },

  previousChapter: async () => {
    if (!get().ancientSource?.bible) {
      console.error("No ancient bible selected");
      return;
    }
    if (!get().ancientSource?.book) {
      get().setBook(get().ancientSource?.bible?.books[0] ?? "");
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

    get().setChapter(`${book}.${chapterNumber}`);
  },

  setAncientBible: (bible: Bible) =>
    set({
      ancientSource: {
        ...useBibleStore.getState().ancientSource,
        bible,
      },
    }),
  setEnglishBible: (bible: Bible) =>
    set({
      englishSource: {
        ...useBibleStore.getState().englishSource,
        bible,
      },
    }),
  setBook: async (bookId: string) => {
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
  },
  setChapter: async (chapterId: string) => {
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
  },
}));
