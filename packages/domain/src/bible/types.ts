import { Book } from "../books/types";
import { Chapter, Verse } from "../chapters/types";

export interface Bible {
  id: string;
  books: string[];
  abbreviation: string;
  name: string;
  language: string;
  description?: string;
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
