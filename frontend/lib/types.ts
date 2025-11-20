export interface Session {
  id: string;
  title: string;
  timestamp: Date;
  transcript: string;
  summary?: string;
  duration?: number;
  audioMode: 'mic' | 'tab';
}

export interface TranscriptLine {
  id: string;
  text: string;
  timestamp: Date;
  speaker?: string;
}
