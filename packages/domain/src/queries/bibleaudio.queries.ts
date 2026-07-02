import { ChapterAudio } from "../models/bible";

export interface BibleAudioQueries {
  getChapterAudioForBibles(
    englishBibleId: string,
    ancientBibleId: string,
    chapterId: string
  ): Promise<
    [englishChapterAudio: ChapterAudio, ancientChapterAudio: ChapterAudio]
  >;
}
