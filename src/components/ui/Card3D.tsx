import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  border?: boolean;
  shadow?: boolean;
  glare?: boolean;
  disabled?: boolean;
  borderColor?: string;
  shadowColor?: string;
  glareColor?: string;
  perspective?: number;
  onClick?: () => void;
}

/**
 * Card3D component for creating interactive 3D card effects
 * 
 * @param children - Content of the card
 * @param className - Additional CSS classes
 * @param intensity - Intensity of the 3D effect (default: 10)
 * @param border - Whether to show a border
 * @param shadow - Whether to show a shadow
 * @param glare - Whether to show a glare effect
 * @param disabled - Whether the 3D effect is disabled
 * @param borderColor - Custom border color
 * @param shadowColor - Custom shadow color
 * @param glareColor - Custom glare color
 * @param perspective - Perspective value for 3D effect (default: 1000)
 * @param onClick - Click handler
 */
export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  intensity = 10,
  border = false,
  shadow = true,
  glare = false,
  disabled = false,
  borderColor = 'border-glass',
  shadowColor = 'rgba(0, 0, 0, 0.1)',
  glareColor = 'rgba(255, 255, 255, 0.15)',
  perspective = 1000,
  onClick,
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle mouse move to create 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calculate mouse position relative to card center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation based on mouse position and intensity
    const rotateYValue = (mouseX / (rect.width / 2)) * intensity;
    const rotateXValue = -(mouseY / (rect.height / 2)) * intensity;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    
    // Calculate glare position
    if (glare) {
      const glareX = (mouseX / rect.width) * 100 + 50;
      const glareY = (mouseY / rect.height) * 100 + 50;
      setGlarePosition({ x: glareX, y: glareY });
    }
  };

  // Reset rotation when mouse leaves
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      setRotateX(0);
      setRotateY(0);
    };
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-xl',
        border && `border ${borderColor}`,
        className
      )}
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
        boxShadow: shadow ? `0 10px 30px -10px ${shadowColor}` : 'none',
      }}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.5,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* Card content */}
      <div className="relative z-card-layer-1">
        {children}
      </div>
      
      {/* Glare effect */}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, ${glareColor} 0%, transparent 70%)`,
            opacity: Math.sqrt(rotateX * rotateX + rotateY * rotateY) / intensity,
          }}
        />
      )}
    </motion.div>
  );
};

export default Card3D;
