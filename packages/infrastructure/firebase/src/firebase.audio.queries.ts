import { getDocs, query, where } from "firebase/firestore";
import { getChapterRecordKey, type AudioQueries } from "@bible-app/domain";
import { audioCollection } from "./firebase.repository";
import {
  toVerseAudio,
  type FirestoreVerseAudioDoc,
} from "./firebase.audio.dto";

export const firebaseAudioQueries: AudioQueries = {
  getChapterAudio: async (bibleId, chapterId) => {
    const q = query(
      audioCollection,
      where("bibleId", "==", bibleId),
      where("chapterId", "==", chapterId),
    );
    const docs = (await getDocs(q)).docs.map(
      (d) => d.data() as FirestoreVerseAudioDoc,
    );
    return {
      bibleId,
      chapterId,
      chapterRecordKey: getChapterRecordKey(bibleId, chapterId),
      versesAudio: docs
        .sort((a, b) => a.verseNumber - b.verseNumber)
        .map(toVerseAudio),
    };
  },
};
