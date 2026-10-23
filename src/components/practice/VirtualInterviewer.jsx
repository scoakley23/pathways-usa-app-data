import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Loader2 } from 'lucide-react';

export const AVATAR_URL = 'https://media.base44.com/images/public/6931bd654d327c7b2e36bfed/868007eb0_generated_image.png';

export default function VirtualInterviewer({ state = 'idle', name = 'Officer Martinez' }) {
  return (
    <div className="flex items-center gap-4 text-pw-navy">
      <div className="relative w-20 h-20 shrink-0">
        {/* Speaking glow ring */}
        {state === 'speaking' && (
          <motion.div
            className="absolute -inset-1.5 rounded-full ring-4 ring-pw-navy/30"
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Listening ring */}
        {state === 'listening' && (
          <div className="absolute -inset-1.5 rounded-full ring-2 ring-pw-navy/40" />
        )}

        {/* Avatar image */}
        <motion.img
          src={AVATAR_URL}
          alt={name}
          className="w-20 h-20 rounded-full object-cover border-4 border-white bg-pw-blue-soft shadow-raised relative z-10"
          animate={state === 'speaking' ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: state === 'speaking' ? Infinity : 0, ease: 'easeInOut' }}
        />

        {/* Sound waves while speaking */}
        {state === 'speaking' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-end gap-0.5 bg-white rounded-full px-2 py-1 shadow-raised">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-pw-navy rounded-full"
                animate={{ height: [4, 12, 4] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
              />
            ))}
          </div>
        )}

        {/* Thinking overlay */}
        {state === 'thinking' && (
          <div className="absolute inset-0 rounded-full bg-pw-navy/20 flex items-center justify-center z-20">
            <Loader2 className="w-8 h-8 text-pw-navy animate-spin" />
          </div>
        )}

        {/* Listening mic badge */}
        {state === 'listening' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-pw-navy rounded-full p-1.5 shadow-raised">
            <Mic className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-extrabold text-lg leading-tight">{name}</p>
        <p className="text-sm text-pw-muted leading-snug mt-0.5">Practice officer (AI). Not a real USCIS officer.</p>
      </div>
    </div>
  );
}