# TradeYa Form Components Documentation

## Overview

The TradeYa form system provides a comprehensive set of glassmorphic form components with integrated validation, accessibility compliance, and TradeYa brand integration. The system includes:

- **Glassmorphic Form Components**: Input, Textarea, Dropdown, and Form containers
- **Multi-Step Form System**: Complete workflow management with progress tracking
- **Validation System**: Real-time validation with accessibility support
- **Pre-built Forms**: Trade creation and profile completion workflows

## Quick Start

```tsx
import { ValidationProvider } from './validation/FormValidationSystem';
import { GlassmorphicForm } from './GlassmorphicForm';
import { GlassmorphicInput } from './GlassmorphicInput';
import { ValidationRules } from './validation/FormValidationSystem';

function MyForm() {
  return (
    <ValidationProvider>
      <GlassmorphicForm variant="stepped" brandAccent="gradient">
        <GlassmorphicInput
          label="Email"
          fieldName="email"
          validationRules={[
            ValidationRules.required(),
            ValidationRules.email()
          ]}
          variant="glass"
          brandAccent="orange"
        />
      </GlassmorphicForm>
    </ValidationProvider>
  );
}
```

## Core Components

### GlassmorphicForm

Container component with glassmorphic styling and multi-step support.

**Props:**
```tsx
interface GlassmorphicFormProps {
  variant?: 'standard' | 'elevated' | 'modal' | 'stepped';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
  blurIntensity?: 'light' | 'medium' | 'heavy';
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
  children: React.ReactNode;
}
```

**Usage:**
```tsx
<GlassmorphicForm 
  variant="elevated" 
  brandAccent="blue"
  blurIntensity="medium"
>
  {/* Form content */}
</GlassmorphicForm>
```

### GlassmorphicInput

Advanced input component with validation integration and brand styling.

**Props:**
```tsx
interface GlassmorphicInputProps {
  label?: string;
  variant?: 'glass' | 'elevated-glass' | 'inset-glass';
  size?: 'sm' | 'md' | 'lg';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'adaptive';
  
  // Validation Integration
  fieldName?: string;
  validationRules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidationIcon?: boolean;
  enableRealTimeValidation?: boolean;
  
  // Standard input props
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  // ... other HTML input attributes
}
```

**Examples:**

Basic input:
```tsx
<GlassmorphicInput
  label="Username"
  placeholder="Enter your username"
  variant="glass"
  brandAccent="orange"
/>
```

With validation:
```tsx
<GlassmorphicInput
  label="Email Address"
  fieldName="email"
  validationRules={[
    ValidationRules.required('Email is required'),
    ValidationRules.email('Please enter a valid email')
  ]}
  variant="elevated-glass"
  brandAccent="blue"
  validateOnChange={true}
  showValidationIcon={true}
/>
```

Password input:
```tsx
<GlassmorphicInput
  label="Password"
  type="password"
  fieldName="password"
  validationRules={[
    ValidationRules.required(),
    ValidationRules.minLength(8, 'Password must be at least 8 characters'),
    ValidationRules.pattern(/(?=.*[A-Z])/, 'Must contain uppercase letter')
  ]}
  showPasswordToggle={true}
  variant="glass"
  brandAccent="purple"
/>
```

### GlassmorphicTextarea

Multi-line text input with auto-resize and character counting.

**Props:**
```tsx
interface GlassmorphicTextareaProps {
  label?: string;
  variant?: 'glass' | 'elevated-glass' | 'inset-glass';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
  
  // Auto-resize
  minRows?: number;
  maxRows?: number;
  autoResize?: boolean;
  
  // Character counting
  showCharacterCount?: boolean;
  maxLength?: number;
  
  // Validation
  fieldName?: string;
  validationRules?: ValidationRule[];
  
  // Standard textarea props
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}
```

**Usage:**
```tsx
<GlassmorphicTextarea
  label="Description"
  placeholder="Describe your item..."
  fieldName="description"
  validationRules={[
    ValidationRules.required(),
    ValidationRules.minLength(20, 'Description must be at least 20 characters')
  ]}
  minRows={3}
  maxRows={8}
  showCharacterCount={true}
  maxLength={500}
  variant="glass"
  brandAccent="gradient"
/>
```

### GlassmorphicDropdown

Advanced dropdown with search, multi-select, and grouping.

**Props:**
```tsx
interface GlassmorphicDropdownProps {
  label?: string;
  options: DropdownOption[];
  variant?: 'glass' | 'elevated-glass' | 'inset-glass';
  brandAccent?: 'orange' | 'blue' | 'purple' | 'gradient';
  
  // Features
  searchable?: boolean;
  multiSelect?: boolean;
  clearable?: boolean;
  
  // Validation
  fieldName?: string;
  validationRules?: ValidationRule[];
  
  // Callbacks
  onChange?: (value: string | string[]) => void;
  onSearch?: (query: string) => void;
}

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  disabled?: boolean;
}
```

**Examples:**

Basic dropdown:
```tsx
<GlassmorphicDropdown
  label="Category"
  options={[
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' }
  ]}
  variant="glass"
  brandAccent="blue"
/>
```

Searchable with groups:
```tsx
<GlassmorphicDropdown
  label="Location"
  options={[
    { value: 'CA', label: 'California', group: 'States' },
    { value: 'NY', label: 'New York', group: 'States' },
    { value: 'los-angeles', label: 'Los Angeles', group: 'Cities' },
    { value: 'new-york-city', label: 'New York City', group: 'Cities' }
  ]}
  searchable={true}
  variant="elevated-glass"
  brandAccent="purple"
/>
```

Multi-select:
```tsx
<GlassmorphicDropdown
  label="Interests"
  options={interests}
  multiSelect={true}
  searchable={true}
  fieldName="interests"
  validationRules={[
    ValidationRules.custom(
      (value) => Array.isArray(value) && value.length > 0,
      'Please select at least one interest'
    )
  ]}
  variant="glass"
  brandAccent="gradient"
/>
```

## Validation System

### ValidationProvider

Wrap your forms with ValidationProvider to enable validation features.

```tsx
<ValidationProvider
  debounceMs={300}
  enableRealTimeValidation={true}
  enableAccessibility={true}
>
  {/* Your form components */}
</ValidationProvider>
```

### Validation Rules

Pre-built validation rules for common use cases:

```tsx
import { ValidationRules } from './validation/FormValidationSystem';

// Required field
ValidationRules.required('This field is required')

// Email validation
ValidationRules.email('Please enter a valid email address')

// Phone number validation
ValidationRules.phone('Please enter a valid phone number')

// Number validation with range
ValidationRules.number(0, 100, 'Must be between 0 and 100')

// Length validation
ValidationRules.minLength(8, 'Must be at least 8 characters')
ValidationRules.maxLength(50, 'Must be no more than 50 characters')

// Pattern validation
ValidationRules.pattern(/^[A-Z]+$/, 'Must be uppercase letters only')

// Custom validation
ValidationRules.custom(
  (value) => value === 'special',
  'Must be "special"'
)

// Async validation
ValidationRules.custom(
  async (value) => {
    const response = await checkAvailability(value);
    return response.available;
  },
  'This username is not available'
)
```

### Custom Validation Hooks

For advanced use cases, use validation hooks directly:

```tsx
import { useFieldValidation, useFormValidation } from './validation/useFormValidation';

// Single field validation
const emailField = useFieldValidation({
  fieldName: 'email',
  rules: [ValidationRules.required(), ValidationRules.email()],
  validateOnChange: true,
  validateOnBlur: true
});

// Complete form validation
const form = useFormValidation({
  initialData: { email: '', password: '' },
  validationRules: {
    email: [ValidationRules.required(), ValidationRules.email()],
    password: [ValidationRules.required(), ValidationRules.minLength(8)]
  }
});
```

## Multi-Step Forms

### MultiStepForm

Complete multi-step form system with progress tracking and validation.

```tsx
import { MultiStepForm, FormStep } from './MultiStepForm';

const steps: FormStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter your basic details',
    component: BasicInfoStep,
    validation: async (data) => {
      // Return true if step is valid
      return !!(data.firstName && data.lastName && data.email);
    }
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Set your preferences',
    component: PreferencesStep,
    validation: async (data) => {
      return !!(data.interests && data.interests.length > 0);
    }
  }
];

<MultiStepForm
  steps={steps}
  initialData={{}}
  onSubmit={handleSubmit}
  variant="stepped"
  brandAccent="gradient"
  showProgressBar={true}
  showStepNumbers={true}
  allowStepNavigation={false}
  validateOnStepChange={true}
  persistData={true}
  storageKey="my-form"
/>
```

### Step Components

Step components receive props for data management and validation:

```tsx
interface StepComponentProps {
  data: any;
  onChange: (field: string, value: any) => void;
  onValidationChange?: (isValid: boolean) => void;
  errors?: Record<string, string>;
}

const MyStep: React.FC<StepComponentProps> = ({
  data,
  onChange,
  onValidationChange,
  errors
}) => {
  useEffect(() => {
    // Validate step and notify parent
    const isValid = !!(data.field1 && data.field2);
    onValidationChange?.(isValid);
  }, [data, onValidationChange]);

  return (
    <div>
      <GlassmorphicInput
        label="Field 1"
        value={data.field1 || ''}
        onChange={(e) => onChange('field1', e.target.value)}
        error={errors?.field1}
      />
      {/* More fields */}
    </div>
  );
};
```

## Pre-built Forms

### TradeCreationForm

Complete trade creation workflow:

```tsx
import { TradeCreationForm } from './TradeCreationForm';

<TradeCreationForm
  onSubmit={async (data) => {
    await createTrade(data);
  }}
  onCancel={() => navigate('/dashboard')}
  variant="stepped"
  brandAccent="gradient"
/>
```

### ProfileCompletionForm

User profile setup workflow:

```tsx
import { ProfileCompletionForm } from './ProfileCompletionForm';

<ProfileCompletionForm
  onSubmit={async (data) => {
    await updateProfile(data);
  }}
  onSkip={() => navigate('/dashboard')}
  showSkipOption={true}
  variant="stepped"
  brandAccent="gradient"
/>
```

## Styling and Theming

### Brand Accents

All components support TradeYa brand accents:

- `orange`: Primary orange (#f97316)
- `blue`: Secondary blue (#0ea5e9)
- `purple`: Accent purple (#8b5cf6)
- `gradient`: Multi-color gradient

### Variants

Form components support multiple visual variants:

- `glass`: Standard glassmorphic effect
- `elevated-glass`: Enhanced depth and shadow
- `inset-glass`: Inset appearance
- `modal`: Optimized for modal dialogs

### Custom Styling

Components accept custom CSS classes and support Tailwind CSS:

```tsx
<GlassmorphicInput
  className="my-custom-class"
  style={{ customProperty: 'value' }}
/>
```

## Accessibility

All components are WCAG 2.1 AA compliant and include:

- Proper ARIA attributes
- Screen reader support
- Keyboard navigation
- Focus management
- Live regions for validation feedback
- High contrast support
- Reduced motion support

### Accessibility Features

```tsx
// Automatic ARIA attributes
<GlassmorphicInput
  fieldName="email"
  validationRules={[ValidationRules.required()]}
  // Automatically adds:
  // aria-invalid="true" when invalid
  // aria-describedby="email-validation" when showing validation
  // role="alert" for error messages
/>

// Custom accessibility
<GlassmorphicInput
  aria-label="Custom label"
  aria-describedby="custom-help"
  role="textbox"
/>
```

## Performance

The form system is optimized for performance:

- **Debounced validation**: Prevents excessive validation calls
- **Lazy validation**: Only validates touched fields
- **Memoized components**: Prevents unnecessary re-renders
- **Efficient state management**: Minimal state updates
- **Code splitting**: Components can be imported individually

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Migration Guide

### From Basic HTML Forms

```tsx
// Before
<form>
  <input type="email" required />
  <textarea></textarea>
  <select></select>
</form>

// After
<ValidationProvider>
  <GlassmorphicForm>
    <GlassmorphicInput
      type="email"
      fieldName="email"
      validationRules={[ValidationRules.required(), ValidationRules.email()]}
    />
    <GlassmorphicTextarea fieldName="description" />
    <GlassmorphicDropdown options={options} fieldName="category" />
  </GlassmorphicForm>
</ValidationProvider>
```

### From Other Form Libraries

The TradeYa form system is designed to be a drop-in replacement for most form libraries while providing enhanced glassmorphic styling and integrated validation.

## Troubleshooting

### Common Issues

1. **Validation not working**: Ensure components are wrapped in `ValidationProvider`
2. **Styling issues**: Check that Tailwind CSS is properly configured
3. **TypeScript errors**: Ensure all required props are provided
4. **Performance issues**: Use debouncing and avoid excessive re-renders

### Debug Mode

Enable debug logging:

```tsx
<ValidationProvider enableDebug={true}>
  {/* Your forms */}
</ValidationProvider>
```

## Contributing

When contributing to the form system:

1. Follow the existing component patterns
2. Include comprehensive tests
3. Update documentation
4. Ensure accessibility compliance
5. Test across all supported browsers

## API Reference

For detailed API documentation of each component, see:

- [GlassmorphicForm API](./docs/GlassmorphicForm.md)
- [GlassmorphicInput API](./docs/GlassmorphicInput.md)
- [GlassmorphicTextarea API](./docs/GlassmorphicTextarea.md)
- [GlassmorphicDropdown API](./docs/GlassmorphicDropdown.md)
- [MultiStepForm API](./docs/MultiStepForm.md)
- [Validation System API](./docs/ValidationSystem.md)

## Examples

See the `examples/` directory for complete working examples of all form components and patterns.

## Testing

The form system includes comprehensive tests. Run tests with:

```bash
npm test src/components/forms
```

Test coverage includes:

- Component rendering and interaction
- Validation logic and edge cases
- Accessibility compliance
- Performance benchmarks
- Cross-browser compatibility

## Changelog

### v1.0.0 (Current)

- Initial release with complete form system
- Glassmorphic styling with TradeYa brand integration
- Comprehensive validation system with real-time feedback
- Multi-step form workflows
- Full accessibility compliance (WCAG 2.1 AA)
- Pre-built trade creation and profile completion forms
