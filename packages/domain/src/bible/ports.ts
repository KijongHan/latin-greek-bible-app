import { BookMutations, BookQueries, BookStorage } from "../books/ports";
import {
  ChapterMutations,
  ChapterQueries,
  ChapterStorage,
} from "../chapters/ports";
import { Bible } from "./types";

// A bible's whole backend: its own list plus its books and chapters, as one
// Firestore / IndexedDB / memory implementation provides them
export interface BibleQueries extends BookQueries, ChapterQueries {
  getBibles(): Promise<Bible[]>;
}

export interface BibleMutations extends BookMutations, ChapterMutations {
  upsertBible(bible: Bible): Promise<void>;
}

export interface BibleStorage extends BookStorage, ChapterStorage {}
