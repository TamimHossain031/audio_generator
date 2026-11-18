import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  FileAudio,
  Radio,
} from 'lucide-react';
import { SceneData, SceneAudioState } from '../types';

interface Props {
  scenes: SceneData[];
  audioStates: Record<number, SceneAudioState>;
  currentSceneIndex: number;
  onSceneChange: (index: number) => void;
}

export const ContinuousPlayer: React.FC<Props> = ({
  scenes,
  audioStates,
  currentSceneIndex,
  onSceneChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const activeScene = scenes[currentSceneIndex];
  const activeAudioState = activeScene ? audioStates[activeScene.scene] : undefined;
  const currentAudioUrl = activeAudioState?.audioBlobUrl;

  // Change audio source when active scene changes
  useEffect(() => {
    if (audioRef.current && currentAudioUrl) {
      audioRef.current.src = currentAudioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current
          .play()
          .catch((e) => console.log('Autoplay blocked or waiting:', e));
      }
    }
  }, [currentSceneIndex, currentAudioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !currentAudioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error(e));
    }
  };

  const handleNext = () => {
    if (currentSceneIndex < scenes.length - 1) {
      onSceneChange(currentSceneIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      onSceneChange(currentSceneIndex - 1);
    }
  };

  const handleEnded = () => {
    if (currentSceneIndex < scenes.length - 1) {
      onSceneChange(currentSceneIndex + 1);
      // Continuous next scene will play via the useEffect
    } else {
      setIsPlaying(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const hasAnyAudio = scenes.some((s) => audioStates[s.scene]?.audioBlobUrl);
  if (!hasAnyAudio) return null;

  return (
    <aside aria-label="Audio timeline player" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-4 py-3">
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={handleEnded}
      />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Active Scene Info */}
        <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-mono font-bold text-sm shrink-0 shadow-lg shadow-indigo-500/20">
            {String(activeScene?.scene || 1).padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 font-semibold">
                <Radio className="w-3 h-3 animate-pulse" />
                PLAYING SCENE {activeScene?.scene} OF {scenes.length}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                {activeScene?.emotion}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-300 truncate mt-0.5">
              {activeAudioState?.fileName || activeScene?.fileName}
            </p>
          </div>
        </div>

        {/* Master Transport Controls */}
        <div className="flex flex-col items-center gap-1 w-full md:w-1/3">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev}
              disabled={currentSceneIndex === 0}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous scene"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentAudioUrl}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-cyan-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={currentSceneIndex >= scenes.length - 1}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next scene"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time scrubber */}
          <div className="w-full flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <div
              onClick={(e) => {
                if (!audioRef.current || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                audioRef.current.currentTime = pos * duration;
                setCurrentTime(pos * duration);
              }}
              className="relative flex-1 h-1.5 bg-slate-800 rounded-full cursor-pointer overflow-hidden group"
            >
              <div
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                }}
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Scene Navigation Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {scenes.map((s, idx) => {
            const hasAudio = Boolean(audioStates[s.scene]?.audioBase64);
            const isSelected = idx === currentSceneIndex;
            return (
              <button
                key={s.scene}
                onClick={() => onSceneChange(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition flex items-center justify-center ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/60 shadow-md'
                    : hasAudio
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-950/60 text-slate-600 border border-slate-800'
                }`}
                title={`Jump to Scene ${s.scene}: ${s.title}`}
              >
                {s.scene}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
