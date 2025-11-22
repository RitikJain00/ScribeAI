'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Session {
  id: string;
  title: string;
  fullText?: string;
  createdAt: string;
  summary?: { text: string };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [openTranscript, setOpenTranscript] = useState(false);
  const [openSummary, setOpenSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const token = localStorage.getItem("token"); // JWT

  // Fetch all sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSessions(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSessions();
  }, []);

  // Open transcript dialog
  const openSession = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCurrentSession(data);
      setOpenTranscript(true);
      setSummary(data.summary?.text || null); // preload summary if exists
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch/generate summary
  const fetchSummary = async () => {
    if (!currentSession) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/sessions/${currentSession.id}/summary`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setSummary(data.summary);
      setOpenSummary(true); // open summary modal
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{session.title}</CardTitle>
              <CardDescription>{new Date(session.createdAt).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => openSession(session.id)}>
                View Transcript
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transcript Dialog */}
      {currentSession && (
        <Dialog open={openTranscript} onOpenChange={setOpenTranscript}>
          <DialogContent className="p-6 w-[90vw] max-w-3xl">
            <DialogHeader>
              <DialogTitle>{currentSession.title}</DialogTitle>
              <DialogDescription>
                {new Date(currentSession.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <textarea
              className="w-full h-64 p-4 mt-4 border rounded"
              readOnly
              value={currentSession.fullText}
            />

            <div className="mt-4 flex gap-2">
              <Button onClick={fetchSummary} disabled={loadingSummary}>
                {loadingSummary ? "Generating..." : "Summary"}
              </Button>
              <Button variant="outline" onClick={() => setOpenTranscript(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Summary Dialog */}
      <Dialog open={openSummary} onOpenChange={setOpenSummary}>
        <DialogContent className="p-6 w-[80vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Summary</DialogTitle>
          </DialogHeader>

          <textarea
            className="w-full h-64 p-4 mt-4 border rounded"
            readOnly
            value={summary || ""}
          />

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setOpenSummary(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
