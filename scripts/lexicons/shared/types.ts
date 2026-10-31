// Lexicon entry types live in @bible-app/domain, where the app reads them
export type {
  Gender,
  Language,
  LatinEntryType,
  LatinLexiconEntry,
  LatinSense,
  LexiconEntry,
  NameType,
  ParsedMorph,
  PartOfSpeech,
  StrongsLanguage,
  StrongsLexiconEntry,
} from "@bible-app/domain";
import type { ParsedMorph, StrongsLanguage } from "@bible-app/domain";

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
