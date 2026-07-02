import { Bible, Book, Chapter, Session } from "../models/bible";

export interface BibleQueries {
  getBibles(): Promise<Bible[]>;
  getBook(bibleId: string, book: string): Promise<Book>;
  getChapter(bibleId: string, chapterId: string): Promise<Chapter>;
  getSessions(): Promise<Session[]>;
  saveSession(session: Session): Promise<void>;
}

let instance: BibleQueries | undefined;

export const setBibleQueries = (queries: BibleQueries): void => {
  instance = queries;
};

export const getBibleQueries = (): BibleQueries => {
  if (!instance) {
    throw new Error(
      "BibleQueries not initialized. Call setBibleQueries() at app boot."
    );
  }
  return instance;
};
