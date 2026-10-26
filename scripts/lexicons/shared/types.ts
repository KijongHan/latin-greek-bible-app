// Languages with Strong's numbers (Greek, Hebrew, Aramaic)
export type StrongsLanguage = "grc" | "hbo" | "arc";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "article"
  | "conjunction"
  | "preposition"
  | "particle"
  | "negative"
  | "interjection"
  | "interrogative"
  | "conditional"
  | "correlative"
  | "pronoun_personal"
  | "pronoun_possessive"
  | "pronoun_reflexive"
  | "pronoun_relative"
  | "pronoun_demonstrative"
  | "pronoun_impersonal";

export type Gender = "masculine" | "feminine" | "neuter" | "common";

export type NameType = "location" | "person" | "gentilic" | "title";

export interface ParsedMorph {
  language: string;
  partOfSpeech?: PartOfSpeech;
  gender?: Gender[];
  nameType?: NameType;
  number?: "singular" | "plural";
}

export interface LexiconEntry {
  id: string;
  language: StrongsLanguage;
  lemma: string;
  transliteration: string;
  gloss: string;
  definition: string;
  morphRaw: string;
  morph: ParsedMorph;
}

// Greek and Hebrew entries, keyed by STEP's Strong's numbers
export interface StrongsLexiconEntry extends LexiconEntry {
  language: StrongsLanguage;
  eStrong: string;
  dStrong: string;
  uStrong: string;
}

// OpenScriptures Strong's entries, kept for the fields STEP lacks
export interface BaseStrongsEntry {
  id: string;
  language: StrongsLanguage;
  lemma: string;
  transliteration: string;
  pronunciation?: string;
  definition: string;
  derivation: string;
  morphRaw?: string;
  morph?: ParsedMorph;
}
