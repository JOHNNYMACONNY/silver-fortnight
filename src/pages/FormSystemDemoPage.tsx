import React, { useState } from 'react';
import { GlassmorphicForm } from '../components/ui/GlassmorphicForm';
import { GlassmorphicInput } from '../components/ui/GlassmorphicInput';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

/**
 * Form System Demo Page
 * 
 * Demonstrates the enhanced form system features from Phase 6:
 * - Multi-step forms
 * - Advanced variants
 * - Brand integration
 * - Sophisticated glassmorphism
 * - Enhanced validation states
 */
const FormSystemDemoPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: '',
    experience: '',
    skills: '',
    bio: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Form System Phase 6 Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Advanced form system with multi-step support, sophisticated glassmorphism, and brand integration
        </p>
      </div>

      {/* Form Variants Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-semibold mb-4">Standard Form</h3>
          <GlassmorphicForm variant="standard" className="space-y-4">
            <GlassmorphicInput
              label="Name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              variant="glass"
              brandAccent="orange"
            />
            <GlassmorphicInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              variant="glass"
              brandAccent="blue"
            />
            <Button className="w-full">Submit</Button>
          </GlassmorphicForm>
        </Card>

        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-semibold mb-4">Elevated Form</h3>
          <GlassmorphicForm variant="elevated" className="space-y-4">
            <GlassmorphicInput
              label="Company"
              placeholder="Enter company name"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              variant="elevated-glass"
              brandAccent="purple"
            />
            <GlassmorphicInput
              label="Role"
              placeholder="Enter your role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              variant="elevated-glass"
              brandAccent="blue"
            />
            <Button className="w-full">Submit</Button>
          </GlassmorphicForm>
        </Card>
      </div>

      {/* Multi-Step Form Demo */}
      <Card variant="glass" className="p-8 mb-12">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-2">Multi-Step Form Demo</h3>
          <div className="flex items-center space-x-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }
                `}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${step < currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        <GlassmorphicForm 
          variant="stepped" 
          isMultiStep={true}
          currentStep={currentStep}
          totalSteps={3}
          className="space-y-6"
        >
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Step 1: Basic Information</h4>
              <GlassmorphicInput
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                variant="floating-glass"
                brandAccent="orange"
                animatedLabel={true}
              />
              <GlassmorphicInput
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                variant="floating-glass"
                brandAccent="blue"
                animatedLabel={true}
              />
              <GlassmorphicInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                variant="floating-glass"
                brandAccent="purple"
                animatedLabel={true}
                showPasswordToggle={true}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Step 2: Professional Details</h4>
              <GlassmorphicInput
                label="Company"
                placeholder="Enter your company name"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                variant="inset-glass"
                brandAccent="orange"
              />
              <GlassmorphicInput
                label="Job Title"
                placeholder="Enter your job title"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                variant="inset-glass"
                brandAccent="blue"
              />
              <GlassmorphicInput
                label="Years of Experience"
                placeholder="Enter years of experience"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                variant="inset-glass"
                brandAccent="purple"
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Step 3: Additional Information</h4>
              <GlassmorphicInput
                label="Skills"
                placeholder="Enter your key skills"
                value={formData.skills}
                onChange={(e) => handleInputChange('skills', e.target.value)}
                variant="elevated-glass"
                brandAccent="orange"
              />
              <GlassmorphicInput
                label="Bio"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                variant="elevated-glass"
                brandAccent="blue"
              />
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
            >
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button>
                Submit Form
              </Button>
            )}
          </div>
        </GlassmorphicForm>
      </Card>

      {/* Input Variants Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-semibold mb-4">Input Variants</h3>
          <div className="space-y-4">
            <GlassmorphicInput
              label="Standard Glass"
              placeholder="Standard glass input"
              variant="glass"
              brandAccent="orange"
            />
            <GlassmorphicInput
              label="Elevated Glass"
              placeholder="Elevated glass input"
              variant="elevated-glass"
              brandAccent="blue"
            />
            <GlassmorphicInput
              label="Inset Glass"
              placeholder="Inset glass input"
              variant="inset-glass"
              brandAccent="purple"
            />
            <GlassmorphicInput
              label="Floating Glass"
              placeholder="Floating glass input"
              variant="floating-glass"
              brandAccent="orange"
              animatedLabel={true}
            />
          </div>
        </Card>

        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-semibold mb-4">Validation States</h3>
          <div className="space-y-4">
              <GlassmorphicInput
              label="Success State"
              placeholder="This input is valid"
              validationState="success"
              success="Input is valid!"
              variant="glass"
                brandAccent="orange"
            />
              <GlassmorphicInput
              label="Error State"
              placeholder="This input has an error"
              validationState="error"
              error="This field is required"
              variant="glass"
                brandAccent="blue"
            />
              <GlassmorphicInput
              label="Warning State"
              placeholder="This input has a warning"
              validationState="warning"
              variant="glass"
                brandAccent="purple"
            />
            <GlassmorphicInput
              label="Password with Toggle"
              type="password"
              placeholder="Enter password"
              variant="glass"
              brandAccent="purple"
              showPasswordToggle={true}
            />
          </div>
        </Card>
      </div>

      {/* Brand Integration Demo */}
      <Card variant="glass" className="p-8">
        <h3 className="text-2xl font-semibold mb-6">Brand Integration Demo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-primary">Orange Brand</h4>
            <GlassmorphicInput
              label="Orange Input"
              placeholder="Orange brand styling"
              variant="elevated-glass"
              brandAccent="orange"
            />
            <Button className="w-full" variant="default">
              Orange Button
            </Button>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-blue-600">Blue Brand</h4>
            <GlassmorphicInput
              label="Blue Input"
              placeholder="Blue brand styling"
              variant="elevated-glass"
              brandAccent="blue"
            />
            <Button className="w-full" variant="default">
              Blue Button
            </Button>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-purple-600">Purple Brand</h4>
            <GlassmorphicInput
              label="Purple Input"
              placeholder="Purple brand styling"
              variant="elevated-glass"
              brandAccent="purple"
            />
            <Button className="w-full" variant="default">
              Purple Button
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FormSystemDemoPage; 