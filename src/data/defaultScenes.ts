import { ProjectScriptJson, VoiceConfig } from '../types';

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  provider: 'gemini',
  gender: 'Male',
  style: 'Professional technology educator',
  tone: 'Confident, friendly, educational',
  speed: 'Medium',
  pronunciation: 'Clear Bangla with natural English technical terminology',
  voiceName: 'Fenrir', // Recommended male prebuilt voice for authoritative, confident education
  ttsModel: 'gemini-3.8-flash-tts',
  elevenLabsModel: 'eleven_multilingual_v2',
  elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Natural male multilingual voice
  elevenLabsVoiceName: 'Adam (Narrator)',
  elevenLabsStability: 0.5,
  elevenLabsSimilarity: 0.75,
};

export const REFERENCE_SCRIPT_JSON: ProjectScriptJson = {
  title: 'What is Artificial Intelligence?',
  language: 'Bangla',
  voice: {
    gender: 'Male',
    style: 'Professional technology educator',
    tone: 'Confident, friendly, educational',
    speed: 'Medium',
    pronunciation: 'Clear Bangla with natural English technical terminology',
  },
  scenes: [
    {
      scene: 1,
      duration: 10,
      emotion: 'Curious',
      narration:
        'আমরা প্রতিদিন ChatGPT, Google Maps, এবং AI Coding Assistant ব্যবহার করছি। কিন্তু কখনো কি ভেবে দেখেছ, Artificial Intelligence আসলে কী?',
    },
    {
      scene: 2,
      duration: 15,
      emotion: 'Explanatory',
      narration:
        'Artificial Intelligence বা AI হলো Computer Science-এর এমন একটি শাখা, যেখানে Machine-কে মানুষের মতো কিছু Intelligent Task সম্পাদন করতে সক্ষম করে তোলা হয়। যেমন Language Understanding, Image Recognition এবং Decision Making।',
    },
    {
      scene: 3,
      duration: 15,
      emotion: 'Analytical',
      narration:
        'Traditional Programming-এ Developer নিজেই Rules লিখে দেয়। Computer সেই Rules অনুসরণ করে Output তৈরি করে। অর্থাৎ Input, সঙ্গে Rules, এবং তার ফলাফল হলো Output।',
    },
    {
      scene: 4,
      duration: 15,
      emotion: 'Engaging',
      narration:
        'কিন্তু Machine Learning-এ বিষয়টি একটু আলাদা। এখানে আমরা Model-কে অনেক Data দিই। Model সেই Data থেকে Pattern শেখে এবং নতুন Data সম্পর্কে Prediction তৈরি করে।',
    },
    {
      scene: 5,
      duration: 15,
      emotion: 'Educational',
      narration:
        'AI-এর একটি গুরুত্বপূর্ণ Subfield হলো Machine Learning। Machine Learning-এর একটি Subfield হলো Deep Learning। আর Generative AI ব্যবহার করে আমরা নতুন Text, Image, Audio এবং Code তৈরি করতে পারি।',
    },
    {
      scene: 6,
      duration: 15,
      emotion: 'Energetic',
      narration:
        'আজকের Software Application-এ AI ব্যবহার হচ্ছে Product Recommendation, Spam Detection, Customer Support Chatbot এবং AI Coding Assistant-এর মতো অসংখ্য কাজে।',
    },
    {
      scene: 7,
      duration: 15,
      emotion: 'Inspirational',
      narration:
        'একজন AI Engineer হিসেবে আমাদের লক্ষ্য শুধু AI Model ব্যবহার করা নয়। বরং সেই Model-কে বাস্তব Software System-এর সঙ্গে Integrate করে Reliable এবং Useful Application তৈরি করা।',
    },
  ],
};
