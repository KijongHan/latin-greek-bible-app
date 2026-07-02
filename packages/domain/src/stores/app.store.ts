import { create } from "zustand";

interface AppStore {
  isScrolled: boolean;

  setIsScrolled: (isScrolled: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  isScrolled: false,

  setIsScrolled: (isScrolled) => {
    if (isScrolled === get().isScrolled) return;
    set({ isScrolled });
  },
}));
