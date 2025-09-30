import React, { useState, useEffect } from "react";
import { useMobileOptimization } from "../../hooks/useMobileOptimization";

export const ResponsiveDebug: React.FC = () => {
  const { isMobile, isTablet, isDesktop, screenSize } = useMobileOptimization();
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-[9999]">
      <div>Width: {windowWidth}px</div>
      <div>Mobile: {isMobile ? "✓" : "✗"}</div>
      <div>Tablet: {isTablet ? "✓" : "✗"}</div>
      <div>Desktop: {isDesktop ? "✓" : "✗"}</div>
      <div>
        Screen: {screenSize.width}x{screenSize.height}
      </div>
    </div>
  );
};
