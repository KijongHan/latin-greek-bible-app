export type Testament = "Old Testament" | "New Testament" | "Deuterocanonical";

export interface Token {
  text: string;
  lexiconEntryId?: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  bibleId: string;
  number: number;
  verses: string[];
  chapterRecordKey: string;
}

export interface Verse {
  id: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  verseNumber: number;
  tokens: Token[];
  verseRecordKey: string;
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
  id: string;
  bibleId: string;
  name: string;
  chapters: string[];
  bookRecordKey: string;
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
  chapterRecordKey: string;
}

export interface BibleSource {
  bible?: Bible;
  chapter?: Chapter;
  book?: Book;
  verses?: Verse[];
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
