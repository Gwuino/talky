import { create } from 'zustand';

interface SettingsState {
  audioInputId: string | null;
  audioOutputId: string | null;
  videoInputId: string | null;
  setAudioInput: (id: string | null) => void;
  setAudioOutput: (id: string | null) => void;
  setVideoInput: (id: string | null) => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(key);
  return val ? (val as unknown as T) : fallback;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  audioInputId: loadFromStorage('settings:audioInput', null),
  audioOutputId: loadFromStorage('settings:audioOutput', null),
  videoInputId: loadFromStorage('settings:videoInput', null),

  setAudioInput: (id) => {
    if (id) localStorage.setItem('settings:audioInput', id);
    else localStorage.removeItem('settings:audioInput');
    set({ audioInputId: id });
  },
  setAudioOutput: (id) => {
    if (id) localStorage.setItem('settings:audioOutput', id);
    else localStorage.removeItem('settings:audioOutput');
    set({ audioOutputId: id });
  },
  setVideoInput: (id) => {
    if (id) localStorage.setItem('settings:videoInput', id);
    else localStorage.removeItem('settings:videoInput');
    set({ videoInputId: id });
  },
}));
