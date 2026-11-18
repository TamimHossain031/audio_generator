import React, { useState } from 'react';
import {
  X,
  FileJson,
  Copy,
  Check,
  Download,
  Sparkles,
  Info,
} from 'lucide-react';
import { REFERENCE_SCRIPT_JSON } from '../data/defaultScenes';
import { downloadBlob } from '../utils/wavHelper';
import { parseAndNormalizeScriptJson, ParsedScriptResult } from '../utils/scriptParser';
import { VoiceConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentVoiceConfig: VoiceConfig;
  onUseReferenceAndGenerate: (data: ParsedScriptResult) => void;
}

export const ReferenceJsonModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentVoiceConfig,
  onUseReferenceAndGenerate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedJson = JSON.stringify(REFERENCE_SCRIPT_JSON, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRefJson = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    downloadBlob(blob, 'reference_voiceover_script.json');
  };

  const handleUseAndGenerate = () => {
    const parsed = parseAndNormalizeScriptJson(formattedJson, currentVoiceConfig);
    onUseReferenceAndGenerate(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Reference Script JSON
              </h2>
              <p className="text-xs text-slate-400">
                Standard 7-scene JSON schema for uploading and auto-generating voiceover audio
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

        {/* Info Banner */}
        <div className="px-6 pt-4">
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Use this Reference JSON structure to prepare your own script file. Whenever you upload a valid <code className="font-mono text-cyan-300">.json</code> file, the studio automatically loads all scenes and generates scene-wise audio immediately.
            </p>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
              reference_voiceover_script.json ({REFERENCE_SCRIPT_JSON.scenes.length} Scenes)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadRefJson}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <pre className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[420px] leading-relaxed">
            {formattedJson}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadRefJson}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download Ref JSON</span>
            </button>

            <button
              type="button"
              onClick={handleUseAndGenerate}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Use Ref JSON & Generate Audio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
