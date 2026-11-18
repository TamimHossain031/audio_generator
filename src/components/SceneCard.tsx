import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Clock,
  Edit3,
  RefreshCw,
  AlertCircle,
  FileAudio,
  Eye,
} from 'lucide-react';
import { SceneData, SceneAudioState, SceneEmotion } from '../types';
import { BengaliTextHighlighter } from './BengaliTextHighlighter';
import { WaveformVisualizer } from './WaveformVisualizer';
import { base64ToUint8Array, downloadBlob } from '../utils/wavHelper';

interface Props {
  scene: SceneData;
  audioState?: SceneAudioState;
  isActive?: boolean;
  onGenerate: (sceneNum: number) => void;
  onUpdateNarration: (sceneNum: number, newNarration: string) => void;
  onSelectScene?: (sceneNum: number) => void;
}

const EMOTION_COLORS: Record<
  SceneEmotion,
  { bg: string; text: string; border: string; glow: string }
> = {
  Curious: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
  },
  Explanatory: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    glow: 'shadow-sky-500/20',
  },
  Analytical: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  Engaging: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
  },
  Educational: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
  },
  Energetic: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/20',
  },
  Inspirational: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-300',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
};

export const SceneCard: React.FC<Props> = ({
  scene,
  audioState,
  isActive = false,
  onGenerate,
  onUpdateNarration,
  onSelectScene,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(scene.narration);
  const [copiedFilename, setCopiedFilename] = useState(false);

  const emotionStyle = EMOTION_COLORS[scene.emotion] || EMOTION_COLORS.Educational;
  const isGenerating = audioState?.status === 'generating';
  const isReady = audioState?.status === 'ready' && audioState.audioBase64;
  const isError = audioState?.status === 'error';
  const effectiveFileName = audioState?.fileName || scene.fileName;

  const handleCopyFilename = () => {
    navigator.clipboard.writeText(effectiveFileName);
    setCopiedFilename(true);
    setTimeout(() => setCopiedFilename(false), 2000);
  };

  const handleDownload = () => {
    if (!audioState?.audioBase64) return;
    const bytes = base64ToUint8Array(audioState.audioBase64);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' });
    downloadBlob(blob, effectiveFileName);
  };

  const handleSaveEdit = () => {
    onUpdateNarration(scene.scene, editedText);
    setIsEditing(false);
  };

  return (
    <div
      id={`scene-${scene.scene}`}
      className={`rounded-2xl transition-all duration-300 p-5 border ${
        isActive
          ? 'bg-slate-900/95 border-indigo-500 ring-2 ring-indigo-500/30 shadow-2xl shadow-indigo-500/10'
          : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700/80 hover:bg-slate-900/80'
      }`}
    >
      {/* Top Header: Scene index, title, emotion tag, target duration */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-sm font-bold border border-indigo-500/30">
            {String(scene.scene).padStart(2, '0')}
          </span>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">{scene.title}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{scene.visualNote}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Emotion Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${emotionStyle.bg} ${emotionStyle.text} ${emotionStyle.border}`}
          >
            {scene.emotion}
          </span>

          {/* Target Duration */}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Target: ~{scene.duration}s</span>
          </span>
        </div>
      </div>

      {/* File Name Banner (Explicitly highlighting scene-wise filename) */}
      <div className="mt-3.5 px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs text-slate-400 shrink-0">Voice File Name:</span>
          <code className="text-xs font-mono font-semibold text-cyan-300 truncate tracking-wide">
            {effectiveFileName}
          </code>
        </div>
        <button
          onClick={handleCopyFilename}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition shrink-0"
          title="Copy exact file name"
        >
          {copiedFilename ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Narration Body */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Bangla Narration Script
          </span>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Script</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditedText(scene.narration);
                  setIsEditing(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={4}
            className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl p-3 text-sm md:text-base text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <BengaliTextHighlighter text={scene.narration} />
          </div>
        )}
      </div>

      {/* Audio Visualizer & Player (when audio is ready) */}
      {isReady && audioState?.audioBlobUrl && (
        <div className="mt-4">
          <WaveformVisualizer
            audioUrl={audioState.audioBlobUrl}
            fileName={effectiveFileName}
          />
        </div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="mt-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{audioState.error || 'Failed to generate voiceover.'}</span>
          </div>
          <button
            onClick={() => onGenerate(scene.scene)}
            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium shrink-0 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Status Label */}
          {isReady ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Generated (24kHz Mono WAV)</span>
              {audioState?.modelUsed && (
                <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                  <span>{audioState.modelUsed}</span>
                  {typeof audioState.keyUsedIndex === 'number' && (
                    <span className="text-cyan-400 font-bold">
                      (Key #{audioState.keyUsedIndex + 1})
                    </span>
                  )}
                </span>
              )}
            </span>
          ) : isGenerating ? (
            <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Synthesizing Speech...
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-mono">Ready to generate</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Download individual scene file */}
          {isReady && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title={`Download ${effectiveFileName}`}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download .WAV</span>
            </button>
          )}

          {/* Generate / Regenerate Button */}
          <button
            onClick={() => onGenerate(scene.scene)}
            disabled={isGenerating}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-md ${
              isReady
                ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : isReady ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Scene</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Generate Voice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
