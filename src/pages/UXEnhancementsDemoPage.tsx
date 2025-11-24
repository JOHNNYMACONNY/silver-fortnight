import React, { useState } from 'react';
import { VisualSelectionGroup } from '../components/ui/VisualSelectionGroup';
import { SkillLevelSelector } from '../components/ui/SkillLevelSelector';
import { SelectionFeedback } from '../components/ui/SelectionFeedback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  isVisualSelectionEnabled, 
  isConversationalLabelsEnabled, 
  isDynamicFeedbackEnabled 
} from '../utils/featureFlags';
import { getCategoryIcon } from '../utils/iconMappings';
import { getTradingInterestIcon } from '../utils/iconMappings';
import { getExperienceLevelIcon } from '../utils/iconMappings';

/**
 * UX Enhancements Demo Page
 * 
 * Isolated testing environment for all new UX enhancement components.
 * Accessible only in development mode at /ux-enhancements-demo
 */
const UXEnhancementsDemoPage: React.FC = () => {
  const [category, setCategory] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [tradingInterests, setTradingInterests] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');

  const categories = ['Design', 'Development', 'Marketing', 'Writing', 'Photography', 'Video Editing', 'Business', 'Music', 'Art', 'Other'];
  const tradingInterestsOptions = [
    { value: 'electronics', label: 'Electronics', description: 'Phones, laptops, gadgets' },
    { value: 'clothing', label: 'Clothing & Fashion', description: 'Apparel, shoes, accessories' },
    { value: 'books', label: 'Books & Media', description: 'Books, movies, music' },
    { value: 'sports', label: 'Sports & Recreation', description: 'Equipment, gear, outdoor items' },
    { value: 'home', label: 'Home & Garden', description: 'Furniture, decor, tools' },
    { value: 'collectibles', label: 'Collectibles', description: 'Art, antiques, memorabilia' },
    { value: 'automotive', label: 'Automotive', description: 'Car parts, accessories' },
    { value: 'crafts', label: 'Arts & Crafts', description: 'Handmade items, supplies' },
  ];
  const experienceLevels = [
    { value: 'beginner', label: 'New to Trading', description: 'Just getting started' },
    { value: 'intermediate', label: 'Some Experience', description: 'A few successful trades' },
    { value: 'experienced', label: 'Experienced Trader', description: 'Many successful trades' },
    { value: 'expert', label: 'Trading Expert', description: 'Highly experienced, mentor others' },
  ];

  const visualSelectionEnabled = isVisualSelectionEnabled();
  const conversationalLabelsEnabled = isConversationalLabelsEnabled();
  const dynamicFeedbackEnabled = isDynamicFeedbackEnabled();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">UX Enhancements Demo</h1>
        <p className="text-muted-foreground">
          Testing environment for visual selections, conversational labels, and dynamic feedback
        </p>
      </div>

      {/* Feature Flags Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Feature Flags Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={visualSelectionEnabled ? 'text-green-500' : 'text-gray-500'}>
                {visualSelectionEnabled ? '✓' : '✗'}
              </span>
              <span>Visual Selection: {visualSelectionEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={conversationalLabelsEnabled ? 'text-green-500' : 'text-gray-500'}>
                {conversationalLabelsEnabled ? '✓' : '✗'}
              </span>
              <span>Conversational Labels: {conversationalLabelsEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={dynamicFeedbackEnabled ? 'text-green-500' : 'text-gray-500'}>
                {dynamicFeedbackEnabled ? '✓' : '✗'}
              </span>
              <span>Dynamic Feedback: {dynamicFeedbackEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Category Selection</CardTitle>
          <CardDescription>Visual selection for trade categories</CardDescription>
        </CardHeader>
        <CardContent>
          <VisualSelectionGroup
            options={categories.map(cat => {
              const Icon = getCategoryIcon(cat);
              return {
                value: cat,
                label: cat,
                icon: Icon ? <Icon className="w-6 h-6" /> : undefined
              };
            })}
            value={category}
            onChange={setCategory}
            topic="trades"
            columns={4}
          />
          {category && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm">Selected: <strong>{category}</strong></p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Level Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Skill Level Selection</CardTitle>
          <CardDescription>Specialized selector for skill levels</CardDescription>
        </CardHeader>
        <CardContent>
          <SkillLevelSelector
            value={skillLevel}
            onChange={setSkillLevel}
            topic="trades"
          />
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm">Selected: <strong>{skillLevel}</strong></p>
          </div>
        </CardContent>
      </Card>

      {/* Trading Interests (Multi-select) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Trading Interests (Multi-select)</CardTitle>
          <CardDescription>Multiple selection example</CardDescription>
        </CardHeader>
        <CardContent>
          <VisualSelectionGroup
            options={tradingInterestsOptions.map(interest => {
              const Icon = getTradingInterestIcon(interest.value);
              return {
                value: interest.value,
                label: interest.label,
                description: interest.description,
                icon: Icon ? <Icon className="w-6 h-6" /> : undefined
              };
            })}
            value={tradingInterests}
            onChange={(value) => {
              const newValue = Array.isArray(value) ? value : [value];
              setTradingInterests(newValue);
            }}
            multiple={true}
            topic="trades"
            columns={4}
          />
          {tradingInterests.length > 0 && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm">Selected: <strong>{tradingInterests.join(', ')}</strong></p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience Level Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Experience Level Selection</CardTitle>
          <CardDescription>Single selection with icon indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <VisualSelectionGroup
            options={experienceLevels.map(level => {
              const Icon = getExperienceLevelIcon(level.value);
              return {
                value: level.value,
                label: level.label,
                description: level.description,
                icon: Icon ? <Icon className="w-6 h-6" /> : undefined
              };
            })}
            value={experienceLevel}
            onChange={(value) => setExperienceLevel(typeof value === 'string' ? value : value[0] || '')}
            multiple={false}
            topic="community"
            columns={4}
          />
          {experienceLevel && (
            <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
              <p className="text-sm">Selected: <strong>{experienceLevel}</strong></p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UXEnhancementsDemoPage;

