import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

/**
 * Test page to demonstrate Enhanced Card System - Phase 2
 */
const CardTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">Enhanced Card System - Phase 2 Test</h1>
        
        {/* Old vs New Comparison */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">🔄 Before vs After</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* OLD - Basic Card */}
            <Card>
              <CardHeader>
                <CardTitle>OLD: Basic Card (Before)</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is the old card system - minimal styling, basic outline.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline">Basic Button</Button>
              </CardFooter>
            </Card>

            {/* NEW - Enhanced Card */}
            <Card variant="glass" tilt={true} depth="lg" glow="subtle" glowColor="orange">
              <CardHeader>
                <CardTitle>NEW: Enhanced Card (Phase 2)</CardTitle>
              </CardHeader>
              <CardContent>
                <p>🎨 Glassmorphism background</p>
                <p>🎮 3D tilt effects (hover over me!)</p>
                <p>✨ Brand-colored glow</p>
                <p>📱 Mobile/accessibility optimized</p>
              </CardContent>
              <CardFooter>
                <Button variant="default">Enhanced Button</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Variant Showcase */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">🎨 Card Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Default Variant */}
            <Card variant="default" hover={true}>
              <CardHeader>
                <CardTitle className="text-lg">Default</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Standard card with hover effects</p>
              </CardContent>
            </Card>

            {/* Glass Variant */}
            <Card variant="glass" tilt={true}>
              <CardHeader>
                <CardTitle className="text-lg">Glass</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Glassmorphism with 3D tilt (hover me!)</p>
              </CardContent>
            </Card>

            {/* Elevated Variant */}
            <Card variant="elevated" depth="xl">
              <CardHeader>
                <CardTitle className="text-lg">Elevated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Enhanced shadows and depth</p>
              </CardContent>
            </Card>

            {/* Premium Variant */}
            <Card variant="premium" tilt={true} glow="strong" glowColor="blue">
              <CardHeader>
                <CardTitle className="text-lg">Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Premium gradient + glow + 3D (hover me!)</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Brand Glow Colors */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">🎯 Brand Glow Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Card variant="glass" glow="strong" glowColor="orange" tilt={true}>
              <CardHeader>
                <CardTitle className="text-lg">TradeYa Orange</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Primary brand color glow</p>
              </CardContent>
            </Card>

            <Card variant="glass" glow="strong" glowColor="blue" tilt={true}>
              <CardHeader>
                <CardTitle className="text-lg">TradeYa Blue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Secondary brand color glow</p>
              </CardContent>
            </Card>

            <Card variant="glass" glow="strong" glowColor="purple" tilt={true}>
              <CardHeader>
                <CardTitle className="text-lg">TradeYa Purple</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Accent brand color glow</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Depth Levels */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">📐 Depth Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <Card depth="sm" hover={true}>
              <CardContent className="p-4">
                <p className="font-semibold">Small Depth</p>
                <p className="text-xs">Subtle shadow</p>
              </CardContent>
            </Card>

            <Card depth="md" hover={true}>
              <CardContent className="p-4">
                <p className="font-semibold">Medium Depth</p>
                <p className="text-xs">Standard shadow</p>
              </CardContent>
            </Card>

            <Card depth="lg" hover={true}>
              <CardContent className="p-4">
                <p className="font-semibold">Large Depth</p>
                <p className="text-xs">Enhanced shadow</p>
              </CardContent>
            </Card>

            <Card depth="xl" hover={true}>
              <CardContent className="p-4">
                <p className="font-semibold">Extra Large</p>
                <p className="text-xs">Maximum shadow</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Interactive Features */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">🎮 Interactive Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card 
              variant="premium" 
              tilt={true} 
              interactive={true} 
              glow="subtle" 
              glowColor="orange"
              onClick={() => alert('Enhanced card clicked!')}
            >
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>✨ Hover for 3D tilt</p>
                <p>🎯 Click me for interaction</p>
                <p>⌨️ Keyboard accessible</p>
                <p>📱 Touch device optimized</p>
              </CardContent>
            </Card>

            <Card variant="glass" tilt={true} disabled={false}>
              <CardHeader>
                <CardTitle>3D Tilt Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Move your mouse over this card to see the 3D tilt effect in action!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  • Automatically disabled on mobile devices<br/>
                  • Respects reduced motion preferences<br/>
                  • Graceful fallback for unsupported browsers
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="bg-secondary/10 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">📝 How to Use Enhanced Cards</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Basic Enhanced Card:</h3>
              <code className="bg-muted p-2 rounded text-sm block mt-1">
                {`<Card variant="glass" tilt={true} depth="lg">`}
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold">Premium Card with Glow:</h3>
              <code className="bg-muted p-2 rounded text-sm block mt-1">
                {`<Card variant="premium" tilt={true} glow="strong" glowColor="orange">`}
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold">Interactive Card:</h3>
              <code className="bg-muted p-2 rounded text-sm block mt-1">
                {`<Card interactive={true} onClick={handleClick}>`}
              </code>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CardTestPage; 