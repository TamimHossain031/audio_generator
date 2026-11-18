import React from 'react';

interface Props {
  text: string;
  className?: string;
}

// Regex to detect English technical terminology within the Bangla text
const TECH_TERMS_REGEX =
  /(ChatGPT|Google Maps|AI Coding Assistant|Artificial Intelligence|AI|Computer Science|Machine Learning|Deep Learning|Generative AI|Machine|Developer|Rules|Input|Output|Model|Data|Pattern|Prediction|Text|Image|Audio|Code|Software Application|Product Recommendation|Spam Detection|Customer Support Chatbot|AI Engineer|Software System|Reliable|Useful Application|Intelligent Task|Language Understanding|Image Recognition|Decision Making|Traditional Programming)/gi;

export const BengaliTextHighlighter: React.FC<Props> = ({ text, className = '' }) => {
  const parts = text.split(TECH_TERMS_REGEX);

  return (
    <p className={`leading-relaxed text-slate-200 text-base md:text-lg ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;
        const isMatch = part.match(TECH_TERMS_REGEX);
        if (isMatch) {
          return (
            <span
              key={index}
              className="inline-block mx-0.5 px-1.5 py-0.5 text-xs md:text-sm font-semibold rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono tracking-tight"
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
};
