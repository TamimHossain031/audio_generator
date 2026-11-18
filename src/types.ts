export type TtsProvider = 'gemini' | 'elevenlabs';

export interface VoiceConfig {
  provider: TtsProvider;
  gender: 'Male' | 'Female';
  style: string;
  tone: string;
  speed: string;
  pronunciation: string;
  voiceName: string;
  ttsModel?: 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts';
  // ElevenLabs configurations
  elevenLabsModel?: 'eleven_multilingual_v2' | 'eleven_turbo_v2_5' | 'eleven_flash_v2_5';
  elevenLabsVoiceId?: string;
  elevenLabsVoiceName?: string;
  elevenLabsStability?: number;
  elevenLabsSimilarity?: number;
}

export interface ApiKeySettings {
  googleApiKeys: string[];
  elevenLabsApiKey: string;
  autoRotateGoogleKeys: boolean;
}

export interface KeyStatus {
  key: string;
  masked: string;
  status: 'active' | 'exhausted' | 'ready' | 'invalid';
  requestsUsed?: number;
  exhaustedUntil?: number;
}

export type SceneEmotion =
  | 'Curious'
  | 'Explanatory'
  | 'Analytical'
  | 'Engaging'
  | 'Educational'
  | 'Energetic'
  | 'Inspirational'
  | (string & {});

export interface SceneData {
  scene: number;
  title: string;
  duration: number; // in seconds
  emotion: SceneEmotion;
  narration: string;
  fileName: string;
  visualNote: string;
}

export interface ProjectScriptJson {
  title?: string;
  language?: string;
  voice?: Partial<VoiceConfig>;
  scenes: Array<{
    scene?: number;
    title?: string;
    duration?: number;
    emotion?: string;
    narration: string;
    fileName?: string;
    visualNote?: string;
  }>;
}

export interface SceneAudioState {
  status: 'idle' | 'generating' | 'ready' | 'error';
  audioBase64?: string;
  audioBlobUrl?: string;
  actualDuration?: number;
  fileName: string;
  generatedAt?: string;
  modelUsed?: string;
  providerUsed?: TtsProvider | 'auto-fallback';
  keyUsedIndex?: number;
  error?: string;
}
