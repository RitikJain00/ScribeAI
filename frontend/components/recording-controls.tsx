import { Play, Pause, Square, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecordingStore } from '@/lib/store';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

export function RecordingControls() {
  const { status, transcript } = useRecordingStore();
  const {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    isReady,
    isConnecting,
  } = useAudioRecorder();

  const isIdle = status === 'idle';
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isProcessing = status === 'processing';

  const canReset =
    (status === 'paused' || status === 'processing' || status === 'idle') && transcript.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recording Controls</CardTitle>
        <CardDescription>Start, pause, or stop your recording session</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 flex-wrap">
          {isIdle && (
            <Button
              size="lg"
              className="flex-1"
              onClick={startRecording}
              disabled={!isReady || isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          )}

          {isRecording && (
            <>
              <Button variant="outline" size="lg" className="flex-1" onClick={pauseRecording}>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={stopRecording}>
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button size="lg" className="flex-1" onClick={resumeRecording}>
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={stopRecording}>
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </>
          )}

          {isProcessing && (
            <Button disabled size="lg" className="flex-1">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={resetRecording}
            disabled={!canReset}
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
