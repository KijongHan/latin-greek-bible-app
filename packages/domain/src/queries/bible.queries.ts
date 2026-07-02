import { Bible, Book, Chapter } from "../models/bible";

export interface BibleQueries {
  getBibles(): Promise<Bible[]>;
  getBook(bibleId: string, book: string): Promise<Book>;
  getChapter(bibleId: string, chapterId: string): Promise<Chapter>;
}
