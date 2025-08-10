import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const DarkModeTest: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-8 min-h-screen bg-background transition-colors duration-200">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Dark Mode Test
        </h1>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Current theme: <span className="font-semibold text-foreground">{theme}</span>
          </p>
          
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Toggle Theme
          </button>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-card rounded-lg">
              <h3 className="font-semibold text-card-foreground mb-2">Light Card</h3>
              <p className="text-muted-foreground">This card should change colors based on the theme.</p>
            </div>
            
            <div className="p-4 bg-card rounded-lg border border-border">
              <h3 className="font-semibold text-card-foreground mb-2">Another Card</h3>
              <p className="text-muted-foreground">This should also adapt to dark mode.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DarkModeTest;
