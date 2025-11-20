import { create } from 'zustand';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'processing' | 'completed';
export type AudioMode = 'mic' | 'tab';

interface RecordingState {
  status: RecordingStatus;
  audioMode: AudioMode;
  transcript: string[];
  currentSessionId: string | null;
  error: string | null;
  
  setStatus: (status: RecordingStatus) => void;
  setAudioMode: (mode: AudioMode) => void;
  addTranscriptLine: (line: string) => void;
  clearTranscript: () => void;
  setCurrentSessionId: (id: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  status: 'idle',
  audioMode: 'mic',
  transcript: [],
  currentSessionId: null,
  error: null,
  
  setStatus: (status) => set({ status }),
  setAudioMode: (mode) => set({ audioMode: mode }),
  addTranscriptLine: (line) => set((state) => ({ 
    transcript: [...state.transcript, line] 
  })),
  clearTranscript: () => set({ transcript: [] }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    status: 'idle', 
    transcript: [], 
    currentSessionId: null, 
    error: null 
  }),
}));
