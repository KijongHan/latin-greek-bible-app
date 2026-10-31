import { create } from "zustand";
import { Session } from "../types";

// What is being read: ids and flags only. The data for them comes from the
// TanStack queries, through the reader hooks.
export interface ReaderStore {
  // undefined until chosen; the hooks fall back to the first preset
  mainBibleId: string | undefined;
  glossBibleId: string | undefined;
  // undefined on the front page
  chapterId: string | undefined;
  showGlossText: boolean;
  // true while navigation prefetches the next chapter
  isNavigating: boolean;
  // The visits of this reading session, saved after each one
  currentSession: Session | undefined;

  setBibles: (mainBibleId?: string, glossBibleId?: string) => void;
  setChapter: (chapterId?: string) => void;
  setShowGlossText: (showGlossText: boolean) => void;
  setIsNavigating: (isNavigating: boolean) => void;
  setCurrentSession: (session: Session) => void;
}

export const useReaderStore = create<ReaderStore>((set) => ({
  mainBibleId: undefined,
  glossBibleId: undefined,
  chapterId: undefined,
  showGlossText: true,
  isNavigating: false,
  currentSession: undefined,

  setBibles: (mainBibleId, glossBibleId) => set({ mainBibleId, glossBibleId }),
  setChapter: (chapterId) => set({ chapterId }),
  setShowGlossText: (showGlossText) => set({ showGlossText }),
  setIsNavigating: (isNavigating) => set({ isNavigating }),
  setCurrentSession: (currentSession) => set({ currentSession }),
}));
