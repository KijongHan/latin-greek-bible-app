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

let instance: BibleAudioQueries | undefined;

export const setBibleAudioQueries = (queries: BibleAudioQueries): void => {
  instance = queries;
};

export const getBibleAudioQueries = (): BibleAudioQueries => {
  if (!instance) {
    throw new Error(
      "BibleAudioQueries not initialized. Call setBibleAudioQueries() at app boot."
    );
  }
  return instance;
};
