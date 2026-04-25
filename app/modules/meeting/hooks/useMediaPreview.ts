import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages a local media preview stream for the pre-join screen.
 * Actually stops tracks (releases device) on toggle — no fake mute.
 */
export function useMediaPreview() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  // ── Acquire media devices ──────────────────────────────────────

  const initMedia = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      setStream(s);
      setIsAudioOn(true);
      setIsVideoOn(true);
      setHasPermission(true);
    } catch {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        streamRef.current = s;
        setStream(s);
        setIsAudioOn(true);
        setIsVideoOn(false);
        setHasPermission(true);
      } catch {
        setHasPermission(false);
      }
    }
  }, []);

  // ── Release all tracks ─────────────────────────────────────────

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  // ── Toggle Audio: stop track / re-acquire ──────────────────────

  const toggleAudio = useCallback(async () => {
    const current = streamRef.current;
    if (!current) return;

    const audioTrack = current.getAudioTracks()[0];

    if (audioTrack) {
      // Turn OFF: stop the audio track to release mic
      audioTrack.stop();
      current.removeTrack(audioTrack);
      setIsAudioOn(false);
    } else {
      // Turn ON: re-acquire audio
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = audioStream.getAudioTracks()[0];
        current.addTrack(newTrack);
        setIsAudioOn(true);
      } catch {
        console.warn('[Preview] Could not re-acquire audio');
      }
    }

    // Force stream state update
    setStream(new MediaStream(current.getTracks()));
    streamRef.current = current;
  }, []);

  // ── Toggle Video: stop track / re-acquire ──────────────────────

  const toggleVideo = useCallback(async () => {
    const current = streamRef.current;
    if (!current) return;

    const videoTrack = current.getVideoTracks()[0];

    if (videoTrack) {
      // Turn OFF: stop the video track to release camera
      videoTrack.stop();
      current.removeTrack(videoTrack);
      setIsVideoOn(false);
    } else {
      // Turn ON: re-acquire video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = videoStream.getVideoTracks()[0];
        current.addTrack(newTrack);
        setIsVideoOn(true);
      } catch {
        console.warn('[Preview] Could not re-acquire video');
      }
    }

    // Force stream state update
    setStream(new MediaStream(current.getTracks()));
    streamRef.current = current;
  }, []);

  // ── Init on mount, cleanup on unmount ──────────────────────────

  useEffect(() => {
    initMedia();
    return () => stopMedia();
  }, [initMedia, stopMedia]);

  return { stream, isAudioOn, isVideoOn, hasPermission, toggleAudio, toggleVideo, stopMedia };
}
