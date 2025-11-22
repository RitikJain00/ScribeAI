'use client';

import { useEffect, useRef, useState } from 'react';
import { useRecordingStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function TranscriptFeed() {
  const { transcript, status, setTranscript } = useRecordingStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Auto-scroll to bottom whenever transcript updates
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleSave = async () => {
    if (!transcript || transcript.length === 0) return;
  
    setSaving(true);
    try {
      const token = localStorage.getItem('token'); // or wherever you store it
      if (!token) {
        alert('Not logged in');
        setSaving(false);
        return;
      }
  
      const res = await fetch('http://localhost:4000/api/transcript/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // add JWT here
        },
        body: JSON.stringify({
          title: `Session ${new Date().toLocaleString()}`,
          fullText: Array.isArray(transcript) ? transcript.join(' ') : transcript,
        }),
      });
  
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save transcript');
      }
  
      alert('Transcript saved successfully!');
      setTranscript('');
    } catch (err) {
      console.error(err);
      alert('Error saving transcript');
    } finally {
      setSaving(false);
    }
  };
  

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Transcript Panel */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Live Transcript</CardTitle>
              <CardDescription>Real-time transcription of your recording</CardDescription>
            </div>
            {status === 'recording' && (
              <Badge variant="default" className="bg-success text-success-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success-foreground animate-pulse" />
                Recording
              </Badge>
            )}
            {status === 'paused' && <Badge variant="secondary">Paused</Badge>}
            {status === 'processing' && <Badge variant="secondary">Processing</Badge>}
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            {transcript.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-center">
                  {status === 'idle'
                    ? 'Start recording to see live transcription'
                    : 'Waiting for transcription...'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {Array.isArray(transcript) ? transcript.join(' ') : transcript}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
          <Button
      onClick={handleSave}
      disabled={status !== 'idle' || transcript.length === 0 || saving}
      variant="default"
    >
      {saving ? 'Saving...' : 'Save Transcript'}
    </Button>

      </div>
    </div>
  );
}
