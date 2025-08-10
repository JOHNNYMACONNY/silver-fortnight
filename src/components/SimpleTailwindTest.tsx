import React from 'react';

const SimpleTailwindTest: React.FC = () => {
  React.useEffect(() => {
    // Debug: Check if ANY Tailwind classes are being applied
    const redElement = document.querySelector('.debug-red-test');
    const testElement = document.querySelector('.debug-basic-test');
    
    if (redElement) {
      const computedStyle = window.getComputedStyle(redElement);
      console.log('🔍 Debug - Red element computed styles:', {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        padding: computedStyle.padding,
        className: redElement.className
      });
    }

    if (testElement) {
      const computedStyle = window.getComputedStyle(testElement);
      console.log('🔍 Debug - Basic test element computed styles:', {
        display: computedStyle.display,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        margin: computedStyle.margin,
        className: testElement.className
      });
    }

    // Check if CSS custom properties are available
    const rootStyles = getComputedStyle(document.documentElement);
    console.log('🔍 Debug - CSS Custom Properties:', {
      colorRed500: rootStyles.getPropertyValue('--color-red-500'),
      colorBlue500: rootStyles.getPropertyValue('--color-blue-500'),
      colorCustomDebugBlue: rootStyles.getPropertyValue('--color-custom-debug-blue')
    });
  }, []);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">🎨 Tailwind Color Test</h1>
      
      {/* Debug info */}
      <div className="debug-basic-test block text-base m-4">
        <h3 className="font-bold text-yellow-800 mb-2">🐛 Debug Information:</h3>
        <p className="text-yellow-700 text-sm">Check browser console for computed styles</p>
        <p className="text-yellow-700 text-sm">Expected: bg-red-500 should be rgb(239, 68, 68)</p>
        <p className="text-yellow-700 text-sm">Testing basic utilities: block, text-base, m-4, font-bold</p>
      </div>
      
      {/* Bold/Vibrant Colors Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Bold Colors (should be very visible)</h2>
        
        <div className="debug-red-test bg-red-500 text-white p-4 rounded-lg shadow" style={{backgroundColor: 'red', border: '2px solid black'}}>
          <p className="font-medium">🔴 RED-500: Bright red background with white text (FORCED RED + TAILWIND)</p>
        </div>
        
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow">
          <p className="font-medium">🔵 BLUE-500: Bright blue background with white text</p>
        </div>
        
        <div className="bg-green-500 text-white p-4 rounded-lg shadow">
          <p className="font-medium">🟢 GREEN-500: Bright green background with white text</p>
        </div>
        
        <div className="bg-purple-500 text-white p-4 rounded-lg shadow">
          <p className="font-medium">🟣 PURPLE-500: Bright purple background with white text</p>
        </div>
      </div>

      {/* Manual CSS Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Manual CSS Test (should definitely work)</h2>
        
        <div style={{backgroundColor: '#ef4444', color: 'white', padding: '16px', borderRadius: '8px'}}>
          <p>🔴 MANUAL RED: This uses inline styles (should definitely show red)</p>
        </div>
        
        <div style={{backgroundColor: '#3b82f6', color: 'white', padding: '16px', borderRadius: '8px'}}>
          <p>🔵 MANUAL BLUE: This uses inline styles (should definitely show blue)</p>
        </div>
      </div>

      {/* Light Colors Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Light Colors (subtle, might be hard to see)</h2>
        
        <div className="bg-red-100 border border-red-200 p-4 rounded-lg">
          <p className="text-red-800 font-medium">🔴 RED-100: Very light red background</p>
        </div>
        
        <div className="bg-blue-100 border border-blue-200 p-4 rounded-lg">
          <p className="text-blue-800 font-medium">🔵 BLUE-100: Very light blue background</p>
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Interactive Elements</h2>
        
        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md">
          🚀 Green Button (hover to test)
        </button>
        
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md ml-4">
          🧡 Orange Button (hover to test)
        </button>
      </div>

      {/* Dark Mode Test */}
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2">⚫ Dark Background Test</h3>
        <p>This should have a very dark gray/black background with white text</p>
      </div>

      {/* Custom Color Test (from your config) */}
      <div className="bg-custom-debug-blue text-white p-4 rounded-lg shadow">
        <p className="font-medium">🔷 CUSTOM-DEBUG-BLUE: Custom color from tailwind.config.ts (#1234FF)</p>
      </div>
    </div>
  );
};

export default SimpleTailwindTest;
