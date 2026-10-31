import type { AnyLexiconEntry, LexiconStorage } from "@bible-app/domain";

export const createMemoryLexiconStorage = (): LexiconStorage => {
  const entries = new Map<string, AnyLexiconEntry>();

  return {
    loadLexiconEntries: async (ids) =>
      ids
        .map((id) => entries.get(id))
        .filter((entry): entry is AnyLexiconEntry => entry !== undefined),
    saveLexiconEntries: async (entriesToSave) => {
      for (const entry of entriesToSave) entries.set(entry.id, entry);
    },
  };
};
