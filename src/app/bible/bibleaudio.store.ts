import { create } from "zustand";
import { ChapterAudio } from "./bible.model";
import { getChapterAudioForBibles } from "./bibleaudio.queries";

interface BibleAudioStore {
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

export const useBibleAudioStore = create<BibleAudioStore>((set) => ({
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
    const [glossChapterAudio, mainChapterAudio] =
      await getChapterAudioForBibles(glossBibleId, mainBibleId, chapterId);
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
