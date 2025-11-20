'use client';

import { useEffect, useRef } from 'react';
import { useRecordingStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function TranscriptFeed() {
  const { transcript, status } = useRecordingStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new transcript arrives
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Transcript</CardTitle>
            <CardDescription>
              Real-time transcription of your recording
            </CardDescription>
          </div>
          {status === 'recording' && (
            <Badge variant="default" className="bg-success text-success-foreground">
              <span className="w-2 h-2 rounded-full bg-success-foreground mr-2 recording-pulse" />
              Recording
            </Badge>
          )}
          {status === 'paused' && (
            <Badge variant="secondary">Paused</Badge>
          )}
          {status === 'processing' && (
            <Badge variant="secondary">Processing</Badge>
          )}
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
            <div className="space-y-3">
              {transcript.map((line, index) => (
                <div
                  key={index}
                  className="transcript-line p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <p className="text-sm leading-relaxed text-foreground">{line}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
