import { useQueries } from "@tanstack/react-query";
import { createLexiconEntryQuery } from "@bible-app/domain";
import { firebaseLexiconQueries } from "@bible-app/firebase";
import { indexedDbLexiconStorage } from "@bible-app/indexeddb";

const lexiconEntryQuery = createLexiconEntryQuery(
  firebaseLexiconQueries,
  indexedDbLexiconStorage,
);

// The entries for a token's lexiconEntryIds, eg when its word is opened.
// Each result's data is the entry, or null when there is none.
export function useLexiconEntries(ids: string[]) {
  return useQueries({ queries: ids.map(lexiconEntryQuery) });
}
