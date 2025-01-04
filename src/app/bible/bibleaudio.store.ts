import { create } from "zustand";
import { ChapterAudio } from "./bible.model";
import { getChapterAudioForBibles } from "./bibleaudio.queries";

interface BibleAudioStore {
  isAudioAvailable: boolean;
  isAudioEnabled: boolean;
  isAudioPlaying: boolean;
  isLoading: boolean;
  currentChapterId: string | undefined;
  currentBibleVerseId: string | undefined;
  englishChapterAudio: ChapterAudio | undefined;
  ancientChapterAudio: ChapterAudio | undefined;

  setIsAudioPlaying: (isAudioPlaying: boolean) => void;
  setIsAudioEnabled: (isAudioEnabled: boolean) => void;
  setCurrentBibleVerseId: (bibleVerseId: string | undefined) => void;
  loadChapterAudioForBibles: (
    englishBibleId: string,
    ancientBibleId: string,
    chapterId: string
  ) => Promise<void>;
  clearChapterAudio: () => void;
}

export const useBibleAudioStore = create<BibleAudioStore>((set) => ({
  isAudioPlaying: false,
  isAudioAvailable: true,
  isAudioEnabled: false,
  currentChapterId: undefined,
  englishChapterAudio: undefined,
  ancientChapterAudio: undefined,
  isLoading: false,
  currentBibleVerseId: undefined,

  setIsAudioPlaying: (isAudioPlaying: boolean) => {
    set({ isAudioPlaying });
  },

  setIsAudioEnabled: (isAudioEnabled: boolean) => {
    console.log("setIsAudioEnabled", isAudioEnabled);
    set({ isAudioEnabled });
  },

  setCurrentBibleVerseId: (bibleVerseId: string | undefined) => {
    set({ currentBibleVerseId: bibleVerseId });
  },

  loadChapterAudioForBibles: async (
    englishBibleId,
    ancientBibleId,
    chapterId
  ) => {
    set({ isLoading: true });
    const [englishChapterAudio, ancientChapterAudio] =
      await getChapterAudioForBibles(englishBibleId, ancientBibleId, chapterId);
    console.log(englishChapterAudio);
    console.log(ancientChapterAudio);

    if (
      englishChapterAudio.versesAudio.length === 0 ||
      ancientChapterAudio.versesAudio.length === 0
    ) {
      set({
        currentBibleVerseId: undefined,
        currentChapterId: undefined,
        englishChapterAudio: undefined,
        ancientChapterAudio: undefined,
        isLoading: false,
        isAudioEnabled: false,
        isAudioAvailable: false,
      });
      return;
    }

    set({
      currentChapterId: chapterId,
      englishChapterAudio: englishChapterAudio,
      ancientChapterAudio: ancientChapterAudio,
      isLoading: false,
      isAudioAvailable: true,
    });
  },

  clearChapterAudio: () => {
    set({
      currentBibleVerseId: undefined,
      currentChapterId: undefined,
      englishChapterAudio: undefined,
      ancientChapterAudio: undefined,
      isAudioEnabled: false,
      isAudioAvailable: false,
    });
  },
}));
