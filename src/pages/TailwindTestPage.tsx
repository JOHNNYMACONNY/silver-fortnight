import React from 'react';

/**
 * Simple test page to diagnose Tailwind CSS issues
 */
const TailwindTestPage: React.FC = () => {
  return (
    <div className="p-8">
        <h1 className="text-4xl font-bold mb-8 text-primary">Tailwind CSS Test</h1>
        
        {/* Basic Tailwind Classes Test */}
        <div className="space-y-4">
          <div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
            🔴 Red background with white text and rounded corners
          </div>
          
          <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
            🔵 Blue background with shadow
          </div>
          
          <div className="bg-success text-success-foreground p-4 rounded-lg hover:bg-success/90 transition-colors">
            🟢 Green background with hover effect
          </div>
          
          <div className="bg-secondary text-secondary-foreground p-4 rounded-lg backdrop-blur-sm">
            🟣 Purple background with backdrop blur
          </div>
          
          <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4 rounded-lg">
            🌈 Gradient background
          </div>
        </div>
        
        {/* Grid Test */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Grid Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded text-center">Grid Item 1</div>
            <div className="bg-muted/80 p-4 rounded text-center">Grid Item 2</div>
            <div className="bg-muted/60 p-4 rounded text-center">Grid Item 3</div>
          </div>
        </div>
        
        {/* Custom Colors Test */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Custom Colors Test</h2>
          <div className="bg-secondary text-foreground p-4 rounded-lg">
            Background: bg-secondary, Text: text-foreground
          </div>
          <div className="bg-secondary text-muted-foreground p-4 rounded-lg mt-2">
            Background: bg-secondary, Text: text-muted-foreground
          </div>
        </div>
    </div>
  );
};

export default TailwindTestPage;
