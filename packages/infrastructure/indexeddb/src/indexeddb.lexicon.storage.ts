import type { AnyLexiconEntry, LexiconStorage } from "@bible-app/domain";
import { indexedDBRepository, LEXICON_ENTRIES_STORE } from "./indexeddb.repository";

export const indexedDbLexiconStorage: LexiconStorage = {
  loadLexiconEntries: async (ids) => {
    const entries = await Promise.all(
      ids.map((id) =>
        indexedDBRepository.load<AnyLexiconEntry>(id, LEXICON_ENTRIES_STORE),
      ),
    );
    return entries.filter((entry): entry is AnyLexiconEntry => entry !== undefined);
  },
  saveLexiconEntries: (entries) =>
    indexedDBRepository.saveMany<AnyLexiconEntry>(entries, LEXICON_ENTRIES_STORE),
};
