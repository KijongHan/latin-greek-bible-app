import { create } from "zustand";

interface PingStore {
  count: number;
  increment: () => void;
  reset: () => void;
}

export const usePingStore = create<PingStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));
