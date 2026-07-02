import { getDocs, query, where } from "firebase/firestore";
import type {
  AudioQueries,
  ChapterAudio,
} from "@bible-app/domain";
import { audioCollection } from "./firebase.repository";

export const firebaseAudioQueries: AudioQueries = {
  getChapterAudio: async (bibleId, chapterId) => {
    const q = query(
      audioCollection,
      where("bibleId", "==", bibleId),
      where("chapterId", "==", chapterId)
    );
    const versesAudio = (await getDocs(q)).docs.map((doc) => doc.data());
    return {
      bibleId,
      chapterId,
      versesAudio: versesAudio
        .sort((a, b) => a.verseNumber - b.verseNumber)
        .map((verse) => ({
          ...verse,
          data: verse.data.toUint8Array(),
        })),
      bibleChapterId: `${bibleId}.${chapterId}`,
    } as ChapterAudio;
  },
};
