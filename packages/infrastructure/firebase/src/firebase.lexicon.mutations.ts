import { commitInBatches } from "./firebase.bible.mutations";
import { lexiconEntryRefByEntryId } from "./firebase.repository";

export const firebaseLexiconMutations = {
  // Takes any lexicon the scripts generate (STEP extended Strong's, Lewis &
  // Short). The app reads entries lazily by the ids on a verse's tokens.
  upsertLexiconEntries: async <T extends { id: string }>(entries: T[]) => {
    await commitInBatches(
      entries,
      (e) => lexiconEntryRefByEntryId(e.id),
      (e) => ({ ...e }),
    );
  },
};
