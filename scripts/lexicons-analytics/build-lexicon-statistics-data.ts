export type Language = "grc" | "hbo";

export interface LexiconStatistics {
  occurrences: number;
  verseIds: string[];
}

export interface LexiconStatisticsEntry {
  lexiconEntryId: string;
  stats: LexiconStatistics;
}

export interface TaggedWordRow {
  ref: string;
  strong: string;
}

function normalizeVerseId(ref: string): string | null {
  const match = ref.match(/^(\w+)\s+(\d+):(\d+)/);
  if (!match) return null;
  return `${match[1]}.${match[2]}.${match[3]}`;
}

function normalizeStrong(raw: string, prefix: "G" | "H"): string | null {
  if (!raw) return null;
  const match = raw.match(/^(\d+)[a-z]*$/);
  if (!match) return null;
  return `${prefix}${match[1].padStart(4, "0")}`;
}

export function buildLexiconStatisticsData(
  rows: TaggedWordRow[],
  language: Language,
): LexiconStatisticsEntry[] {
  const prefix = language === "grc" ? "G" : "H";
  const accum = new Map<string, { count: number; verses: Set<string> }>();

  for (const row of rows) {
    const strong = normalizeStrong(row.strong, prefix);
    if (!strong) continue;
    const verseId = normalizeVerseId(row.ref);
    if (!verseId) continue;

    const lexiconEntryId = `${language}:${strong}`;
    let entry = accum.get(lexiconEntryId);
    if (!entry) {
      entry = { count: 0, verses: new Set() };
      accum.set(lexiconEntryId, entry);
    }
    entry.count++;
    entry.verses.add(verseId);
  }

  return [...accum.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lexiconEntryId, { count, verses }]) => ({
      lexiconEntryId,
      stats: {
        occurrences: count,
        verseIds: [...verses].sort(),
      },
    }));
}
