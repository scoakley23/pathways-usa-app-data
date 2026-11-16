import React from 'react';
import { 
  CheckCircle2,
  ListChecks,
  Target, 
  Star, 
  Mountain, 
  BookOpen,
  Lock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { BADGES } from '@/lib/badges';

// Names, descriptions and rules live in src/lib/badges.js; this adds the look.
const BADGE_LOOK = {
  first_step: { icon: Star, color: "text-navy bg-tint border-tint" },
  ten_right: { icon: CheckCircle2, color: "text-navy bg-tint border-tint" },
  fifty_right: { icon: ListChecks, color: "text-navy bg-tint border-tint" },
  scholar: { icon: BookOpen, color: "text-navy bg-tint border-tint" },
  full_marks: { icon: Target, color: "text-correct bg-correct-bg border-correct-bg" },
  points_1000: { icon: Mountain, color: "text-navy bg-tint border-tint" },
};

const BADGES_CONFIG = Object.fromEntries(BADGES.map((b) => [b.id, { ...b, ...BADGE_LOOK[b.id] }]));

export default function BadgesDisplay({ earnedBadges = [] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <TooltipProvider>
        {Object.values(BADGES_CONFIG).map((badge) => {
          const isEarned = earnedBadges.includes(badge.id);
          const Icon = badge.icon;

          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center transition-all aspect-square
                    ${isEarned 
                      ? badge.color 
                      : 'bg-tint border-line text-muted'
                    }`}
                >
                  {!isEarned && (
                    <div className="absolute top-3 end-3 z-10">
                      <Lock className="w-4 h-4 text-muted" aria-label="Locked" />
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-full ${isEarned ? 'bg-white/70' : 'bg-white'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold leading-tight">{badge.name}</span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-bold text-navy">{badge.name}</p>
                <p className="text-sm text-muted">{badge.description}</p>
                {!isEarned && <p className="text-sm text-muted mt-1 font-bold">Locked</p>}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}