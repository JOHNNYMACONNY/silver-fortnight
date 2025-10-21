/**
 * Mobile Animation Demo Page
 * 
 * Interactive showcase of mobile-optimized animations and touch interactions
 * for TradeYa trading workflows.
 */

import React, { useState } from 'react';
import { cn } from '../utils/cn';
import {
  MobileAnimatedButton,
  MobileProposalSubmitButton,
  MobileNegotiationResponseButton,
  MobileConfirmationButton,
  SwipeableTradeCard,
  useSwipeGestures,
  TRADE_CARD_SWIPE_CONFIG,
} from '../components/animations';

// Mock trade data for demo
const mockTrade = {
  id: 'demo-trade-1',
  title: 'Web Development for Logo Design',
  description: 'I can build a responsive website for your business in exchange for a professional logo design.',
  offeredSkill: 'Web Development',
  requestedSkill: 'Logo Design',
  category: 'design',
  status: 'pending',
  creatorId: 'demo-user-1',
  creatorName: 'Alex Johnson',
  participantId: null,
  participantName: null,
  createdAt: { seconds: Date.now() / 1000 },
  updatedAt: { seconds: Date.now() / 1000 },
};

/**
 * Mobile Animation Demo Page Component
 */
export const MobileAnimationDemo: React.FC = () => {
  const [demoState, setDemoState] = useState({
    hapticEnabled: true,
    rippleEnabled: true,
    swipeEnabled: true,
    lastAction: '',
  });

  // Demo swipe gesture
  const { isSwipeActive, swipeProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeGestures(
    TRADE_CARD_SWIPE_CONFIG,
    (swipeEvent) => {
      setDemoState(prev => ({
        ...prev,
        lastAction: `Swiped ${swipeEvent.direction} (${Math.round(swipeEvent.distance)}px, ${Math.round(swipeEvent.velocity * 1000)}ms)`,
      }));
    }
  );

  const handleAction = (action: string) => {
    setDemoState(prev => ({ ...prev, lastAction: action }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Mobile Animation Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive showcase of mobile-optimized animations
          </p>
        </div>

        {/* Settings Panel */}
        <div className="glassmorphic p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Settings
          </h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={demoState.hapticEnabled}
                onChange={(e) => setDemoState(prev => ({ ...prev, hapticEnabled: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Haptic Feedback</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={demoState.rippleEnabled}
                onChange={(e) => setDemoState(prev => ({ ...prev, rippleEnabled: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ripple Effects</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={demoState.swipeEnabled}
                onChange={(e) => setDemoState(prev => ({ ...prev, swipeEnabled: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Swipe Gestures</span>
            </label>
          </div>
        </div>

        {/* Action Feedback */}
        {demoState.lastAction && (
          <div className="glassmorphic p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Last Action:</strong> {demoState.lastAction}
            </p>
          </div>
        )}

        {/* Mobile Button Demos */}
        <div className="glassmorphic p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mobile Buttons
          </h2>
          <div className="space-y-4">
            {/* Basic Mobile Button */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Basic Mobile Button
              </h3>
              <MobileAnimatedButton
                tradingContext="general"
                hapticEnabled={demoState.hapticEnabled}
                rippleEffect={demoState.rippleEnabled}
                onClick={() => handleAction('Basic button tapped')}
                className="w-full"
              >
                Tap Me
              </MobileAnimatedButton>
            </div>

            {/* Proposal Submit Button */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proposal Submit Button
              </h3>
              <MobileProposalSubmitButton
                hapticEnabled={demoState.hapticEnabled}
                rippleEffect={demoState.rippleEnabled}
                onClick={() => handleAction('Proposal submitted')}
                className="w-full"
              >
                Submit Proposal
              </MobileProposalSubmitButton>
            </div>

            {/* Negotiation Response Button */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Negotiation Response Button
              </h3>
              <MobileNegotiationResponseButton
                hapticEnabled={demoState.hapticEnabled}
                rippleEffect={demoState.rippleEnabled}
                swipeEnabled={demoState.swipeEnabled}
                onClick={() => handleAction('Negotiation response sent')}
                className="w-full"
              >
                Send Response
              </MobileNegotiationResponseButton>
            </div>

            {/* Confirmation Button */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmation Button
              </h3>
              <MobileConfirmationButton
                hapticEnabled={demoState.hapticEnabled}
                rippleEffect={demoState.rippleEnabled}
                longPressEnabled={true}
                onClick={() => handleAction('Trade confirmed')}
                className="w-full"
              >
                Confirm Trade
              </MobileConfirmationButton>
            </div>
          </div>
        </div>

        {/* Swipeable Card Demo */}
        <div className="glassmorphic p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Swipeable Cards
          </h2>
          <div className="space-y-4">
            <SwipeableTradeCard
              trade={mockTrade as any}
              onAccept={() => handleAction('Trade accepted via swipe')}
              onDecline={() => handleAction('Trade declined via swipe')}
              onViewDetails={() => handleAction('Trade details viewed via swipe')}
              showSwipeHints={true}
            />
          </div>
        </div>

        {/* Swipe Gesture Demo */}
        <div className="glassmorphic p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Swipe Gesture Demo
          </h2>
          <div
            className={cn(
               "h-32 bg-gradient-to-r from-primary to-secondary rounded-lg",
              "flex items-center justify-center text-white font-semibold",
              "transition-transform duration-200",
               (isSwipeActive ? "scale-95" : "")
            )}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-center">
              <p>Swipe in any direction</p>
               {isSwipeActive ? (
                <p className="text-sm mt-1">
                  Progress: {Math.round(swipeProgress * 100)}%
                </p>
               ) : null}
            </div>
          </div>
        </div>

        {/* Performance Info */}
        <div className="glassmorphic p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Mobile Optimizations
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Target FPS:</span>
              <span>45fps (mobile optimized)</span>
            </div>
            <div className="flex justify-between">
              <span>Touch Response:</span>
              <span>&lt; 50ms</span>
            </div>
            <div className="flex justify-between">
              <span>Haptic Support:</span>
              <span>{typeof navigator.vibrate === 'function' ? 'Available' : 'Not Available'}</span>
            </div>
            <div className="flex justify-between">
              <span>Touch Device:</span>
              <span>{'ontouchstart' in window ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="glassmorphic p-4">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Instructions
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Tap buttons to feel haptic feedback</li>
            <li>• Watch for ripple effects on touch</li>
            <li>• Swipe the trade card in different directions</li>
            <li>• Try long-pressing the confirmation button</li>
            <li>• Toggle settings to see different behaviors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileAnimationDemo;
