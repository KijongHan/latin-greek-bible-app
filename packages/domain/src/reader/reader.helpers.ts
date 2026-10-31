import { Bible, BiblePreset, Book } from "../types";

// Main / gloss pairs offered on the front page. The first is the default.
export const buildPresets = (bibles: Bible[]): BiblePreset[] => {
  const idOf = (abbreviation: string) =>
    bibles.find((bible) => bible.abbreviation === abbreviation)?.id ?? "";
  return [
    {
      name: "Vulgate - Douay Rheims",
      mainBibleId: idOf("VLG"),
      glossBibleId: idOf("DRC"),
    },
    {
      name: "Clementine Vulgate - Douay Rheims",
      mainBibleId: idOf("CLVLG"),
      glossBibleId: idOf("DRC"),
    },
    {
      name: "King James - Vulgate",
      mainBibleId: idOf("KJV"),
      glossBibleId: idOf("VLG"),
    },
    {
      name: "King James - Textus Receptus",
      mainBibleId: idOf("KJV"),
      glossBibleId: idOf("GRCTR"),
    },
    {
      name: "Custom",
      mainBibleId: "",
      glossBibleId: "",
    },
  ];
};

// The bibles shown before any are chosen: the first preset, or else the
// first bible
export const defaultBiblePair = (bibles: Bible[]): BiblePair => {
  const [preset] = buildPresets(bibles);
  return {
    mainBible:
      bibles.find((bible) => bible.id === preset.mainBibleId) ?? bibles[0],
    glossBible:
      bibles.find((bible) => bible.id === preset.glossBibleId) ?? bibles[0],
  };
};

// Books in both bibles, in the main bible's order
export const sharedBooks = (mainBible?: Bible, glossBible?: Bible): string[] =>
  mainBible?.books.filter((book) => glossBible?.books.includes(book)) ?? [];

export interface BiblePair {
  mainBible?: Bible;
  glossBible?: Bible;
}

// Selects a bible for one side. Picking the bible the other side already
// shows moves the other side to a different bible, so both never match.
export const pickBiblePair = (
  bibles: Bible[],
  side: "main" | "gloss",
  bibleId: string,
  current: BiblePair,
): BiblePair => {
  const picked = bibles.find((bible) => bible.id === bibleId);
  const other = side === "main" ? current.glossBible : current.mainBible;
  const otherBible =
    bibleId === other?.id
      ? bibles.find((bible) => bible.id !== bibleId)
      : other;
  return side === "main"
    ? { mainBible: picked, glossBible: otherBible }
    : { mainBible: otherBible, glossBible: picked };
};

export type AdjacentChapter =
  | { type: "chapter"; chapterId: string }
  // The previous book's last chapter, which needs that book's chapter list
  | { type: "lastChapterOf"; bookId: string }
  // Before the first chapter of the first book
  | { type: "home" };

// The chapter after or before chapterNumber of book. Next runs on into the
// following shared book and wraps to the first; previous runs back into the
// preceding book, or to the front page from the first book's first chapter.
export const adjacentChapter = (
  book: Book,
  chapterNumber: number,
  books: string[],
  direction: "next" | "previous",
): AdjacentChapter => {
  const bookIndex = books.findIndex((b) => b === book.id);

  if (direction === "next") {
    const chapterId = `${book.id}.${chapterNumber + 1}`;
    if (book.chapters.includes(chapterId))
      return { type: "chapter", chapterId };
    const nextBook = books.at(bookIndex + 1) ?? books[0];
    return { type: "chapter", chapterId: `${nextBook}.1` };
  }

  if (chapterNumber - 1 > 0) {
    return { type: "chapter", chapterId: `${book.id}.${chapterNumber - 1}` };
  }
  if (bookIndex === 0) return { type: "home" };
  return { type: "lastChapterOf", bookId: books.at(bookIndex - 1) ?? books[0] };
};
