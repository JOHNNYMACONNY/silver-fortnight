import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const ThemeDemoPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background-primary transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Theme Demo</h1>
          <ThemeToggle />
        </div>

        <div className="mb-8 p-6 rounded-lg bg-card text-card-foreground shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Current Theme: {theme}</h2>
          <p className="text-text-muted">
            This page demonstrates the new semantic, theme-aware CSS variables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="p-6 rounded-lg bg-card text-card-foreground shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Text Styles</h2>
            <div className="space-y-4">
              <p className="text-text-primary">Primary Text</p>
              <p className="text-text-muted">Muted Text</p>
              <p className="text-accent">Accent Text</p>
              <p className="text-success">Success Text</p>
              <p className="text-destructive">Error Text</p>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card text-card-foreground shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Button Styles</h2>
            <div className="space-y-4">
              <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
                Secondary Button
              </button>
              <button className="px-4 py-2 rounded-md bg-success text-success-foreground hover:bg-success/90 transition-colors">
                Success Button
              </button>
              <button className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                Danger Button
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card text-card-foreground shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Form Elements</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-text-primary">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full rounded-md px-3 py-2 bg-input text-text-primary border border-border focus:ring-ring focus:ring-2 focus:outline-none"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-text-primary">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-md px-3 py-2 bg-input text-text-primary border border-border focus:ring-ring focus:ring-2 focus:outline-none"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1 text-text-primary">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full rounded-md px-3 py-2 bg-input text-text-primary border border-border focus:ring-ring focus:ring-2 focus:outline-none"
                placeholder="Enter your message"
              ></textarea>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                className="rounded text-primary focus:ring-ring"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-text-primary">
                I agree to the terms and conditions
              </label>
            </div>
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Submit
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-lg bg-card text-card-foreground shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">How to Use Theme Utilities</h2>
          <div className="p-4 rounded-md bg-background-secondary font-mono text-sm overflow-auto">
            <pre className="text-text-primary">
{`// Tailwind CSS uses CSS variables for theming.
// Example: 'bg-primary' maps to 'hsl(var(--primary))'

// In your CSS (e.g., src/index.css):
:root {
  --background: 0 0% 100%;
  --primary: 222.2 47.4% 11.2%;
  /* ... etc. */
}

.dark {
  --background: 222.2 84% 4.9%;
  --primary: 210.4 92.9% 95.1%;
  /* ... etc. */
}

// In your components, use the semantic utility classes:
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemoPage;
