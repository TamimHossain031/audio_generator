import JSZip from 'jszip';
import { SceneData, SceneAudioState } from '../types';

/**
 * Converts a base64 string to a Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates an object URL for a base64 WAV audio string
 */
export function createWavBlobUrl(base64: string): string {
  const bytes = base64ToUint8Array(base64);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Finds the offset of the "data" subchunk and extracts raw PCM bytes
 */
export function extractPcmFromWav(wavBytes: Uint8Array): Uint8Array {
  // Check for "RIFF"
  if (
    wavBytes.length < 44 ||
    wavBytes[0] !== 0x52 || // R
    wavBytes[1] !== 0x49 || // I
    wavBytes[2] !== 0x46 || // F
    wavBytes[3] !== 0x46 // F
  ) {
    // If not a standard RIFF header, treat the whole buffer as PCM
    return wavBytes;
  }

  // Scan for 'data' marker
  let dataOffset = 12;
  while (dataOffset < wavBytes.length - 8) {
    const chunkId = String.fromCharCode(
      wavBytes[dataOffset],
      wavBytes[dataOffset + 1],
      wavBytes[dataOffset + 2],
      wavBytes[dataOffset + 3]
    );
    const chunkSize =
      wavBytes[dataOffset + 4] |
      (wavBytes[dataOffset + 5] << 8) |
      (wavBytes[dataOffset + 6] << 16) |
      (wavBytes[dataOffset + 7] << 24);

    if (chunkId === 'data') {
      const start = dataOffset + 8;
      const end = Math.min(wavBytes.length, start + chunkSize);
      return wavBytes.subarray(start, end);
    }
    dataOffset += 8 + chunkSize;
  }

  // Default fallback: header is 44 bytes
  return wavBytes.subarray(44);
}

/**
 * Creates a standard 44-byte WAV header for 24kHz mono 16-bit PCM
 */
export function createWavHeader(
  dataLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  // "RIFF"
  header.set([0x52, 0x49, 0x46, 0x46], 0);
  // File size - 8
  view.setUint32(4, 36 + dataLength, true);
  // "WAVE"
  header.set([0x57, 0x41, 0x56, 0x45], 8);
  // "fmt "
  header.set([0x66, 0x6d, 0x74, 0x20], 12);
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true);
  // AudioFormat (1 for PCM)
  view.setUint16(20, 1, true);
  // NumChannels
  view.setUint16(22, numChannels, true);
  // SampleRate
  view.setUint32(24, sampleRate, true);
  // ByteRate
  view.setUint32(28, byteRate, true);
  // BlockAlign
  view.setUint16(32, blockAlign, true);
  // BitsPerSample
  view.setUint16(34, bitsPerSample, true);
  // "data"
  header.set([0x64, 0x61, 0x74, 0x61], 36);
  // Subchunk2Size
  view.setUint32(40, dataLength, true);

  return header;
}

/**
 * Concatenates multiple base64 WAV audio clips into one unified WAV blob
 */
export function mergeWavAudio(base64Clips: string[], sampleRate = 24000): Blob {
  const pcmParts: Uint8Array[] = [];
  let totalPcmLength = 0;

  for (const b64 of base64Clips) {
    if (!b64) continue;
    const bytes = base64ToUint8Array(b64);
    const pcm = extractPcmFromWav(bytes);
    pcmParts.push(pcm);
    totalPcmLength += pcm.length;
  }

  const header = createWavHeader(totalPcmLength, sampleRate, 1, 16);
  const fullBytes = new Uint8Array(44 + totalPcmLength);
  fullBytes.set(header, 0);

  let currentOffset = 44;
  for (const part of pcmParts) {
    fullBytes.set(part, currentOffset);
    currentOffset += part.length;
  }

  return new Blob([fullBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
}

/**
 * Triggers a file download in the browser
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate SRT format subtitles from scenes and durations
 */
export function generateSrt(
  scenes: SceneData[],
  audioStates: Record<number, SceneAudioState>
): string {
  let srt = '';
  let currentTime = 0;

  scenes.forEach((scene, index) => {
    const duration = audioStates[scene.scene]?.actualDuration || scene.duration || 10;
    const startTime = currentTime;
    const endTime = currentTime + duration;
    currentTime = endTime;

    const formatSrtTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    srt += `${index + 1}\n`;
    srt += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
    srt += `${scene.narration}\n\n`;
  });

  return srt;
}

/**
 * Creates and downloads a ZIP package containing all scene-wise WAV files,
 * merged narration WAV, JSON manifest, and SRT subtitles.
 */
export async function downloadAllScenesAsZip(
  scenes: SceneData[],
  audioStates: Record<number, SceneAudioState>,
  projectTitle: string
) {
  const zip = new JSZip();
  const folder = zip.folder('bangla_ai_voiceover_scenes') || zip;

  const validBase64List: string[] = [];

  scenes.forEach((scene) => {
    const state = audioStates[scene.scene];
    if (state?.audioBase64) {
      const bytes = base64ToUint8Array(state.audioBase64);
      folder.file(state.fileName || scene.fileName, bytes);
      validBase64List.push(state.audioBase64);
    }
  });

  // Also include merged full narration if multiple audio clips exist
  if (validBase64List.length > 1) {
    const mergedBlob = mergeWavAudio(validBase64List);
    const mergedBuffer = await mergedBlob.arrayBuffer();
    folder.file('full_narration_merged_all_scenes.wav', mergedBuffer);
  }

  // Include Subtitles (.srt)
  const srtContent = generateSrt(scenes, audioStates);
  folder.file('narration_subtitles.srt', srtContent);

  // Include Manifest JSON
  const manifest = {
    title: projectTitle,
    generatedWith: 'Google Gemini 3.8 Flash TTS',
    totalScenes: scenes.length,
    scenes: scenes.map((s) => ({
      scene: s.scene,
      title: s.title,
      fileName: audioStates[s.scene]?.fileName || s.fileName,
      emotion: s.emotion,
      targetDuration: s.duration,
      actualDuration: audioStates[s.scene]?.actualDuration || null,
      narration: s.narration,
      generated: Boolean(audioStates[s.scene]?.audioBase64),
    })),
  };
  folder.file('scenes_manifest.json', JSON.stringify(manifest, null, 2));

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_audio_scenes.zip`;
  downloadBlob(zipBlob, zipFileName);
}
