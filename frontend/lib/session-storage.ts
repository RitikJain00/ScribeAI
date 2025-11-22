'use client';

import { create } from 'zustand';

export interface Session {
  id: string;
  title: string;
  timestamp: string;
  transcript: string;
  summary?: string;
  audioMode: 'mic' | 'tab';
}

interface SessionState {
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;
  summary: string | null;
  setSummary: (summary: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),
  summary: null,
  setSummary: (summary) => set({ summary }),
}));
