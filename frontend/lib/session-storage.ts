import { Session } from './types';

const SESSIONS_KEY = 'scribeai_sessions';

export const getSessions = (): Session[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(SESSIONS_KEY);
  if (!stored) return [];
  
  try {
    const sessions = JSON.parse(stored);
    return sessions.map((s: any) => ({
      ...s,
      timestamp: new Date(s.timestamp),
    }));
  } catch {
    return [];
  }
};

export const getSession = (id: string): Session | null => {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
};

export const saveSession = (session: Session): void => {
  const sessions = getSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.unshift(session);
  }
  
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const deleteSession = (id: string): void => {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
};
