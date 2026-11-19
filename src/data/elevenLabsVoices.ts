export interface ElevenLabsVoiceOption {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  labels: {
    accent?: string;
    gender?: string;
    use_case?: string;
  };
  preview_url?: string;
  requiresPaidPlan?: boolean;
}

// Verified ElevenLabs premade voices that work on Free Tier API as well as Paid plans
export const CURATED_ELEVENLABS_VOICES: ElevenLabsVoiceOption[] = [
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    category: 'premade',
    description: 'Deep, warm, dominant narrator (Excellent for tech education)',
    labels: { accent: 'American', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    category: 'premade',
    description: 'Clear, crisp, balanced educational tone',
    labels: { accent: 'American', gender: 'male', use_case: 'educational' },
  },
  {
    voice_id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    category: 'premade',
    description: 'Clear, engaging British educator & explainer',
    labels: { accent: 'British', gender: 'female', use_case: 'educational' },
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    category: 'premade',
    description: 'Mature, reassuring, confident news & tutorial presenter',
    labels: { accent: 'American', gender: 'female', use_case: 'news' },
  },
  {
    voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    category: 'premade',
    description: 'Warm, captivating British storyteller & lecturer',
    labels: { accent: 'British', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    category: 'premade',
    description: 'Energetic, articulate, modern social media creator',
    labels: { accent: 'American', gender: 'male', use_case: 'podcast' },
  },
  {
    voice_id: 'hpp4J3VqNfWAUOO0d1Us',
    name: 'Bella',
    category: 'premade',
    description: 'Professional, bright, warm presenter',
    labels: { accent: 'American', gender: 'female', use_case: 'narration' },
  },
  {
    voice_id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    category: 'premade',
    description: 'Enthusiastic, expressive, bright social explainer',
    labels: { accent: 'American', gender: 'female', use_case: 'social' },
  },
  {
    voice_id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    category: 'premade',
    description: 'Steady, authoritative British broadcaster & documentary host',
    labels: { accent: 'British', gender: 'male', use_case: 'news' },
  },
  {
    voice_id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    category: 'premade',
    description: 'Deep, resonant, comforting studio documentary narrator',
    labels: { accent: 'American', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: 'cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    category: 'premade',
    description: 'Smooth, trustworthy corporate & software educator',
    labels: { accent: 'American', gender: 'male', use_case: 'conversational' },
  },
  {
    voice_id: 'iP95p4xoKVk53GoZ742B',
    name: 'Chris',
    category: 'premade',
    description: 'Charming, down-to-earth, easy-to-follow tech explainer',
    labels: { accent: 'American', gender: 'male', use_case: 'conversational' },
  },
  {
    voice_id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    category: 'premade',
    description: 'Playful, bright, warm tutorial & course host',
    labels: { accent: 'American', gender: 'female', use_case: 'conversational' },
  },
  {
    voice_id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    category: 'premade',
    description: 'Knowledgeable, professional lesson & audiobook narrator',
    labels: { accent: 'American', gender: 'female', use_case: 'narration' },
  },
  {
    voice_id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    category: 'premade',
    description: 'Velvety, expressive British storytelling voice',
    labels: { accent: 'British', gender: 'female', use_case: 'narration' },
  },
  {
    voice_id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    category: 'premade',
    description: 'Deep, confident, energetic Australian storyteller',
    labels: { accent: 'Australian', gender: 'male', use_case: 'conversational' },
  },
  {
    voice_id: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    category: 'premade',
    description: 'Husky, crisp, character & tech narrator',
    labels: { accent: 'American', gender: 'male', use_case: 'characters' },
  },
  {
    voice_id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    category: 'premade',
    description: 'Laid-back, casual, resonant presenter',
    labels: { accent: 'American', gender: 'male', use_case: 'social' },
  },
  {
    voice_id: 'bIHbv24MWmeRgasZH58o',
    name: 'Will',
    category: 'premade',
    description: 'Relaxed, optimistic, friendly creator voice',
    labels: { accent: 'American', gender: 'male', use_case: 'social' },
  },
  {
    voice_id: 'pqHfZKP75CvOlQylNhV4',
    name: 'Bill',
    category: 'premade',
    description: 'Wise, mature, balanced documentary narrator',
    labels: { accent: 'American', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: 'SOYHLrjzK2X1ezoPC6cr',
    name: 'Harry',
    category: 'premade',
    description: 'Bold, intense, high-impact dramatic narrator',
    labels: { accent: 'American', gender: 'male', use_case: 'characters' },
  },
  {
    voice_id: 'SAz9YHcvj6GT2YYXdXww',
    name: 'River',
    category: 'premade',
    description: 'Relaxed, neutral, calm informational voice',
    labels: { accent: 'American', gender: 'neutral', use_case: 'conversational' },
  },
];
