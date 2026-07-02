import type { BibleAudioStorage, ChapterAudio } from "@bible-app/domain";
import {
  CHAPTER_AUDIO_STORE,
  indexedDBRepository,
} from "./indexeddb.repository";

export const indexedDbBibleAudioStorage: BibleAudioStorage = {
  loadChapterAudio: (bibleId, chapterId) =>
    indexedDBRepository.load<ChapterAudio>(
      `${bibleId}.${chapterId}`,
      CHAPTER_AUDIO_STORE
    ),
  saveChapterAudio: (audio) =>
    indexedDBRepository.save<ChapterAudio>(audio, CHAPTER_AUDIO_STORE),
};
