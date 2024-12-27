import { create } from "zustand";

interface AppStore {
  isScrolled: boolean;

  setIsScrolled: (isScrolled: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isScrolled: false,

  setIsScrolled: (isScrolled) => set({ isScrolled }),
}));
