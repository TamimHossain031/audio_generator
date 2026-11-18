import React, { useState } from 'react';
import { X, Mic, Volume2, CheckCircle2, Sliders, Info } from 'lucide-react';
import { VoiceConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: VoiceConfig;
  onSave: (newConfig: VoiceConfig) => void;
}

const PREBUILT_VOICES = [
  {
    name: 'Fenrir',
    gender: 'Male',
    style: 'Deep, confident, authoritative educator',
    recommended: true,
  },
  {
    name: 'Puck',
    gender: 'Male',
    style: 'Energetic, friendly, crisp & bright',
    recommended: false,
  },
  {
    name: 'Charon',
    gender: 'Male',
    style: 'Calm, deep, analytical technical lecturer',
    recommended: false,
  },
  {
    name: 'Kore',
    gender: 'Female',
    style: 'Smooth, educational, articulate presenter',
    recommended: false,
  },
  {
    name: 'Zephyr',
    gender: 'Female',
    style: 'Warm, dynamic, engaging instructor',
    recommended: false,
  },
];

export const VoiceSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<VoiceConfig>(config);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Voice & Narration Settings
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Model: gemini-3.8-flash-tts
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Engine & Provider Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Text-to-Speech Engine & Model
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, provider: 'gemini' })}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    formData.provider === 'gemini'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, provider: 'elevenlabs' })}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    formData.provider === 'elevenlabs'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ElevenLabs
                </button>
              </div>
            </div>

            {formData.provider === 'gemini' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, ttsModel: 'gemini-3.8-flash-tts' })
                  }
                  className={`text-left p-3 rounded-xl border transition-all ${
                    (formData.ttsModel || 'gemini-3.8-flash-tts') === 'gemini-3.8-flash-tts'
                      ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs font-mono text-slate-100">
                      gemini-3.8-flash-tts
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      Flagship
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    High emotional expressiveness and educator inflection.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, ttsModel: 'gemini-3.8-flash-lite-tts' })
                  }
                  className={`text-left p-3 rounded-xl border transition-all ${
                    formData.ttsModel === 'gemini-3.8-flash-lite-tts'
                      ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs font-mono text-slate-100">
                      gemini-3.8-flash-lite-tts
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      Fast Lite
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Optimized for rapid generation and higher throughput.
                  </p>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'eleven_multilingual_v2',
                    name: 'Multilingual v2',
                    badge: 'Recommended',
                    desc: 'Optimal for Bangla & English tech terms',
                  },
                  {
                    id: 'eleven_turbo_v2_5',
                    name: 'Turbo v2.5',
                    badge: 'Low Latency',
                    desc: 'Fast multilingual speech synthesis',
                  },
                  {
                    id: 'eleven_flash_v2_5',
                    name: 'Flash v2.5',
                    badge: 'Ultra Fast',
                    desc: 'High-speed batch processing',
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, elevenLabsModel: m.id as any })
                    }
                    className={`text-left p-3 rounded-xl border transition-all ${
                      (formData.elevenLabsModel || 'eleven_multilingual_v2') === m.id
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs font-mono text-slate-100">
                        {m.name}
                      </span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{m.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prebuilt Voice Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Voice Persona
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PREBUILT_VOICES.map((v) => {
                const isSelected = formData.voiceName === v.name;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        voiceName: v.name,
                        gender: v.gender as 'Male' | 'Female',
                      })
                    }
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-sm text-slate-100 font-mono">
                          {v.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {v.gender}
                        </span>
                      </div>
                      {v.recommended && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{v.style}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tone
              </label>
              <input
                type="text"
                value={formData.tone}
                onChange={(e) =>
                  setFormData({ ...formData, tone: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Confident, friendly, educational"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Educator Style
              </label>
              <input
                type="text"
                value={formData.style}
                onChange={(e) =>
                  setFormData({ ...formData, style: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Professional technology educator"
              />
            </div>
          </div>

          {/* Pronunciation & Tech Terms */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pronunciation Instruction
            </label>
            <input
              type="text"
              value={formData.pronunciation}
              onChange={(e) =>
                setFormData({ ...formData, pronunciation: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Clear Bangla with natural English technical terminology"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Ensures terms like ChatGPT, Machine Learning, Deep Learning are spoken naturally.
            </p>
          </div>

          {/* Speech Speed */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Speaking Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Slow', 'Medium', 'Fast'].map((speedOption) => (
                <button
                  key={speedOption}
                  type="button"
                  onClick={() => setFormData({ ...formData, speed: speedOption })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                    formData.speed === speedOption
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {speedOption}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
