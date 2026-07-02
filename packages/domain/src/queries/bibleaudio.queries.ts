import { ChapterAudio } from "../models/bible";

export interface BibleAudioQueries {
  getChapterAudio(bibleId: string, chapterId: string): Promise<ChapterAudio>;
}
