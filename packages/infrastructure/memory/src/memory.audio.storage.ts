import type { BibleAudioStorage, ChapterAudio } from "@bible-app/domain";

export const createMemoryBibleAudioStorage = (): BibleAudioStorage => {
  const chapterAudio = new Map<string, ChapterAudio>();

  return {
    loadChapterAudio: async (bibleId, chapterId) =>
      chapterAudio.get(`${bibleId}.${chapterId}`),
    saveChapterAudio: async (audio) => {
      chapterAudio.set(audio.chapterRecordKey, audio);
    },
  };
};
