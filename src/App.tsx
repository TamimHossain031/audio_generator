import React, { useState, useRef } from 'react';
import { DEFAULT_VOICE_CONFIG } from './data/defaultScenes';
import { getGeminiVoiceGender } from './data/geminiVoices';
import { SceneData, VoiceConfig, SceneAudioState, ApiKeySettings } from './types';
import { Header } from './components/Header';
import { SceneCard } from './components/SceneCard';
import { ContinuousPlayer } from './components/ContinuousPlayer';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { JsonUploadModal } from './components/JsonUploadModal';
import { ReferenceJsonModal } from './components/ReferenceJsonModal';
import { ApiKeysModal } from './components/ApiKeysModal';
import {
  createWavBlobUrl,
  downloadAllScenesAsZip,
  mergeWavAudio,
  downloadBlob,
} from './utils/wavHelper';
import { parseAndNormalizeScriptJson, ParsedScriptResult } from './utils/scriptParser';
import {
  Sparkles,
  Check,
  Upload,
  FileJson,
  Trash2,
  FileCode,
  AlertCircle,
} from 'lucide-react';

const LOCAL_STORAGE_KEY_SETTINGS = 'bangla_voice_studio_api_keys';
const LOCAL_STORAGE_VOICE_CONFIG = 'bangla_voice_studio_voice_config';

function getInitialApiKeySettings(): ApiKeySettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return {
    googleApiKeys: [],
    elevenLabsApiKey: '',
    autoRotateGoogleKeys: true,
  };
}

function getInitialVoiceConfig(): VoiceConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VOICE_CONFIG);
    if (raw) {
      const merged: VoiceConfig = { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(raw) };
      if (merged.provider !== 'elevenlabs') {
        merged.gender = getGeminiVoiceGender(merged.voiceName, merged.gender);
      }
      return merged;
    }
  } catch {
    // Ignore
  }
  return DEFAULT_VOICE_CONFIG;
}

export default function App() {
  const [projectTitle, setProjectTitle] = useState('No Script Loaded');
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(getInitialVoiceConfig);
  const [apiKeySettings, setApiKeySettings] = useState<ApiKeySettings>(getInitialApiKeySettings);
  const [audioStates, setAudioStates] = useState<Record<number, SceneAudioState>>({});
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isRefJsonOpen, setIsRefJsonOpen] = useState(false);
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [isDraggingEmpty, setIsDraggingEmpty] = useState(false);
  const directFileInputRef = useRef<HTMLInputElement | null>(null);

  const persistVoiceConfig = (next: VoiceConfig) => {
    setVoiceConfig(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_VOICE_CONFIG, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveApiKeys = (newSettings: ApiKeySettings, newVoiceConfig: VoiceConfig) => {
    setApiKeySettings(newSettings);
    persistVoiceConfig(newVoiceConfig);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch {
      // Ignore
    }
    const activeVoiceLabel =
      newVoiceConfig.provider === 'elevenlabs'
        ? newVoiceConfig.elevenLabsVoiceName || 'ElevenLabs Voice'
        : newVoiceConfig.voiceName || 'Fenrir';
    showToast(
      `Saved! Engine: ${newVoiceConfig.provider === 'elevenlabs' ? 'ElevenLabs' : 'Google Gemini'} (${activeVoiceLabel})`
    );
  };

  // Generate a single scene voiceover via /api/tts/generate-scene
  const generateSingleScene = async (
    sceneNum: number,
    overrideScene?: SceneData,
    overrideVoiceConfig?: VoiceConfig
  ): Promise<boolean> => {
    const targetScene = overrideScene || scenes.find((s) => s.scene === sceneNum);
    if (!targetScene) return false;

    const effectiveVoice = overrideVoiceConfig || voiceConfig;

    setAudioStates((prev) => ({
      ...prev,
      [sceneNum]: {
        ...(prev[sceneNum] || {}),
        status: 'generating',
        fileName: targetScene.fileName,
        error: undefined,
      },
    }));

    try {
      const response = await fetch('/api/tts/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: sceneNum,
          narration: targetScene.narration,
          emotion: targetScene.emotion,
          duration: targetScene.duration,
          voiceName: effectiveVoice.voiceName,
          gender: effectiveVoice.gender,
          style: effectiveVoice.style,
          tone: effectiveVoice.tone,
          speed: effectiveVoice.speed,
          pronunciation: effectiveVoice.pronunciation,
          sceneTitle: targetScene.title,
          provider: effectiveVoice.provider || 'gemini',
          model:
            effectiveVoice.provider === 'elevenlabs'
              ? effectiveVoice.elevenLabsModel || 'eleven_multilingual_v2'
              : effectiveVoice.ttsModel || 'gemini-3.8-flash-tts',
          googleApiKeys: apiKeySettings.googleApiKeys,
          elevenLabsApiKey: apiKeySettings.elevenLabsApiKey,
          elevenLabsModel: effectiveVoice.elevenLabsModel || 'eleven_multilingual_v2',
          elevenLabsVoiceId: effectiveVoice.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB',
          elevenLabsStability: effectiveVoice.elevenLabsStability ?? 0.5,
          elevenLabsSimilarity: effectiveVoice.elevenLabsSimilarity ?? 0.75,
        }),
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {
          success: false,
          error: `Server returned non-JSON response (HTTP ${response.status}): ${rawText.slice(0, 140)}`,
        };
      }

      if (!response.ok || !data.success || !data.audioBase64) {
        const errMessage =
          data.error ||
          `${effectiveVoice.provider === 'elevenlabs' ? 'ElevenLabs' : 'Google Gemini'} voice generation failed (HTTP ${response.status}).`;
        setAudioStates((prev) => ({
          ...prev,
          [sceneNum]: {
            ...(prev[sceneNum] || {}),
            status: 'error',
            fileName: targetScene.fileName,
            error: errMessage,
          },
        }));
        showToast(errMessage);
        return false;
      }

      const audioMimeType = data.mimeType || 'audio/wav';
      const audioBlobUrl = createWavBlobUrl(data.audioBase64, audioMimeType);
      const binaryLength = window.atob(data.audioBase64).length;
      const estimatedSecs =
        audioMimeType === 'audio/mpeg'
          ? Math.max(1, Math.round(binaryLength / 16000))
          : Math.max(1, Math.round(Math.max(0, binaryLength - 44) / 48000));

      setAudioStates((prev) => ({
        ...prev,
        [sceneNum]: {
          status: 'ready',
          audioBase64: data.audioBase64,
          audioBlobUrl,
          actualDuration: estimatedSecs,
          fileName: data.fileName || targetScene.fileName,
          generatedAt: data.generatedAt,
          modelUsed: data.modelUsed,
          providerUsed: data.providerUsed,
          keyUsedIndex: data.keyUsedIndex,
          mimeType: audioMimeType,
        },
      }));

      return true;
    } catch (err: any) {
      const errMessage =
        err?.message || 'Network error while contacting the voice synthesis server.';
      setAudioStates((prev) => ({
        ...prev,
        [sceneNum]: {
          ...(prev[sceneNum] || {}),
          status: 'error',
          fileName: targetScene.fileName,
          error: errMessage,
        },
      }));
      showToast(errMessage);
      return false;
    }
  };

  // Batch generate audio sequentially for a given list of scenes (safe from stale closures)
  const runBatchGeneration = async (
    targetScenes: SceneData[],
    targetVoiceConfig: VoiceConfig
  ) => {
    if (targetScenes.length === 0) return;
    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: targetScenes.length });

    let successCount = 0;
    for (let i = 0; i < targetScenes.length; i++) {
      const scene = targetScenes[i];
      setBatchProgress({ current: i + 1, total: targetScenes.length });
      setCurrentSceneIndex(i);

      const ok = await generateSingleScene(scene.scene, scene, targetVoiceConfig);
      if (ok) successCount++;
    }

    setIsBatchGenerating(false);
    showToast(`Generated audio for ${successCount} of ${targetScenes.length} scenes!`);
  };

  const handleGenerateScene = async (sceneNum: number): Promise<boolean> => {
    return generateSingleScene(sceneNum);
  };

  const handleGenerateAll = async () => {
    if (isBatchGenerating || scenes.length === 0) return;
    await runBatchGeneration(scenes, voiceConfig);
  };

  // Apply uploaded or reference JSON script and immediately generate audio
  const handleApplyUploadedScript = (
    data: ParsedScriptResult,
    autoGenerateAudio = true
  ) => {
    setDropError(null);
    const nextVoiceConfig: VoiceConfig = data.voiceConfig
      ? {
          ...voiceConfig,
          ...data.voiceConfig,
          provider: voiceConfig.provider,
          ttsModel: voiceConfig.ttsModel,
          voiceName: voiceConfig.voiceName,
          gender:
            voiceConfig.provider === 'elevenlabs'
              ? voiceConfig.gender
              : getGeminiVoiceGender(voiceConfig.voiceName, voiceConfig.gender),
          elevenLabsModel: voiceConfig.elevenLabsModel,
          elevenLabsVoiceId: voiceConfig.elevenLabsVoiceId,
          elevenLabsVoiceName: voiceConfig.elevenLabsVoiceName,
        }
      : voiceConfig;

    setProjectTitle(data.title || 'Custom Voiceover Project');
    setScenes(data.scenes);
    setAudioStates({});
    setCurrentSceneIndex(0);
    persistVoiceConfig(nextVoiceConfig);

    if (autoGenerateAudio) {
      showToast(`Loaded "${data.title}" (${data.scenes.length} scenes). Generating audio...`);
      void runBatchGeneration(data.scenes, nextVoiceConfig);
    } else {
      showToast(`Loaded "${data.title}" with ${data.scenes.length} scenes!`);
    }
  };

  // Direct JSON file upload from empty studio dropzone
  const handleDirectJsonFile = (file: File) => {
    setDropError(null);
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setDropError('Please select a valid .json file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseAndNormalizeScriptJson(content, voiceConfig);
        handleApplyUploadedScript(parsed, true);
      } catch (err: any) {
        setDropError(err.message || 'Invalid JSON script format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearScript = () => {
    if (isBatchGenerating) return;
    setScenes([]);
    setAudioStates({});
    setProjectTitle('No Script Loaded');
    setCurrentSceneIndex(0);
    setDropError(null);
    showToast('Cleared all narration scripts.');
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    try {
      await downloadAllScenesAsZip(scenes, audioStates, projectTitle);
      showToast('All scene audio files, SRT subtitles, and manifest downloaded as ZIP!');
    } catch (err) {
      console.error('Download ZIP error:', err);
      showToast('Failed to generate ZIP package.');
    }
  };

  // Merge all scenes into one continuous audio track
  const handleDownloadMerged = () => {
    const readyStates = scenes
      .map((s) => audioStates[s.scene])
      .filter((st): st is SceneAudioState => Boolean(st?.audioBase64));

    if (readyStates.length === 0) {
      showToast('Please generate at least one scene voiceover first.');
      return;
    }

    const cleanSlug = projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const allMp3 = readyStates.every((st) => st.mimeType === 'audio/mpeg');
    if (allMp3) {
      const mp3Parts = readyStates.map((st) => {
        const binary = window.atob(st.audioBase64!);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return arr;
      });
      const mergedBlob = new Blob(mp3Parts, { type: 'audio/mpeg' });
      downloadBlob(mergedBlob, `${cleanSlug}_full_voiceover.mp3`);
      showToast('Downloaded complete merged MP3 narration track!');
      return;
    }

    const readyWavBase64 = readyStates
      .filter((st) => st.mimeType !== 'audio/mpeg')
      .map((st) => st.audioBase64!);

    const mergedBlob = mergeWavAudio(readyWavBase64);
    downloadBlob(mergedBlob, `${cleanSlug}_full_voiceover.wav`);
    showToast('Downloaded complete merged narration track!');
  };

  const handleUpdateNarration = (sceneNum: number, newNarration: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.scene === sceneNum ? { ...s, narration: newNarration } : s))
    );
  };

  const readyCount = scenes.filter((s) => audioStates[s.scene]?.audioBase64).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-28">
      {/* Top Header */}
      <Header
        title={projectTitle}
        voiceConfig={voiceConfig}
        totalScenes={scenes.length}
        readyCount={readyCount}
        isBatchGenerating={isBatchGenerating}
        batchProgress={batchProgress}
        googleKeysCount={apiKeySettings.googleApiKeys.length}
        hasElevenLabsKey={Boolean(apiKeySettings.elevenLabsApiKey)}
        onGenerateAll={handleGenerateAll}
        onDownloadZip={handleDownloadZip}
        onDownloadMerged={handleDownloadMerged}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenJsonUpload={() => setIsJsonModalOpen(true)}
        onOpenReferenceJson={() => setIsRefJsonOpen(true)}
        onOpenApiKeys={() => setIsApiKeysOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce border border-indigo-400">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Project Introduction Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/30 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-500/30">
                {voiceConfig.provider === 'elevenlabs' ? 'ElevenLabs Engine' : 'Google Gemini TTS'}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-semibold border border-cyan-500/30">
                {voiceConfig.provider === 'elevenlabs'
                  ? voiceConfig.elevenLabsModel || 'eleven_multilingual_v2'
                  : voiceConfig.ttsModel || 'gemini-3.8-flash-tts'}
              </span>
              <button
                onClick={() => setIsApiKeysOpen(true)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-mono ml-1"
              >
                Change Model / Manage Keys ({apiKeySettings.googleApiKeys.length} Google Keys)
              </button>
            </div>
            <h2 className="text-base font-bold text-white">{projectTitle}</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Upload a JSON narration script to automatically synthesize scene-by-scene audio with customized emotion, educator cadence, and clear Bangla + English technical pronunciation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRefJsonOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 shadow-sm transition"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>Reference JSON</span>
            </button>

            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm transition"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Script (.json)</span>
            </button>

            {scenes.length > 0 && (
              <>
                <button
                  onClick={handleClearScript}
                  disabled={isBatchGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/30 transition disabled:opacity-40"
                  title="Remove loaded narration script"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                {readyCount < scenes.length && (
                  <button
                    onClick={handleGenerateAll}
                    disabled={isBatchGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate All</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Scene Studio Workspace */}
        {scenes.length === 0 ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingEmpty(true);
              }}
              onDragLeave={() => setIsDraggingEmpty(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingEmpty(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleDirectJsonFile(e.dataTransfer.files[0]);
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition flex flex-col items-center justify-center gap-4 ${
                isDraggingEmpty
                  ? 'border-cyan-400 bg-indigo-950/30'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-400 flex items-center justify-center border border-indigo-500/30 shadow-lg">
                <FileCode className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-lg">
                <h3 className="text-lg font-bold text-slate-100">
                  Upload JSON Script to Auto-Generate Voiceover Audio
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drag & drop your <code className="font-mono text-cyan-300">.json</code> file here, or click Upload below. Once uploaded, every scene&apos;s audio is generated automatically.
                </p>
              </div>

              {dropError && (
                <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{dropError}</span>
                </div>
              )}

              <input
                ref={directFileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleDirectJsonFile(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => directFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload .json File & Generate Audio</span>
                </button>

                <button
                  onClick={() => setIsJsonModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Paste JSON</span>
                </button>

                <button
                  onClick={() => setIsRefJsonOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition"
                >
                  <FileJson className="w-4 h-4 text-amber-400" />
                  <span>Reference JSON</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 font-mono">
                Scene-by-Scene Audio Pipeline ({scenes.length} Scenes)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                WAV files named strictly scene-wise
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {scenes.map((scene, idx) => (
                <SceneCard
                  key={scene.scene}
                  scene={scene}
                  audioState={audioStates[scene.scene]}
                  isActive={currentSceneIndex === idx}
                  onGenerate={handleGenerateScene}
                  onUpdateNarration={handleUpdateNarration}
                  onSelectScene={() => setCurrentSceneIndex(idx)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Continuous Audio Player */}
      <ContinuousPlayer
        scenes={scenes}
        audioStates={audioStates}
        currentSceneIndex={currentSceneIndex}
        onSceneChange={setCurrentSceneIndex}
      />

      {/* Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={voiceConfig}
        googleApiKeys={apiKeySettings.googleApiKeys}
        elevenLabsApiKey={apiKeySettings.elevenLabsApiKey}
        onSave={(newConfig) => {
          persistVoiceConfig(newConfig);
          const activeVoiceLabel =
            newConfig.provider === 'elevenlabs'
              ? newConfig.elevenLabsVoiceName || 'ElevenLabs Voice'
              : newConfig.voiceName || 'Fenrir';
          showToast(
            `Engine set to ${newConfig.provider === 'elevenlabs' ? 'ElevenLabs' : 'Google Gemini'} (${activeVoiceLabel})`
          );
        }}
      />

      {/* API Keys & Model Engine Modal */}
      <ApiKeysModal
        isOpen={isApiKeysOpen}
        onClose={() => setIsApiKeysOpen(false)}
        apiKeySettings={apiKeySettings}
        voiceConfig={voiceConfig}
        onSaveSettings={handleSaveApiKeys}
      />

      {/* Script JSON Upload & Import Modal */}
      <JsonUploadModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        currentTitle={projectTitle}
        currentVoiceConfig={voiceConfig}
        currentScenes={scenes}
        onApplyScript={handleApplyUploadedScript}
        onOpenReferenceJson={() => setIsRefJsonOpen(true)}
      />

      {/* Reference JSON Viewer & Downloader Modal */}
      <ReferenceJsonModal
        isOpen={isRefJsonOpen}
        onClose={() => setIsRefJsonOpen(false)}
        currentVoiceConfig={voiceConfig}
        onUseReferenceAndGenerate={(data) => handleApplyUploadedScript(data, true)}
      />
    </div>
  );
}
