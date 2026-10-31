import { documentId, getDocs, query, where } from "firebase/firestore";
import type { AnyLexiconEntry, LexiconQueries } from "@bible-app/domain";
import { lexiconEntriesCollection } from "./firebase.repository";

// Firestore's limit on values in an "in" filter
const IN_QUERY_LIMIT = 30;

export const firebaseLexiconQueries: LexiconQueries = {
  getLexiconEntries: async (ids) => {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += IN_QUERY_LIMIT) {
      chunks.push(ids.slice(i, i + IN_QUERY_LIMIT));
    }
    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        getDocs(query(lexiconEntriesCollection, where(documentId(), "in", chunk))),
      ),
    );
    // Documents are the uploaded entries as they are, see
    // scripts/lexicons/uploader.ts
    return snapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => doc.data() as AnyLexiconEntry),
    );
  },
};
