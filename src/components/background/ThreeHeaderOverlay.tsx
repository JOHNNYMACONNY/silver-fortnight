import React from 'react';
import WebGLCanvas from './WebGLCanvas';

export type EffectsPreset = 'ribbons' | 'aurora' | 'metaballs' | 'audio';
export type EffectsBlendMode = 'screen' | 'soft-light' | 'overlay' | 'plus-lighter';

interface ThreeHeaderOverlayProps {
  preset?: EffectsPreset;
  opacity?: number; // 0.0 - 1.0
  blendMode?: EffectsBlendMode;
  className?: string;
  speed?: number;
  complexity?: number;
  brightness?: number;
  saturation?: number;
}

const brandColors = {
  primary: '#0ea5e9', // sky-500
  secondary: '#f97316', // orange-500
  accent: '#8b5cf6', // violet-500
};

function resolvePresetColors(preset: EffectsPreset) {
  // For now presets map to the same brand colors. In future, we can tune per-preset
  // parameters (e.g., speed/complexity) by extending DynamicBackground/WebGLCanvas props.
  switch (preset) {
    case 'audio':
      return brandColors;
    case 'aurora':
      return brandColors;
    case 'metaballs':
      return brandColors;
    case 'ribbons':
    default:
      return brandColors;
  }
}

export const ThreeHeaderOverlay: React.FC<ThreeHeaderOverlayProps> = ({
  preset = 'ribbons',
  opacity = 0.1,
  blendMode = 'screen',
  className,
  speed,
  complexity,
  brightness,
  saturation,
}) => {
  const colors = resolvePresetColors(preset);

  const resolvePresetParams = (
    p: EffectsPreset
  ): { speed: number; complexity: number; brightness: number; saturation: number } => {
    switch (p) {
      case 'aurora':
        return { speed: 1.0, complexity: 3.2, brightness: 1.2, saturation: 1.15 };
      case 'metaballs':
        return { speed: 0.8, complexity: 4.2, brightness: 1.15, saturation: 1.2 };
      case 'audio':
        return { speed: 1.2, complexity: 3.8, brightness: 1.2, saturation: 1.2 };
      case 'ribbons':
      default:
        return { speed: 0.9, complexity: 4.0, brightness: 1.2, saturation: 1.2 };
    }
  };
  const defaults = resolvePresetParams(preset);

  return (
    <div
      className={['pointer-events-none', 'w-full h-full', className || ''].join(' ')}
      aria-hidden
    >
      <div
        className="w-full h-full"
        style={{
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
          opacity
        }}
      >
        <WebGLCanvas
          colors={colors}
          className="w-full h-full"
          transparent
          speed={typeof speed === 'number' ? speed : defaults.speed}
          complexity={typeof complexity === 'number' ? complexity : defaults.complexity}
          brightness={typeof brightness === 'number' ? brightness : defaults.brightness}
          saturation={typeof saturation === 'number' ? saturation : defaults.saturation}
          preset={preset}
          intensity={Math.max(0, Math.min(1, opacity / 0.3))}
        />
      </div>
    </div>
  );
};

export default ThreeHeaderOverlay;


