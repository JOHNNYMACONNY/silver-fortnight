import { useMemo } from 'react';

interface BannerGradientProps {
  style: string;
  className?: string;
}

// Define gradient styles
const gradientStyles = {
  'banner-masculine': {
    background: 'linear-gradient(135deg, #4A5D43 0%, #3A4A36 50%, #2F3B2F 100%)',
    overlay: 'linear-gradient(180deg, rgba(47, 59, 47, 0) 0%, rgba(47, 59, 47, 0.2) 100%)'
  },
  'banner-feminine': {
    background: 'linear-gradient(135deg, #C67D63 0%, #B57058 50%, #8B9D83 100%)',
    overlay: 'linear-gradient(180deg, rgba(139, 157, 131, 0) 0%, rgba(139, 157, 131, 0.2) 100%)'
  },
  'banner-neutral': {
    background: 'linear-gradient(135deg, #D69F4C 0%, #C89245 50%, #F5F2EA 100%)',
    overlay: 'linear-gradient(180deg, rgba(245, 242, 234, 0) 0%, rgba(245, 242, 234, 0.1) 100%)'
  }
};

export function BannerGradient({ style, className = '' }: BannerGradientProps) {
  const gradientStyle = useMemo(() => {
    const gradient = gradientStyles[style as keyof typeof gradientStyles];
    if (!gradient) return { background: '#1F2937' }; // Default background

    return {
      background: gradient.background,
      animation: 'banner-gradient 12s ease infinite',
      backgroundSize: '400% 400%'
    };
  }, [style]);

  return (
    <div 
      className={`h-32 w-full ${className}`} 
      style={gradientStyle}
    >
      <div 
        className="h-full w-full" 
        style={{ 
          background: gradientStyles[style as keyof typeof gradientStyles]?.overlay,
          pointerEvents: 'none' 
        }} 
      />
    </div>
  );
}
