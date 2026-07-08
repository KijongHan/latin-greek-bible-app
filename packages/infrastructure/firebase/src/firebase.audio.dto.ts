import type { Bytes } from "firebase/firestore";
import type { VerseAudio } from "@bible-app/domain";

export interface FirestoreVerseAudioDoc {
  bibleId: string;
  chapterId: string;
  verseId: string;
  verseNumber: number;
  data: Bytes;
}

export const toVerseAudio = (doc: FirestoreVerseAudioDoc): VerseAudio => ({
  bibleId: doc.bibleId,
  chapterId: doc.chapterId,
  verseId: doc.verseId,
  data: doc.data.toUint8Array(),
});
