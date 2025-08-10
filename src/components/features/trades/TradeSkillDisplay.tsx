import React from 'react';
import { motion } from 'framer-motion';
import { TradeSkill } from '../../../services/firestore-exports';

interface TradeSkillDisplayProps {
  skill: TradeSkill;
  className?: string;
}

export const TradeSkillDisplay: React.FC<TradeSkillDisplayProps> = ({ skill, className }) => (
  <motion.span 
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    whileHover={{ scale: 1.05 }}
  >
    {skill.name} <span className="ml-1 text-gray-500">({skill.level})</span>
  </motion.span>
);