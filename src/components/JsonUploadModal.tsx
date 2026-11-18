import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileCode,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  FileJson,
} from 'lucide-react';
import { SceneData, VoiceConfig, ProjectScriptJson } from '../types';
import { downloadBlob } from '../utils/wavHelper';
import { REFERENCE_SCRIPT_JSON } from '../data/defaultScenes';
import {
  parseAndNormalizeScriptJson,
  sanitizeFilename,
  ParsedScriptResult,
} from '../utils/scriptParser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  currentVoiceConfig: VoiceConfig;
  currentScenes: SceneData[];
  onApplyScript: (data: ParsedScriptResult, autoGenerateAudio?: boolean) => void;
  onOpenReferenceJson: () => void;
}

export const JsonUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentTitle,
  currentVoiceConfig,
  currentScenes,
  onApplyScript,
  onOpenReferenceJson,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedScriptResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parseAndValidateJson = (rawString: string): ParsedScriptResult | null => {
    setErrorMessage(null);
    try {
      const result = parseAndNormalizeScriptJson(rawString, currentVoiceConfig);
      setParsedData(result);
      return result;
    } catch (err: any) {
      setParsedData(null);
      setErrorMessage(err.message || 'Failed to parse JSON.');
      return null;
    }
  };

  // Uploading a .json file automatically loads scenes and triggers audio generation
  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setErrorMessage('Please select a valid .json file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      const result = parseAndValidateJson(content);
      if (result) {
        onApplyScript(result, true);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyAndGenerate = () => {
    if (!parsedData) return;
    onApplyScript(parsedData, true);
    onClose();
  };

  const handleDownloadCurrentJson = () => {
    if (currentScenes.length === 0) return;
    const exportData: ProjectScriptJson = {
      title: currentTitle,
      language: 'Bangla',
      voice: currentVoiceConfig,
      scenes: currentScenes.map((s) => ({
        scene: s.scene,
        duration: s.duration,
        emotion: s.emotion,
        title: s.title,
        narration: s.narration,
        fileName: s.fileName,
        visualNote: s.visualNote,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const fileName = `${sanitizeFilename(currentTitle || 'script')}_scenes.json`;
    downloadBlob(blob, fileName);
  };

  const handleDownloadReferenceJson = () => {
    const blob = new Blob([JSON.stringify(REFERENCE_SCRIPT_JSON, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, 'reference_voiceover_script.json');
  };

  const handleLoadReferenceIntoEditor = () => {
    const str = JSON.stringify(REFERENCE_SCRIPT_JSON, null, 2);
    setJsonText(str);
    setActiveTab('paste');
    parseAndValidateJson(str);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Upload Script JSON & Auto-Generate Audio
              </h2>
              <p className="text-xs text-slate-400">
                Upload a .json file to immediately load scenes and generate voiceover audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Template Actions */}
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload .json File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'paste'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste / Edit JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenReferenceJson();
              }}
              className="flex items-center gap-1 text-[11px] font-mono text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition"
              title="View full 7-scene Reference JSON"
            >
              <FileJson className="w-3 h-3" />
              <span>Ref JSON</span>
            </button>

            {currentScenes.length > 0 && (
              <button
                onClick={handleDownloadCurrentJson}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                title="Download current script as JSON"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Export Current</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/60'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/25">
                  <FileCode className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Click to browse or drag and drop your script .json
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Audio generation starts automatically for all scenes as soon as the file is uploaded.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* Reference JSON quick actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                <span>Need the required JSON structure?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadReferenceJson}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download Ref JSON</span>
                  </button>
                  <button
                    onClick={handleLoadReferenceIntoEditor}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-mono border border-indigo-500/30 transition"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Edit Ref JSON</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Script JSON Content
                </label>
                <button
                  onClick={handleLoadReferenceIntoEditor}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-mono underline"
                >
                  Insert Reference JSON
                </button>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  if (e.target.value.trim()) {
                    parseAndValidateJson(e.target.value);
                  } else {
                    setParsedData(null);
                    setErrorMessage(null);
                  }
                }}
                rows={10}
                placeholder={`{\n  "title": "What is Artificial Intelligence?",\n  "language": "Bangla",\n  "voice": {\n    "gender": "Male",\n    "style": "Professional technology educator",\n    "tone": "Confident, friendly, educational",\n    "speed": "Medium",\n    "pronunciation": "Clear Bangla with natural English technical terminology"\n  },\n  "scenes": [\n    {\n      "scene": 1,\n      "duration": 10,\n      "emotion": "Curious",\n      "narration": "আমরা প্রতিদিন ChatGPT..."\n    }\n  ]\n}`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Validation Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">JSON Validation Error</p>
                <p className="text-[11px] text-rose-200 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Parsed Script Preview Card */}
          {parsedData && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Valid Script Detected</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {parsedData.scenes.length} Scenes
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Title</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {parsedData.title}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Voice</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {parsedData.voiceConfig?.gender || currentVoiceConfig.gender} (
                    {parsedData.voiceConfig?.voiceName || currentVoiceConfig.voiceName})
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Estimated Time</span>
                  <span className="font-semibold text-slate-200 font-mono block">
                    ~{parsedData.scenes.reduce((acc, s) => acc + s.duration, 0)}s
                  </span>
                </div>
              </div>

              {/* Scene list preview */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {parsedData.scenes.map((s) => (
                  <div
                    key={s.scene}
                    className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-indigo-400 font-bold shrink-0">
                        #{s.scene}
                      </span>
                      <span className="text-slate-300 truncate">{s.narration}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 shrink-0">
                      {s.emotion} (~{s.duration}s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyAndGenerate}
            disabled={!parsedData}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Load Script & Generate Audio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
