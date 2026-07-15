import { ParsedMorph } from "../extended-strongs/parse-tbes-data";

export type Language = "grc" | "hbo";

export interface BaseStrongsEntry {
  id: string;
  language: Language;
  lemma: string;
  transliteration: string;
  pronunciation?: string;
  definition: string;
  derivation: string;
  morphRaw?: string;
  morph?: ParsedMorph;
}

interface RawGreekEntry {
  lemma: string;
  translit: string;
  strongs_def: string;
  kjv_def: string;
  derivation: string;
}

interface RawHebrewEntry {
  lemma: string;
  xlit: string;
  pron: string;
  strongs_def: string;
  kjv_def: string;
  derivation: string;
}

type RawEntry = RawGreekEntry | RawHebrewEntry;

function padStrong(strong: string): string {
  const match = strong.match(/^([GH])(\d+)$/);
  if (!match) return strong;
  return `${match[1]}${match[2].padStart(4, "0")}`;
}

export function buildBaseStrongsData(
  raw: Record<string, RawEntry>,
  prefix: "H" | "G",
): BaseStrongsEntry[] {
  const language: Language = prefix === "H" ? "hbo" : "grc";
  const entries: BaseStrongsEntry[] = [];

  for (const [strongRaw, data] of Object.entries(raw)) {
    const padded = padStrong(strongRaw);
    const transliteration =
      "xlit" in data ? data.xlit : (data as RawGreekEntry).translit;

    const entry: BaseStrongsEntry = {
      id: `${language}:${padded}`,
      language,
      lemma: (data.lemma || "").trim(),
      transliteration: (transliteration || "").trim(),
      definition: (data.strongs_def || "").trim(),
      derivation: (data.derivation || "").trim(),
    };

    if ("pron" in data && data.pron) {
      entry.pronunciation = data.pron.trim();
    }

    entries.push(entry);
  }

  return entries;
}
