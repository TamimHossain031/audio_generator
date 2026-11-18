export interface GeminiVoiceOption {
  name: string;
  gender: 'Male' | 'Female';
  toneTag: string;
  style: string;
  recommended?: boolean;
}

export const CURATED_GEMINI_VOICES: GeminiVoiceOption[] = [
  {
    name: 'Fenrir',
    gender: 'Male',
    toneTag: 'Excitable',
    style: 'Deep, confident, authoritative educator',
    recommended: true,
  },
  {
    name: 'Puck',
    gender: 'Male',
    toneTag: 'Upbeat',
    style: 'Energetic, friendly, crisp & bright',
  },
  {
    name: 'Charon',
    gender: 'Male',
    toneTag: 'Informative',
    style: 'Calm, deep, analytical technical lecturer',
  },
  {
    name: 'Kore',
    gender: 'Female',
    toneTag: 'Firm',
    style: 'Smooth, educational, articulate presenter',
    recommended: true,
  },
  {
    name: 'Zephyr',
    gender: 'Female',
    toneTag: 'Bright',
    style: 'Warm, dynamic, engaging instructor',
  },
  {
    name: 'Orus',
    gender: 'Male',
    toneTag: 'Firm',
    style: 'Steady, lower-middle authoritative speaker',
  },
  {
    name: 'Leda',
    gender: 'Female',
    toneTag: 'Youthful',
    style: 'Energetic, fresh, clear tutorial host',
  },
  {
    name: 'Aoede',
    gender: 'Female',
    toneTag: 'Breezy',
    style: 'Relaxed, natural, conversational narrator',
  },
  {
    name: 'Callirrhoe',
    gender: 'Female',
    toneTag: 'Easy-going',
    style: 'Calm, approachable, pleasant explainer',
  },
  {
    name: 'Autonoe',
    gender: 'Female',
    toneTag: 'Bright',
    style: 'Optimistic, cheerful, engaging host',
  },
  {
    name: 'Enceladus',
    gender: 'Male',
    toneTag: 'Breathy',
    style: 'Soft, warm, thoughtful storyteller',
  },
  {
    name: 'Iapetus',
    gender: 'Male',
    toneTag: 'Clear',
    style: 'Articulate, balanced, crisp presenter',
  },
  {
    name: 'Umbriel',
    gender: 'Male',
    toneTag: 'Easy-going',
    style: 'Deep, calm, resonant documentary tone',
  },
  {
    name: 'Algieba',
    gender: 'Male',
    toneTag: 'Smooth',
    style: 'Polished, pleasant studio-grade narrator',
  },
  {
    name: 'Despina',
    gender: 'Female',
    toneTag: 'Smooth',
    style: 'Flowing, calm, refined voiceover',
  },
  {
    name: 'Erinome',
    gender: 'Female',
    toneTag: 'Clear',
    style: 'Precise, structured educational speaker',
  },
  {
    name: 'Algenib',
    gender: 'Male',
    toneTag: 'Gravelly',
    style: 'Textured, distinctive, bold narrator',
  },
  {
    name: 'Rasalgethi',
    gender: 'Male',
    toneTag: 'Informative',
    style: 'Professional documentary & tech host',
  },
  {
    name: 'Laomedeia',
    gender: 'Female',
    toneTag: 'Upbeat',
    style: 'Higher-pitch, enthusiastic explainer',
  },
  {
    name: 'Achernar',
    gender: 'Female',
    toneTag: 'Soft',
    style: 'Gentle, higher-pitch, friendly narrator',
  },
  {
    name: 'Alnilam',
    gender: 'Male',
    toneTag: 'Firm',
    style: 'Direct, strong, decisive instructor',
  },
  {
    name: 'Schedar',
    gender: 'Male',
    toneTag: 'Even',
    style: 'Steady, neutral technical reader',
  },
  {
    name: 'Gacrux',
    gender: 'Female',
    toneTag: 'Mature',
    style: 'Poised, experienced, thoughtful lecturer',
  },
  {
    name: 'Pulcherrima',
    gender: 'Male',
    toneTag: 'Forward',
    style: 'Projecting, confident, clear speaker',
  },
  {
    name: 'Achird',
    gender: 'Male',
    toneTag: 'Friendly',
    style: 'Warm, approachable tutorial guide',
  },
  {
    name: 'Zubenelgenubi',
    gender: 'Male',
    toneTag: 'Casual',
    style: 'Natural, conversational podcast tone',
  },
  {
    name: 'Vindemiatrix',
    gender: 'Female',
    toneTag: 'Gentle',
    style: 'Empathetic, soft, clear storyteller',
  },
  {
    name: 'Sadachbia',
    gender: 'Male',
    toneTag: 'Lively',
    style: 'Dynamic, lower-pitch engaging voice',
  },
  {
    name: 'Sadaltager',
    gender: 'Male',
    toneTag: 'Knowledgeable',
    style: 'Academic, calm, steady mentor voice',
  },
  {
    name: 'Sulafat',
    gender: 'Female',
    toneTag: 'Warm',
    style: 'Welcoming, smooth, middle-pitch presenter',
  },
];
