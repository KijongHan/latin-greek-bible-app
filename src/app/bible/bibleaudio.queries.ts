import { CHAPTER_AUDIO_STORE } from "@/lib/repositories/indexeddb.repository";
import { indexedDBRepository } from "@/lib/repositories/indexeddb.repository";
import { ChapterAudio } from "./bible.model";
import { getDocs, query, where } from "firebase/firestore";
import { audioCollection } from "@/lib/repositories/firebase.repository";

export const getChapterAudio = async (
  bibleId: string,
  chapterId: string
): Promise<ChapterAudio> => {
  const bibleChapterId = `${bibleId}.${chapterId}`;
  const cachedChapterAudio = await indexedDBRepository.load<ChapterAudio>(
    bibleChapterId,
    CHAPTER_AUDIO_STORE
  );

  if (cachedChapterAudio) {
    return cachedChapterAudio;
  }

  const q = query(
    audioCollection,
    where("bibleId", "==", bibleId),
    where("chapterId", "==", chapterId)
  );
  const versesAudio = (await getDocs(q)).docs.map((doc) => doc.data());
  const chapterAudioResponse = {
    bibleId,
    chapterId,
    versesAudio: versesAudio
      .sort((a, b) => a.verseNumber - b.verseNumber)
      .map((verse) => ({
        ...verse,
        data: verse.data.toUint8Array(),
      })),
    bibleChapterId,
  } as ChapterAudio;
  await indexedDBRepository.save<ChapterAudio>(
    chapterAudioResponse,
    CHAPTER_AUDIO_STORE
  );
  return chapterAudioResponse;
};

export const getChapterAudioForBibles = async (
  englishBibleId: string,
  ancientBibleId: string,
  chapterId: string
): Promise<
  [englishChapterAudio: ChapterAudio, ancientChapterAudio: ChapterAudio]
> => {
  const englishChapterAudio = await getChapterAudio(englishBibleId, chapterId);
  const ancientChapterAudio = await getChapterAudio(ancientBibleId, chapterId);
  return [englishChapterAudio, ancientChapterAudio];
};
