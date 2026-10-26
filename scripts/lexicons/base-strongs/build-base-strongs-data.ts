import type { BaseStrongsEntry, StrongsLanguage } from "../shared/types";

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
  const language: StrongsLanguage = prefix === "H" ? "hbo" : "grc";
  const entries: BaseStrongsEntry[] = [];

  for (const [strongRaw, data] of Object.entries(raw)) {
    const padded = padStrong(strongRaw);
    const transliteration =
      "xlit" in data ? data.xlit : (data as RawGreekEntry).translit;

    const entry: BaseStrongsEntry = {
      id: padded,
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
