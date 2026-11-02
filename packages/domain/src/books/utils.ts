import { bookIdLookup } from "./constants";

export const getBookId = (bookName: string) => {
  return bookIdLookup.get(bookName) ?? null;
};

export const getBookRecordKey = (bibleId: string, book: string) => {
  return `${bibleId}.${book}`;
};
