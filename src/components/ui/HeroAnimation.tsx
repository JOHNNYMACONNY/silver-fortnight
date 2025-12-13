import React from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import { useMotion } from './MotionProvider';

export const HeroAnimation: React.FC<{ className?: string }> = ({ className }) => {
  const { isMotionDisabled } = useMotion();

  // Static gradient for reduced motion - still visible but not animated
  const staticGradient = "radial-gradient(circle at 50% 50%, rgba(249,115,22,0.12) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(236,72,153,0.10) 0%, transparent 60%), radial-gradient(circle at 30% 70%, rgba(14,165,233,0.10) 0%, transparent 60%)";

  if (isMotionDisabled) {
    // Static fallback - subtle static gradient (still visible, just not animated)
    return (
      <div
        className={cn(
          "relative w-full h-full rounded-2xl overflow-hidden",
          className
        )}
        style={{ background: staticGradient }}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden",
        className
      )}
    >
      {/* Ultra-minimal animated gradient overlay - more visible than before */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(circle at 30% 50%, rgba(249,115,22,0.15) 0%, transparent 65%), radial-gradient(circle at 70% 50%, rgba(236,72,153,0.12) 0%, transparent 65%)",
            "radial-gradient(circle at 50% 30%, rgba(236,72,153,0.15) 0%, transparent 65%), radial-gradient(circle at 50% 70%, rgba(14,165,233,0.12) 0%, transparent 65%)",
            "radial-gradient(circle at 70% 50%, rgba(14,165,233,0.15) 0%, transparent 65%), radial-gradient(circle at 30% 50%, rgba(249,115,22,0.12) 0%, transparent 65%)",
          ]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
