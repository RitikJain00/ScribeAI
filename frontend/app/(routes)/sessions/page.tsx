'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:4000/api/sessions", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // <--- add token here
        },
      });
        const data = await res.json();
        setSessions(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSessions();
  }, []);

  const openSession = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${id}`);
      const data = await res.json();
      setCurrentSession(data);
      setSummary(data.summary?.text || null);
      setOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    if (!currentSession) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${currentSession.id}/summary`, {
        method: 'POST',
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-lg font-semibold mb-2">No Sessions Yet</div>
            <p className="text-muted-foreground mb-4">Start recording to create your first session.</p>
            <Button onClick={() => window.location.href='/dashboard'}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions?.length > 0 && sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{session.title}</CardTitle>
              <CardDescription>{new Date(session.createdAt).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => openSession(session.id)}>View Transcript</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentSession && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-6 w-[90vw] max-w-3xl">
            <DialogHeader>
              <DialogTitle>{currentSession.title}</DialogTitle>
              <DialogDescription>{new Date(currentSession.createdAt).toLocaleString()}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 max-h-64 overflow-y-auto border p-4 rounded bg-gray-50">
              {currentSession.fullText}
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={fetchSummary} disabled={loadingSummary}>
                {loadingSummary ? 'Generating...' : summary ? 'Refresh Summary' : 'Get Summary'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </div>

            {summary && (
              <div className="mt-4 p-4 border rounded bg-white shadow-sm">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p>{summary}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
