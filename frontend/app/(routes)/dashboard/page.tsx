'use client';


import { useRouter } from 'next/navigation';
import { AudioModeSelector } from '@/components/audio-mode-selector';
import { RecordingControls } from '@/components/recording-controls';
import { useRecordingStore } from '@/lib/store';
import { TranscriptFeed } from '@/components/transcript-feed';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';


export default function DashboardPage() {
  const router = useRouter();
  const { error, addTranscriptLine, setStatus, transcript, audioMode, setCurrentSessionId } = useRecordingStore();


  return (
    <div className="h-full p-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <AudioModeSelector />
          <RecordingControls />
        </div>

        <div className="lg:col-span-2 h-[calc(100vh-12rem)]">
          <TranscriptFeed />
        </div>
      </div>
    </div>
  );
}
