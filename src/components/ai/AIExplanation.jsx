import React, { useState } from 'react';
import { Chip } from '@/components/pathways/ui';
import usePracticeText from '@/components/practice/usePracticeText';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ai, isAiLimit } from '@/api/ai';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIExplanation({ question, answer }) {
  const { t } = usePracticeText();
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
      setExplanation(isAiLimit(error) ? error.message : t('ai_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      {!isOpen && !explanation ? (
        <Chip onClick={getExplanation}>
            <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
            {t('explain_ai')}
        </Chip>
      ) : (
        <div className="bg-line-soft rounded-card overflow-hidden transition-all text-start">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full min-h-[44px] flex items-center justify-between px-4 py-3 text-base font-bold text-navy rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            >
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" aria-hidden="true" /> <span dir="auto">{t('ai_explanation')}</span></span>
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
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('ai_thinking')}
                            </div>
                        ) : (
                            <p className="text-base text-navy leading-relaxed" dir="auto">
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