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
  ancientSource: BibleSource | undefined;
  englishSource: BibleSource | undefined;

  initialize: () => Promise<void>;

  setAncientBible: (bible: Bible) => void;
  setEnglishBible: (bible: Bible) => void;
  setChapter: (chapter: string) => Promise<void>;
}

export const useBibleStore = create<BibleStore>((set) => ({
  ancientBibles: [],
  englishBibles: [],
  ancientSource: undefined,
  englishSource: undefined,

  initialize: async () => {
    const ancientBibles = await getAncientBibles();
    const englishBibles = await getEnglishBibles();

    const ancientBible =
      ancientBibles.find((bible) => bible.abbreviation === "VLG") ??
      ancientBibles[0];
    const englishBible =
      englishBibles.find((bible) => bible.abbreviation === "KJV") ??
      englishBibles[0];

    const ancientBook = await getBook(ancientBible.id, ancientBible.books[0]);
    const englishBook = await getBook(englishBible.id, englishBible.books[0]);

    const ancientChapter = await getChapter(
      ancientBible.id,
      ancientBook.chapters[0]
    );
    const englishChapter = await getChapter(
      englishBible.id,
      englishBook.chapters[0]
    );
    console.log(ancientChapter);

    set({
      ancientBibles,
      englishBibles,
      ancientSource: {
        bible: ancientBible,
        book: ancientBook,
        chapter: ancientChapter,
      },
      englishSource: {
        bible: englishBible,
        book: englishBook,
        chapter: englishChapter,
      },
    });
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
  setChapter: async (chapter: string) => {
    // const ancientChapter = await getChapter(
    //   useBibleStore.getState().ancientSource?.bible?.id ?? "",
    //   useBibleStore.getState().ancientSource?.book?.name ?? "",
    //   chapter
    // );
    // set({
    //   ancientSource: {
    //     ...useBibleStore.getState().ancientSource,
    //   },
    // });
  },
}));
