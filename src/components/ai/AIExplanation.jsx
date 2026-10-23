import React, { useState } from 'react';
import { PillButton } from '@/components/pathways/ui';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIExplanation({ question, answer, context = "US Civics Test" }) {
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
      const prompt = `Explain clearly and simply why "${answer}" is the correct answer to the question: "${question}". 
      Context: ${context}. 
      Target audience: English language learners studying for US Citizenship. 
      Keep it concise (2-3 sentences).`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setExplanation(typeof response === 'string' ? response : JSON.stringify(response));
    } catch (error) {
      console.error("Error fetching explanation:", error);
      setExplanation("Sorry, I couldn't generate an explanation right now.");
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
        <div className="bg-pw-blue-soft rounded-2xl overflow-hidden transition-all text-left">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full min-h-[44px] flex items-center justify-between px-4 py-3 text-sm font-bold text-pw-blue-ink rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
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
                            <div className="flex items-center gap-2 text-pw-muted text-sm py-1">
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Thinking...
                            </div>
                        ) : (
                            <p className="text-base text-pw-navy leading-relaxed">
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