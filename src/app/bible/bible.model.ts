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
}

export interface Book {
  bibleId: string;
  name: string;
  nameLong: string;
  chapters: string[];
}
