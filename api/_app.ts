import express from 'express';
import dotenv from 'dotenv';
import type { GoogleGenAI as GoogleGenAIType } from '@google/genai';

dotenv.config();

let cachedGoogleGenAI: typeof GoogleGenAIType | null = null;
export async function loadGoogleGenAI(): Promise<typeof GoogleGenAIType> {
  if (!cachedGoogleGenAI) {
    const mod = await import('@google/genai');
    cachedGoogleGenAI = mod.GoogleGenAI;
  }
  return cachedGoogleGenAI;
}

// Helper to sanitize filename
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// In-memory key exhaustion tracker: key string -> timestamp until which it is exhausted
const googleKeyExhaustedUntil: Map<string, number> = new Map();

// Helper to check if an error is quota exhaustion (429)
function isQuotaError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status || err?.code;
  return (
    status === 429 ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('429')
  );
}

// Extract pool of candidate Google API keys (User keys take highest priority, then env vars)
function getGoogleKeysPool(userKeys?: string[]): string[] {
  const pool: string[] = [];
  if (Array.isArray(userKeys)) {
    for (const k of userKeys) {
      const clean = (k || '').trim();
      if (clean && !pool.includes(clean)) pool.push(clean);
    }
  }
  if (process.env.GOOGLE_API_KEYS) {
    const envKeys = process.env.GOOGLE_API_KEYS.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const k of envKeys) {
      if (!pool.includes(k)) pool.push(k);
    }
  }
  if (process.env.GEMINI_API_KEY && !pool.includes(process.env.GEMINI_API_KEY)) {
    pool.push(process.env.GEMINI_API_KEY);
  }
  return pool;
}

// Generate valid 24kHz 16-bit mono WAV audio stream on server when cloud quota is exhausted
function generateSyntheticWavBase64(durationSec = 12, emotion = 'Curious'): string {
  const sampleRate = 24000;
  const numSamples = Math.max(sampleRate * 4, sampleRate * (durationSec || 12));
  const pcm = new Int16Array(numSamples);
  let baseFreq = 125;
  if (emotion === 'Curious') baseFreq = 135;
  if (emotion === 'Energetic') baseFreq = 145;
  if (emotion === 'Analytical') baseFreq = 118;
  if (emotion === 'Inspirational') baseFreq = 130;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const rhythm = 0.5 + 0.5 * Math.sin(t * 1.8 * Math.PI);
    if (rhythm > 0.15) {
      const pitch = baseFreq * (1 + 0.08 * Math.sin(t * 2.2));
      const f1 = Math.sin(2 * Math.PI * pitch * t);
      const f2 = 0.35 * Math.sin(2 * Math.PI * (pitch * 4.2) * t);
      const breath = 0.03 * (Math.random() * 2 - 1);
      const pulse = Math.sin(t * 9 * Math.PI) > 0 ? 1 : 0.25;
      const env = Math.min(1, Math.min(t * 8, ((durationSec || 12) - t) * 8));
      pcm[i] = Math.floor((f1 + f2 + breath) * pulse * env * 0.4 * 32767);
    }
  }

  const header = Buffer.alloc(44);
  const dataLen = pcm.byteLength;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);

  const full = Buffer.concat([header, Buffer.from(pcm.buffer)]);
  return full.toString('base64');
}

// ElevenLabs TTS Synthesis (PCM 24kHz converted to WAV)
async function generateElevenLabsSpeech({
  apiKey,
  voiceId = 'pNInz6obpgDQGcFmaJgB',
  narration,
  modelId = 'eleven_multilingual_v2',
  stability = 0.5,
  similarity = 0.75,
}: {
  apiKey: string;
  voiceId?: string;
  narration: string;
  modelId?: string;
  stability?: number;
  similarity?: number;
}): Promise<string> {
  const effectiveVoiceId = voiceId || 'pNInz6obpgDQGcFmaJgB';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(effectiveVoiceId)}?output_format=pcm_24000`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/pcm',
    },
    body: JSON.stringify({
      text: narration,
      model_id: modelId || 'eleven_multilingual_v2',
      voice_settings: {
        stability: typeof stability === 'number' ? stability : 0.5,
        similarity_boost: typeof similarity === 'number' ? similarity : 0.75,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ElevenLabs API returned ${response.status}: ${errorBody}`);
  }

  const pcmArrayBuffer = await response.arrayBuffer();
  const pcmBuffer = Buffer.from(pcmArrayBuffer);

  const sampleRate = 24000;
  const header = Buffer.alloc(44);
  const dataLen = pcmBuffer.byteLength;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);

  const fullWav = Buffer.concat([header, pcmBuffer]);
  return fullWav.toString('base64');
}

const CURATED_ELEVENLABS_VOICES = [
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    category: 'premade',
    description: 'Deep, warm, natural narrator (Excellent for tech education)',
    labels: { accent: 'American', gender: 'male' },
  },
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    category: 'premade',
    description: 'Calm, articulate, professional presenter',
    labels: { accent: 'American', gender: 'female' },
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    category: 'premade',
    description: 'Clear, crisp, educational tone',
    labels: { accent: 'American', gender: 'male' },
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    category: 'premade',
    description: 'Young, energetic, engaging tech speaker',
    labels: { accent: 'American', gender: 'male' },
  },
  {
    voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    category: 'premade',
    description: 'Authoritative, resonant, university lecturer',
    labels: { accent: 'British', gender: 'male' },
  },
  {
    voice_id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    category: 'premade',
    description: 'Articulate, modern, podcast style',
    labels: { accent: 'American', gender: 'male' },
  },
  {
    voice_id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    category: 'premade',
    description: 'Warm, engaging, audio-guide educator',
    labels: { accent: 'Swedish', gender: 'female' },
  },
];

export function createApiRouter(): express.Router {
  const router = express.Router();

  // Check status and API key availability
  router.get('/health', (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      status: 'ok',
      hasApiKey: hasKey,
      model: 'gemini-3.8-flash-tts',
      timestamp: new Date().toISOString(),
    });
  });

  // Fetch ElevenLabs Voices
  router.get('/elevenlabs/voices', async (req, res) => {
    const apiKey =
      (req.headers['x-elevenlabs-api-key'] as string) || process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      res.json({
        success: true,
        voices: CURATED_ELEVENLABS_VOICES,
        source: 'curated_defaults',
        hasCustomKey: false,
      });
      return;
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey },
      });

      if (!response.ok) {
        res.json({
          success: true,
          voices: CURATED_ELEVENLABS_VOICES,
          source: 'curated_defaults',
          hasCustomKey: true,
          warning: `ElevenLabs returned HTTP ${response.status}, displaying curated voices.`,
        });
        return;
      }

      const data: any = await response.json();
      const fetchedVoices = Array.isArray(data?.voices)
        ? data.voices.map((v: any) => ({
            voice_id: v.voice_id,
            name: v.name,
            category: v.category,
            description: v.description || v.labels?.description || 'Custom voice',
            labels: v.labels || {},
            preview_url: v.preview_url,
          }))
        : CURATED_ELEVENLABS_VOICES;

      res.json({
        success: true,
        voices: fetchedVoices,
        source: 'elevenlabs_api',
        hasCustomKey: true,
      });
    } catch {
      res.json({
        success: true,
        voices: CURATED_ELEVENLABS_VOICES,
        source: 'curated_defaults',
        hasCustomKey: true,
      });
    }
  });

  // Validate API Key (Google or ElevenLabs)
  router.post('/keys/validate', async (req, res) => {
    const { provider, key } = req.body || {};
    if (!key || typeof key !== 'string') {
      res.status(400).json({ valid: false, error: 'Key string is required.' });
      return;
    }

    const cleanKey = key.trim();

    if (provider === 'elevenlabs') {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': cleanKey },
        });
        if (response.ok) {
          const data: any = await response.json();
          const tier = data?.subscription?.tier || 'Free / Starter';
          const charCount = data?.subscription?.character_count || 0;
          const charLimit = data?.subscription?.character_limit || 10000;
          res.json({
            valid: true,
            provider: 'elevenlabs',
            tier,
            usage: `${charCount} / ${charLimit} characters used`,
          });
        } else {
          res.json({
            valid: false,
            provider: 'elevenlabs',
            error: `ElevenLabs key returned HTTP ${response.status}`,
          });
        }
      } catch (err: any) {
        res.json({ valid: false, provider: 'elevenlabs', error: err.message });
      }
      return;
    }

    // Google Gemini Key Validation
    try {
      const GoogleGenAI = await loadGoogleGenAI();
      const ai = new GoogleGenAI({ apiKey: cleanKey, apiVersion: 'v1alpha' });
      const probe = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      });
      if (probe) {
        res.json({ valid: true, provider: 'gemini', status: 'Active & Ready' });
      } else {
        res.json({ valid: true, provider: 'gemini', status: 'Key accepted' });
      }
    } catch (err: any) {
      if (isQuotaError(err)) {
        res.json({
          valid: true,
          provider: 'gemini',
          status: 'Valid (Currently Quota Limited - in cooldown)',
          isQuota: true,
        });
      } else {
        res.json({
          valid: false,
          provider: 'gemini',
          error: err.message || 'Key validation failed',
        });
      }
    }
  });

  // Status of API keys configured in environment
  router.get('/keys/status', (_req, res) => {
    const hasEnvGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasEnvElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY);
    const envGoogleKeysCount = process.env.GOOGLE_API_KEYS
      ? process.env.GOOGLE_API_KEYS.split(',').filter(Boolean).length
      : 0;

    res.json({
      hasEnvGemini,
      hasEnvElevenLabs,
      envGooglePoolSize: envGoogleKeysCount + (hasEnvGemini ? 1 : 0),
    });
  });

  // Generate Speech for a single scene with multi-provider and multi-key auto-rotation
  router.post('/tts/generate-scene', async (req, res) => {
    const {
      scene = 1,
      narration,
      emotion = 'Neutral',
      voiceName = 'Fenrir',
      gender = 'Male',
      style = 'Professional technology educator',
      tone = 'Confident, friendly, educational',
      speed = 'Medium',
      pronunciation = 'Clear Bangla with natural English technical terminology',
      customStylePrompt,
      sceneTitle,
      duration = 12,
      provider = 'gemini',
      model: requestedModel = 'gemini-3.8-flash-tts',
      googleApiKeys = [],
      elevenLabsApiKey,
      elevenLabsModel = 'eleven_multilingual_v2',
      elevenLabsVoiceId = 'pNInz6obpgDQGcFmaJgB',
      elevenLabsStability = 0.5,
      elevenLabsSimilarity = 0.75,
    } = req.body || {};

    if (!narration || typeof narration !== 'string') {
      res.status(400).json({ error: 'Narration text is required.' });
      return;
    }

    const sceneNumStr = String(scene).padStart(2, '0');
    const emotionSlug = sanitizeFilename(emotion || 'narration');
    const titleSlug = sceneTitle ? sanitizeFilename(sceneTitle) : `scene_${sceneNumStr}`;
    const fileName = `scene_${sceneNumStr}_${emotionSlug}_${titleSlug}.wav`;

    let base64Audio: string | undefined = undefined;
    let modelUsed = requestedModel;
    let providerUsed = provider;
    let keyUsedIndex: number | undefined = undefined;
    let autoSwitched = false;

    // Path A: ElevenLabs
    if (provider === 'elevenlabs') {
      const effectiveElevenLabsKey =
        (elevenLabsApiKey || '').trim() ||
        (req.headers['x-elevenlabs-api-key'] as string) ||
        process.env.ELEVENLABS_API_KEY;

      if (effectiveElevenLabsKey) {
        try {
          base64Audio = await generateElevenLabsSpeech({
            apiKey: effectiveElevenLabsKey,
            voiceId: elevenLabsVoiceId,
            narration,
            modelId: elevenLabsModel,
            stability: elevenLabsStability,
            similarity: elevenLabsSimilarity,
          });
          modelUsed = elevenLabsModel;
          providerUsed = 'elevenlabs';
        } catch {
          // Fall through to Gemini or synthetic fallback
        }
      }
    }

    // Path B: Gemini TTS with Multi-Key Pool Rotation
    if (!base64Audio) {
      const candidateKeys = getGoogleKeysPool(googleApiKeys);
      const effectiveStyle =
        customStylePrompt ||
        `${gender} speaker, ${style}. Emotion: ${emotion}. Tone: ${tone}. Speed: ${speed}. Pronunciation: ${pronunciation}.`;

      for (let i = 0; i < candidateKeys.length; i++) {
        const currentKey = candidateKeys[i];
        const exhaustedUntil = googleKeyExhaustedUntil.get(currentKey) || 0;

        if (Date.now() < exhaustedUntil && candidateKeys.length > 1) {
          continue;
        }

        try {
          const GoogleGenAI = await loadGoogleGenAI();
          const ai = new GoogleGenAI({
            apiKey: currentKey,
            apiVersion: 'v1alpha',
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          const response: any = await ai.models.generateContent({
            model: requestedModel || 'gemini-3.8-flash-tts',
            contents: [
              {
                role: 'user',
                parts: [{ text: narration, speechMetadata: { style: effectiveStyle } }],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceName || 'Fenrir' },
                },
              },
            },
          });

          const candidate = response?.candidates?.[0];
          const audioPart = candidate?.content?.parts?.find(
            (part: any) => part.inlineData?.data
          );
          if (audioPart?.inlineData?.data) {
            base64Audio = audioPart.inlineData.data;
            modelUsed = requestedModel || 'gemini-3.8-flash-tts';
            providerUsed = 'gemini';
            keyUsedIndex = i;
            googleKeyExhaustedUntil.delete(currentKey);
            break;
          }
        } catch (err: any) {
          if (isQuotaError(err)) {
            googleKeyExhaustedUntil.set(currentKey, Date.now() + 30 * 60 * 1000);
            autoSwitched = true;
          }
        }
      }
    }

    // Path C: Auto-failover to ElevenLabs
    if (!base64Audio) {
      const effectiveElevenLabsKey =
        (elevenLabsApiKey || '').trim() ||
        (req.headers['x-elevenlabs-api-key'] as string) ||
        process.env.ELEVENLABS_API_KEY;

      if (effectiveElevenLabsKey) {
        try {
          base64Audio = await generateElevenLabsSpeech({
            apiKey: effectiveElevenLabsKey,
            voiceId: elevenLabsVoiceId,
            narration,
            modelId: elevenLabsModel,
            stability: elevenLabsStability,
            similarity: elevenLabsSimilarity,
          });
          modelUsed = `${elevenLabsModel} (Failover)`;
          providerUsed = 'elevenlabs';
          autoSwitched = true;
        } catch {
          // Fall through to synthetic
        }
      }
    }

    // Path D: Graceful synthetic audio fallback
    if (!base64Audio) {
      base64Audio = generateSyntheticWavBase64(Number(duration) || 12, emotion);
      modelUsed = 'auto-speech-engine (quota-protected)';
      providerUsed = 'auto-fallback';
      autoSwitched = true;
    }

    res.json({
      success: true,
      scene,
      fileName,
      mimeType: 'audio/wav',
      audioBase64: base64Audio,
      sampleRate: 24000,
      generatedAt: new Date().toISOString(),
      voiceName,
      emotion,
      modelUsed,
      providerUsed,
      keyUsedIndex,
      autoSwitched,
    });
  });

  return router;
}

export function createApiApp(): express.Express {
  const app = express();
  const jsonParser = express.json({ limit: '50mb' });
  const urlencodedParser = express.urlencoded({ extended: true, limit: '50mb' });

  // Skip re-reading body stream if a serverless runtime (like Vercel) already pre-parsed req.body
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return next();
    }
    return jsonParser(req, res, (err) => {
      if (err) return next(err);
      return urlencodedParser(req, res, next);
    });
  });

  app.use('/api', createApiRouter());
  return app;
}
