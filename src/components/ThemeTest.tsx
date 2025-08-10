import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeTest: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [htmlClasses, setHtmlClasses] = useState('');

  useEffect(() => {
    // Monitor HTML element classes
    const updateClasses = () => {
      setHtmlClasses(document.documentElement.className);
    };
    
    updateClasses();
    
    // Set up observer to watch for class changes
    const observer = new MutationObserver(updateClasses);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-8 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Theme Test</h1>
      
      <div className="mb-6 p-4 bg-card rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
        <p className="mb-2"><strong>Current theme from context:</strong> {theme}</p>
        <p className="mb-2"><strong>HTML element classes:</strong> {htmlClasses || 'No classes'}</p>
        <p className="mb-2"><strong>LocalStorage theme:</strong> {localStorage.getItem('theme') || 'Not set'}</p>
        <p className="mb-2"><strong>System preference:</strong> {
          window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }</p>
      </div>
      
      <button 
        onClick={toggleTheme}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 mb-8"
      >
        Toggle Theme (Current: {theme})
      </button>
      
      <div className="mt-8 p-4 bg-card rounded">
        <h2 className="text-lg font-semibold mb-2">Test Elements:</h2>
        <div className="space-y-2">
          <div className="p-2 bg-destructive/20 text-destructive-foreground rounded">
            Red background test
          </div>
          <div className="p-2 bg-success/20 text-success-foreground rounded">
            Green background test
          </div>
          <div className="p-2 bg-warning/20 text-warning-foreground rounded">
            Yellow background test
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 border-2 border-dashed border-border rounded">
        <h2 className="text-lg font-semibold mb-2">Manual CSS Test:</h2>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          padding: '1rem',
          borderRadius: '0.5rem'
        }}>
          This element uses inline styles based on theme: {theme}
        </div>
      </div>
      
      <div className="mt-8 p-4 test-dark-mode rounded">
        <h2 className="text-lg font-semibold mb-2">CSS @apply Test:</h2>
        <div className="test-colors p-4 rounded">
          This element uses CSS @apply with dark mode classes
        </div>
      </div>
    </div>
  );
};

export default ThemeTest;
