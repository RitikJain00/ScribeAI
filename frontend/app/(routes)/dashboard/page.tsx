'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AudioModeSelector } from "@/components/audio-mode-selector";
import { RecordingControls } from "@/components/recording-controls";
import { useRecordingStore } from "@/lib/store";
import { TranscriptFeed } from "@/components/transcript-feed";
import { getSocket, onTranscript, onProcessing, onCompleted } from '@/lib/socket';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { error, addTranscriptLine, setStatus, transcript, audioMode, setCurrentSessionId } = useRecordingStore();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // --- Verify user ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.replace("/login");

    const verifyUser = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          return router.replace("/login");
        }

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [router]);

  // --- Socket listeners for live transcription ---
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const unsubscribeTranscript = onTranscript((text) => addTranscriptLine(text));
    const unsubscribeProcessing = onProcessing(() => setStatus('processing'));
    const unsubscribeCompleted = onCompleted(() => {
      setStatus('completed');

      const sessionId = `session_${Date.now()}`;
      const finalTranscript = useRecordingStore.getState().transcript;

      const session = {
        id: sessionId,
        title: `Recording ${new Date().toLocaleDateString()}`,
        timestamp: new Date(),
        transcript: finalTranscript.join('\n'),
        audioMode,
      };
      setCurrentSessionId(sessionId);
    });

    return () => {
      unsubscribeTranscript();
      unsubscribeProcessing();
      unsubscribeCompleted();
    };
  }, [addTranscriptLine, setStatus, audioMode, setCurrentSessionId]);

  if (loading) return <div className="h-screen flex items-center justify-center"><p className="text-muted-foreground text-lg">Loading...</p></div>;

  return (
    <div className="h-full p-6 space-y-6">
      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Welcome, {user?.name}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

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
