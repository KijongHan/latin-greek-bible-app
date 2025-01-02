import { create } from "zustand";
import { ChapterAudio } from "./bible.model";
import { getChapterAudioForBibles } from "./bibleaudio.queries";

interface BibleAudioStore {
  isPlaying: boolean;
  isLoading: boolean;
  chapterId: string | undefined;
  englishChapterAudio: ChapterAudio | undefined;
  ancientChapterAudio: ChapterAudio | undefined;

  loadChapterAudioForBibles: (
    englishBibleId: string,
    ancientBibleId: string,
    chapterId: string
  ) => Promise<void>;
}

export const useBibleAudioStore = create<BibleAudioStore>((set, get) => ({
  chapterId: undefined,
  englishChapterAudio: undefined,
  ancientChapterAudio: undefined,
  isLoading: false,
  isPlaying: false,

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
    set({
      chapterId,
      englishChapterAudio: englishChapterAudio,
      ancientChapterAudio: ancientChapterAudio,
      isLoading: false,
    });
  },
}));
