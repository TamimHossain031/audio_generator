import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Sliders, Info, Play, AlertCircle } from 'lucide-react';
import { VoiceConfig } from '../types';
import {
  CURATED_ELEVENLABS_VOICES,
  ElevenLabsVoiceOption,
  normalizeVoiceGender,
} from '../data/elevenLabsVoices';
import { CURATED_GEMINI_VOICES, getGeminiVoiceGender } from '../data/geminiVoices';
import { VoicePickerGrid, VoicePickerItem } from './VoicePickerGrid';
import { createWavBlobUrl } from '../utils/wavHelper';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: VoiceConfig;
  googleApiKeys?: string[];
  elevenLabsApiKey?: string;
  onSave: (newConfig: VoiceConfig) => void;
}

export const VoiceSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  googleApiKeys = [],
  elevenLabsApiKey,
  onSave,
}) => {
  const [formData, setFormData] = useState<VoiceConfig>(config);
  const [voiceSearch, setVoiceSearch] = useState('');
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'male' | 'female'>('all');
  const [elevenVoices, setElevenVoices] = useState<ElevenLabsVoiceOption[]>(CURATED_ELEVENLABS_VOICES);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testMessage, setTestMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(config);
      setVoiceSearch('');
      setVoiceFilter('all');
      setTestMessage(null);
      const cleanKey = (elevenLabsApiKey || '').trim();
      if (cleanKey) {
        fetch('/api/elevenlabs/voices', {
          headers: { 'x-elevenlabs-api-key': cleanKey },
        })
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data?.voices) && data.voices.length > 0) {
              setElevenVoices(data.voices);
            }
          })
          .catch(() => {});
      } else {
        setElevenVoices(CURATED_ELEVENLABS_VOICES);
      }
    }
  }, [isOpen, config, elevenLabsApiKey]);

  if (!isOpen) return null;

  const handlePreviewVoice = async () => {
    setIsTestingVoice(true);
    setTestMessage(null);
    const isEleven = formData.provider === 'elevenlabs';
    const voiceGender = isEleven
      ? formData.gender
      : getGeminiVoiceGender(formData.voiceName);
    try {
      const res = await fetch('/api/tts/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: 1,
          narration: 'নমস্কার! আমি আপনার সিলেক্ট করা ভয়েস টেস্ট করছি।',
          emotion: 'Friendly',
          voiceName: formData.voiceName || 'Fenrir',
          gender: voiceGender,
          style: formData.style,
          tone: formData.tone,
          speed: formData.speed,
          pronunciation: formData.pronunciation,
          provider: formData.provider || 'gemini',
          model: isEleven
            ? formData.elevenLabsModel || 'eleven_multilingual_v2'
            : formData.ttsModel || 'gemini-3.8-flash-tts',
          googleApiKeys,
          elevenLabsApiKey: (elevenLabsApiKey || '').trim(),
          elevenLabsModel: formData.elevenLabsModel || 'eleven_multilingual_v2',
          elevenLabsVoiceId: formData.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB',
          elevenLabsStability: formData.elevenLabsStability ?? 0.5,
          elevenLabsSimilarity: formData.elevenLabsSimilarity ?? 0.75,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.audioBase64) {
        setTestMessage({
          ok: false,
          text: data.error || `Voice preview failed (HTTP ${res.status}).`,
        });
        return;
      }
      const blobUrl = createWavBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
      const audio = new Audio(blobUrl);
      audio.onended = () => URL.revokeObjectURL(blobUrl);
      await audio.play().catch(() => {});
      const label = isEleven
        ? formData.elevenLabsVoiceName || 'ElevenLabs Voice'
        : formData.voiceName || 'Fenrir';
      setTestMessage({
        ok: true,
        text: `Playing ${label} (${voiceGender === 'Female' ? '♀ Female' : '♂ Male'})`,
      });
    } catch (err: any) {
      setTestMessage({ ok: false, text: err?.message || 'Voice preview failed.' });
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const syncedGender =
      formData.provider === 'gemini'
        ? getGeminiVoiceGender(formData.voiceName, formData.gender)
        : formData.gender;
    onSave({ ...formData, gender: syncedGender });
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
                Model:{' '}
                {formData.provider === 'elevenlabs'
                  ? formData.elevenLabsModel || 'eleven_multilingual_v2'
                  : formData.ttsModel || 'gemini-3.8-flash-tts'}
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
            {(() => {
              const isEleven = formData.provider === 'elevenlabs';
              const activeVoiceObj = isEleven
                ? elevenVoices.find(
                    (v) =>
                      v.voice_id === (formData.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB')
                  )
                : null;
              const activeGender: 'male' | 'female' | 'neutral' = isEleven
                ? normalizeVoiceGender(activeVoiceObj?.labels?.gender || formData.gender)
                : getGeminiVoiceGender(formData.voiceName) === 'Female'
                ? 'female'
                : 'male';
              const activeVoiceName = isEleven
                ? formData.elevenLabsVoiceName || activeVoiceObj?.name || 'Adam'
                : formData.voiceName || 'Fenrir';

              const items: VoicePickerItem[] = isEleven
                ? elevenVoices.map((v) => {
                    const isPaidOnly = Boolean(
                      v.requiresPaidPlan ||
                        v.category === 'professional' ||
                        v.category === 'high_quality'
                    );
                    return {
                      id: v.voice_id,
                      name: v.name,
                      gender: normalizeVoiceGender(v.labels?.gender),
                      subtitle: `${v.labels?.accent ? `${v.labels.accent} • ` : ''}${v.description}`,
                      tierBadge: isPaidOnly ? 'paid' : 'free',
                    };
                  })
                : CURATED_GEMINI_VOICES.map((v) => ({
                    id: v.name,
                    name: v.name,
                    gender: v.gender === 'Female' ? 'female' : 'male',
                    subtitle: v.style,
                    tag: v.toneTag,
                    recommended: v.recommended,
                  }));

              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      {isEleven
                        ? `Select ElevenLabs Voice (${elevenVoices.length} Voices)`
                        : `Select Gemini Voice (${CURATED_GEMINI_VOICES.length} Studio Voices)`}
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                          activeGender === 'female'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : activeGender === 'neutral'
                            ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {activeGender === 'female'
                          ? '♀ Female'
                          : activeGender === 'neutral'
                          ? '◎ Neutral'
                          : '♂ Male'}{' '}
                        • {activeVoiceName}
                      </span>
                      <button
                        type="button"
                        onClick={handlePreviewVoice}
                        disabled={isTestingVoice || (isEleven && !(elevenLabsApiKey || '').trim())}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition disabled:opacity-40"
                      >
                        <Play className="w-3 h-3" />
                        <span>{isTestingVoice ? 'Testing...' : 'Test Voice'}</span>
                      </button>
                    </div>
                  </div>

                  {testMessage && (
                    <p
                      className={`text-[11px] mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                        testMessage.ok
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {testMessage.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{testMessage.text}</span>
                    </p>
                  )}

                  <div className="space-y-3">
                    <VoicePickerGrid
                      items={items}
                      selectedId={
                        isEleven
                          ? formData.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB'
                          : formData.voiceName || 'Fenrir'
                      }
                      onSelect={(item) => {
                        setTestMessage(null);
                        if (isEleven) {
                          setFormData({
                            ...formData,
                            elevenLabsVoiceId: item.id,
                            elevenLabsVoiceName: item.name,
                            gender: item.gender === 'female' ? 'Female' : 'Male',
                          });
                        } else {
                          setFormData({
                            ...formData,
                            voiceName: item.id,
                            gender: item.gender === 'female' ? 'Female' : 'Male',
                          });
                        }
                      }}
                      searchQuery={voiceSearch}
                      onSearchChange={setVoiceSearch}
                      genderFilter={voiceFilter}
                      onGenderFilterChange={setVoiceFilter}
                      searchPlaceholder="Search voice name, tone, or style..."
                      maxHeightClass="max-h-60"
                    />

                    {isEleven && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                            <span>Stability</span>
                            <span className="font-mono text-cyan-400">
                              {(formData.elevenLabsStability ?? 0.5).toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={formData.elevenLabsStability ?? 0.5}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                elevenLabsStability: parseFloat(e.target.value),
                              })
                            }
                            className="w-full accent-indigo-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                            <span>Similarity Boost</span>
                            <span className="font-mono text-cyan-400">
                              {(formData.elevenLabsSimilarity ?? 0.75).toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={formData.elevenLabsSimilarity ?? 0.75}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                elevenLabsSimilarity: parseFloat(e.target.value),
                              })
                            }
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
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
