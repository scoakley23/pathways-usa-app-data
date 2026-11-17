import React, { useState } from 'react';
import { PillButton } from '@/components/pathways/ui';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ai, isAiLimit } from '@/api/ai';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIExplanation({ question, answer }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getExplanation = async () => {
    if (explanation) {
        setIsOpen(!isOpen);
        return;
    }

    setLoading(true);
    setIsOpen(true);
    try {
      // `explain` in src/lib/aiRequests.js (civics questions only; never
      // current officeholders), through src/api/ai.js.
      const response = await ai.run('explain', { question, answer });
      const text = typeof response === 'string' ? response : response?.explanation;
      if (!text) throw new Error('no explanation');
      setExplanation(text);
    } catch (error) {
      console.error("Error fetching explanation:", error);
      setExplanation(isAiLimit(error) ? error.message : "Sorry, I couldn't generate an explanation right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      {!isOpen && !explanation ? (
        <PillButton onClick={getExplanation}>
            <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
            Explain with AI
        </PillButton>
      ) : (
        <div className="bg-tint rounded-2xl overflow-hidden transition-all text-left">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full min-h-[44px] flex items-center justify-between px-4 py-3 text-sm font-bold text-navy rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            >
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" aria-hidden="true" /> AI Explanation</span>
                {isOpen ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2 text-muted text-sm py-1">
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Thinking...
                            </div>
                        ) : (
                            <p className="text-base text-navy leading-relaxed">
                                {explanation}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      )}
    </div>
  );
}