/**
 * Animation Demo Page
 * 
 * Showcase page for TradeYa's new animation system and micro-interactions
 */

import React, { useState } from "react";
import { 
  AnimatedButton,
  ProposalSubmitButton,
  NegotiationResponseButton,
  ConfirmationButton,
  CompletionButton,
  TradeStatusIndicator,
  TradeProgressRing,
  type TradeStatus,
} from "../components/animations";

export const AnimationDemo: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState<TradeStatus>("pending");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Demo functions
  const handleStatusChange = (status: TradeStatus) => {
    setCurrentStatus(status);
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const statusOptions: TradeStatus[] = [
    "pending",
    "negotiating", 
    "confirmed",
    "completed",
    "cancelled",
    "expired"
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            TradeYa Animation System Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            Interactive showcase of Phase 5 micro-interactions and animations
          </p>
        </div>

        {/* Animated Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Animated Buttons</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Basic Variants */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Basic Variants</h3>
              <div className="space-y-3">
                <AnimatedButton variant="primary">Primary Button</AnimatedButton>
                <AnimatedButton variant="secondary">Secondary Button</AnimatedButton>
                <AnimatedButton variant="outline">Outline Button</AnimatedButton>
                <AnimatedButton variant="ghost">Ghost Button</AnimatedButton>
              </div>
            </div>

            {/* Trading Context Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Trading Context</h3>
              <div className="space-y-3">
                <ProposalSubmitButton>Submit Proposal</ProposalSubmitButton>
                <NegotiationResponseButton>Respond to Offer</NegotiationResponseButton>
                <ConfirmationButton>Confirm Trade</ConfirmationButton>
                <CompletionButton>Mark Complete</CompletionButton>
              </div>
            </div>

            {/* Button States */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Button States</h3>
              <div className="space-y-3">
                <AnimatedButton 
                  loading={isLoading}
                  onClick={handleLoadingDemo}
                >
                  {isLoading ? "Loading..." : "Test Loading"}
                </AnimatedButton>
                <AnimatedButton disabled>Disabled Button</AnimatedButton>
                <AnimatedButton criticalAction>Critical Action</AnimatedButton>
                <AnimatedButton size="sm">Small Button</AnimatedButton>
              </div>
            </div>

            {/* Button Sizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Button Sizes</h3>
              <div className="space-y-3">
                <AnimatedButton size="sm">Small</AnimatedButton>
                <AnimatedButton size="md">Medium</AnimatedButton>
                <AnimatedButton size="lg">Large</AnimatedButton>
              </div>
            </div>
          </div>
        </section>

        {/* Trade Status Indicators Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Trade Status Indicators</h2>
          
          <div className="space-y-6">
            {/* Current Status Display */}
            <div className="flex items-center justify-center p-8 bg-card rounded-lg border">
              <TradeStatusIndicator 
                status={currentStatus} 
                size="lg"
                showAnimation={true}
              />
            </div>

            {/* Status Controls */}
            <div className="flex flex-wrap gap-3 justify-center">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    currentStatus === status
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* All Status Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statusOptions.map((status) => (
                <div key={status} className="text-center space-y-2">
                  <TradeStatusIndicator status={status} size="md" />
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Progress Rings Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Trade Progress Rings</h2>
          
          <div className="space-y-6">
            {/* Progress Controls */}
            <div className="flex items-center justify-center space-x-4">
              <label className="text-sm font-medium text-foreground">Progress:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="w-64"
              />
              <span className="text-sm text-muted-foreground w-12">{progress}%</span>
            </div>

            {/* Progress Ring Sizes */}
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center space-y-2">
                <TradeProgressRing progress={progress} size="sm" />
                <p className="text-sm text-muted-foreground">Small</p>
              </div>
              <div className="text-center space-y-2">
                <TradeProgressRing progress={progress} size="md" />
                <p className="text-sm text-muted-foreground">Medium</p>
              </div>
              <div className="text-center space-y-2">
                <TradeProgressRing progress={progress} size="lg" />
                <p className="text-sm text-muted-foreground">Large</p>
              </div>
              <div className="text-center space-y-2">
                <TradeProgressRing progress={progress} size="xl" />
                <p className="text-sm text-muted-foreground">Extra Large</p>
              </div>
            </div>

            {/* Quick Progress Buttons */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => handleProgressChange(0)}
                className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80"
              >
                0%
              </button>
              <button
                onClick={() => handleProgressChange(25)}
                className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80"
              >
                25%
              </button>
              <button
                onClick={() => handleProgressChange(50)}
                className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80"
              >
                50%
              </button>
              <button
                onClick={() => handleProgressChange(75)}
                className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80"
              >
                75%
              </button>
              <button
                onClick={() => handleProgressChange(100)}
                className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80"
              >
                100%
              </button>
            </div>
          </div>
        </section>

        {/* Performance Info */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Performance & Accessibility</h2>
          <div className="bg-card p-6 rounded-lg border space-y-3">
            <p className="text-sm text-muted-foreground">
              ✅ All animations respect <code>prefers-reduced-motion</code> settings
            </p>
            <p className="text-sm text-muted-foreground">
              ✅ Performance monitoring integrated with existing PerformanceContext
            </p>
            <p className="text-sm text-muted-foreground">
              ✅ TradeYa brand colors (#f97316, #0ea5e9, #8b5cf6) integrated throughout
            </p>
            <p className="text-sm text-muted-foreground">
              ✅ WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnimationDemo;
