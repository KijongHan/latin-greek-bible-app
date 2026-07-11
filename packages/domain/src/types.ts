export type Testament = "Old Testament" | "New Testament" | "Deuterocanonical";

export interface Chapter {
  bibleChapterId: string;
  id: string;
  bookId: string;
  bibleId: string;
  number: number;
  verses: { id: string; text: string | string[] }[];
}

export interface Bible {
  id: string;
  books: string[];
  abbreviation: string;
  name: string;
  language: string;
  description?: string;
}

export interface Book {
  bibleBookId: string;
  id: string;
  bibleId: string;
  name: string;
  chapters: string[];
}

export interface VerseAudio {
  bibleId: string;
  chapterId: string;
  verseId: string;
  data: Uint8Array;
}

export interface ChapterAudio {
  bibleId: string;
  chapterId: string;
  versesAudio: VerseAudio[];
  bibleChapterId: string;
}

export interface BibleSource {
  bible?: Bible;
  chapter?: Chapter;
  book?: Book;
}

export interface BiblePreset {
  name: string;
  mainBibleId: string;
  glossBibleId: string;
}

export interface Session {
  sessionId: string;
  sessionDate: string;
  visits: {
    main: {
      bibleId: string;
      bibleName: string;
      bookId: string;
      chapterId: string;
    };
    gloss: {
      bibleId: string;
      bibleName: string;
      bookId: string;
      chapterId: string;
    };
    visitedAt: string;
  }[];
}
