import { createStore, StoreApi } from "zustand/vanilla";
import { ChapterAudio } from "../models/bible";
import { BibleAudioQueries } from "../queries/bibleaudio.queries";
import { BibleAudioStorage } from "../ports/storage";

export interface BibleAudioStore {
  isAudioAvailable: boolean;
  isAudioEnabled: boolean;
  isAudioPlaying: boolean;
  audioTimer: number | undefined;
  isLoading: boolean;
  currentChapterId: string | undefined;
  currentBibleVerseId: string | undefined;
  glossChapterAudio: ChapterAudio | undefined;
  mainChapterAudio: ChapterAudio | undefined;

  setAudioTimer: (audioTimer: number | undefined) => void;
  setIsAudioPlaying: (isAudioPlaying: boolean) => void;
  setIsAudioEnabled: (isAudioEnabled: boolean) => void;
  setCurrentBibleVerseId: (bibleVerseId: string | undefined) => void;
  loadChapterAudioForBibles: (
    glossBibleId: string,
    mainBibleId: string,
    chapterId: string
  ) => Promise<void>;
  clearChapterAudio: () => void;
}

export const audioTimes = [5, 10, 15, 30];

export const createBibleAudioStore = (
  queries: BibleAudioQueries,
  storage: BibleAudioStorage
): StoreApi<BibleAudioStore> => {
  const loadOrFetchChapterAudio = async (
    bibleId: string,
    chapterId: string
  ): Promise<ChapterAudio> => {
    const cached = await storage.loadChapterAudio(bibleId, chapterId);
    if (cached) return cached;
    const fetched = await queries.getChapterAudio(bibleId, chapterId);
    await storage.saveChapterAudio(fetched);
    return fetched;
  };

  return createStore<BibleAudioStore>((set) => ({
    isAudioPlaying: false,
    isAudioAvailable: true,
    isAudioEnabled: false,
    audioTimer: undefined,
    currentChapterId: undefined,
    glossChapterAudio: undefined,
    mainChapterAudio: undefined,
    isLoading: false,
    currentBibleVerseId: undefined,

    setIsAudioPlaying: (isAudioPlaying: boolean) => {
      set({ isAudioPlaying });
    },

    setAudioTimer: (audioTimer: number | undefined) => {
      set({ audioTimer });
    },

    setIsAudioEnabled: (isAudioEnabled: boolean) => {
      console.log("setIsAudioEnabled", isAudioEnabled);
      set({ isAudioEnabled });
    },

    setCurrentBibleVerseId: (bibleVerseId: string | undefined) => {
      set({ currentBibleVerseId: bibleVerseId });
    },

    loadChapterAudioForBibles: async (glossBibleId, mainBibleId, chapterId) => {
      set({ isLoading: true });
      const glossChapterAudio = await loadOrFetchChapterAudio(
        glossBibleId,
        chapterId
      );
      const mainChapterAudio = await loadOrFetchChapterAudio(
        mainBibleId,
        chapterId
      );
      console.log(glossChapterAudio);
      console.log(mainChapterAudio);

      if (
        glossChapterAudio.versesAudio.length === 0 ||
        mainChapterAudio.versesAudio.length === 0
      ) {
        set({
          currentBibleVerseId: undefined,
          currentChapterId: undefined,
          glossChapterAudio: undefined,
          mainChapterAudio: undefined,
          isLoading: false,
          isAudioEnabled: false,
          isAudioAvailable: false,
        });
        return;
      }

      set({
        currentChapterId: chapterId,
        glossChapterAudio: glossChapterAudio,
        mainChapterAudio: mainChapterAudio,
        isLoading: false,
        isAudioAvailable: true,
      });
    },

    clearChapterAudio: () => {
      set({
        currentBibleVerseId: undefined,
        currentChapterId: undefined,
        glossChapterAudio: undefined,
        mainChapterAudio: undefined,
        isAudioEnabled: false,
        isAudioAvailable: false,
      });
    },
  }));
};
