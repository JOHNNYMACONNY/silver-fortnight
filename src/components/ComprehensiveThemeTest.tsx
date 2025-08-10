import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ComprehensiveThemeTest: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const runTests = () => {
    const results: Record<string, boolean> = {};
    
    // Test 1: HTML element has dark class when theme is dark
    results['HTML dark class'] = theme === 'dark' ? 
      document.documentElement.classList.contains('dark') : 
      !document.documentElement.classList.contains('dark');
    
    // Test 2: Check if computed styles are applied correctly
    const testElement = document.querySelector('[data-test="dark-mode-test"]');
    if (testElement) {
      const computedStyle = window.getComputedStyle(testElement);
      const bgColor = computedStyle.backgroundColor;
      
      if (theme === 'dark') {
        // In dark mode, should have a dark background
        results['Computed dark style'] = bgColor.includes('31, 41, 55') || bgColor.includes('rgb(31, 41, 55)');
      } else {
        // In light mode, should have a light background
        results['Computed light style'] = bgColor.includes('255, 255, 255') || bgColor.includes('rgb(255, 255, 255)');
      }
    }
    
    // Test 3: LocalStorage persistence
    results['LocalStorage sync'] = localStorage.getItem('theme') === theme;
    
    setTestResults(results);
  };

  React.useEffect(() => {
    // Run tests after theme changes
    setTimeout(runTests, 100);
  }, [theme]);

  return (
    <div className="p-8 min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Comprehensive Theme Test</h1>
        
        {/* Theme Controls */}
        <div className="mb-8 p-6 bg-card rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Theme Controls</h2>
          <div className="space-y-2 mb-4">
            <p><strong>Current theme:</strong> {theme}</p>
            <p><strong>HTML classes:</strong> {document.documentElement.className || 'none'}</p>
            <p><strong>LocalStorage:</strong> {localStorage.getItem('theme') || 'not set'}</p>
          </div>
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Toggle Theme (Current: {theme})
          </button>
          <button 
            onClick={runTests}
            className="ml-2 px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
          >
            Run Tests
          </button>
        </div>

        {/* Test Results */}
        <div className="mb-8 p-6 bg-card rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {Object.keys(testResults).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Click "Run Tests" to see results</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(testResults).map(([test, passed]) => (
                <div key={test} className={`p-2 rounded ${passed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                  <span className={`inline-block w-4 h-4 rounded mr-2 ${passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {test}: {passed ? 'PASS' : 'FAIL'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visual Test Elements */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Visual Test Elements</h2>
          
          {/* Background test */}
          <div 
            data-test="dark-mode-test"
            className="p-4 bg-card border border-border rounded"
          >
            <h3 className="font-semibold mb-2">Background Test</h3>
            <p className="text-muted-foreground">
              This element should have a white background in light mode and gray-800 background in dark mode.
            </p>
          </div>

          {/* Text color test */}
          <div className="p-4 bg-muted rounded">
            <h3 className="font-semibold mb-2 text-foreground">Text Color Test</h3>
            <p className="text-muted-foreground mb-2">
              Primary text should be dark gray in light mode and white in dark mode.
            </p>
            <p className="text-muted-foreground">
              Secondary text should be lighter gray in both modes.
            </p>
          </div>

          {/* Color variations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
              Red variant
            </div>
            <div className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Blue variant
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
              Green variant
            </div>
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
              Yellow variant
            </div>
          </div>

          {/* Interactive elements */}
          <div className="space-y-4">
            <h3 className="font-semibold">Interactive Elements</h3>
            <div className="space-x-2">
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors">
                Secondary Button
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded transition-colors">
                Outline Button
              </button>
            </div>
          </div>

          {/* Form elements */}
          <div className="space-y-4">
            <h3 className="font-semibold">Form Elements</h3>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Text input"
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <textarea 
                placeholder="Textarea"
                rows={3}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <select className="w-full px-3 py-2 border border-input bg-background text-foreground rounded focus:ring-2 focus:ring-ring focus:border-transparent">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveThemeTest;
