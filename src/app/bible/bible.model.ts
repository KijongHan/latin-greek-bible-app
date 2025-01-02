export interface Language {
  script: string;
  id: string;
  name: string;
}

export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Chapter {
  bibleChapterId: string;
  id: string;
  bookId: string;
  bibleId: string;
  number: number;
  verses: { id: string; text: string }[];
}

export interface Bible {
  id: string;
  dblId: string;
  books: string[];
  createdAt: Timestamp;
  abbreviation: string;
  name: string;
  language: Language;
  type: string;
  description?: string;
}

export interface Book {
  bibleBookId: string;
  id: string;
  bibleId: string;
  name: string;
  nameLong: string;
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
