import React from 'react';
import {
  Sparkles,
  Download,
  Sliders,
  Music,
  CheckCircle,
  FileArchive,
  RefreshCw,
  Upload,
  FileJson,
} from 'lucide-react';
import { VoiceConfig } from '../types';
import { getGeminiVoiceGender } from '../data/geminiVoices';

interface Props {
  title: string;
  voiceConfig: VoiceConfig;
  totalScenes: number;
  readyCount: number;
  isBatchGenerating: boolean;
  batchProgress: { current: number; total: number };
  googleKeysCount: number;
  hasElevenLabsKey: boolean;
  onGenerateAll: () => void;
  onDownloadZip: () => void;
  onDownloadMerged: () => void;
  onOpenSettings: () => void;
  onOpenJsonUpload: () => void;
  onOpenReferenceJson: () => void;
  onOpenApiKeys: () => void;
}

export const Header: React.FC<Props> = ({
  title,
  voiceConfig,
  totalScenes,
  readyCount,
  isBatchGenerating,
  batchProgress,
  googleKeysCount,
  hasElevenLabsKey,
  onGenerateAll,
  onDownloadZip,
  onDownloadMerged,
  onOpenSettings,
  onOpenJsonUpload,
  onOpenReferenceJson,
  onOpenApiKeys,
}) => {
  return (
    <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Top bar with branding and actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <span>Bangla AI Voice Studio</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>
                      {voiceConfig.provider === 'elevenlabs'
                        ? (voiceConfig.elevenLabsModel || 'eleven_multilingual_v2')
                        : (voiceConfig.ttsModel || 'gemini-3.8-flash-tts')}
                    </span>
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Educational Voiceover: <span className="text-slate-200">{title}</span>
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              {(() => {
                const resolvedGender =
                  voiceConfig.provider === 'elevenlabs'
                    ? voiceConfig.gender
                    : getGeminiVoiceGender(voiceConfig.voiceName, voiceConfig.gender);
                const isFemale = resolvedGender === 'Female';
                return (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className={`px-2.5 py-0.5 rounded-md font-mono font-semibold border transition hover:brightness-110 ${
                      isFemale
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    }`}
                    title="Click to switch Male or Female voice"
                  >
                    {isFemale ? '♀ Female' : '♂ Male'} •{' '}
                    {voiceConfig.provider === 'elevenlabs'
                      ? `${voiceConfig.elevenLabsVoiceName || 'Adam'} (ElevenLabs)`
                      : voiceConfig.voiceName}
                  </button>
                );
              })()}
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                Bangla + Tech English
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                24kHz Mono WAV
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>{readyCount}/{totalScenes} Scenes Ready</span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* API Keys & Engine Configuration */}
            <button
              onClick={onOpenApiKeys}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm transition hover:border-indigo-500"
              title="Configure multiple Google API keys & ElevenLabs API"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>API Keys & Engines</span>
              {googleKeysCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                  {googleKeysCount}
                </span>
              )}
            </button>

            {/* Generate All Scenes */}
            <button
              onClick={onGenerateAll}
              disabled={isBatchGenerating || totalScenes === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isBatchGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    Generating Scene {batchProgress.current}/{batchProgress.total}...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>
                    {totalScenes === 0
                      ? 'No Script Loaded'
                      : readyCount === totalScenes
                      ? `Regenerate All ${totalScenes} Scenes`
                      : `Generate All ${totalScenes} Scenes`}
                  </span>
                </>
              )}
            </button>

            {/* Download All as ZIP */}
            <button
              onClick={onDownloadZip}
              disabled={readyCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Download all scene-wise WAV files and manifest in a ZIP"
            >
              <FileArchive className="w-4 h-4 text-amber-400" />
              <span>ZIP</span>
            </button>

            {/* Merge Full Track */}
            <button
              onClick={onDownloadMerged}
              disabled={readyCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export complete merged narration audio track"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Full Track</span>
            </button>

            {/* Reference JSON */}
            <button
              onClick={onOpenReferenceJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition shadow-sm"
              title="View or download the 7-scene Reference JSON format"
            >
              <FileJson className="w-4 h-4 text-amber-400" />
              <span>Ref JSON</span>
            </button>

            {/* Upload Script (.json) */}
            <button
              onClick={onOpenJsonUpload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition shadow-sm"
              title="Upload custom script JSON to auto-generate audio"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload JSON</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Voice & Narration Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
