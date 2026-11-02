import { ChapterAudio } from "./types";

export interface AudioQueries {
  getChapterAudio(bibleId: string, chapterId: string): Promise<ChapterAudio>;
}

export interface BibleAudioStorage {
  loadChapterAudio(
    bibleId: string,
    chapterId: string
  ): Promise<ChapterAudio | undefined>;
  saveChapterAudio(audio: ChapterAudio): Promise<void>;
}
