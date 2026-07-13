import * as fs from "node:fs/promises";

export type Language = "grc" | "hbo";

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
  language: Language;
  eStrong: string;
  dStrong: string;
  uStrong: string;
  lemma: string;
  transliteration: string;
  gloss: string;
  definition: string;
  morphRaw: string;
  morph: ParsedMorph;
}

const POS_MAP: Record<string, PartOfSpeech> = {
  N: "noun",
  V: "verb",
  A: "adjective",
  Adv: "adverb",
  Art: "article",
  Conj: "conjunction",
  Prep: "preposition",
  Part: "particle",
  Neg: "negative",
  Intj: "interjection",
  Intg: "interrogative",
  Cond: "conditional",
  Cor: "correlative",
  PerP: "pronoun_personal",
  PosP: "pronoun_possessive",
  RefP: "pronoun_reflexive",
  RelP: "pronoun_relative",
  DemP: "pronoun_demonstrative",
  ImpP: "pronoun_impersonal",
};

const GENDER_MAP: Record<string, Gender> = {
  M: "masculine",
  F: "feminine",
  N: "neuter",
  C: "common",
};

const NAME_TYPE_MAP: Record<string, NameType> = {
  L: "location",
  P: "person",
  LG: "gentilic",
  PG: "gentilic",
  T: "title",
};

export function parseMorph(morphRaw: string): ParsedMorph {
  const trimmed = morphRaw.trim();
  if (!trimmed) return { language: "" };

  const [language, ...rest] = trimmed.split(":");
  const body = rest.join(":");
  if (!body) return { language };

  const [typeAndGender, ...extras] = body.split("-");
  const parts = typeAndGender.split(/-/);

  const morph: ParsedMorph = { language };

  const posCode = parts[0];
  const pos = POS_MAP[posCode];
  if (pos) morph.partOfSpeech = pos;

  const nextChunks = body.split("-").slice(1);
  for (const chunk of nextChunks) {
    if (!chunk) continue;

    if (chunk.includes("/")) {
      const genderCodes = chunk.split("/");
      const genders = genderCodes
        .map((code) => GENDER_MAP[code[0]])
        .filter((g): g is Gender => g !== undefined);
      if (genders.length > 0) morph.gender = genders;
      continue;
    }

    if (GENDER_MAP[chunk[0]] !== undefined && chunk.length <= 2) {
      const genders: Gender[] = [GENDER_MAP[chunk[0]]];
      if (chunk[1] === "P") morph.number = "plural";
      else if (chunk[1] === "S") morph.number = "singular";
      morph.gender = genders;
      continue;
    }

    if (NAME_TYPE_MAP[chunk]) {
      morph.nameType = NAME_TYPE_MAP[chunk];
      continue;
    }
  }

  return morph;
}

export function stripHtml(input: string): string {
  return input
    .replace(/<ref='[^']*'>([^<]*)<\/ref>/g, "$1")
    .replace(/<a[^>]*title="([^"]*)"[^>]*>([^<]*)<\/a>/g, "$2")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function isLexiconRow(line: string, prefix: "G" | "H"): boolean {
  return new RegExp(`^${prefix}\\d`).test(line);
}

function normalizeStrong(raw: string): string {
  const match = raw.match(/^([GH]\d+[a-zA-Z]*)/);
  return match ? match[1] : raw.trim();
}

export async function parseTbesFile(
  fileUrl: URL,
  prefix: "G" | "H",
): Promise<Omit<LexiconEntry, "id" | "language">[]> {
  const content = await fs.readFile(fileUrl, "utf-8");
  const lines = content.split(/\r?\n/);

  const entries: Omit<LexiconEntry, "id" | "language">[] = [];

  for (const line of lines) {
    if (!isLexiconRow(line, prefix)) continue;

    const cols = line.split("\t");
    if (cols.length < 8) continue;

    const [eStrongRaw, dStrongRaw, uStrongRaw, lemma, transliteration, morphRaw, gloss, meaningHtml] = cols;

    const eStrong = normalizeStrong(eStrongRaw);
    const dStrong = normalizeStrong(dStrongRaw);
    const uStrong = normalizeStrong(uStrongRaw);

    if (!eStrong || !lemma) continue;

    entries.push({
      eStrong,
      dStrong,
      uStrong,
      lemma: lemma.trim(),
      transliteration: transliteration.trim(),
      gloss: gloss.trim(),
      definition: stripHtml(meaningHtml),
      morphRaw: morphRaw.trim(),
      morph: parseMorph(morphRaw),
    });
  }

  return entries;
}
