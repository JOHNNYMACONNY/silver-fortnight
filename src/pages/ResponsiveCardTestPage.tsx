import React, { useState, useEffect } from 'react';
import Box from '../components/layout/primitives/Box';

/**
 * Responsive Card Test Page
 * 
 * This page tests the responsive breakpoint behavior for the micro-hero cards.
 * It helps verify that Tailwind responsive classes are working correctly.
 */
const ResponsiveCardTestPage: React.FC = () => {
  const [breakpoint, setBreakpoint] = useState<string>('Loading...');
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const updateIndicators = () => {
      const w = window.innerWidth;
      setWidth(w);
      
      if (w < 768) {
        setBreakpoint('Mobile (< 768px)');
      } else if (w < 1024) {
        setBreakpoint('Tablet (768px - 1024px)');
      } else {
        setBreakpoint('Desktop (> 1024px)');
      }
    };

    updateIndicators();
    window.addEventListener('resize', updateIndicators);
    return () => window.removeEventListener('resize', updateIndicators);
  }, []);
  return (
    <Box className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Responsive Card Test</h1>
          <p className="text-muted-foreground mb-6">
            This page tests the responsive behavior of the micro-hero card variants.
            Resize your browser to see which variant is active.
          </p>
        </div>

        {/* Test Container - Simulates the hero section */}
        <div className="border-2 border-dashed border-primary-500/50 rounded-2xl p-6 bg-neutral-50 dark:bg-neutral-900">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Current Screen Size</h2>
              <div className="text-sm text-muted-foreground">
                <p>Breakpoint: <span className="font-mono font-bold text-primary-500">{breakpoint}</span></p>
                <p>Width: <span className="font-mono">{width}px</span></p>
              </div>
            </div>

          {/* Simulated Hero Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10 items-start md:items-center border-2 border-dashed border-secondary-500/50 rounded-lg p-4 bg-white/50 dark:bg-neutral-800/50">
            
            {/* Left: Text Content */}
            <div className="md:col-span-2 relative z-10">
              <h3 className="text-2xl font-bold mb-2">Hero Text Content</h3>
              <p className="text-muted-foreground mb-4">
                This is the left side of the hero section (2 columns on desktop).
              </p>
            </div>

            {/* Right: Adaptive Cards Visual */}
            <div className="md:col-span-3 flex justify-center items-center w-full border-2 border-dashed border-accent-500/50 rounded-lg p-4 bg-white/30 dark:bg-neutral-800/30">
              
              {/* Mobile Variant - Should show at < 768px */}
              <div className="flex md:hidden gap-2 w-full justify-center py-2 border-2 border-green-500 rounded-lg p-2 bg-green-50 dark:bg-green-950/20">
                <div className="text-center">
                  <div className="font-bold text-green-700 dark:text-green-400 mb-1">MOBILE VARIANT</div>
                  <div className="text-xs text-muted-foreground">Visible: &lt; 768px</div>
                  <div className="flex gap-2 mt-2 justify-center">
                    <div className="glassmorphic border border-white/10 rounded-lg p-2 backdrop-blur-md transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300 flex-1 max-w-[140px]">
                      <div className="text-[10px] font-semibold text-foreground mb-0.5 line-clamp-1">UI Design</div>
                      <div className="text-[9px] text-muted-foreground">↔ React Dev</div>
                    </div>
                    <div className="glassmorphic border border-white/10 rounded-lg p-2 backdrop-blur-md transform rotate-[1deg] hover:rotate-0 transition-transform duration-300 flex-1 max-w-[140px]">
                      <div className="text-[10px] font-semibold text-foreground mb-0.5 line-clamp-1">Video Edit</div>
                      <div className="text-[9px] text-muted-foreground">↔ Web Design</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tablet Variant - Should show at 768px - 1024px */}
              <div className="hidden md:max-lg:flex gap-3 w-full max-w-sm justify-center border-2 border-blue-500 rounded-lg p-2 bg-blue-50 dark:bg-blue-950/20">
                <div className="text-center w-full">
                  <div className="font-bold text-blue-700 dark:text-blue-400 mb-1">TABLET VARIANT</div>
                  <div className="text-xs text-muted-foreground">Visible: 768px - 1024px</div>
                  <div className="flex gap-3 mt-2 justify-center">
                    <div className="glassmorphic border border-white/10 rounded-xl p-2.5 backdrop-blur-md transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300 flex-1">
                      <div className="text-xs font-semibold text-foreground mb-1 line-clamp-1">UI Design</div>
                      <div className="text-[10px] text-muted-foreground">↔ React Dev</div>
                    </div>
                    <div className="glassmorphic border border-white/10 rounded-xl p-2.5 backdrop-blur-md transform rotate-[1deg] hover:rotate-0 transition-transform duration-300 flex-1">
                      <div className="text-xs font-semibold text-foreground mb-1 line-clamp-1">Video Edit</div>
                      <div className="text-[10px] text-muted-foreground">↔ Web Design</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Variant - Should show at > 1024px */}
              <div className="hidden lg:flex w-full max-w-md justify-center border-2 border-purple-500 rounded-lg p-2 bg-purple-50 dark:bg-purple-950/20">
                <div className="text-center w-full">
                  <div className="font-bold text-purple-700 dark:text-purple-400 mb-1">DESKTOP VARIANT</div>
                  <div className="text-xs text-muted-foreground">Visible: &gt; 1024px</div>
                  <div className="grid grid-cols-3 gap-3 w-full px-4 mt-2">
                    <div className="glassmorphic border border-white/10 rounded-xl p-3 backdrop-blur-md transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
                      <div className="text-xs font-semibold text-foreground mb-1 line-clamp-1">UI Design</div>
                      <div className="text-[10px] text-muted-foreground">↔ React Dev</div>
                    </div>
                    <div className="glassmorphic border border-white/10 rounded-xl p-3 backdrop-blur-md transform rotate-[1deg] hover:rotate-0 transition-transform duration-300">
                      <div className="text-xs font-semibold text-foreground mb-1 line-clamp-1">Video Edit</div>
                      <div className="text-[10px] text-muted-foreground">↔ Web Design</div>
                    </div>
                    <div className="glassmorphic border border-white/10 rounded-xl p-3 backdrop-blur-md transform rotate-[-1deg] hover:rotate-0 transition-transform duration-300">
                      <div className="text-xs font-semibold text-foreground mb-1 line-clamp-1">Writing</div>
                      <div className="text-[10px] text-muted-foreground">↔ Marketing</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakpoint Reference */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Breakpoint Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
              <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">Mobile</h3>
              <p className="text-sm text-muted-foreground">&lt; 768px</p>
              <p className="text-sm text-muted-foreground">Classes: <code className="font-mono text-xs">flex md:hidden</code></p>
            </div>
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2">Tablet</h3>
              <p className="text-sm text-muted-foreground">768px - 1024px</p>
              <p className="text-sm text-muted-foreground">Classes: <code className="font-mono text-xs">hidden md:max-lg:flex</code></p>
            </div>
            <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
              <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-2">Desktop</h3>
              <p className="text-sm text-muted-foreground">&gt; 1024px</p>
              <p className="text-sm text-muted-foreground">Classes: <code className="font-mono text-xs">hidden lg:flex</code></p>
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default ResponsiveCardTestPage;
