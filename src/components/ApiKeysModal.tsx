import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Play,
} from 'lucide-react';
import { ApiKeySettings, VoiceConfig, TtsProvider } from '../types';
import { CURATED_ELEVENLABS_VOICES, normalizeVoiceGender } from '../data/elevenLabsVoices';
import { CURATED_GEMINI_VOICES, getGeminiVoiceGender } from '../data/geminiVoices';
import { VoicePickerGrid, VoicePickerItem } from './VoicePickerGrid';
import { createWavBlobUrl } from '../utils/wavHelper';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiKeySettings: ApiKeySettings;
  voiceConfig: VoiceConfig;
  onSaveSettings: (settings: ApiKeySettings, voiceConfig: VoiceConfig) => void;
}

export const ApiKeysModal: React.FC<Props> = ({
  isOpen,
  onClose,
  apiKeySettings,
  voiceConfig,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TtsProvider>(voiceConfig.provider || 'gemini');
  const [googleKeys, setGoogleKeys] = useState<string[]>(apiKeySettings.googleApiKeys || []);
  const [newGoogleKey, setNewGoogleKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState(apiKeySettings.elevenLabsApiKey || '');
  const [showElevenKey, setShowElevenKey] = useState(false);
  const [selectedElevenModel, setSelectedElevenModel] = useState(
    voiceConfig.elevenLabsModel || 'eleven_multilingual_v2'
  );
  const [selectedElevenVoiceId, setSelectedElevenVoiceId] = useState(
    voiceConfig.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB'
  );
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [validationStatus, setValidationStatus] = useState<Record<string, { checking: boolean; status?: string; error?: string }>>({});
  const [fetchedVoices, setFetchedVoices] = useState<any[]>(CURATED_ELEVENLABS_VOICES);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'male' | 'female'>('all');
  const [voiceSearch, setVoiceSearch] = useState('');
  const [selectedGeminiModel, setSelectedGeminiModel] = useState<'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts'>(
    voiceConfig.ttsModel || 'gemini-3.8-flash-tts'
  );
  const [selectedGeminiVoiceName, setSelectedGeminiVoiceName] = useState(
    voiceConfig.voiceName || 'Fenrir'
  );
  const [geminiVoiceFilter, setGeminiVoiceFilter] = useState<'all' | 'male' | 'female'>('all');
  const [geminiVoiceSearch, setGeminiVoiceSearch] = useState('');
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [voiceTestMessage, setVoiceTestMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isTestingGeminiVoice, setIsTestingGeminiVoice] = useState(false);
  const [geminiTestMessage, setGeminiTestMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGoogleKeys(apiKeySettings.googleApiKeys || []);
      setElevenLabsKey(apiKeySettings.elevenLabsApiKey || '');
      setActiveTab(voiceConfig.provider || 'gemini');
      setSelectedElevenModel(voiceConfig.elevenLabsModel || 'eleven_multilingual_v2');
      setSelectedElevenVoiceId(voiceConfig.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB');
      setVoiceFilter('all');
      setVoiceSearch('');
      setSelectedGeminiModel(voiceConfig.ttsModel || 'gemini-3.8-flash-tts');
      setSelectedGeminiVoiceName(voiceConfig.voiceName || 'Fenrir');
      setGeminiVoiceFilter('all');
      setGeminiVoiceSearch('');
      setVoiceTestMessage(null);
      setGeminiTestMessage(null);
      loadVoices(apiKeySettings.elevenLabsApiKey || '');
    }
  }, [isOpen, apiKeySettings, voiceConfig]);

  const sanitizeKeyInput = (raw: string) =>
    raw.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');

  const handleTestElevenLabsVoice = async () => {
    const activeKey = sanitizeKeyInput(elevenLabsKey);
    const targetVoiceId = customVoiceId.trim() || selectedElevenVoiceId;
    if (!activeKey) {
      setVoiceTestMessage({ ok: false, text: 'Enter your ElevenLabs API key first.' });
      return;
    }
    setIsTestingVoice(true);
    setVoiceTestMessage(null);
    try {
      const res = await fetch('/api/tts/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: 1,
          narration: 'হ্যালো! আমি ইলেভেনল্যাবস থেকে আপনার সিলেক্ট করা ভয়েস টেস্ট করছি।',
          provider: 'elevenlabs',
          elevenLabsApiKey: activeKey,
          elevenLabsModel: selectedElevenModel,
          elevenLabsVoiceId: targetVoiceId,
          elevenLabsStability: voiceConfig.elevenLabsStability ?? 0.5,
          elevenLabsSimilarity: voiceConfig.elevenLabsSimilarity ?? 0.75,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.audioBase64) {
        setVoiceTestMessage({
          ok: false,
          text: data.error || `Voice test failed (HTTP ${res.status}).`,
        });
        return;
      }
      const blobUrl = createWavBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
      const audio = new Audio(blobUrl);
      audio.onended = () => URL.revokeObjectURL(blobUrl);
      await audio.play().catch(() => {});
      const vName =
        fetchedVoices.find((v) => v.voice_id === targetVoiceId)?.name || 'Selected Voice';
      setVoiceTestMessage({
        ok: true,
        text: `Playing sample with ${vName} (${selectedElevenModel})`,
      });
    } catch (err: any) {
      setVoiceTestMessage({
        ok: false,
        text: err?.message || 'Failed to test ElevenLabs voice.',
      });
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleTestGeminiVoice = async () => {
    setIsTestingGeminiVoice(true);
    setGeminiTestMessage(null);
    const voiceGender = getGeminiVoiceGender(selectedGeminiVoiceName);
    try {
      const res = await fetch('/api/tts/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: 1,
          narration: 'নমস্কার! আমি আপনার সিলেক্ট করা গুগল জেমিনি ভয়েস টেস্ট করছি।',
          emotion: 'Friendly',
          voiceName: selectedGeminiVoiceName,
          gender: voiceGender,
          provider: 'gemini',
          model: selectedGeminiModel,
          googleApiKeys: googleKeys,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.audioBase64) {
        setGeminiTestMessage({
          ok: false,
          text: data.error || `Gemini voice test failed (HTTP ${res.status}).`,
        });
        return;
      }
      const blobUrl = createWavBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
      const audio = new Audio(blobUrl);
      audio.onended = () => URL.revokeObjectURL(blobUrl);
      await audio.play().catch(() => {});
      setGeminiTestMessage({
        ok: true,
        text: `Playing ${selectedGeminiVoiceName} (${voiceGender === 'Female' ? '♀ Female' : '♂ Male'}) via ${data.modelUsed || selectedGeminiModel}`,
      });
    } catch (err: any) {
      setGeminiTestMessage({
        ok: false,
        text: err?.message || 'Failed to test Gemini voice.',
      });
    } finally {
      setIsTestingGeminiVoice(false);
    }
  };

  const loadVoices = async (keyOverride?: string) => {
    setIsLoadingVoices(true);
    const activeKey = sanitizeKeyInput(keyOverride ?? elevenLabsKey);
    try {
      const res = await fetch('/api/elevenlabs/voices', {
        headers: activeKey ? { 'x-elevenlabs-api-key': activeKey } : {},
      });
      const data = await res.json();
      if (Array.isArray(data.voices) && data.voices.length > 0) {
        setFetchedVoices(data.voices);
      }
    } catch {
      // Fallback to CURATED_ELEVENLABS_VOICES
    } finally {
      setIsLoadingVoices(false);
    }
  };

  if (!isOpen) return null;

  const handleAddGoogleKey = () => {
    const trimmed = newGoogleKey.trim();
    if (!trimmed) return;
    if (googleKeys.includes(trimmed)) return;
    setGoogleKeys([...googleKeys, trimmed]);
    setNewGoogleKey('');
  };

  const handleRemoveGoogleKey = (index: number) => {
    setGoogleKeys(googleKeys.filter((_, i) => i !== index));
  };

  const maskKey = (k: string) => {
    if (k.length <= 10) return '••••••••••';
    return `${k.substring(0, 6)}••••••••${k.substring(k.length - 4)}`;
  };

  const handleValidateKey = async (provider: 'gemini' | 'elevenlabs', key: string, id: string) => {
    setValidationStatus((prev) => ({
      ...prev,
      [id]: { checking: true },
    }));

    const cleanKey = provider === 'elevenlabs' ? sanitizeKeyInput(key) : key.trim();

    try {
      const res = await fetch('/api/keys/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key: cleanKey }),
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        setValidationStatus((prev) => ({
          ...prev,
          [id]: {
            checking: false,
            error: `HTTP ${res.status}: ${rawText.slice(0, 100) || 'Invalid server response'}`,
          },
        }));
        return;
      }

      if (res.ok && data.valid) {
        setValidationStatus((prev) => ({
          ...prev,
          [id]: {
            checking: false,
            status: data.status || data.tier || 'Verified Active',
          },
        }));
        if (provider === 'elevenlabs') {
          void loadVoices(cleanKey);
        }
      } else {
        setValidationStatus((prev) => ({
          ...prev,
          [id]: {
            checking: false,
            error: data.error || `Validation failed (HTTP ${res.status})`,
          },
        }));
      }
    } catch (err: any) {
      setValidationStatus((prev) => ({
        ...prev,
        [id]: { checking: false, error: err.message },
      }));
    }
  };

  const handleSave = () => {
    const effectiveElevenVoiceId = customVoiceId.trim() || selectedElevenVoiceId;
    const selectedVoiceObj = fetchedVoices.find((v) => v.voice_id === effectiveElevenVoiceId);
    const selectedGeminiVoiceObj = CURATED_GEMINI_VOICES.find(
      (v) => v.name === selectedGeminiVoiceName
    );

    const updatedVoiceConfig: VoiceConfig = {
      ...voiceConfig,
      provider: activeTab,
      ttsModel: selectedGeminiModel,
      voiceName: selectedGeminiVoiceName || 'Fenrir',
      gender:
        activeTab === 'gemini'
          ? selectedGeminiVoiceObj?.gender || voiceConfig.gender
          : selectedVoiceObj?.labels?.gender?.toLowerCase() === 'female'
          ? 'Female'
          : selectedVoiceObj?.labels?.gender?.toLowerCase() === 'male'
          ? 'Male'
          : voiceConfig.gender,
      elevenLabsModel: selectedElevenModel as any,
      elevenLabsVoiceId: effectiveElevenVoiceId,
      elevenLabsVoiceName: selectedVoiceObj?.name || 'ElevenLabs Voice',
    };

    const updatedApiSettings: ApiKeySettings = {
      googleApiKeys: googleKeys,
      elevenLabsApiKey: sanitizeKeyInput(elevenLabsKey),
      autoRotateGoogleKeys: true,
    };

    onSaveSettings(updatedApiSettings, updatedVoiceConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  AI Model & API Key Configuration
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Secure Client Store
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure multiple Google keys for auto-failover, or switch to ElevenLabs TTS
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

        {/* Provider Switcher Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800 flex gap-3 bg-slate-950/20">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
              activeTab === 'gemini'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Google Gemini TTS (Multi-Key Pool)</span>
          </button>

          <button
            onClick={() => setActiveTab('elevenlabs')}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
              activeTab === 'elevenlabs'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>ElevenLabs TTS (Multilingual)</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'gemini' ? (
            <div className="space-y-5">
              {/* Info Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-200">
                    Multi-Key Load Balancing & Auto Quota Failover
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Google Gemini Free Tier allows 10 TTS requests/day per key. Add 2 or more Google API keys below: when Key #1 exhausts its quota (429), the engine will automatically and instantly rotate to Key #2, then Key #3!
                  </p>
                </div>
              </div>

              {/* Add Key Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Add Google Gemini API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newGoogleKey}
                    onChange={(e) => setNewGoogleKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleAddGoogleKey}
                    disabled={!newGoogleKey.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Pool</span>
                  </button>
                </div>
              </div>

              {/* Keys Pool List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    Active Keys Pool ({googleKeys.length})
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  >
                    <span>Get New Key on Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {googleKeys.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-1">
                    <p className="text-xs text-slate-400">
                      Using server default key from environment (<code className="font-mono text-indigo-400">GEMINI_API_KEY</code>).
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Add your own keys above to unlock higher quotas and automatic failover!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {googleKeys.map((key, idx) => {
                      const id = `gkey_${idx}`;
                      const valState = validationStatus[id];
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-mono text-xs text-slate-200 truncate">
                              {maskKey(key)}
                            </span>
                            {idx === 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                                Primary Key
                              </span>
                            )}
                            {valState?.status && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                                {valState.status}
                              </span>
                            )}
                            {valState?.error && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                                {valState.error}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleValidateKey('gemini', key, id)}
                              disabled={valState?.checking}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                            >
                              {valState?.checking ? 'Testing...' : 'Test'}
                            </button>
                            <button
                              onClick={() => handleRemoveGoogleKey(idx)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gemini Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Select Gemini TTS Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'gemini-3.8-flash-tts',
                      name: 'gemini-3.8-flash-tts',
                      badge: 'Flagship',
                      desc: 'Rich emotional expressiveness and educator cadence',
                    },
                    {
                      id: 'gemini-3.8-flash-lite-tts',
                      name: 'gemini-3.8-flash-lite-tts',
                      badge: 'Fast Lite',
                      desc: 'Low-latency high-throughput Bangla & English TTS',
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedGeminiModel(m.id as any)}
                      className={`text-left p-3 rounded-xl border transition ${
                        selectedGeminiModel === m.id
                          ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs font-mono text-slate-100">
                          {m.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemini Prebuilt Voice Selection */}
              <div>
                {(() => {
                  const activeGeminiGender = getGeminiVoiceGender(selectedGeminiVoiceName);
                  const geminiItems: VoicePickerItem[] = CURATED_GEMINI_VOICES.map((voice) => ({
                    id: voice.name,
                    name: voice.name,
                    gender: voice.gender === 'Female' ? 'female' : 'male',
                    subtitle: voice.style,
                    tag: voice.toneTag,
                    recommended: voice.recommended,
                  }));

                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Select Gemini Voice ({CURATED_GEMINI_VOICES.length} Studio Voices)
                        </label>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                              activeGeminiGender === 'Female'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            }`}
                          >
                            {activeGeminiGender === 'Female' ? '♀ Female' : '♂ Male'} • {selectedGeminiVoiceName}
                          </span>
                          <button
                            type="button"
                            onClick={handleTestGeminiVoice}
                            disabled={isTestingGeminiVoice}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition disabled:opacity-40"
                          >
                            <Play className="w-3 h-3" />
                            <span>{isTestingGeminiVoice ? 'Testing...' : 'Test Voice'}</span>
                          </button>
                        </div>
                      </div>

                      {geminiTestMessage && (
                        <p
                          className={`text-[11px] mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                            geminiTestMessage.ok
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          {geminiTestMessage.ok ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{geminiTestMessage.text}</span>
                        </p>
                      )}

                      <VoicePickerGrid
                        items={geminiItems}
                        selectedId={selectedGeminiVoiceName}
                        onSelect={(item) => {
                          setSelectedGeminiVoiceName(item.id);
                          setGeminiTestMessage(null);
                        }}
                        searchQuery={geminiVoiceSearch}
                        onSearchChange={setGeminiVoiceSearch}
                        genderFilter={geminiVoiceFilter}
                        onGenderFilterChange={setGeminiVoiceFilter}
                        searchPlaceholder="Search Gemini voice name, tone, or style..."
                        maxHeightClass="max-h-64"
                      />
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* ElevenLabs Tab */
            <div className="space-y-5">
              {/* ElevenLabs API Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    ElevenLabs API Key
                  </label>
                  <a
                    href="https://elevenlabs.io/app/settings/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  >
                    <span>Get Key from ElevenLabs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showElevenKey ? 'text' : 'password'}
                    value={elevenLabsKey}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/["'\s]+/g, '');
                      setElevenLabsKey(cleaned);
                      setValidationStatus((prev) => {
                        if (!prev['eleven_main']) return prev;
                        const next = { ...prev };
                        delete next['eleven_main'];
                        return next;
                      });
                    }}
                    placeholder="sk_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-24 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowElevenKey(!showElevenKey)}
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      {showElevenKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleValidateKey('elevenlabs', elevenLabsKey, 'eleven_main')}
                      disabled={!elevenLabsKey.trim() || validationStatus['eleven_main']?.checking}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition disabled:opacity-40"
                    >
                      {validationStatus['eleven_main']?.checking ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {validationStatus['eleven_main']?.status && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Key verified: {validationStatus['eleven_main'].status}</span>
                  </p>
                )}
                {validationStatus['eleven_main']?.error && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Verification error: {validationStatus['eleven_main'].error}</span>
                  </p>
                )}
              </div>

              {/* ElevenLabs Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Select ElevenLabs Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'eleven_multilingual_v2',
                      name: 'Multilingual v2',
                      badge: 'Recommended',
                      desc: 'Best for Bangla with English tech words',
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
                      onClick={() => setSelectedElevenModel(m.id as any)}
                      className={`text-left p-3 rounded-xl border transition ${
                        selectedElevenModel === m.id
                          ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-100">{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ElevenLabs Voice Selection */}
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Select Voice ({fetchedVoices.length} Available)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTestElevenLabsVoice}
                      disabled={isTestingVoice || !elevenLabsKey.trim()}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition disabled:opacity-40"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isTestingVoice ? 'Testing...' : 'Test Voice'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadVoices()}
                      disabled={isLoadingVoices}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingVoices ? 'animate-spin' : ''}`} />
                      <span>Refresh Voices</span>
                    </button>
                  </div>
                </div>

                {voiceTestMessage && (
                  <p
                    className={`text-[11px] mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                      voiceTestMessage.ok
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {voiceTestMessage.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{voiceTestMessage.text}</span>
                  </p>
                )}

                {(() => {
                  const elevenItems: VoicePickerItem[] = fetchedVoices.map((voice) => {
                    const isPaidOnly = Boolean(
                      voice.requiresPaidPlan ||
                        voice.category === 'professional' ||
                        voice.category === 'high_quality'
                    );
                    return {
                      id: voice.voice_id,
                      name: voice.name,
                      gender: normalizeVoiceGender(voice.labels?.gender),
                      subtitle: `${voice.labels?.accent ? `${voice.labels.accent} • ` : ''}${voice.description || ''}`,
                      tierBadge: isPaidOnly ? 'paid' : 'free',
                    };
                  });

                  return (
                    <VoicePickerGrid
                      items={elevenItems}
                      selectedId={selectedElevenVoiceId}
                      onSelect={(item) => {
                        setSelectedElevenVoiceId(item.id);
                        setCustomVoiceId('');
                        setVoiceTestMessage(null);
                      }}
                      searchQuery={voiceSearch}
                      onSearchChange={setVoiceSearch}
                      genderFilter={voiceFilter}
                      onGenderFilterChange={setVoiceFilter}
                      searchPlaceholder="Search voice name, accent, or style..."
                      maxHeightClass="max-h-64"
                    />
                  );
                })()}
              </div>

              {/* Or Custom Voice ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Or Custom ElevenLabs Voice ID
                </label>
                <input
                  type="text"
                  value={customVoiceId}
                  onChange={(e) => setCustomVoiceId(e.target.value)}
                  placeholder="Paste any cloned or community Voice ID from ElevenLabs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <span>Active Engine:</span>
            <span className="text-indigo-400 font-bold uppercase">
              {activeTab === 'gemini' ? 'Google Gemini' : 'ElevenLabs'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
