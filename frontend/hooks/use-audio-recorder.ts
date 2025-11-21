import { useEffect, useRef, useCallback } from 'react';
import { useRecordingStore, AudioMode } from '@/lib/store';
import { getSocket, emitAudioChunk } from '@/lib/socket';

export const useAudioRecorder = () => {
  const { status, audioMode, setStatus, setError } = useRecordingStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      console.log('clicked');

      // Request appropriate media stream based on mode
      let stream: MediaStream;

      if (audioMode === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        // Tab audio capture
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: false,
          audio: true,
        });
      }

      streamRef.current = stream;

      // Choose a supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Send audio chunks every 1 second
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          emitAudioChunk(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[v0] MediaRecorder stopped');
      };

      mediaRecorder.onerror = (event) => {
        console.error('[v0] MediaRecorder error:', event);
        setError('Recording error occurred');
        setStatus('idle');
      };

      // Start recording with 1 second timeslices
      mediaRecorder.start(1000);
      setStatus('recording');

      // Connect socket if not connected
      const socket = getSocket();
      if (!socket.connected) {
        socket.connect();
      }

    } catch (error) {
      console.error('[v0] Error starting recording:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Permission denied. Please allow microphone/audio access.');
        } else if (error.name === 'NotFoundError') {
          setError('No audio device found.');
        } else {
          setError('Failed to start recording: ' + error.message);
        }
      }
      setStatus('idle');
    }
  }, [audioMode, setStatus, setError]);

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.pause();
      setStatus('paused');
    }
  }, [setStatus]);

  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'paused'
    ) {
      mediaRecorderRef.current.resume();
      setStatus('recording');
    }
  }, [setStatus]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();

      // Small delay to ensure last data chunk arrives
      setTimeout(() => {
        setStatus('processing');
      }, 200);
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [setStatus]);

  // Cleanup when unmounting or audioMode changes
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioMode]);

  // Handle tab/window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () =>
      window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    isProcessing: status === 'processing',
  };
};
