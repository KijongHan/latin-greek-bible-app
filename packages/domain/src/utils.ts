import { bookIdLookup } from "./constants";

export const getBookId = (bookName: string) => {
  return bookIdLookup.get(bookName) ?? null;
};

export const getChapterId = (bookId: string, chapter: number) => {
  return `${bookId}.${chapter}`;
};

export const getVerseId = (bookId: string, chapter: number, verse: number) => {
  return `${bookId}.${chapter}.${verse}`;
};

export const getBookRecordKey = (bibleId: string, book: string) => {
  return `${bibleId}.${book}`;
};

export const getChapterRecordKey = (bibleId: string, chapterId: string) => {
  return `${bibleId}.${chapterId}`;
};
