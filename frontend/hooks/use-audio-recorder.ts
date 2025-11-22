import { useEffect, useRef, useCallback, useState } from 'react';
import { useRecordingStore } from '@/lib/store';
import { getSocket, emitAudioChunk } from '@/lib/socket';

export const useAudioRecorder = () => {
  const { status, audioMode, setStatus, setError, clearTranscript } = useRecordingStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isResetting, setIsResetting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // --- Initialize persistent Socket/Deepgram ---
  const initSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      setIsReady(true);
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsReady(true);
      setIsConnecting(false);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsReady(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
      setIsReady(false);
      setIsConnecting(false);
    });

    if (!socket.connected) socket.connect();
  }, []);

  // --- Start Recording ---
  const startRecording = useCallback(async () => {
    if (isResetting || !isReady) return;
    setError(null);

    // Stop previous recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      const stream: MediaStream =
        audioMode === 'mic'
          ? await navigator.mediaDevices.getUserMedia({ audio: true })
          : await navigator.mediaDevices.getDisplayMedia({ video: false, audio: true });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          if (socketRef.current?.connected) emitAudioChunk(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
        setStatus('idle');
      };

      mediaRecorder.start(1000);
      setStatus('recording');
    } catch (err) {
      console.error('[AudioRecorder] Start error:', err);
      setStatus('idle');
    }
  }, [audioMode, setStatus, setError, isResetting, isReady]);

  // --- Pause / Resume ---
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
    }
  }, [setStatus]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
    }
  }, [setStatus]);

  // --- Stop Recording ---
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        setStatus('processing');
        setTimeout(() => {
          setStatus('idle');
          chunksRef.current = [];
        }, 500);
      };
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [setStatus]);

  // --- Reset Recording ---
  const resetRecording = useCallback(() => {
    setIsResetting(true);
    const cleanup = () => {
      mediaRecorderRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      chunksRef.current = [];
      setStatus('idle');
      clearTranscript();
      setIsResetting(false);
    };
  
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = cleanup;
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
    }
  }, [setStatus, clearTranscript]);
  

  // --- Lifecycle: Mount / Unmount ---
  useEffect(() => {
    initSocket();
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [initSocket]);

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    isProcessing: status === 'processing',
    isResetting,
    isReady,
    isConnecting,
  };
};
