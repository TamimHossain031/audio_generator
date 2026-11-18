import { SceneData, VoiceConfig } from '../types';

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export interface ParsedScriptResult {
  title: string;
  language?: string;
  voiceConfig?: Partial<VoiceConfig>;
  scenes: SceneData[];
}

export function parseAndNormalizeScriptJson(
  rawString: string,
  fallbackVoiceConfig: VoiceConfig
): ParsedScriptResult {
  const parsed = JSON.parse(rawString);

  let scenesRaw: any[] = [];
  let title = 'Custom Voiceover Project';
  let language = 'Bangla';
  let voiceConfig: Partial<VoiceConfig> | undefined = undefined;

  if (Array.isArray(parsed)) {
    scenesRaw = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.scenes)) {
      scenesRaw = parsed.scenes;
    } else {
      throw new Error('JSON must contain a "scenes" array or be an array of scenes.');
    }
    if (parsed.title) title = String(parsed.title);
    if (parsed.language) language = String(parsed.language);
    if (parsed.voice && typeof parsed.voice === 'object') {
      const gender: 'Male' | 'Female' = parsed.voice.gender === 'Female' ? 'Female' : 'Male';
      voiceConfig = {
        gender,
        style: parsed.voice.style || fallbackVoiceConfig.style,
        tone: parsed.voice.tone || fallbackVoiceConfig.tone,
        speed: parsed.voice.speed || fallbackVoiceConfig.speed,
        pronunciation: parsed.voice.pronunciation || fallbackVoiceConfig.pronunciation,
        voiceName:
          parsed.voice.voiceName ||
          (gender === 'Female' ? 'Kore' : fallbackVoiceConfig.voiceName || 'Fenrir'),
      };
    }
  } else {
    throw new Error('Invalid JSON format. Expected an object or array.');
  }

  if (scenesRaw.length === 0) {
    throw new Error('The scenes array cannot be empty. Please include at least one scene.');
  }

  const normalizedScenes: SceneData[] = scenesRaw.map((item, index) => {
    const sceneNum = item.scene ?? index + 1;
    const narration = item.narration || item.text || item.script || '';
    if (!narration || typeof narration !== 'string' || !narration.trim()) {
      throw new Error(`Scene ${sceneNum} is missing narration text.`);
    }

    const emotion = item.emotion || 'Educational';
    const sceneTitle = item.title || `Scene ${sceneNum}`;
    const duration = Number(item.duration) || 12;

    const sceneNumStr = String(sceneNum).padStart(2, '0');
    const emotionSlug = sanitizeFilename(emotion);
    const titleSlug = sanitizeFilename(sceneTitle || `scene_${sceneNumStr}`);
    const defaultFilename = `scene_${sceneNumStr}_${emotionSlug}_${titleSlug}.wav`;

    return {
      scene: sceneNum,
      title: sceneTitle,
      duration,
      emotion,
      narration: narration.trim(),
      fileName: item.fileName || defaultFilename,
      visualNote: item.visualNote || `Visual for Scene ${sceneNum} (${emotion})`,
    };
  });

  return {
    title,
    language,
    voiceConfig,
    scenes: normalizedScenes,
  };
}
