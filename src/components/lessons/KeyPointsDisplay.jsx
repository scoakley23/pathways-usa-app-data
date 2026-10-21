import React from 'react';
import { CheckCircle } from 'lucide-react';
import GlossaryText from '@/components/lessons/GlossaryText';

export default function KeyPointsDisplay({ keyPoints }) {
  if (!keyPoints || keyPoints.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white border border-pw-line shadow-raised p-5 text-pw-navy">
      <h3 className="text-2xl font-extrabold mb-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-pw-green-soft grid place-items-center shrink-0">
          <CheckCircle className="w-6 h-6 text-pw-green-ink" aria-hidden="true" />
        </span>
        Key Points to Remember
      </h3>
      <ul className="space-y-3">
        {keyPoints.map((point, idx) => {
          const pointText = typeof point === 'string' ? point : point.text;
          const definition = typeof point === 'string' ? null : point.definition;
          const imageUrl = typeof point === 'string' ? null : point.image_url;
          
          return (
            <li key={idx} className="p-4 bg-white rounded-2xl border border-pw-line space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-pw-navy text-white text-sm font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-base text-pw-navy leading-relaxed font-semibold flex-1 pt-1"><GlossaryText>{pointText}</GlossaryText></span>
              </div>
              {definition && (
                <div className="ml-11 p-3 bg-pw-blue-soft rounded-xl">
                  <p className="text-base text-pw-blue-ink">{definition}</p>
                </div>
              )}
              {imageUrl && (
                <div className="ml-11 rounded-2xl overflow-hidden border border-pw-line">
                  <img 
                    src={imageUrl} 
                    alt={pointText}
                    className="w-full h-auto object-cover max-h-64"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}