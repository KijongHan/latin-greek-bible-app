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
  verseId: string;
  dStrongs: string[];
}

export function buildLexiconStatisticsData(
  rows: TaggedWordRow[],
): LexiconStatisticsEntry[] {
  const accum = new Map<string, { count: number; verses: Set<string> }>();

  for (const row of rows) {
    for (const lexiconEntryId of row.dStrongs) {
      let entry = accum.get(lexiconEntryId);
      if (!entry) {
        entry = { count: 0, verses: new Set() };
        accum.set(lexiconEntryId, entry);
      }
      entry.count++;
      entry.verses.add(row.verseId);
    }
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
