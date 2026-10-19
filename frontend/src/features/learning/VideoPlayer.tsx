import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayCircle, Check, Loader2, VideoOff } from 'lucide-react';
import { useUpdateLessonProgress } from './hooks';

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
        className="w-full aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white/50 space-y-3 p-6 border border-slate-800 shadow-inner"
        data-testid="no-video-container"
      >
        <VideoOff className="w-12 h-12 text-slate-500" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-300">No video stream for this lesson</p>
          <p className="text-xs text-slate-500 mt-1">
            Check the Reading Content and Transcript tabs below for this lesson's curriculum.
          </p>
        </div>
      </div>
    );
  }

  // Check if it's an external embed (e.g. youtube or vimeo)
  const isEmbed =
    videoUrl.includes('youtube.com') ||
    videoUrl.includes('youtu.be') ||
    videoUrl.includes('vimeo.com');

  if (isEmbed) {
    return (
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800 relative">
        <iframe
          src={videoUrl}
          title="Lesson Video"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-800 group">
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-medium text-white/80 shadow">
            <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            Saving progress...
          </span>
        ) : isSaved ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 backdrop-blur-md text-[11px] font-semibold text-emerald-300 shadow border border-emerald-800/50">
            <Check className="w-3 h-3 text-emerald-400" />
            Progress saved ({formatTime(currentTime)})
          </span>
        ) : currentTime > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-md text-[11px] font-medium text-white/70 shadow">
            <PlayCircle className="w-3 h-3 text-indigo-400" />
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        ) : null}
      </div>
    </div>
  );
};
