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
}

export const CURATED_ELEVENLABS_VOICES: ElevenLabsVoiceOption[] = [
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    category: 'premade',
    description: 'Deep, warm, natural narrator (Excellent for tech education)',
    labels: { accent: 'American', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    category: 'premade',
    description: 'Calm, articulate, professional presenter',
    labels: { accent: 'American', gender: 'female', use_case: 'narration' },
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    category: 'premade',
    description: 'Clear, crisp, educational tone',
    labels: { accent: 'American', gender: 'male', use_case: 'educational' },
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    category: 'premade',
    description: 'Young, energetic, engaging tech speaker',
    labels: { accent: 'American', gender: 'male', use_case: 'conversational' },
  },
  {
    voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    category: 'premade',
    description: 'Authoritative, resonant, university lecturer',
    labels: { accent: 'British', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    category: 'premade',
    description: 'Articulate, modern, podcast style',
    labels: { accent: 'American', gender: 'male', use_case: 'podcast' },
  },
  {
    voice_id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    category: 'premade',
    description: 'Warm, engaging, audio-guide educator',
    labels: { accent: 'Swedish', gender: 'female', use_case: 'educational' },
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    category: 'premade',
    description: 'Soft, confident, clear conversational news & tutorial voice',
    labels: { accent: 'American', gender: 'female', use_case: 'news' },
  },
  {
    voice_id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    category: 'premade',
    description: 'Upbeat, expressive, bright social explainer',
    labels: { accent: 'American', gender: 'female', use_case: 'social' },
  },
  {
    voice_id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    category: 'premade',
    description: 'Authoritative British broadcaster & documentary host',
    labels: { accent: 'British', gender: 'male', use_case: 'news' },
  },
  {
    voice_id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    category: 'premade',
    description: 'Deep, comforting, studio-quality documentary narrator',
    labels: { accent: 'American', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: 'cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    category: 'premade',
    description: 'Friendly, trustworthy corporate & software educator',
    labels: { accent: 'American', gender: 'male', use_case: 'conversational' },
  },
  {
    voice_id: 'iP95p4xoKVk53GoZ742B',
    name: 'Chris',
    category: 'premade',
    description: 'Casual, natural, easy-to-follow tech explainer',
    labels: { accent: 'American', gender: 'male', use_case: 'conversational' },
  },
  {
    voice_id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    category: 'premade',
    description: 'Expressive, warm, modern tutorial & course host',
    labels: { accent: 'American', gender: 'female', use_case: 'conversational' },
  },
  {
    voice_id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    category: 'premade',
    description: 'Warm, engaging audiobook & lesson narrator',
    labels: { accent: 'American', gender: 'female', use_case: 'narration' },
  },
  {
    voice_id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    category: 'premade',
    description: 'Warm, velvety British storytelling voice',
    labels: { accent: 'British', gender: 'female', use_case: 'narration' },
  },
  {
    voice_id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    category: 'premade',
    description: 'Natural Australian conversational storyteller',
    labels: { accent: 'Australian', gender: 'male', use_case: 'conversational' },
  },
  {
    voice_id: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    category: 'premade',
    description: 'Intense, clear, transatlantic character & tech narrator',
    labels: { accent: 'Transatlantic', gender: 'male', use_case: 'characters' },
  },
  {
    voice_id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    category: 'premade',
    description: 'Confident, poised, mature presenter',
    labels: { accent: 'American', gender: 'male', use_case: 'social' },
  },
  {
    voice_id: 'bIHbv24MWmeRgasZH58o',
    name: 'Will',
    category: 'premade',
    description: 'Friendly, youthful, enthusiastic creator voice',
    labels: { accent: 'American', gender: 'male', use_case: 'social' },
  },
  {
    voice_id: 'pqHfZKP75CvOlQylNhV4',
    name: 'Bill',
    category: 'premade',
    description: 'Trustworthy, seasoned documentary narrator',
    labels: { accent: 'American', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: 'SAz9YHcvj6GT2YYXdXww',
    name: 'River',
    category: 'premade',
    description: 'Calm, confident, neutral informational voice',
    labels: { accent: 'American', gender: 'non-binary', use_case: 'conversational' },
  },
  {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    category: 'premade',
    description: 'Strong, assertive, high-clarity presenter',
    labels: { accent: 'American', gender: 'female', use_case: 'narration' },
  },
  {
    voice_id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    category: 'premade',
    description: 'Emotional, youthful, expressive storytelling voice',
    labels: { accent: 'American', gender: 'female', use_case: 'narration' },
  },
  {
    voice_id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    category: 'premade',
    description: 'Crisp, resonant, authoritative explainer',
    labels: { accent: 'American', gender: 'male', use_case: 'narration' },
  },
  {
    voice_id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    category: 'premade',
    description: 'Authentic, grounded, warm raspy narrator',
    labels: { accent: 'American', gender: 'male', use_case: 'narration' },
  },
];
