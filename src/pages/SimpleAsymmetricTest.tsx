import React from 'react';
import { generateAsymmetricClasses, ASYMMETRIC_PATTERNS } from '../utils/asymmetricLayouts';

/**
 * Simple Asymmetric Test
 * 
 * Minimal test to verify asymmetric layout CSS classes are working
 */
const SimpleAsymmetricTest: React.FC = () => {
  const pattern = ASYMMETRIC_PATTERNS['asymmetric-standard'];
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Simple Asymmetric Layout Test</h1>
      
      <div className="space-y-8">
        {/* Row 1: Small-Large */}
        <div className={generateAsymmetricClasses(pattern, 0, 'gap-6')}>
          <div className="bg-orange-200 p-6 rounded-lg border-2 border-orange-500">
            <h3 className="font-bold text-orange-800">Small Item (1/3)</h3>
            <p className="text-orange-700">This should be 1/3 width on desktop</p>
          </div>
          <div className="bg-blue-200 p-6 rounded-lg border-2 border-blue-500">
            <h3 className="font-bold text-blue-800">Large Item (2/3)</h3>
            <p className="text-blue-700">This should be 2/3 width on desktop</p>
          </div>
        </div>

        {/* Row 2: Large-Small */}
        <div className={generateAsymmetricClasses(pattern, 1, 'gap-6')}>
          <div className="bg-green-200 p-6 rounded-lg border-2 border-green-500">
            <h3 className="font-bold text-green-800">Large Item (2/3)</h3>
            <p className="text-green-700">This should be 2/3 width on desktop</p>
          </div>
          <div className="bg-purple-200 p-6 rounded-lg border-2 border-purple-500">
            <h3 className="font-bold text-purple-800">Small Item (1/3)</h3>
            <p className="text-purple-700">This should be 1/3 width on desktop</p>
          </div>
        </div>

        {/* Row 3: Small-Large (repeats pattern) */}
        <div className={generateAsymmetricClasses(pattern, 2, 'gap-6')}>
          <div className="bg-red-200 p-6 rounded-lg border-2 border-red-500">
            <h3 className="font-bold text-red-800">Small Item (1/3)</h3>
            <p className="text-red-700">This should be 1/3 width on desktop</p>
          </div>
          <div className="bg-indigo-200 p-6 rounded-lg border-2 border-indigo-500">
            <h3 className="font-bold text-indigo-800">Large Item (2/3)</h3>
            <p className="text-indigo-700">This should be 2/3 width on desktop</p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-bold mb-2">Expected Behavior:</h3>
        <ul className="text-sm space-y-1">
          <li>• On mobile: Items stack vertically (full width)</li>
          <li>• On desktop: Items are side by side with different widths</li>
          <li>• Row 1: Small (1/3) + Large (2/3)</li>
          <li>• Row 2: Large (2/3) + Small (1/3) - reversed order</li>
          <li>• Row 3: Small (1/3) + Large (2/3)</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
        <h3 className="font-bold mb-2">Generated CSS Classes:</h3>
        <code className="text-sm">
          Row 1: {generateAsymmetricClasses(pattern, 0, 'gap-6')}
        </code>
        <br />
        <code className="text-sm">
          Row 2: {generateAsymmetricClasses(pattern, 1, 'gap-6')}
        </code>
      </div>
    </div>
  );
};

export default SimpleAsymmetricTest; 