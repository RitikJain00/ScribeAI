// /hooks/use-audio-recorder.ts
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRecordingStore, AudioMode } from '@/lib/store';
import { getSocket, emitAudioChunk } from '@/lib/socket';

/**
 * Robust audio recorder hook supporting:
 * - microphone (getUserMedia({ audio: true }))
 * - tab/system audio (getDisplayMedia({ video: true, audio: true }) -> stop video track)
 *
 * Ensures socket is persistent and waits for readiness before enabling start.
 */
export const useAudioRecorder = () => {
  const { status, audioMode, setStatus, setError, clearTranscript } = useRecordingStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isResetting, setIsResetting] = useState(false);
  const [isReady, setIsReady] = useState(false); // socket/Deepgram ready
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize persistent socket (call on mount)
  const initSocket = useCallback(() => {
    // If already have socket and connected, mark ready
    if (socketRef.current && socketRef.current.connected) {
      setIsReady(true);
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log('[Socket] connected');
      setIsConnecting(false);
      // mark ready by default on connect; if your server emits a specific "deepgram-ready"
      // event you can also listen for that and set isReady only then.
      setIsReady(true);
    };

    const onDisconnect = () => {
      console.log('[Socket] disconnected');
      setIsReady(false);
    };

    const onConnectError = (err: any) => {
      console.error('[Socket] connect_error', err);
      setIsReady(false);
      setIsConnecting(false);
    };

    // Optional server-side event that specifically indicates Deepgram is ready.
    // If your server emits e.g. 'deepgram-ready', listen and treat that as readiness.
    const onDeepgramReady = () => {
      console.log('[Socket] deepgram-ready');
      setIsReady(true);
      setIsConnecting(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('deepgram-ready', onDeepgramReady); // optional

    // Connect if not connected already
    if (!socket.connected) socket.connect();
  }, []);

  // call init on mount
  useEffect(() => {
    initSocket();

    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (socketRef.current && socketRef.current.connected) {
          // Keep socket persistent across navigation? If you prefer to close on unmount,
          // uncomment the next line. For persistence leave it connected.
          // socketRef.current.disconnect();
        }
      } catch (err) {
        console.error('[useAudioRecorder] cleanup error', err);
      }
    };
  }, [initSocket]);

  // Start recording
  const startRecording = useCallback(async () => {
    // Block if resetting or not ready
    if (isResetting) {
      console.warn('[useAudioRecorder] start prevented - resetting in progress');
      return;
    }
    if (!isReady) {
      console.warn('[useAudioRecorder] start prevented - socket not ready');
      setError?.('Still connecting — please wait until connection is ready.');
      return;
    }

    try {
      setError?.(null);

      // If any previous recorder active, stop it first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Acquire stream:
      // - mic: getUserMedia({ audio: true })
      // - tab: getDisplayMedia({ video: true, audio: true }) then stop video track
      let stream: MediaStream;
      if (audioMode === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        // IMPORTANT: request video:true for getDisplayMedia so many browsers return tab/system audio.
        // We will stop the video track immediately so the user is not actually screen-sharing.
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

        // If there is a video track, stop it immediately to avoid showing a persistent screen-share.
        // Keep audio tracks (system/tab audio).
        const videoTracks = stream.getVideoTracks();
        if (videoTracks && videoTracks.length > 0) {
          // Stop the video track(s) immediately but keep the audio tracks in the stream.
          videoTracks.forEach((vt) => {
            try {
              vt.stop();
              stream.removeTrack(vt);
            } catch (err) {
              // ignore
            }
          });
        }
      }

      // Save stream for cleanup
      streamRef.current = stream;

      // Choose a stable mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // ondataavailable: send chunk to server via socket (via emitAudioChunk helper)
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        try {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
            // emitAudioChunk should accept Blob/ArrayBuffer per your implementation
            emitAudioChunk(event.data);
          }
        } catch (err) {
          console.error('[useAudioRecorder] ondataavailable error', err);
        }
      };

      mediaRecorder.onerror = (ev) => {
        console.error('[useAudioRecorder] mediaRecorder error', ev);
        setError?.('Recording error occurred');
        setStatus('idle');
      };

      mediaRecorder.onstop = () => {
        // when stopped we put into processing state briefly
        setStatus('processing');
        // small delay to allow last chunk processing
        setTimeout(() => {
          setStatus('idle');
          chunksRef.current = [];
        }, 500);
      };

      // start with 1s timeslice so ondataavailable fires every second
      mediaRecorder.start(1000);
      setStatus('recording');

      // Ensure socket is connected (initSocket should have been called)
      if (!socketRef.current) initSocket();
      if (socketRef.current && !socketRef.current.connected) socketRef.current.connect();
    } catch (err) {
      console.error('[useAudioRecorder] startRecording error', err);
      setStatus('idle');
      setError?.('Failed to start recording: ' + (err as Error).message);
    }
  }, [audioMode, initSocket, isReady, isResetting, setError, setStatus]);

  // Pause
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
        setStatus('paused');
      } catch (err) {
        console.error('[useAudioRecorder] pause error', err);
      }
    }
  }, [setStatus]);

  // Resume
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
        setStatus('recording');
      } catch (err) {
        console.error('[useAudioRecorder] resume error', err);
      }
    }
  }, [setStatus]);

  // Stop
  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        // onstop handler sets processing -> idle
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Keep socket connected for persistence (do not disconnect)
    } catch (err) {
      console.error('[useAudioRecorder] stopRecording error', err);
      setStatus('idle');
    }
  }, [setStatus]);

  // Reset: clear transcript & internal state. Do NOT close socket (persistent).
  const resetRecording = useCallback(() => {
    setIsResetting(true);

    const cleanup = () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          // ensure onstop won't set strange states
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        // ignore
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      mediaRecorderRef.current = null;
      chunksRef.current = [];
      setStatus('idle');
      clearTranscript?.();
      setIsResetting(false);
      // keep socketRef.current connected (persistent)
    };

    cleanup();
  }, [setStatus, clearTranscript]);

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
