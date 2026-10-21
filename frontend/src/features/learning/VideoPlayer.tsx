import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayCircle, Check, Loader2, VideoOff } from 'lucide-react';
import { useUpdateLessonProgress } from './hooks';
import { toEmbedUrl } from '../../lib/video';

export interface VideoPlayerProps {
  lessonId: string;
  courseId?: string;
  videoUrl: string | null;
  initialPositionSeconds?: number;
  onPositionUpdate?: (seconds: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lessonId,
  courseId,
  videoUrl,
  initialPositionSeconds = 0,
  onPositionUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(initialPositionSeconds);
  const [duration, setDuration] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const hasSeekedInitial = useRef<boolean>(false);
  const lastSavedPosition = useRef<number>(initialPositionSeconds);

  const updateProgressMutation = useUpdateLessonProgress(lessonId, courseId);

  // Helper to persist playback position
  const persistPosition = useCallback(
    (seconds: number) => {
      const pos = Math.max(0, Math.floor(seconds));
      // Only save if changed by at least 1 second
      if (Math.abs(pos - lastSavedPosition.current) < 1) {
        return;
      }

      setIsSaving(true);
      lastSavedPosition.current = pos;
      onPositionUpdate?.(pos);

      updateProgressMutation.mutate(
        { last_position_seconds: pos },
        {
          onSuccess: () => {
            setIsSaving(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
          },
          onError: () => {
            setIsSaving(false);
          },
        }
      );
    },
    [updateProgressMutation, onPositionUpdate]
  );

  // Restore position when video metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (!hasSeekedInitial.current && initialPositionSeconds > 0) {
        // Only seek if within video duration
        if (initialPositionSeconds < videoRef.current.duration) {
          videoRef.current.currentTime = initialPositionSeconds;
        }
        hasSeekedInitial.current = true;
      }
    }
  };

  // Periodic autosave interval: every 12 seconds
  useEffect(() => {
    const videoEl = videoRef.current;
    const interval = setInterval(() => {
      if (videoEl && !videoEl.paused) {
        persistPosition(videoEl.currentTime);
      }
    }, 12000);

    return () => {
      clearInterval(interval);
      // Persist latest position on unmount
      if (videoEl) {
        persistPosition(videoEl.currentTime);
      }
    };
  }, [persistPosition]);

  // Handle Pause
  const handlePause = () => {
    if (videoRef.current) {
      persistPosition(videoRef.current.currentTime);
    }
  };

  // Handle Time Update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Render fallback if no video URL
  if (!videoUrl) {
    return (
      <div
        className="w-full aspect-video bg-black/[0.03] dark:bg-[#131418] rounded-2xl flex flex-col items-center justify-center text-[#868E96] space-y-3 p-6 border border-black/[0.08] dark:border-white/[0.08]"
        data-testid="no-video-container"
      >
        <VideoOff className="w-10 h-10 text-[#868E96]" />
        <div className="text-center">
          <p className="text-sm font-semibold text-[#121316] dark:text-[#F3F4F6]">No video stream for this lesson</p>
          <p className="text-xs text-[#868E96] mt-1">
            Check the Reading Content and Transcript tabs below for this lesson's curriculum.
          </p>
        </div>
      </div>
    );
  }

  // YouTube/Vimeo page links are rewritten to their embeddable player URL
  const embedUrl = toEmbedUrl(videoUrl);

  if (embedUrl) {
    return (
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-sm border border-black/[0.1] dark:border-white/[0.1] relative">
        <iframe
          src={embedUrl}
          title="Lesson Video"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-sm border border-black/[0.1] dark:border-white/[0.1] group">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        className="w-full h-full object-contain"
        data-testid="lesson-video-player"
      >
        Your browser does not support HTML5 video streaming.
      </video>

      {/* Playback progress & save indicator banner */}
      <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
        {isSaving ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-medium text-white/90 shadow">
            <Loader2 className="w-3 h-3 animate-spin text-[#0066FF]" />
            Saving progress...
          </span>
        ) : isSaved ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#059669]/90 backdrop-blur-md text-[11px] font-semibold text-white shadow">
            <Check className="w-3 h-3 text-white" />
            Progress saved ({formatTime(currentTime)})
          </span>
        ) : currentTime > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-white/80 shadow">
            <PlayCircle className="w-3 h-3 text-[#0066FF]" />
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        ) : null}
      </div>
    </div>
  );
};
