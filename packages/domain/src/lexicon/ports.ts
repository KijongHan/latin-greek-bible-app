import { AnyLexiconEntry } from "./types";

export interface LexiconQueries {
  // Entries for these ids; ids with no entry are left out
  getLexiconEntries(ids: string[]): Promise<AnyLexiconEntry[]>;
}

export interface LexiconStorage {
  // Cached entries for these ids; ids not cached are left out
  loadLexiconEntries(ids: string[]): Promise<AnyLexiconEntry[]>;
  saveLexiconEntries(entries: AnyLexiconEntry[]): Promise<void>;
}
