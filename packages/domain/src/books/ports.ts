import { Book } from "./types";

export interface BookQueries {
  getBook(bibleId: string, bookId: string): Promise<Book>;
}

export interface BookMutations {
  upsertBook(book: Book): Promise<void>;
}

export interface BookStorage {
  loadBook(bibleId: string, book: string): Promise<Book | undefined>;
  saveBook(book: Book): Promise<void>;
}
