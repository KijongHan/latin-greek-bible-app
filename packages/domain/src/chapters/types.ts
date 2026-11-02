export interface Token {
  text: string;
  lexiconEntryIds?: string[];
  // STEP morph codes (eg V-AAI-3S), parallel to lexiconEntryIds
  // TODO: generate the morph code table from STEP TEGMC/TEHMC
  morphCodeIds?: string[];
}

export interface Chapter {
  id: string;
  bookId: string;
  bibleId: string;
  number: number;
  verses: string[];
  chapterRecordKey: string;
}

export interface Verse {
  id: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  verseNumber: number;
  tokens: Token[];
  verseRecordKey: string;
}
