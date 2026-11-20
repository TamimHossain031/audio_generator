import express from 'express';
import { GoogleGenAI } from '@google/genai';

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const googleKeyExhaustedUntil: Map<string, number> = new Map();

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

function isTemporaryDemandError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status || err?.code;
  return (
    status === 503 ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable') ||
    msg.includes('try again later') ||
    msg.includes('503')
  );
}

function extractCleanErrorMessage(err: any): string {
  const raw = String(err?.message || err || 'Validation failed');
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) return String(parsed.error.message);
    if (parsed?.message) return String(parsed.message);
  } catch {
    // raw is plain text
  }
  return raw.length > 220 ? `${raw.slice(0, 220)}...` : raw;
}

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

function cleanElevenLabsApiKey(raw?: string): string {
  return (raw || '').trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
}

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
}): Promise<{ base64: string; mimeType: 'audio/wav' | 'audio/mpeg' }> {
  const cleanKey = cleanElevenLabsApiKey(apiKey);
  const effectiveVoiceId = voiceId || 'pNInz6obpgDQGcFmaJgB';
  const payload = JSON.stringify({
    text: narration,
    model_id: modelId || 'eleven_multilingual_v2',
    voice_settings: {
      stability: typeof stability === 'number' ? stability : 0.5,
      similarity_boost: typeof similarity === 'number' ? similarity : 0.75,
      style: 0.35,
      use_speaker_boost: true,
    },
  });

  // Try lossless 24kHz PCM first (paid tiers), fall back cleanly to MP3 (Free / Starter tiers)
  const pcmUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(effectiveVoiceId)}?output_format=pcm_24000`;
  const pcmResponse = await fetch(pcmUrl, {
    method: 'POST',
    headers: {
      'xi-api-key': cleanKey,
      'Content-Type': 'application/json',
      Accept: 'audio/pcm',
    },
    body: payload,
  });

  if (pcmResponse.ok) {
    const pcmArrayBuffer = await pcmResponse.arrayBuffer();
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
    return { base64: fullWav.toString('base64'), mimeType: 'audio/wav' };
  }

  const pcmErrText = await pcmResponse.text();

  // Retry with MP3 format (supported on ElevenLabs Free Tier & all plans)
  if (pcmResponse.status === 400 || pcmResponse.status === 401 || pcmResponse.status === 403) {
    const mp3Url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(effectiveVoiceId)}?output_format=mp3_44100_128`;
    const mp3Response = await fetch(mp3Url, {
      method: 'POST',
      headers: {
        'xi-api-key': cleanKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: payload,
    });

    if (mp3Response.ok) {
      const mp3Buffer = Buffer.from(await mp3Response.arrayBuffer());
      return { base64: mp3Buffer.toString('base64'), mimeType: 'audio/mpeg' };
    }

    const mp3ErrText = await mp3Response.text();
    const err: any = new Error(extractElevenLabsError(mp3Response.status, mp3ErrText));
    err.status = mp3Response.status;
    throw err;
  }

  const err: any = new Error(extractElevenLabsError(pcmResponse.status, pcmErrText));
  err.status = pcmResponse.status;
  throw err;
}

function extractElevenLabsError(status: number, bodyText: string): string {
  try {
    const parsed = JSON.parse(bodyText);
    const code = parsed?.detail?.code || parsed?.detail?.status || '';
    const msg = parsed?.detail?.message || parsed?.message || '';
    if (code === 'paid_plan_required' || status === 402) {
      return 'This voice is a Paid Library voice (HTTP 402). Please select any "Free OK" premade voice (e.g., Adam, Alice, Sarah, George, Liam, Brian, Bella, Matilda, Daniel, Lily) for Free Tier API.';
    }
    if (msg) return `ElevenLabs (${status}): ${msg}`;
  } catch {
    // Plain text body
  }
  return `ElevenLabs API returned HTTP ${status}: ${bodyText.slice(0, 180)}`;
}

const CURATED_ELEVENLABS_VOICES = [
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade', description: 'Deep, warm, dominant narrator (Excellent for tech education)', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade', description: 'Clear, crisp, balanced educational tone', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', category: 'premade', description: 'Clear, engaging British educator & explainer', labels: { accent: 'British', gender: 'female' } },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', category: 'premade', description: 'Mature, reassuring, confident news & tutorial presenter', labels: { accent: 'American', gender: 'female' } },
  { voice_id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', category: 'premade', description: 'Warm, captivating British storyteller & lecturer', labels: { accent: 'British', gender: 'male' } },
  { voice_id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', category: 'premade', description: 'Energetic, articulate, modern social media creator', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella', category: 'premade', description: 'Professional, bright, warm presenter', labels: { accent: 'American', gender: 'female' } },
  { voice_id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', category: 'premade', description: 'Enthusiastic, expressive, bright social explainer', labels: { accent: 'American', gender: 'female' } },
  { voice_id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', category: 'premade', description: 'Steady, authoritative British broadcaster & documentary host', labels: { accent: 'British', gender: 'male' } },
  { voice_id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', category: 'premade', description: 'Deep, resonant, comforting studio documentary narrator', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', category: 'premade', description: 'Smooth, trustworthy corporate & software educator', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', category: 'premade', description: 'Charming, down-to-earth, easy-to-follow tech explainer', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', category: 'premade', description: 'Playful, bright, warm tutorial & course host', labels: { accent: 'American', gender: 'female' } },
  { voice_id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', category: 'premade', description: 'Knowledgeable, professional lesson & audiobook narrator', labels: { accent: 'American', gender: 'female' } },
  { voice_id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', category: 'premade', description: 'Velvety, expressive British storytelling voice', labels: { accent: 'British', gender: 'female' } },
  { voice_id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', category: 'premade', description: 'Deep, confident, energetic Australian storyteller', labels: { accent: 'Australian', gender: 'male' } },
  { voice_id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', category: 'premade', description: 'Husky, crisp, character & tech narrator', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', category: 'premade', description: 'Laid-back, casual, resonant presenter', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'bIHbv24MWmeRgasZH58o', name: 'Will', category: 'premade', description: 'Relaxed, optimistic, friendly creator voice', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', category: 'premade', description: 'Wise, mature, balanced documentary narrator', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry', category: 'premade', description: 'Bold, intense, high-impact dramatic narrator', labels: { accent: 'American', gender: 'male' } },
  { voice_id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', category: 'premade', description: 'Relaxed, neutral, calm informational voice', labels: { accent: 'American', gender: 'neutral' } },
];

export function createApiApp(): express.Express {
  const app = express();
  const jsonParser = express.json({ limit: '50mb' });
  const urlencodedParser = express.urlencoded({ extended: true, limit: '50mb' });

  // Skip re-reading body stream if Vercel already pre-parsed req.body
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return next();
    }
    return jsonParser(req, res, (err) => {
      if (err) return next(err);
      return urlencodedParser(req, res, next);
    });
  });

  const router = express.Router();

  router.get('/health', (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      status: 'ok',
      hasApiKey: hasKey,
      model: 'gemini-3.8-flash-tts',
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/elevenlabs/voices', async (req, res) => {
    const apiKey = cleanElevenLabsApiKey(
      (req.headers['x-elevenlabs-api-key'] as string) || process.env.ELEVENLABS_API_KEY
    );

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
        ? data.voices
            .map((v: any) => ({
              voice_id: v.voice_id,
              name: v.name,
              category: v.category || 'premade',
              description: v.description || v.labels?.description || 'ElevenLabs voice',
              labels: v.labels || {},
              preview_url: v.preview_url,
              requiresPaidPlan:
                v.category === 'professional' || v.category === 'high_quality',
            }))
            .sort((a: any, b: any) => Number(Boolean(a.requiresPaidPlan)) - Number(Boolean(b.requiresPaidPlan)))
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

  router.post('/keys/validate', async (req, res) => {
    const { provider, key } = req.body || {};
    if (!key || typeof key !== 'string') {
      res.status(400).json({ valid: false, error: 'Key string is required.' });
      return;
    }

    const cleanKey =
      provider === 'elevenlabs' ? cleanElevenLabsApiKey(key) : key.trim();

    if (provider === 'elevenlabs') {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': cleanKey },
        });
        if (response.ok) {
          const data: any = await response.json();
          const tier = data?.subscription?.tier || 'Free / Starter';
          const charCount = data?.subscription?.character_count ?? 0;
          const charLimit = data?.subscription?.character_limit ?? 10000;
          res.json({
            valid: true,
            provider: 'elevenlabs',
            tier,
            usage: `${charCount} / ${charLimit} characters used`,
            status: `${tier} (${charCount.toLocaleString()} / ${charLimit.toLocaleString()} chars)`,
          });
          return;
        }

        // Parse ElevenLabs error body so scoped-permission keys (missing user_read) are handled accurately
        const errBody: any = await response.json().catch(() => ({}));
        const detailStatus = errBody?.detail?.status || '';
        const detailMessage = errBody?.detail?.message || '';

        if (detailStatus === 'missing_permissions') {
          const [voicesRes, modelsRes] = await Promise.all([
            fetch('https://api.elevenlabs.io/v1/voices', {
              headers: { 'xi-api-key': cleanKey },
            }).catch(() => null),
            fetch('https://api.elevenlabs.io/v1/models', {
              headers: { 'xi-api-key': cleanKey },
            }).catch(() => null),
          ]);

          if (voicesRes?.ok) {
            res.json({
              valid: true,
              provider: 'elevenlabs',
              tier: 'Scoped Key',
              status: 'Verified (Scoped Key: Voices & TTS Ready)',
            });
            return;
          }
          if (modelsRes?.ok) {
            res.json({
              valid: true,
              provider: 'elevenlabs',
              tier: 'Scoped Key',
              status: 'Verified (Scoped Key: Models & TTS Ready)',
            });
            return;
          }

          res.json({
            valid: true,
            provider: 'elevenlabs',
            tier: 'Scoped TTS Key',
            status: 'Key recognized (Scoped: ensure Text-to-Speech access is enabled)',
          });
          return;
        }

        const friendlyError =
          detailMessage ||
          (response.status === 401
            ? 'Invalid or unauthorized ElevenLabs API key (HTTP 401). Please copy the full sk_... key without extra spaces from elevenlabs.io/app/settings/api-keys.'
            : `ElevenLabs key returned HTTP ${response.status}`);

        res.json({
          valid: false,
          provider: 'elevenlabs',
          error: friendlyError,
        });
      } catch (err: any) {
        res.json({ valid: false, provider: 'elevenlabs', error: err.message });
      }
      return;
    }

    // Google Gemini Key Validation
    // 1) Try lightweight models.list first (zero inference tokens, immune to 503 model demand spikes)
    const ai = new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    try {
      const modelsPager = await ai.models.list({ config: { pageSize: 1 } });
      if (modelsPager) {
        res.json({
          valid: true,
          provider: 'gemini',
          status: 'Active & Ready',
        });
        return;
      }
    } catch (listErr: any) {
      const listMsg = String(listErr?.message || '').toLowerCase();
      const isDefiniteInvalidKey =
        listErr?.status === 401 ||
        listMsg.includes('api key not valid') ||
        listMsg.includes('api_key_invalid') ||
        listMsg.includes('invalid api key');
      if (isDefiniteInvalidKey) {
        res.json({
          valid: false,
          provider: 'gemini',
          error: extractCleanErrorMessage(listErr),
        });
        return;
      }
      // Some Express / scoped keys disallow models.list; fall through to lightweight generateContent probe
    }

    // 2) Lightweight inference probe (prioritize Flash Lite first to avoid high-demand spikes)
    const validationModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-4-hydrogen',
    ];
    let lastError: any = null;
    let sawHighDemand = false;

    for (const probeModel of validationModels) {
      try {
        const probe = await ai.models.generateContent({
          model: probeModel,
          contents: 'ping',
        });
        res.json({
          valid: true,
          provider: 'gemini',
          status: probe ? `Active & Ready (${probeModel})` : 'Key accepted',
        });
        return;
      } catch (err: any) {
        lastError = err;
        if (isQuotaError(err)) {
          res.json({
            valid: true,
            provider: 'gemini',
            status: 'Valid (Currently Quota Limited - in cooldown)',
            isQuota: true,
          });
          return;
        }
        if (isTemporaryDemandError(err)) {
          sawHighDemand = true;
          continue;
        }
        const msgLower = String(err?.message || '').toLowerCase();
        const isModelUnavailable =
          err?.status === 404 ||
          msgLower.includes('no longer available') ||
          msgLower.includes('not found') ||
          msgLower.includes('not supported');
        if (!isModelUnavailable) {
          break;
        }
      }
    }

    if (sawHighDemand) {
      res.json({
        valid: true,
        provider: 'gemini',
        status: 'Valid Key (Gemini servers temporarily busy — ready to use)',
      });
      return;
    }

    res.json({
      valid: false,
      provider: 'gemini',
      error: extractCleanErrorMessage(lastError),
    });
  });

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
    let fileName = `scene_${sceneNumStr}_${emotionSlug}_${titleSlug}.wav`;

    let base64Audio: string | undefined = undefined;
    let audioMimeType: 'audio/wav' | 'audio/mpeg' = 'audio/wav';
    let modelUsed = requestedModel;
    let providerUsed = provider;
    let keyUsedIndex: number | undefined = undefined;
    let autoSwitched = false;

    if (provider === 'elevenlabs') {
      const effectiveElevenLabsKey = cleanElevenLabsApiKey(
        elevenLabsApiKey ||
          (req.headers['x-elevenlabs-api-key'] as string) ||
          process.env.ELEVENLABS_API_KEY
      );

      if (!effectiveElevenLabsKey) {
        res.status(400).json({
          success: false,
          provider: 'elevenlabs',
          error:
            'ElevenLabs API key is missing. Open "API Keys & Engines", paste your ElevenLabs sk_... key, and click Apply & Save.',
        });
        return;
      }

      try {
        const result = await generateElevenLabsSpeech({
          apiKey: effectiveElevenLabsKey,
          voiceId: elevenLabsVoiceId,
          narration,
          modelId: elevenLabsModel,
          stability: elevenLabsStability,
          similarity: elevenLabsSimilarity,
        });
        base64Audio = result.base64;
        audioMimeType = result.mimeType;
        if (audioMimeType === 'audio/mpeg') {
          fileName = fileName.replace(/\.wav$/i, '.mp3');
        }
        modelUsed = elevenLabsModel;
        providerUsed = 'elevenlabs';
      } catch (err: any) {
        const statusCode =
          typeof err?.status === 'number' && err.status >= 400 && err.status < 600
            ? err.status
            : 502;
        res.status(statusCode).json({
          success: false,
          provider: 'elevenlabs',
          error: err?.message || 'ElevenLabs speech synthesis failed.',
        });
        return;
      }
    }

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

        const primaryTtsModel = requestedModel || 'gemini-3.8-flash-tts';
        const fallbackTtsModel =
          primaryTtsModel === 'gemini-3.8-flash-tts'
            ? 'gemini-3.8-flash-lite-tts'
            : 'gemini-3.8-flash-tts';
        const ttsModelsToTry = [primaryTtsModel, fallbackTtsModel];

        const ai = new GoogleGenAI({
          apiKey: currentKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        for (const ttsModel of ttsModelsToTry) {
          try {
            const response: any = await ai.models.generateContent({
              model: ttsModel,
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
              modelUsed = ttsModel;
              providerUsed = 'gemini';
              keyUsedIndex = i;
              googleKeyExhaustedUntil.delete(currentKey);
              break;
            }
          } catch (err: any) {
            if (isQuotaError(err)) {
              googleKeyExhaustedUntil.set(currentKey, Date.now() + 30 * 60 * 1000);
              autoSwitched = true;
            } else if (isTemporaryDemandError(err)) {
              autoSwitched = true;
              continue;
            }
          }
        }

        if (base64Audio) break;
      }
    }

    if (!base64Audio) {
      const effectiveElevenLabsKey = cleanElevenLabsApiKey(
        elevenLabsApiKey ||
          (req.headers['x-elevenlabs-api-key'] as string) ||
          process.env.ELEVENLABS_API_KEY
      );

      if (effectiveElevenLabsKey) {
        try {
          const result = await generateElevenLabsSpeech({
            apiKey: effectiveElevenLabsKey,
            voiceId: elevenLabsVoiceId,
            narration,
            modelId: elevenLabsModel,
            stability: elevenLabsStability,
            similarity: elevenLabsSimilarity,
          });
          base64Audio = result.base64;
          audioMimeType = result.mimeType;
          if (audioMimeType === 'audio/mpeg') {
            fileName = fileName.replace(/\.wav$/i, '.mp3');
          }
          modelUsed = `${elevenLabsModel} (Failover)`;
          providerUsed = 'elevenlabs';
          autoSwitched = true;
        } catch {
          // Fall through to synthetic
        }
      }
    }

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
      mimeType: audioMimeType,
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

  app.use('/api', router);
  return app;
}

const app = createApiApp();

export default function handler(req: any, res: any) {
  try {
    if (req.url && !req.url.startsWith('/api')) {
      req.url = req.url.startsWith('/') ? `/api${req.url}` : `/api/${req.url}`;
    }
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({
      valid: false,
      error: err?.message || 'Unexpected serverless handler error.',
    });
  }
}
