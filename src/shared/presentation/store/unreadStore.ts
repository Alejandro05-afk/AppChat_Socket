import { create } from 'zustand';

interface UnreadState {
  counts: Record<string, number>;
  increment: (roomId: string) => void;
  clear: (roomId: string) => void;
  total: () => number;
}

export const useUnreadStore = create<UnreadState>((set, get) => ({
  counts: {},
  increment: (roomId) =>
    set((s) => ({ counts: { ...s.counts, [roomId]: (s.counts[roomId] ?? 0) + 1 } })),
  clear: (roomId) =>
    set((s) => {
      const c = { ...s.counts };
      delete c[roomId];
      return { counts: c };
    }),
  total: () => Object.values(get().counts).reduce((a, b) => a + b, 0),
}));
