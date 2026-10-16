import { create } from 'zustand';

export type ToastTone = 'neutral' | 'success' | 'error';

export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastState = {
  current: Toast | null;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: (id?: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  show: (message, tone = 'neutral') => set({ current: { id: nextId++, message, tone } }),
  dismiss: (id) => {
    if (id === undefined || get().current?.id === id) set({ current: null });
  },
}));

/** Fire-and-forget confirmation, e.g. `toast('Draft saved', 'success')`. */
export function toast(message: string, tone?: ToastTone) {
  useToastStore.getState().show(message, tone);
}
