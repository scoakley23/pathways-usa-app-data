import React from 'react';
import { 
  Flame, 
  Target, 
  Star, 
  Zap, 
  ShieldCheck, 
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

const BADGES_CONFIG = {
  "first_step": {
    id: "first_step",
    name: "First Step",
    description: "Complete your first sentence correctly",
    icon: Star,
    color: "text-pw-blue-ink bg-pw-blue-soft border-pw-blue-soft"
  },
  "on_fire": {
    id: "on_fire",
    name: "On Fire",
    description: "Achieve a 5-sentence streak",
    icon: Flame,
    color: "text-pw-red-ink bg-pw-red-soft border-pw-red-soft"
  },
  "unstoppable": {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Achieve a 10-sentence streak",
    icon: Zap,
    color: "text-pw-navy bg-pw-soft border-pw-soft"
  },
  "scholar": {
    id: "scholar",
    name: "Civics Scholar",
    description: "Master 50 sentences total",
    icon: BookOpen,
    color: "text-pw-blue-ink bg-pw-blue-soft border-pw-blue-soft"
  },
  "perfect_week": {
    id: "perfect_week",
    name: "Sharpshooter",
    description: "Get 100% accuracy in a session",
    icon: Target,
    color: "text-pw-green-ink bg-pw-green-soft border-pw-green-soft"
  },
  "veteran": {
    id: "veteran",
    name: "Veteran",
    description: "Earn 1000 points",
    icon: ShieldCheck,
    color: "text-pw-teal-ink bg-pw-teal-soft border-pw-teal-soft"
  }
};

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
                      : 'bg-pw-soft border-pw-line text-pw-muted'
                    }`}
                >
                  {!isEarned && (
                    <div className="absolute top-3 right-3 z-10">
                      <Lock className="w-4 h-4 text-pw-muted" aria-label="Locked" />
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-full ${isEarned ? 'bg-white/70' : 'bg-white'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold leading-tight">{badge.name}</span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-bold text-pw-navy">{badge.name}</p>
                <p className="text-sm text-pw-muted">{badge.description}</p>
                {!isEarned && <p className="text-sm text-pw-red-ink mt-1 font-bold">Locked</p>}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}