// Example usage of the new theme system in your App component
import React, { useEffect } from 'react';
import { initializeTheme, useTheme } from './utils/themeInitializer';

// Initialize theme system when app starts
initializeTheme({
  defaultTheme: 'system',
  enableSystem: true,
  storageKey: 'tradeya-theme',
});

function App() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-md bg-bg-card border border-border hover:bg-bg-secondary transition-colors"
      >
        {resolvedTheme === 'dark' ? '🌞' : '🌙'}
      </button>

      {/* Your app content */}
      <main>
        {/* Components will automatically use theme-aware colors */}
      </main>
    </div>
  );
}

export default App;
