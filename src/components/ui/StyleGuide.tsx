import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Alert, AlertDescription } from './Alert';
import { Toast } from './Toast';
import { useToast } from '../../contexts/ToastContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { BentoGrid, BentoItem } from './BentoGrid';
import AnimatedHeading from './AnimatedHeading';
import GradientMeshBackground from './GradientMeshBackground';
import { TopicLink } from './TopicLink';
import Box from '../layout/primitives/Box';
import Stack from '../layout/primitives/Stack';
import { semanticClasses, brandGradientText } from '../../utils/semanticColors';
import { themeClasses } from '../../utils/themeUtils';
import { GlassmorphicForm } from './GlassmorphicForm';
import { GlassmorphicInput } from './GlassmorphicInput';
import { AccessibleFormField } from './AccessibleFormField';
import { DynamicBackground } from '../background/DynamicBackground';
import { MobileMenu } from './MobileMenu';
import { CommandPalette } from './CommandPalette';
import { NavItem } from './NavItem';
import { UserMenu } from './UserMenu';
import { Modal } from './Modal';
import { SimpleModal } from './SimpleModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './Sheet';
import { ContextualLoading, LoadingSpinner } from './EnhancedLoadingStates';
import Spinner from './Spinner';
import StateTransition from './StateTransition';
import { Progress, CircularProgress, StepProgress } from './Progress';
import { progressPresets, progressPatterns, createStepProgress, createLinearProgress } from '../../utils/progressUtils';
import { ThreeHeaderOverlay } from '../background/ThreeHeaderOverlay';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Star, 
  Trophy, 
  Crown, 
  Users, 
  Handshake, 
  Globe, 
  Zap,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Plus,
  Palette,
  Code,
  Music,
  Video,
  PenTool,
  Camera,
  Layers,
  TrendingUp,
  GraduationCap,
  Menu,
  Command,
  Search,
  Home,
  ShoppingBag,
  Award,
  Briefcase,
  MessageSquare,
  Bell,
  User,
  Settings,
  X,
  ChevronDown,
  Loader2,
  RefreshCw,
  BarChart3,
  TrendingUp as TrendingUpIcon,
  Activity
} from 'lucide-react';

/**
 * TradeYa Style Guide Component
 * 
 * This component provides a comprehensive visual reference for the design system,
 * showcasing colors, typography, components, and interaction patterns.
 */
export const StyleGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('colors');
  const { showToast } = useToast();
  
  // Dialog demo states
  const [modalOpen, setModalOpen] = useState(false);
  const [simpleModalOpen, setSimpleModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');
  return (
    <div className="relative min-h-screen p-8">
      {/* Dynamic Background - same as rest of website */}
      <DynamicBackground
        colors={{
          primary: '#f97316',   // TradeYa Orange
          secondary: '#0ea5e9', // TradeYa Blue
          accent: '#8b5cf6'     // TradeYa Purple
        }}
        className="fixed inset-0 -z-10"
      />
      <div className="relative max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">TradeYa Design System</h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive style guide for consistent UX and visual design
          </p>
        </div>

        <Tabs
          value={activeTab}
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-14">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="dialogs">Dialogs</TabsTrigger>
            <TabsTrigger value="loading">Loading</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            <Card variant="glass" className="glassmorphic">
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Primary (Orange)</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                      <div key={shade} className="text-center">
                        <div 
                          className={`w-16 h-16 rounded-lg mb-2 mx-auto bg-primary-${shade} shadow-glass`}
                          title={`Primary ${shade}`}
                        />
                        <span className="text-sm text-muted-foreground">{shade}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secondary Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Secondary (Blue)</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                      <div key={shade} className="text-center">
                        <div 
                          className={`w-16 h-16 rounded-lg mb-2 mx-auto bg-secondary-${shade} shadow-glass`}
                          title={`Secondary ${shade}`}
                        />
                        <span className="text-sm text-muted-foreground">{shade}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Semantic Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg mb-2 mx-auto bg-success shadow-glass" />
                      <span className="text-sm text-muted-foreground">Success</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg mb-2 mx-auto bg-warning shadow-glass" />
                      <span className="text-sm text-muted-foreground">Warning</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg mb-2 mx-auto bg-destructive shadow-glass" />
                      <span className="text-sm text-muted-foreground">Error</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg mb-2 mx-auto bg-info shadow-glass" />
                      <span className="text-sm text-muted-foreground">Info</span>
                    </div>
                  </div>
                </div>

                {/* Topic-Based Semantic Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Topic-Based Colors</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-lg mb-2 mx-auto ${semanticClasses('trades').bgSolid} shadow-glass`} />
                      <span className="text-sm text-muted-foreground">Trades</span>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-lg mb-2 mx-auto ${semanticClasses('collaboration').bgSolid} shadow-glass`} />
                      <span className="text-sm text-muted-foreground">Collaboration</span>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-lg mb-2 mx-auto ${semanticClasses('community').bgSolid} shadow-glass`} />
                      <span className="text-sm text-muted-foreground">Community</span>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-lg mb-2 mx-auto ${semanticClasses('success').bgSolid} shadow-glass`} />
                      <span className="text-sm text-muted-foreground">Success</span>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-lg mb-2 mx-auto ${semanticClasses('warning').bgSolid} shadow-glass`} />
                      <span className="text-sm text-muted-foreground">Warning</span>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-lg mb-2 mx-auto ${semanticClasses('danger').bgSolid} shadow-glass`} />
                      <span className="text-sm text-muted-foreground">Danger</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-12">
            {/* Premium Typography Scale */}
            <Card>
              <CardHeader>
                <CardTitle>Premium Typography Scale</CardTitle>
                <p className="text-sm text-muted-foreground">Complete typography system with semantic classes for consistent design</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-8">
                    {/* Hero & Display Typography */}
                    <div className="glassmorphic rounded-xl border-glass p-8 bg-white/5 backdrop-blur-xl">
                      <h4 className="text-lg font-semibold mb-6 text-foreground">Hero & Display Typography</h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h1 className={themeClasses.heroHeading}>
                            Hero Heading (themeClasses.heroHeading)
                          </h1>
                          <p className="text-sm text-muted-foreground">Ultimate impact for main page titles and hero sections</p>
                        </div>
                        <div className="space-y-2">
                          <h1 className={themeClasses.displayLarge}>
                            Large Display (themeClasses.displayLarge)
                          </h1>
                          <p className="text-sm text-muted-foreground">Prominent headings for major sections</p>
                        </div>
                        <div className="space-y-2">
                          <h1 className={themeClasses.displayMain}>
                            Main Heading (themeClasses.displayMain)
                          </h1>
                          <p className="text-sm text-muted-foreground">Primary headings for page sections</p>
                        </div>
                      </div>
                    </div>

                    {/* Section Typography */}
                    <div className="glassmorphic rounded-xl border-glass p-8 bg-white/5 backdrop-blur-xl">
                      <h4 className="text-lg font-semibold mb-6 text-foreground">Section Typography</h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h2 className={themeClasses.sectionHeading}>
                            Section Heading (themeClasses.sectionHeading)
                          </h2>
                          <p className="text-sm text-muted-foreground">Clear hierarchy for content sections</p>
                        </div>
                        <div className="space-y-2">
                          <h3 className={themeClasses.subsectionHeading}>
                            Subsection (themeClasses.subsectionHeading)
                          </h3>
                          <p className="text-sm text-muted-foreground">Secondary headings within sections</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className={themeClasses.componentTitle}>
                            Component Title (themeClasses.componentTitle)
                          </h4>
                          <p className="text-sm text-muted-foreground">Titles for cards and component headers</p>
                        </div>
                      </div>
                    </div>

                    {/* Body Typography */}
                    <div className="glassmorphic rounded-xl border-glass p-8 bg-white/5 backdrop-blur-xl">
                      <h4 className="text-lg font-semibold mb-6 text-foreground">Body Typography</h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h5 className={themeClasses.bodyLarge}>
                            Large Body (themeClasses.bodyLarge)
                          </h5>
                          <p className="text-sm text-muted-foreground">Emphasized body text for important content</p>
                        </div>
                        <div className="space-y-2">
                          <p className={themeClasses.body}>
                            Regular body text with optimal line height for readability and premium feel (themeClasses.body)
                          </p>
                          <p className="text-sm text-muted-foreground">Standard body text for paragraphs and descriptions</p>
                        </div>
                        <div className="space-y-2">
                          <p className={themeClasses.bodySmall}>
                            Small body text with relaxed line spacing (themeClasses.bodySmall)
                          </p>
                          <p className="text-sm text-muted-foreground">Secondary text and supporting content</p>
                        </div>
                        <div className="space-y-2">
                          <p className={themeClasses.caption}>
                            Caption text (themeClasses.caption)
                          </p>
                          <p className="text-sm text-muted-foreground">Small labels and metadata</p>
                        </div>
                        <div className="space-y-2">
                          <p className={themeClasses.labelSmall}>
                            Ultra-small labels (themeClasses.labelSmall)
                          </p>
                          <p className="text-sm text-muted-foreground">Minimal text for badges and tags</p>
                        </div>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Premium Font Weights */}
            <Card>
              <CardHeader>
                <CardTitle>Premium Font Weights</CardTitle>
                <p className="text-sm text-muted-foreground">Comprehensive weight system with contextual usage guidelines</p>
              </CardHeader>
              <CardContent>
                <div className="glassmorphic rounded-xl border-glass p-8 bg-white/5 backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors cursor-pointer">
                        <p className={`${themeClasses.fontThinHeading} mb-2`}>Ultra-light heading (themeClasses.fontThinHeading)</p>
                        <p className="text-xs text-muted-foreground">Perfect for elegant, minimal designs</p>
                      </div>
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors cursor-pointer">
                        <p className={`${themeClasses.fontLightHeading} mb-2`}>Light heading (themeClasses.fontLightHeading)</p>
                        <p className="text-xs text-muted-foreground">Great for subtle emphasis and modern layouts</p>
                      </div>
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors cursor-pointer">
                        <p className={`${themeClasses.fontNormalBody} mb-2`}>Regular body text (themeClasses.fontNormalBody)</p>
                        <p className="text-xs text-muted-foreground">Standard weight for optimal readability</p>
                      </div>
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors cursor-pointer">
                        <p className={`${themeClasses.fontMediumEmphasis} mb-2`}>Medium emphasis (themeClasses.fontMediumEmphasis)</p>
                        <p className="text-xs text-muted-foreground">Subtle emphasis without being heavy</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors cursor-pointer">
                        <p className={`${themeClasses.fontSemiboldSection} mb-2`}>Section heading (themeClasses.fontSemiboldSection)</p>
                        <p className="text-xs text-muted-foreground">Strong but not overwhelming emphasis</p>
                      </div>
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors cursor-pointer">
                        <p className={`${themeClasses.fontBoldMain} mb-2`}>Main heading (themeClasses.fontBoldMain)</p>
                        <p className="text-xs text-muted-foreground">Strong emphasis for important content</p>
                      </div>
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors cursor-pointer">
                        <p className={`${themeClasses.fontExtraboldHero} mb-2`}>Hero heading (themeClasses.fontExtraboldHero)</p>
                        <p className="text-xs text-muted-foreground">Maximum impact for hero sections</p>
                      </div>
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors cursor-pointer">
                        <p className={`${themeClasses.fontBlackDisplay} mb-2`}>Display text (themeClasses.fontBlackDisplay)</p>
                        <p className="text-xs text-muted-foreground">Ultimate emphasis for display purposes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Developer Usage Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Developer Usage Guide</CardTitle>
                <p className="text-sm text-muted-foreground">Essential information for implementing semantic typography</p>
              </CardHeader>
              <CardContent>
                  <div className="glassmorphic rounded-xl border-glass p-6 bg-white/5 backdrop-blur-xl">
                    <h4 className="text-sm font-medium mb-4 text-muted-foreground">Semantic Typography Classes</h4>
                    <div className="space-y-4">
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors">
                        <h5 className="text-sm font-medium mb-2 text-foreground">Import & Usage</h5>
                        <div className="glassmorphic rounded-lg border-glass p-3 bg-white/10 backdrop-blur-xl">
                          <code className="text-xs font-mono text-foreground">
                            {`import { themeClasses } from '../../utils/themeUtils';

// Instead of hard-coded classes:
<h1 className="text-6xl font-black tracking-tighter leading-none text-foreground hover:text-primary transition-colors cursor-pointer">

// Use semantic classes:
<h1 className={themeClasses.heroHeading}>`}
                          </code>
                        </div>
                      </div>
                      
                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors">
                        <h5 className="text-sm font-medium mb-2 text-foreground">Available Semantic Classes</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">Hero & Display:</div>
                            <div className="text-xs font-mono text-foreground">themeClasses.heroHeading</div>
                            <div className="text-xs font-mono text-foreground">themeClasses.displayLarge</div>
                            <div className="text-xs font-mono text-foreground">themeClasses.displayMain</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">Section & Body:</div>
                            <div className="text-xs font-mono text-foreground">themeClasses.sectionHeading</div>
                            <div className="text-xs font-mono text-foreground">themeClasses.body</div>
                            <div className="text-xs font-mono text-foreground">themeClasses.caption</div>
                          </div>
                  </div>
                </div>

                      <div className="hover:bg-white/5 rounded-lg p-4 transition-colors">
                        <h5 className="text-sm font-medium mb-2 text-foreground">Benefits for Developers</h5>
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">✅ <strong>Consistent:</strong> Same styling across all components</div>
                          <div className="text-xs text-muted-foreground">✅ <strong>Maintainable:</strong> Update once, changes everywhere</div>
                          <div className="text-xs text-muted-foreground">✅ <strong>Semantic:</strong> Clear meaning (heroHeading vs text-6xl)</div>
                          <div className="text-xs text-muted-foreground">✅ <strong>Future-proof:</strong> Easy to update design system</div>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Enhanced Animated Headings */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Premium Animated Headings</h3>
                  <div className="space-y-6">
                    <div className="glassmorphic rounded-xl border-glass p-6 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-colors">
                      <h4 className="text-sm font-medium mb-4 text-muted-foreground">Kinetic Animation</h4>
                      <AnimatedHeading as="h2" animation="kinetic" className="text-3xl font-bold tracking-tight text-foreground">
                        Kinetic Heading
                      </AnimatedHeading>
                      <p className="text-xs text-muted-foreground mt-2">Dynamic, energetic animation perfect for hero sections</p>
                    </div>
                    <div className="glassmorphic rounded-xl border-glass p-6 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-colors">
                      <h4 className="text-sm font-medium mb-4 text-muted-foreground">Slide Animation</h4>
                      <AnimatedHeading as="h3" animation="slide" className="text-2xl font-semibold tracking-normal text-foreground">
                        Slide Heading
                      </AnimatedHeading>
                      <p className="text-xs text-muted-foreground mt-2">Smooth sliding effect for section transitions</p>
                    </div>
                    <div className="glassmorphic rounded-xl border-glass p-6 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-colors">
                      <h4 className="text-sm font-medium mb-4 text-muted-foreground">Fade Animation</h4>
                      <AnimatedHeading as="h4" animation="fade" className="text-xl font-medium tracking-normal text-foreground">
                        Fade Heading
                      </AnimatedHeading>
                      <p className="text-xs text-muted-foreground mt-2">Subtle fade-in effect for gentle emphasis</p>
                    </div>
                  </div>
                </div>

                {/* Gradient Text Utilities */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Gradient Text Utilities</h3>
                  <div className="space-y-6">
                    {/* Brand Gradient */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Brand Gradient</h4>
                      <div className="space-y-3">
                        <h2 className={`text-2xl font-bold ${brandGradientText}`}>
                          Premium Brand Heading
                        </h2>
                        <div className="glassmorphic rounded-lg border-glass p-4 bg-white/5 backdrop-blur-xl">
                          <code className="text-xs text-muted-foreground font-mono">
                            {`className="${brandGradientText}"`}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Topic Gradients */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Topic-Based Gradients</h4>
                      <div className="space-y-4">
                        <div>
                          <h3 className={`text-xl font-semibold ${semanticClasses('trades').gradientText}`}>
                            Trades Gradient Heading
                          </h3>
                          <div className="glassmorphic rounded-lg border-glass p-3 bg-white/5 backdrop-blur-xl mt-2">
                            <code className="text-xs text-muted-foreground font-mono">
                              {`semanticClasses('trades').gradientText`}
                            </code>
                          </div>
                        </div>
                        <div>
                          <h3 className={`text-xl font-semibold ${semanticClasses('collaboration').gradientText}`}>
                            Collaboration Gradient Heading
                          </h3>
                          <div className="glassmorphic rounded-lg border-glass p-3 bg-white/5 backdrop-blur-xl mt-2">
                            <code className="text-xs text-muted-foreground font-mono">
                              {`semanticClasses('collaboration').gradientText`}
                            </code>
                          </div>
                        </div>
                        <div>
                          <h3 className={`text-xl font-semibold ${semanticClasses('community').gradientText}`}>
                            Community Gradient Heading
                          </h3>
                          <div className="glassmorphic rounded-lg border-glass p-3 bg-white/5 backdrop-blur-xl mt-2">
                            <code className="text-xs text-muted-foreground font-mono">
                              {`semanticClasses('community').gradientText`}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Usage Examples */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Usage Examples</h4>
                      <div className="space-y-4">
                        <div className="glassmorphic rounded-lg border-glass p-4 bg-white/5 backdrop-blur-xl">
                          <h5 className="text-sm font-medium mb-2 text-muted-foreground">Page Headings</h5>
                          <h1 className={`text-3xl font-bold mb-2 ${brandGradientText}`}>
                            Welcome to TradeYa
                          </h1>
                          <p className="text-sm text-muted-foreground">Perfect for hero sections and main page titles</p>
                        </div>
                        <div className="glassmorphic rounded-lg border-glass p-4 bg-white/5 backdrop-blur-xl">
                          <h5 className="text-sm font-medium mb-2 text-muted-foreground">Section Headings</h5>
                          <h2 className={`text-xl font-semibold mb-2 ${semanticClasses('trades').gradientText}`}>
                            Active Trades
                          </h2>
                          <p className="text-sm text-muted-foreground">Use topic gradients for contextual sections</p>
                        </div>
                        <div className="glassmorphic rounded-lg border-glass p-4 bg-white/5 backdrop-blur-xl">
                          <h5 className="text-sm font-medium mb-2 text-muted-foreground">Special Text</h5>
                          <p className={`text-lg font-medium ${semanticClasses('collaboration').gradientText}`}>
                            New Collaboration Available
                          </p>
                          <p className="text-sm text-muted-foreground">Highlight important information with gradient text</p>
                        </div>
                      </div>
                    </div>

                    {/* Implementation Guide */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Implementation Guide</h4>
                      <div className="glassmorphic rounded-lg border-glass p-4 bg-white/5 backdrop-blur-xl">
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">Import</h5>
                            <code className="text-xs text-foreground font-mono bg-black/10 px-2 py-1 rounded">
                              import {`{ brandGradientText, semanticClasses }`} from '@/utils/semanticColors'
                            </code>
                          </div>
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">Brand Gradient</h5>
                            <code className="text-xs text-foreground font-mono bg-black/10 px-2 py-1 rounded">
                              className={`"${brandGradientText}"`}
                            </code>
                          </div>
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">Topic Gradient</h5>
                            <code className="text-xs text-foreground font-mono bg-black/10 px-2 py-1 rounded">
                              className={`{semanticClasses('trades').gradientText}`}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">

            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Button Variants</h3>
                  <div className="space-y-6">
                    {/* Design Hierarchy: Premium > Interactive > Glassmorphic */}
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Design Hierarchy</h4>
                      <div className="space-y-4">
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">On Premium Card Background</h5>
                                  <Card variant="premium" depth="lg" glow="subtle" glowColor="orange" className="p-4">
                                    <div className="flex flex-wrap gap-4">
                                      <Button variant="premium">Premium (Most Important)</Button>
                                      <Button variant="interactive">Interactive (Really Important)</Button>
                                      <Button variant="glassmorphic">Glassmorphic (Less Important)</Button>
                                      <Button variant="premium-outline">Premium Outline</Button>
                                      <Button variant="interactive-outline">Interactive Outline</Button>
                                    </div>
                                  </Card>
                                </div>
                      </div>
                    </div>
                    
                            {/* Background Context Examples */}
                            <div>
                              <h4 className="text-md font-medium text-muted-foreground mb-3">Background Context Examples</h4>
                              <div className="space-y-4">
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">On Default Card Background</h5>
                                  <Card variant="default" className="p-4">
                                    <div className="flex flex-wrap gap-4">
                                      <Button variant="premium-light">Premium Light</Button>
                                      <Button variant="interactive-light">Interactive Light</Button>
                                      <Button variant="premium-outline">Premium Outline</Button>
                                      <Button variant="interactive-outline">Interactive Outline</Button>
                                      <Button variant="glassmorphic">Glassmorphic</Button>
                                    </div>
                                  </Card>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">On Glass Card Background</h5>
                                  <Card variant="glass" className="p-4">
                                    <div className="flex flex-wrap gap-4">
                                      <Button variant="premium-light">Premium Light</Button>
                                      <Button variant="interactive-light">Interactive Light</Button>
                                      <Button variant="premium-outline">Premium Outline</Button>
                                      <Button variant="interactive-outline">Interactive Outline</Button>
                                      <Button variant="glassmorphic">Glassmorphic</Button>
                                    </div>
                                  </Card>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">On Premium Card Background</h5>
                                  <Card variant="premium" depth="lg" glow="subtle" glowColor="orange" className="p-4">
                                    <div className="flex flex-wrap gap-4">
                                      <Button variant="premium">Premium</Button>
                                      <Button variant="interactive">Interactive</Button>
                                      <Button variant="glassmorphic">Glassmorphic</Button>
                                      <Button variant="premium-outline">Premium Outline</Button>
                                      <Button variant="interactive-outline">Interactive Outline</Button>
                                    </div>
                                  </Card>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">On Elevated Card Background</h5>
                                  <Card variant="elevated" className="p-4">
                                    <div className="flex flex-wrap gap-4">
                                      <Button variant="premium">Premium</Button>
                                      <Button variant="interactive">Interactive</Button>
                                      <Button variant="glassmorphic">Glassmorphic</Button>
                                      <Button variant="premium-outline">Premium Outline</Button>
                                      <Button variant="interactive-outline">Interactive Outline</Button>
                                    </div>
                                  </Card>
                                </div>
                              </div>
                            </div>
                    
                    {/* All Variants */}
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">All Variants</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                        <Button variant="success">Success</Button>
                        <Button variant="warning">Warning</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Button Sizes</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Button States</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button>Normal</Button>
                    <Button disabled>Disabled</Button>
                    <Button className="opacity-50">Loading...</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Elements */}
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Form Elements</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Glassmorphic Form</h4>
                      <GlassmorphicForm className="max-w-md">
                        <div className="space-y-4">
                          <AccessibleFormField id="email" label="Email">
                            <GlassmorphicInput
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              icon={<span className={semanticClasses('community').text}>@</span>}
                            />
                          </AccessibleFormField>
                          <AccessibleFormField id="password" label="Password">
                            <GlassmorphicInput
                              id="password"
                              type="password"
                              placeholder="Enter your password"
                              showPasswordToggle={true}
                            />
                          </AccessibleFormField>
                          <Button variant="premium-light" className="w-full">
                            Submit
                          </Button>
                        </div>
                      </GlassmorphicForm>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Glassmorphic Input Variants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassmorphicInput
                          variant="glass"
                          placeholder="Glass variant"
                          label="Glass"
                        />
                        <GlassmorphicInput
                          variant="elevated-glass"
                          placeholder="Elevated Glass"
                          label="Elevated Glass"
                        />
                        <GlassmorphicInput
                          variant="inset-glass"
                          placeholder="Inset Glass"
                          label="Inset Glass"
                        />
                        <GlassmorphicInput
                          variant="floating-glass"
                          placeholder="Floating Glass"
                          label="Floating Glass"
                        />
                        <GlassmorphicInput
                          variant="glass"
                          placeholder="Disabled Glass"
                          label="Disabled Glass"
                          disabled
                        />
                        <GlassmorphicInput
                          variant="elevated-glass"
                          placeholder="Disabled Elevated"
                          label="Disabled Elevated"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Topic-Based Form Examples</h4>
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-3">Trades Form</h5>
                          <GlassmorphicForm className="max-w-md">
                            <div className="space-y-4">
                              <AccessibleFormField id="trade-title" label="Trade Title">
                                <GlassmorphicInput
                                  id="trade-title"
                                  placeholder="What are you trading?"
                                  icon={<span className={semanticClasses('trades').text}>⚡</span>}
                                />
                              </AccessibleFormField>
                              <Button variant="premium" className="w-full">
                                Create Trade
                              </Button>
                            </div>
                          </GlassmorphicForm>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-3">Collaboration Form</h5>
                          <GlassmorphicForm className="max-w-md">
                            <div className="space-y-4">
                              <AccessibleFormField id="collab-title" label="Project Title">
                                <GlassmorphicInput
                                  id="collab-title"
                                  placeholder="What are you collaborating on?"
                                  icon={<span className={semanticClasses('collaboration').text}>🤝</span>}
                                />
                              </AccessibleFormField>
                              <Button variant="interactive" className="w-full">
                                Start Collaboration
                              </Button>
                            </div>
                          </GlassmorphicForm>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-3">Community Form</h5>
                          <GlassmorphicForm className="max-w-md">
                            <div className="space-y-4">
                              <AccessibleFormField id="community-post" label="Community Post">
                                <GlassmorphicInput
                                  id="community-post"
                                  placeholder="Share with the community..."
                                  icon={<span className={semanticClasses('community').text}>💬</span>}
                                />
                              </AccessibleFormField>
                              <Button variant="glassmorphic" className="w-full">
                                Post to Community
                              </Button>
                            </div>
                          </GlassmorphicForm>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Textarea</h3>
                  <Textarea placeholder="Enter longer text..." />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Select</h3>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Alert Variants</h3>
                  <div className="space-y-4">
                    <Alert variant="default">
                      <AlertDescription>This is a default glassmorphic alert message with automatic icon. Notice how the text is consistently readable while the icon provides visual context.</AlertDescription>
                    </Alert>
                    <Alert variant="success">
                      <AlertDescription>This is a success alert message with glassmorphic styling. The check icon is green for instant recognition, but the text remains optimally readable.</AlertDescription>
                    </Alert>
                    <Alert variant="warning">
                      <AlertDescription>This is a warning alert message with glassmorphic styling. The warning icon is orange while maintaining excellent text readability.</AlertDescription>
                    </Alert>
                    <Alert variant="destructive">
                      <AlertDescription>This is a destructive alert message with glassmorphic styling. The error icon is red for clear identification, with text that's always easy to read.</AlertDescription>
                    </Alert>
                    <Alert variant="info">
                      <AlertDescription>This is an info alert message with glassmorphic styling. The info icon is blue for informational content, with consistently readable text.</AlertDescription>
                    </Alert>
                    <Alert variant="error">
                      <AlertDescription>This is an error alert message with glassmorphic styling. The error icon is red for system errors, distinct from destructive alerts.</AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Topic-Based Alerts</h3>
                  <div className="space-y-4">
                    <Alert variant="trades">
                      <AlertDescription>Trade completed successfully! Your items have been exchanged. The lightning icon is orange (trades color) while text stays readable.</AlertDescription>
                    </Alert>
                    <Alert variant="collaboration">
                      <AlertDescription>New collaboration request received. Check your notifications. The handshake icon is purple (collaboration color) for instant recognition.</AlertDescription>
                    </Alert>
                    <Alert variant="community">
                      <AlertDescription>Welcome to the community! Your post has been published. The globe icon is blue (community color) with consistently readable text.</AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Gamification Alerts</h3>
                  <div className="space-y-4">
                    <Alert variant="xp">
                      <AlertDescription>You gained 50 XP for completing a trade! The star icon is orange (XP color) for instant recognition of experience points.</AlertDescription>
                    </Alert>
                    <Alert variant="achievement">
                      <AlertDescription>Congratulations! You unlocked the "First Trade" achievement. The trophy icon is purple (achievement color) for celebrating milestones.</AlertDescription>
                    </Alert>
                    <Alert variant="level-up">
                      <AlertDescription>Level Up! You've reached Level 5. The crown icon is gold (level-up color) for celebrating progression milestones.</AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Size Variants</h3>
                  <div className="space-y-4">
                    <Alert variant="success" size="sm">
                      <AlertDescription>Small toast notification</AlertDescription>
                    </Alert>
                    <Alert variant="warning" size="md">
                      <AlertDescription>Medium alert message (default size)</AlertDescription>
                    </Alert>
                    <Alert variant="destructive" size="lg">
                      <AlertDescription>Large important system alert with bigger icon and text</AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Dismissible Alerts</h3>
                  <div className="space-y-4">
                    <Alert variant="success" dismissible onDismiss={() => console.log('Success alert dismissed')}>
                      <AlertDescription>This success alert can be dismissed by clicking the X button.</AlertDescription>
                    </Alert>
                    <Alert variant="trades" dismissible onDismiss={() => console.log('Trade alert dismissed')}>
                      <AlertDescription>Trade notification - click X to dismiss when you're done reading.</AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Alerts with Action Buttons</h3>
                  <div className="space-y-4">
                    <Alert 
                      variant="collaboration" 
                      actions={[
                        { label: "View Request", onClick: () => console.log('View collaboration request') },
                        { label: "Decline", variant: "outline", onClick: () => console.log('Decline request') }
                      ]}
                    >
                      <AlertDescription>New collaboration request from Sarah Johnson for "Mobile App Design".</AlertDescription>
                    </Alert>
                    <Alert 
                      variant="trades" 
                      actions={[
                        { label: "View Trade", onClick: () => console.log('View trade details') },
                        { label: "Rate User", variant: "ghost", onClick: () => console.log('Rate user') }
                      ]}
                    >
                      <AlertDescription>Your trade with Mike has been completed successfully!</AlertDescription>
                    </Alert>
                    <Alert 
                      variant="community" 
                      actions={[
                        { label: "View Post", onClick: () => console.log('View community post') },
                        { label: "Reply", variant: "outline", onClick: () => console.log('Reply to post') }
                      ]}
                    >
                      <AlertDescription>Your community post received 5 new comments!</AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Context Examples</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">On Premium Card Background</h4>
                      <Card variant="premium" depth="lg" glow="subtle" glowColor="orange" className="p-4">
                        <Alert variant="glass-success" dismissible onDismiss={() => console.log('Dismissed')}>
                          <AlertDescription>Trade completed successfully! Your items have been exchanged.</AlertDescription>
                        </Alert>
                      </Card>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">On Glass Card Background</h4>
                      <Card variant="glass" className="p-4">
                        <Alert 
                          variant="glass-warning" 
                          actions={[
                            { label: "Verify Now", onClick: () => console.log('Verify email') }
                          ]}
                        >
                          <AlertDescription>Please verify your email address to complete registration.</AlertDescription>
                        </Alert>
                      </Card>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">On Default Card Background</h4>
                      <Card variant="default" className="p-4">
                        <Alert 
                          variant="glass-destructive" 
                          size="sm"
                          actions={[
                            { label: "Retry", onClick: () => console.log('Retry request') },
                            { label: "Contact Support", variant: "outline", onClick: () => console.log('Contact support') }
                          ]}
                        >
                          <AlertDescription>Unable to process your request. Please try again later.</AlertDescription>
                </Alert>
                      </Card>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Gamification Alerts in Context</h4>
                      <Card variant="elevated" className="p-4">
                        <div className="space-y-3">
                          <Alert variant="xp" size="sm">
                            <AlertDescription>+25 XP for completing your profile</AlertDescription>
                </Alert>
                          <Alert variant="achievement" size="sm">
                            <AlertDescription>New achievement: "Profile Complete"</AlertDescription>
                </Alert>
                          <Alert variant="level-up" size="sm">
                            <AlertDescription>Level up! You're now Level 3</AlertDescription>
                </Alert>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Toast Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Toast Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Toast Variants</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <button 
                        onClick={() => showToast('Operation completed successfully!', 'success')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Success Toast
                      </button>
                      <button 
                        onClick={() => showToast('Something went wrong. Please try again.', 'error')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Error Toast
                      </button>
                      <button 
                        onClick={() => showToast('Please check your input and try again.', 'warning')}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        Warning Toast
                      </button>
                      <button 
                        onClick={() => showToast('Here is some helpful information.', 'info')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Info Toast
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click the buttons above to see toast notifications in action. They will appear in the top-right corner.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Topic-Based Toast Variants</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <button 
                        onClick={() => showToast('Trade completed! Your items have been exchanged.', 'trades')}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Trades Toast
                      </button>
                      <button 
                        onClick={() => showToast('New collaboration request received!', 'collaboration')}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Collaboration Toast
                      </button>
                      <button 
                        onClick={() => showToast('Welcome to the community!', 'community')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Community Toast
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Gamification Toast Variants</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <button 
                        onClick={() => showToast('+50 XP for completing a trade!', 'xp')}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        XP Toast
                      </button>
                      <button 
                        onClick={() => showToast('Achievement unlocked: "First Trade"!', 'achievement')}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Achievement Toast
                      </button>
                      <button 
                        onClick={() => showToast('Level Up! You\'re now Level 5!', 'level-up')}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        Level Up Toast
                      </button>
                      <button 
                        onClick={() => showToast('🔥 7-day streak! Keep it up!', 'streak')}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Streak Toast
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">System Status Toast Variants</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <button 
                        onClick={() => showToast('Connection restored! You\'re back online.', 'connection')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Connection Toast
                      </button>
                      <button 
                        onClick={() => showToast('Scheduled maintenance in 30 minutes. Save your work!', 'maintenance')}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        Maintenance Toast
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Toast with Actions</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <button 
                        onClick={() => showToast('File uploaded successfully!', 'success', {
                          action: { label: 'View File', onClick: () => console.log('View file clicked') }
                        })}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Toast with Action
                      </button>
                      <button 
                        onClick={() => showToast('Connection lost. Retry?', 'error', {
                          action: { label: 'Retry', onClick: () => console.log('Retry clicked') },
                          persistent: true
                        })}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Persistent Toast
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Toast Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium">Visual Design</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Glassmorphic background with backdrop blur</li>
                        <li>• Semantic border colors for instant recognition</li>
                        <li>• Color-coded icons with readable text</li>
                        <li>• Rounded corners and subtle shadows</li>
                        <li>• 13 comprehensive variants covering all use cases</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Functionality</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Auto-dismiss after 5 seconds (7s for errors)</li>
                        <li>• Manual dismiss with close button</li>
                        <li>• Optional action buttons</li>
                        <li>• Persistent mode for important messages</li>
                        <li>• System status and gamification support</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Badge Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="default" className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Default
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Secondary
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Outline
                    </Badge>
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Destructive
                    </Badge>
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Success
                    </Badge>
                    <Badge variant="warning" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Warning
                    </Badge>
                    <Badge variant="info" className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Info
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Gamification Badge Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="xp" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      +50 XP
                    </Badge>
                    <Badge variant="level" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Level 5
                    </Badge>
                    <Badge variant="achievement" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Achievement
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    These variants are also shown in different sizes below
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Topic-Based Badges</h3>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="default" topic="trades" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Trades
                    </Badge>
                    <Badge variant="default" topic="collaboration" className="flex items-center gap-1">
                      <Handshake className="h-3 w-3" />
                      Collaboration
                    </Badge>
                    <Badge variant="default" topic="community" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Community
                    </Badge>
                    <Badge variant="default" topic="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Success
                    </Badge>
                    <Badge variant="status-glow" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Live Status
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Badge Sizes</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Small (sm)</h4>
                      <div className="flex flex-wrap gap-4">
                        <Badge variant="default" size="sm">Default</Badge>
                        <Badge variant="info" size="sm">Info</Badge>
                        <Badge variant="xp" size="sm">+25 XP</Badge>
                        <Badge variant="warning" size="sm">Warning</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Medium (md) - Default</h4>
                      <div className="flex flex-wrap gap-4">
                        <Badge variant="info" size="md">Info</Badge>
                        <Badge variant="warning" size="md">Warning</Badge>
                        <Badge variant="level" size="md">Level 5</Badge>
                        <Badge variant="destructive" size="md">Destructive</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Large (lg)</h4>
                      <div className="flex flex-wrap gap-4">
                        <Badge variant="destructive" size="lg">Destructive</Badge>
                        <Badge variant="achievement" size="lg">Achievement</Badge>
                        <Badge variant="xp" size="lg">+100 XP</Badge>
                        <Badge variant="outline" size="lg">Outline</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="status">Status</Badge>
                    <Badge variant="status-glow">Live</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Creative Skills Badges</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Design & Visual Arts</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Palette className="h-3 w-3" />
                          UI/UX Design
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Palette className="h-3 w-3" />
                          Graphic Design
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Palette className="h-3 w-3" />
                          Illustration
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Palette className="h-3 w-3" />
                          Brand Design
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +5 more
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Development & Tech</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          React
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          JavaScript
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          Python
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          Node.js
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +8 more
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Audio & Sound</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          Music Production
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          Audio Engineering
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          Sound Design
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          Mixing & Mastering
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +3 more
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Video & Film</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Video Editing
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Cinematography
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Motion Graphics
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Filmmaking
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +4 more
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Writing & Content</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <PenTool className="h-3 w-3" />
                          Copywriting
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <PenTool className="h-3 w-3" />
                          Content Writing
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <PenTool className="h-3 w-3" />
                          Script Writing
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <PenTool className="h-3 w-3" />
                          Technical Writing
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +2 more
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Photography & Visual Media</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Photography
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Portrait Photography
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Product Photography
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Photojournalism
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +3 more
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">3D & Animation</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          3D Modeling
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          Animation
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          Character Design
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          Environment Design
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +2 more
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Business & Marketing</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Marketing
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Social Media
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          SEO
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Project Management
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +4 more
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Education & Mentoring</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          Teaching
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          Mentoring
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          Consulting
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          Data Analysis
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          +1 more
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Collaboration Context</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Status Badges</h4>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="default" className="text-orange-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Open
                        </Badge>
                        <Badge variant="success" className="text-green-600 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Recruiting
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          In Progress
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Cancelled
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Collaboration status uses existing badge variants for consistency</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Skills & Difficulty</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Skills (using semantic system with auto-icons):</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="default" topic="community" className="flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              React
                            </Badge>
                            <Badge variant="default" topic="community" className="flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              TypeScript
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              +3 more
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Difficulty (using semantic topic):</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="default" topic="difficulty" className="text-green-400 bg-green-500/20">Beginner</Badge>
                            <Badge variant="default" topic="difficulty" className="text-blue-400 bg-blue-500/20">Intermediate</Badge>
                            <Badge variant="default" topic="difficulty" className="text-purple-400 bg-purple-500/20">Advanced</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Real-World Usage</h4>
                      <div className="glassmorphic p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium">Mobile App Design</span>
                          </div>
                          <Badge variant="default">Open</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="default" topic="community" className="flex items-center gap-1">
                            <Palette className="h-3 w-3" />
                            UI/UX
                          </Badge>
                          <Badge variant="default" topic="community" className="flex items-center gap-1">
                            <Palette className="h-3 w-3" />
                            Figma
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Plus className="h-3 w-3" />
                            +2 more
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <Badge variant="default" topic="difficulty" className="text-blue-400 bg-blue-500/20">Intermediate</Badge>
                          <span className="text-xs text-muted-foreground">Posted 2 days ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Badge Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium">Visual Design</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Glassmorphic transparent backgrounds</li>
                        <li>• Semantic color coding for instant recognition</li>
                        <li>• Rounded pill design with subtle borders</li>
                        <li>• Hover effects for interactivity</li>
                        <li>• 3 size variants for different contexts</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Variants</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• 7 basic variants (default, secondary, etc.)</li>
                        <li>• 3 gamification variants (xp, level, achievement)</li>
                        <li>• 5 semantic topics (trades, collaboration, difficulty, etc.)</li>
                        <li>• 8 creative skill categories (50+ skills)</li>
                        <li>• 2 status indicators (status, status-glow)</li>
                        <li>• Icon + text pattern for instant recognition</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Topic Links */}
            <Card>
              <CardHeader>
                <CardTitle>Topic Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Premium Topic Link Variants</h3>
                  <div className="space-y-6">
                    
                    {/* Premium Variant */}
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Premium (Most Important)</h4>
                      <div className="flex flex-wrap gap-4">
                        <TopicLink to="/trades" topic="trades" variant="premium" icon={<Zap className="h-4 w-4" />}>
                          Browse Trades
                        </TopicLink>
                        <TopicLink to="/collaborations" topic="collaboration" variant="premium" icon={<Handshake className="h-4 w-4" />}>
                          Find Collaborations
                        </TopicLink>
                        <TopicLink to="/users" topic="community" variant="premium" icon={<Globe className="h-4 w-4" />}>
                          Browse Community
                        </TopicLink>
                        <TopicLink to="/challenges" topic="success" variant="premium" icon={<Trophy className="h-4 w-4" />}>
                          View Challenges
                        </TopicLink>
                      </div>
                    </div>

                    {/* Interactive Variant */}
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Interactive (Important)</h4>
                      <div className="flex flex-wrap gap-4">
                        <TopicLink to="/trades" topic="trades" variant="interactive" icon={<Zap className="h-4 w-4" />}>
                          Browse Trades
                        </TopicLink>
                        <TopicLink to="/collaborations" topic="collaboration" variant="interactive" icon={<Handshake className="h-4 w-4" />}>
                          Find Collaborations
                        </TopicLink>
                        <TopicLink to="/users" topic="community" variant="interactive" icon={<Globe className="h-4 w-4" />}>
                          Browse Community
                        </TopicLink>
                        <TopicLink to="/challenges" topic="success" variant="interactive" icon={<Trophy className="h-4 w-4" />}>
                          View Challenges
                        </TopicLink>
                      </div>
                    </div>

                    {/* Glassmorphic Variant */}
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Glassmorphic (Less Important)</h4>
                      <div className="flex flex-wrap gap-4">
                        <TopicLink to="/trades" topic="trades" variant="glassmorphic" icon={<Zap className="h-4 w-4" />}>
                          Browse Trades
                        </TopicLink>
                        <TopicLink to="/collaborations" topic="collaboration" variant="glassmorphic" icon={<Handshake className="h-4 w-4" />}>
                          Find Collaborations
                        </TopicLink>
                        <TopicLink to="/users" topic="community" variant="glassmorphic" icon={<Globe className="h-4 w-4" />}>
                          Browse Community
                        </TopicLink>
                        <TopicLink to="/challenges" topic="success" variant="glassmorphic" icon={<Trophy className="h-4 w-4" />}>
                          View Challenges
                        </TopicLink>
                      </div>
                    </div>

                    {/* Subtle Variant */}
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Subtle Background</h4>
                      <div className="flex flex-wrap gap-4">
                        <TopicLink to="/trades" topic="trades" variant="subtle" icon={<Zap className="h-4 w-4" />}>
                          Browse Trades
                        </TopicLink>
                        <TopicLink to="/collaborations" topic="collaboration" variant="subtle" icon={<Handshake className="h-4 w-4" />}>
                          Find Collaborations
                        </TopicLink>
                        <TopicLink to="/users" topic="community" variant="subtle" icon={<Globe className="h-4 w-4" />}>
                          Browse Community
                        </TopicLink>
                        <TopicLink to="/challenges" topic="success" variant="subtle" icon={<Trophy className="h-4 w-4" />}>
                          View Challenges
                        </TopicLink>
                      </div>
                    </div>

                    {/* Text Variant */}
                    <div>
                      <h4 className="text-md font-medium text-muted-foreground mb-3">Text Only</h4>
                      <div className="flex flex-wrap gap-4">
                        <TopicLink to="/trades" topic="trades" variant="text" icon={<Zap className="h-4 w-4" />}>
                          Browse Trades
                        </TopicLink>
                        <TopicLink to="/collaborations" topic="collaboration" variant="text" icon={<Handshake className="h-4 w-4" />}>
                          Find Collaborations
                        </TopicLink>
                        <TopicLink to="/users" topic="community" variant="text" icon={<Globe className="h-4 w-4" />}>
                          Browse Community
                        </TopicLink>
                        <TopicLink to="/challenges" topic="success" variant="text" icon={<Trophy className="h-4 w-4" />}>
                          View Challenges
                        </TopicLink>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Size Variants */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Size Variants</h3>
                <div className="space-y-4">
                  <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Small (sm)</h4>
                      <div className="flex flex-wrap gap-4">
                        <TopicLink to="/trades" topic="trades" variant="interactive" size="sm" icon={<Zap className="h-3 w-3" />}>
                          Browse Trades
                        </TopicLink>
                        <TopicLink to="/collaborations" topic="collaboration" variant="interactive" size="sm" icon={<Handshake className="h-3 w-3" />}>
                          Find Collaborations
                        </TopicLink>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Medium (md) - Default</h4>
                      <div className="flex flex-wrap gap-4">
                        <TopicLink to="/trades" topic="trades" variant="interactive" size="md" icon={<Zap className="h-4 w-4" />}>
                          Browse Trades
                        </TopicLink>
                        <TopicLink to="/collaborations" topic="collaboration" variant="interactive" size="md" icon={<Handshake className="h-4 w-4" />}>
                          Find Collaborations
                        </TopicLink>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Large (lg)</h4>
                      <div className="flex flex-wrap gap-4">
                        <TopicLink to="/trades" topic="trades" variant="interactive" size="lg" icon={<Zap className="h-5 w-5" />}>
                          Browse Trades
                        </TopicLink>
                        <TopicLink to="/collaborations" topic="collaboration" variant="interactive" size="lg" icon={<Handshake className="h-5 w-5" />}>
                          Find Collaborations
                        </TopicLink>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Width Example */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Full Width Navigation</h3>
                    <div className="space-y-2">
                    <TopicLink to="/trades" topic="trades" variant="interactive" fullWidth leftIcon={<Zap className="h-4 w-4" />} rightIcon={<span>→</span>}>
                      Browse All Trades
                      </TopicLink>
                    <TopicLink to="/collaborations" topic="collaboration" variant="interactive" fullWidth leftIcon={<Handshake className="h-4 w-4" />} rightIcon={<span>→</span>}>
                      Find Collaborations
                      </TopicLink>
                    <TopicLink to="/users" topic="community" variant="interactive" fullWidth leftIcon={<Globe className="h-4 w-4" />} rightIcon={<span>→</span>}>
                      Browse Community
                      </TopicLink>
                    <TopicLink to="/challenges" topic="success" variant="interactive" fullWidth leftIcon={<Trophy className="h-4 w-4" />} rightIcon={<span>→</span>}>
                      View Challenges
                      </TopicLink>
                  </div>
                </div>

                {/* Context Examples */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Context Examples</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">On Premium Card Background</h4>
                      <Card variant="premium" depth="lg" glow="subtle" glowColor="orange" className="p-4">
                        <div className="space-y-2">
                          <TopicLink to="/trades" topic="trades" variant="premium" fullWidth leftIcon={<Zap className="h-4 w-4" />}>
                            Start Trading
                          </TopicLink>
                          <TopicLink to="/collaborations" topic="collaboration" variant="interactive" fullWidth leftIcon={<Handshake className="h-4 w-4" />}>
                            Find Collaborations
                          </TopicLink>
                        </div>
                      </Card>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Navigation Menu Style</h4>
                      <Card variant="glass" className="p-4">
                        <div className="space-y-1">
                          <TopicLink to="/trades" topic="trades" variant="subtle" fullWidth leftIcon={<Zap className="h-4 w-4" />}>
                            Trades
                          </TopicLink>
                          <TopicLink to="/collaborations" topic="collaboration" variant="subtle" fullWidth leftIcon={<Handshake className="h-4 w-4" />}>
                            Collaborations
                          </TopicLink>
                          <TopicLink to="/users" topic="community" variant="subtle" fullWidth leftIcon={<Globe className="h-4 w-4" />}>
                            Community
                          </TopicLink>
                          <TopicLink to="/challenges" topic="success" variant="subtle" fullWidth leftIcon={<Trophy className="h-4 w-4" />}>
                            Challenges
                          </TopicLink>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Topic Link Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium">Visual Design</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Glassmorphic backgrounds with backdrop blur</li>
                        <li>• Semantic color coding for instant recognition</li>
                        <li>• Smooth hover animations and scale effects</li>
                        <li>• Premium shadows and depth effects</li>
                        <li>• 5 variants for different importance levels</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Variants & Features</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Premium: Most important links with strong effects</li>
                        <li>• Interactive: Important links with moderate effects</li>
                        <li>• Glassmorphic: Standard links with subtle effects</li>
                        <li>• Subtle: Background with minimal effects</li>
                        <li>• Text: Clean text-only with hover effects</li>
                        <li>• Icon support (left, right, or both)</li>
                        <li>• Full width option for navigation menus</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-8">
            {/* BentoGrid System */}
            <Card>
              <CardHeader>
                <CardTitle>BentoGrid Layout System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Premium Asymmetric Layout</h3>
                    <p className="text-muted-foreground mb-6">
                      The BentoGrid system used throughout the HomePage for creating modern, asymmetric layouts with premium glassmorphic styling.
                    </p>
                    <BentoGrid
                      layoutPattern="asymmetric"
                      visualRhythm="alternating"
                      contentAwareLayout={true}
                      className="mb-6"
                      gap="lg"
                    >
                      <BentoItem
                        asymmetricSize="small"
                        contentType="feature"
                        layoutRole="simple"
                      >
                        <Card variant="premium" depth="lg" glow="subtle" glowColor="orange" className="h-32 flex flex-col p-4 hover:scale-105 transform transition-all duration-300 cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <h4 className="text-sm font-semibold">Quick Trade</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">Simple trading interface</p>
                        </Card>
                      </BentoItem>

                      <BentoItem
                        asymmetricSize="large"
                        contentType="mixed"
                        layoutRole="complex"
                      >
                        <Card variant="premium" depth="lg" glow="subtle" glowColor="purple" tilt={true} interactive={true} className="h-32 flex flex-col p-4 cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <Handshake className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <h4 className="text-sm font-semibold">Active Collaboration</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">Complex collaboration dashboard with multiple features and real-time updates</p>
                          <div className="mt-auto flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          </div>
                        </Card>
                      </BentoItem>
                    </BentoGrid>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Semantic Topic Grid</h3>
                    <p className="text-muted-foreground mb-6">
                      BentoGrid with semantic topic theming for different content types.
                    </p>
                    <BentoGrid
                      layoutPattern="asymmetric"
                      visualRhythm="progressive"
                      contentAwareLayout={true}
                      className="mb-6"
                      gap="md"
                    >
                      <BentoItem
                        asymmetricSize="small"
                        contentType="stats"
                        layoutRole="featured"
                      >
                        <Card variant="glass" className="h-24 flex flex-col justify-center p-4 ring-primary-500/20 hover:ring-2 transition-all duration-300 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">25</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Trades Completed</p>
                        </Card>
                      </BentoItem>

                      <BentoItem
                        asymmetricSize="small"
                        contentType="stats"
                        layoutRole="featured"
                      >
                        <Card variant="glass" className="h-24 flex flex-col justify-center p-4 ring-purple-500/20 hover:ring-2 transition-all duration-300 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">12</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Active Collaborations</p>
                        </Card>
                      </BentoItem>

                      <BentoItem
                        asymmetricSize="large"
                        contentType="media"
                        layoutRole="complex"
                      >
                        <Card variant="glass" className="h-24 flex flex-col p-4 hover:scale-105 transform transition-all duration-300 cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                            <h4 className="text-sm font-semibold">Community Activity</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">Latest posts and discussions in your community</p>
                        </Card>
                      </BentoItem>
                    </BentoGrid>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Interactive Grid Features</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 glassmorphic rounded-xl border-glass shadow-md">
                          <h4 className="text-sm font-semibold mb-2">Hover Effects</h4>
                          <p className="text-xs text-muted-foreground">Scale and shadow animations on hover</p>
                        </div>
                        <div className="p-4 glassmorphic rounded-xl border-glass shadow-md">
                          <h4 className="text-sm font-semibold mb-2">Semantic Theming</h4>
                          <p className="text-xs text-muted-foreground">Topic-based colors and icons</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 glassmorphic rounded-xl border-glass shadow-md">
                          <h4 className="text-sm font-semibold mb-2">Premium Depth</h4>
                          <p className="text-xs text-muted-foreground">Multiple shadow levels and depth effects</p>
                        </div>
                        <div className="p-4 glassmorphic rounded-xl border-glass shadow-md">
                          <h4 className="text-sm font-semibold mb-2">Responsive Design</h4>
                          <p className="text-xs text-muted-foreground">Adapts to different screen sizes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Layout Primitives */}
            <Card>
              <CardHeader>
                <CardTitle>Layout Primitives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Box Component Variants</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Basic Box</h4>
                      <Box className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm">Box with padding and background</p>
                      </Box>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Glassmorphic Box</h4>
                        <Box className="p-6 glassmorphic rounded-xl border-glass shadow-lg">
                          <p className="text-sm">Box with premium glassmorphic styling</p>
                      </Box>
                    </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Interactive Box</h4>
                        <Box className="p-4 glassmorphic rounded-xl border-glass shadow-md hover:shadow-lg hover:scale-102 transform transition-all duration-300 cursor-pointer">
                          <p className="text-sm">Interactive box with hover effects</p>
                        </Box>
                  </div>

                  <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Semantic Topic Boxes</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Box className="p-4 glassmorphic rounded-xl border-glass shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ring-primary-500/20 hover:ring-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">Trades</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Trading content box</p>
                          </Box>
                          <Box className="p-4 glassmorphic rounded-xl border-glass shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ring-purple-500/20 hover:ring-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Handshake className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Collaboration</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Collaboration content box</p>
                          </Box>
                          <Box className="p-4 glassmorphic rounded-xl border-glass shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ring-secondary-500/20 hover:ring-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Globe className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                              <span className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Community</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Community content box</p>
                          </Box>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Stack Component Variants</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Basic Stack</h4>
                        <Stack gap="md" className="p-4 glassmorphic rounded-xl border-glass shadow-md">
                          <div className="p-3 glassmorphic rounded-lg border-glass shadow-sm">Item 1</div>
                          <div className="p-3 glassmorphic rounded-lg border-glass shadow-sm">Item 2</div>
                          <div className="p-3 glassmorphic rounded-lg border-glass shadow-sm">Item 3</div>
                    </Stack>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Interactive Stack</h4>
                        <Stack gap="sm" className="p-4 glassmorphic rounded-xl border-glass shadow-lg">
                          <div className="p-3 glassmorphic rounded-lg border-glass shadow-sm hover:shadow-md hover:scale-102 transform transition-all duration-200 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                              <span className="text-sm font-semibold">Trade Request</span>
                            </div>
                            <p className="text-xs text-muted-foreground">View details</p>
                          </div>
                          <div className="p-3 glassmorphic rounded-lg border-glass shadow-sm hover:shadow-md hover:scale-102 transform transition-all duration-200 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Handshake className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-semibold">Collaboration Invite</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Accept or decline</p>
                          </div>
                          <div className="p-3 glassmorphic rounded-lg border-glass shadow-sm hover:shadow-md hover:scale-102 transform transition-all duration-200 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                              <span className="text-sm font-semibold">Community Post</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Read more</p>
                          </div>
                        </Stack>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Grid Layout Examples</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Premium Grid</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1, 2, 3, 4, 5, 6].map((item) => (
                            <Box 
                              key={item}
                              className="p-4 glassmorphic rounded-xl border-glass shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{item}</span>
                                </div>
                                <span className="text-sm font-semibold">Grid Item {item}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Premium grid layout with glassmorphic styling</p>
                            </Box>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GradientMeshBackground */}
            <Card>
              <CardHeader>
                <CardTitle>GradientMeshBackground</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Used in the HomePage hero section for dynamic gradient backgrounds.
                  </p>
                  <div className="relative rounded-lg overflow-hidden h-32">
                    <GradientMeshBackground variant="primary" intensity="medium" className="p-6">
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-white mb-2">Hero Section</h4>
                        <p className="text-sm text-white/80">GradientMeshBackground example</p>
                      </div>
                    </GradientMeshBackground>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-8">
            {/* Card Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Card Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Design Hierarchy</h3>
                    <div className="space-y-4">
                              <div>
                                <h4 className="text-md font-medium text-muted-foreground mb-3">Premium Cards (Most Important)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card variant="premium" depth="lg" glow="subtle" glowColor="orange" className="h-32 p-4">
                                    <h4 className="font-semibold mb-2">Premium Card</h4>
                                    <p className="text-sm text-muted-foreground">Most important content with premium styling and depth effect</p>
                                  </Card>
                                  <Card variant="premium" tilt={true} depth="lg" glow="subtle" glowColor="purple" interactive={true} className="h-32 p-4 cursor-pointer">
                                    <h4 className="font-semibold mb-2">Collaboration Premium</h4>
                                    <p className="text-sm text-muted-foreground">Collaboration content with 3D effects and depth (purple glow)</p>
                                  </Card>
                                </div>
                              </div>
                      
                              <div>
                                <h4 className="text-md font-medium text-muted-foreground mb-3">Glassmorphic Cards (Less Important)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card variant="glass" className="h-32 p-4">
                                    <h4 className="font-semibold mb-2">Glass Card</h4>
                                    <p className="text-sm text-muted-foreground">Less important content with glassmorphic styling</p>
                                  </Card>
                                  <Card variant="elevated" className="h-32 p-4">
                                    <h4 className="font-semibold mb-2">Elevated Card</h4>
                                    <p className="text-sm text-muted-foreground">Elevated card with glassmorphic styling and extra shadow</p>
                                  </Card>
                                </div>
                              </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Trade Premium Card</h3>
                    <div className="flex justify-center">
                      <Card 
                        variant="premium" 
                        tilt={true}
                        depth="lg"
                        glow="subtle"
                        glowColor="orange"
                        interactive={true}
                        className="h-32 p-4 cursor-pointer w-full max-w-md"
                      >
                        <h4 className="font-semibold mb-2">Trade Premium</h4>
                        <p className="text-sm text-muted-foreground">Trade content with tilt, depth, glow, and interactive effects (orange glow)</p>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navigation Tab */}
          <TabsContent value="navigation" className="space-y-12">
            {/* NavItem Component */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation Items</CardTitle>
                <p className="text-sm text-muted-foreground">NavItem component for consistent navigation styling</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Desktop Navigation Items</h4>
                    <div className="flex flex-wrap gap-4 p-4 glassmorphic rounded-xl border-glass">
                      <NavItem to="/" label="Home" variant="desktop" />
                      <NavItem to="/trades" label="Trades" variant="desktop" />
                      <NavItem to="/collaborations" label="Collaborations" variant="desktop" />
                      <NavItem to="/directory" label="Directory" variant="desktop" />
                      <NavItem to="/challenges" label="Challenges" variant="desktop" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Mobile Navigation Items</h4>
                    <div className="space-y-2 p-4 glassmorphic rounded-xl border-glass max-w-sm">
                      <NavItem to="/" label="Home" variant="mobile" icon={<Home className="h-5 w-5" />} />
                      <NavItem to="/trades" label="Trades" variant="mobile" icon={<ShoppingBag className="h-5 w-5" />} />
                      <NavItem to="/collaborations" label="Collaborations" variant="mobile" icon={<Users className="h-5 w-5" />} />
                      <NavItem to="/challenges" label="Challenges" variant="mobile" icon={<Award className="h-5 w-5" />} />
                      <NavItem to="/portfolio" label="Portfolio" variant="mobile" icon={<Briefcase className="h-5 w-5" />} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Active State Examples</h4>
                    <div className="space-y-2 p-4 glassmorphic rounded-xl border-glass max-w-sm">
                      <NavItem to="/" label="Home" variant="mobile" icon={<Home className="h-5 w-5" />} isActive={true} />
                      <NavItem to="/trades" label="Trades" variant="mobile" icon={<ShoppingBag className="h-5 w-5" />} />
                      <NavItem to="/collaborations" label="Collaborations" variant="mobile" icon={<Users className="h-5 w-5" />} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Menu Component */}
            <Card>
              <CardHeader>
                <CardTitle>Mobile Menu</CardTitle>
                <p className="text-sm text-muted-foreground">Mobile navigation menu with glassmorphic styling</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Mobile Menu Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            <Menu className="h-4 w-4" />
                            Navigation Items
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Home, Trades, Collaborations</li>
                            <li>• Directory, Challenges, Portfolio</li>
                            <li>• Leaderboard, Messages, Notifications</li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            User Menu
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Profile, Dashboard, Settings</li>
                            <li>• Connections, Messages</li>
                            <li>• Admin Panel (if admin)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Mobile Menu Styling</h4>
                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium mb-2">Visual Design</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Glassmorphic backdrop blur</li>
                            <li>• Slide-in animation</li>
                            <li>• Icon + text navigation items</li>
                            <li>• Active state highlighting</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Functionality</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Touch-optimized targets</li>
                            <li>• Keyboard navigation</li>
                            <li>• ESC key to close</li>
                            <li>• Backdrop click to close</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Responsive</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Full-screen on mobile</li>
                            <li>• Side panel on tablet</li>
                            <li>• Adaptive spacing</li>
                            <li>• Reduced motion support</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Command Palette Component */}
            <Card>
              <CardHeader>
                <CardTitle>Command Palette</CardTitle>
                <p className="text-sm text-muted-foreground">Keyboard-driven command interface for power users</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Command Categories</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            <Command className="h-4 w-4" />
                            Navigation Commands
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• "Go to Home" → Navigate to homepage</li>
                            <li>• "Go to Trades" → Browse trades</li>
                            <li>• "Go to Collaborations" → Find teams</li>
                            <li>• "Go to Directory" → Browse people</li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search Commands
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• "Search Trades" → Find specific trades</li>
                            <li>• "Search Users" → Find people</li>
                            <li>• "Search Collaborations" → Find projects</li>
                            <li>• "Search Challenges" → Find tasks</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Command Palette Features</h4>
                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <h5 className="font-medium mb-2">Interaction</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Cmd/Ctrl + K to open</li>
                            <li>• Type to filter commands</li>
                            <li>• Arrow keys to navigate</li>
                            <li>• Enter to execute</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Visual Design</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Glassmorphic modal overlay</li>
                            <li>• Fuzzy search highlighting</li>
                            <li>• Category grouping</li>
                            <li>• Keyboard shortcut display</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Menu Component */}
            <Card>
              <CardHeader>
                <CardTitle>User Menu</CardTitle>
                <p className="text-sm text-muted-foreground">User dropdown menu with profile options and actions</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">User Menu Sections</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Profile Section
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• User avatar and name</li>
                            <li>• Profile link</li>
                            <li>• Dashboard access</li>
                            <li>• Settings page</li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Quick Actions
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Messages and notifications</li>
                            <li>• Admin panel (if admin)</li>
                            <li>• Theme toggle</li>
                            <li>• Sign out option</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">User Menu Styling</h4>
                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium mb-2">Visual Design</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Glassmorphic dropdown</li>
                            <li>• User avatar display</li>
                            <li>• Icon + text menu items</li>
                            <li>• Hover state animations</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Interaction</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Click avatar to open</li>
                            <li>• Click outside to close</li>
                            <li>• Keyboard navigation</li>
                            <li>• ESC key to close</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Responsive</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Dropdown on desktop</li>
                            <li>• Full menu on mobile</li>
                            <li>• Touch-optimized targets</li>
                            <li>• Accessible focus states</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation Guidelines</CardTitle>
                <p className="text-sm text-muted-foreground">Best practices for consistent navigation patterns</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Design Principles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 glassmorphic rounded-xl border-glass">
                        <h5 className="font-semibold mb-2">Visual Hierarchy</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Primary navigation always visible</li>
                          <li>• Secondary actions in user menu</li>
                          <li>• Power user features in command palette</li>
                          <li>• Mobile-first responsive design</li>
                        </ul>
                      </div>
                      <div className="p-4 glassmorphic rounded-xl border-glass">
                        <h5 className="font-semibold mb-2">Accessibility</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Keyboard navigation support</li>
                          <li>• Screen reader compatibility</li>
                          <li>• Focus state indicators</li>
                          <li>• ARIA labels and roles</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Implementation Notes</h4>
                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <h5 className="font-medium mb-2">Mobile Menu</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Full-screen overlay on mobile</li>
                            <li>• Slide-in animation from left</li>
                            <li>• Backdrop blur and overlay</li>
                            <li>• Touch-optimized spacing</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Command Palette</h5>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Modal overlay with blur</li>
                            <li>• Fuzzy search with highlighting</li>
                            <li>• Category-based grouping</li>
                            <li>• Keyboard shortcut display</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dialogs Tab */}
          <TabsContent value="dialogs" className="space-y-8">
            {/* Modal Component */}
            <Card>
              <CardHeader>
                <CardTitle>Modal Components</CardTitle>
                <p className="text-sm text-muted-foreground">Modal dialogs with glassmorphic styling and focus management</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Standard Modal</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => setModalOpen(true)}
                          variant="primary"
                        >
                          Open Standard Modal
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Features:</p>
                          <ul className="space-y-1">
                            <li>• Focus trap and ESC key support</li>
                            <li>• Backdrop click to close</li>
                            <li>• Multiple sizes (sm, md, lg, xl, xxl, full)</li>
                            <li>• Customizable header and footer</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Simple Modal</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => setSimpleModalOpen(true)}
                          variant="secondary"
                        >
                          Open Simple Modal
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Features:</p>
                          <ul className="space-y-1">
                            <li>• Lightweight implementation</li>
                            <li>• Minimal styling overhead</li>
                            <li>• Perfect for simple confirmations</li>
                            <li>• Fast rendering</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Confirm Dialog</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => setConfirmDialogOpen(true)}
                          variant="destructive"
                        >
                          Open Confirm Dialog
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Features:</p>
                          <ul className="space-y-1">
                            <li>• Pre-built confirmation UI</li>
                            <li>• Destructive action styling</li>
                            <li>• Customizable text and actions</li>
                            <li>• Built on Modal component</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sheet Component */}
            <Card>
              <CardHeader>
                <CardTitle>Sheet Component</CardTitle>
                <p className="text-sm text-muted-foreground">Slide-out panels with Radix UI foundation</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Sheet Demo</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                          <SheetTrigger asChild>
                            <Button variant="outline">
                              Open Sheet
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Sheet Title</SheetTitle>
                              <SheetDescription>
                                This is a sheet component with glassmorphic styling.
                              </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Sheet content goes here. This component is built on Radix UI
                                for excellent accessibility and keyboard navigation.
                              </p>
                              <Button 
                                onClick={() => setSheetOpen(false)}
                                variant="secondary"
                                className="w-full"
                              >
                                Close Sheet
                              </Button>
                            </div>
                          </SheetContent>
                        </Sheet>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Features:</p>
                          <ul className="space-y-1">
                            <li>• Radix UI foundation</li>
                            <li>• Multiple positions (left, right, top, bottom)</li>
                            <li>• Focus management</li>
                            <li>• Mobile-optimized</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Guidelines</CardTitle>
                <p className="text-sm text-muted-foreground">Best practices for dialog accessibility</p>
              </CardHeader>
              <CardContent>
                <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">Focus Management</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Focus trap within modal content</li>
                        <li>• Return focus to trigger on close</li>
                        <li>• Initial focus on first interactive element</li>
                        <li>• ESC key to close modal</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-secondary">ARIA Attributes</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• role="dialog" or role="alertdialog"</li>
                        <li>• aria-modal="true"</li>
                        <li>• aria-labelledby for title</li>
                        <li>• aria-describedby for description</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modal Instances */}
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Standard Modal"
              size="md"
              footer={
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => setModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This is a standard modal with glassmorphic styling, focus management,
                  and customizable header and footer content.
                </p>
                <div className="p-4 glassmorphic rounded-lg border-glass">
                  <h5 className="font-medium mb-2">Modal Features</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Focus trap and keyboard navigation</li>
                    <li>• Backdrop click to close</li>
                    <li>• ESC key to close</li>
                    <li>• Multiple size variants</li>
                  </ul>
                </div>
              </div>
            </Modal>

            <SimpleModal
              isOpen={simpleModalOpen}
              onClose={() => setSimpleModalOpen(false)}
              title="Simple Modal"
            >
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This is a lightweight modal implementation with minimal styling overhead,
                  perfect for simple confirmations and alerts.
                </p>
                <Button 
                  onClick={() => setSimpleModalOpen(false)}
                  variant="primary"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </SimpleModal>

            <ConfirmDialog
              open={confirmDialogOpen}
              onConfirm={() => {
                setConfirmDialogOpen(false);
                showToast("Action Confirmed - The confirmation dialog action was executed.", "success");
              }}
              onCancel={() => setConfirmDialogOpen(false)}
              title="Confirm Action"
              description="Are you sure you want to perform this action? This cannot be undone."
              confirmText="Yes, Continue"
              cancelText="Cancel"
            />
          </TabsContent>

          {/* Loading Tab */}
          <TabsContent value="loading" className="space-y-8">
            {/* Enhanced Loading States */}
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Loading States</CardTitle>
                <p className="text-sm text-muted-foreground">Context-aware loading indicators with smart messaging</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Loading Variants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 glassmorphic rounded-xl border-glass">
                        <h5 className="font-medium mb-3">Basic Spinner</h5>
                        <LoadingSpinner 
                          size="md" 
                          message="Loading content..." 
                          variant="glass"
                        />
                      </div>
                      <div className="p-4 glassmorphic rounded-xl border-glass">
                        <h5 className="font-medium mb-3">Minimal Spinner</h5>
                        <LoadingSpinner 
                          size="sm" 
                          variant="minimal"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 glassmorphic rounded-xl border-glass">
                        <h5 className="font-medium mb-3">Contextual Loading</h5>
                        <ContextualLoading
                          type="spinner"
                          context="search"
                          variant="glass"
                          message="Processing your trade..."
                        />
                      </div>
                      <div className="p-4 glassmorphic rounded-xl border-glass">
                        <h5 className="font-medium mb-3">Card Loading</h5>
                        <LoadingSpinner 
                          size="lg" 
                          message="Fetching data..." 
                          variant="card"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Simple Spinner</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" color="primary" />
                        <span className="text-sm">Small</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Spinner size="md" color="primary" />
                        <span className="text-sm">Medium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Spinner size="lg" color="primary" />
                        <span className="text-sm">Large</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* State Transitions */}
            <Card>
              <CardHeader>
                <CardTitle>State Transitions</CardTitle>
                <p className="text-sm text-muted-foreground">Smooth transitions between UI states</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">State Demo</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          onClick={() => setLoadingState('loading')}
                          variant={loadingState === 'loading' ? 'primary' : 'outline'}
                          size="sm"
                        >
                          Loading
                        </Button>
                        <Button 
                          onClick={() => setLoadingState('error')}
                          variant={loadingState === 'error' ? 'destructive' : 'outline'}
                          size="sm"
                        >
                          Error
                        </Button>
                        <Button 
                          onClick={() => setLoadingState('empty')}
                          variant={loadingState === 'empty' ? 'secondary' : 'outline'}
                          size="sm"
                        >
                          Empty
                        </Button>
                        <Button 
                          onClick={() => setLoadingState('success')}
                          variant={loadingState === 'success' ? 'primary' : 'outline'}
                          size="sm"
                        >
                          Success
                        </Button>
                      </div>
                      <div className="min-h-[120px] flex items-center justify-center">
                        <StateTransition
                          state={loadingState}
                          loadingComponent={<LoadingSpinner size="lg" message="Loading data..." variant="glass" />}
                          errorComponent={
                            <div className="text-center">
                              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Something went wrong</p>
                              <Button size="sm" variant="outline" className="mt-2">
                                Try Again
                              </Button>
                            </div>
                          }
                          emptyComponent={
                            <div className="text-center">
                              <Info className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No data available</p>
                            </div>
                          }
                          successComponent={
                            <div className="text-center">
                              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Data loaded successfully!</p>
                            </div>
                          }
                        >
                          <div>Default content</div>
                        </StateTransition>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Guidelines</CardTitle>
                <p className="text-sm text-muted-foreground">Best practices for loading state accessibility</p>
              </CardHeader>
              <CardContent>
                <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">Screen Readers</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• role="status" for loading indicators</li>
                        <li>• aria-busy="true" for busy states</li>
                        <li>• Descriptive aria-label text</li>
                        <li>• sr-only labels for context</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-secondary">Motion Preferences</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Respect prefers-reduced-motion</li>
                        <li>• Static alternatives for animations</li>
                        <li>• Essential info not motion-dependent</li>
                        <li>• Graceful degradation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-8">
            {/* Progress Components */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Components</CardTitle>
                <p className="text-sm text-muted-foreground">Linear, circular, and step progress indicators</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Linear Progress</h4>
                  <div className="space-y-6">
                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <h5 className="font-medium mb-4">Basic Progress</h5>
                      <div className="space-y-4">
                        <Progress value={33} className="w-full" showLabel label="Upload Progress" />
                        <Progress value={66} className="w-full" showLabel label="Processing" />
                        <Progress value={100} className="w-full" showLabel label="Complete" />
                      </div>
                    </div>
                    
                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <h5 className="font-medium mb-4">Progress Variants</h5>
                      <div className="space-y-4">
                        <Progress value={75} variant="default" showLabel label="Default Progress" />
                        <Progress value={90} variant="success" showLabel label="Success State" />
                        <Progress value={45} variant="warning" showLabel label="Warning State" />
                        <Progress value={25} variant="error" showLabel label="Error State" />
                        <Progress value={60} variant="gradient" showLabel label="Gradient Style" />
                      </div>
                    </div>

                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <h5 className="font-medium mb-4">Progress Sizes</h5>
                      <div className="space-y-4">
                        <Progress value={50} size="sm" showLabel label="Small Progress" />
                        <Progress value={50} size="md" showLabel label="Medium Progress" />
                        <Progress value={50} size="lg" showLabel label="Large Progress" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Circular Progress</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <CircularProgress value={25} size={80} />
                        <p className="text-sm text-muted-foreground mt-2">25%</p>
                      </div>
                      <div className="text-center">
                        <CircularProgress value={50} size={80} />
                        <p className="text-sm text-muted-foreground mt-2">50%</p>
                      </div>
                      <div className="text-center">
                        <CircularProgress value={75} size={80} />
                        <p className="text-sm text-muted-foreground mt-2">75%</p>
                      </div>
                      <div className="text-center">
                        <CircularProgress value={100} size={80} />
                        <p className="text-sm text-muted-foreground mt-2">100%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Step Progress</h4>
                  <div className="space-y-6">
                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <h5 className="font-medium mb-4">Horizontal Steps</h5>
                      <StepProgress
                        steps={[
                          { label: "Start", description: "Begin process", completed: true },
                          { label: "Process", description: "In progress", current: true },
                          { label: "Review", description: "Pending review", completed: false },
                          { label: "Complete", description: "Final step", completed: false }
                        ]}
                        orientation="horizontal"
                      />
                    </div>
                    
                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <h5 className="font-medium mb-4">Vertical Steps</h5>
                      <StepProgress
                        steps={[
                          { label: "Setup", description: "Initial configuration", completed: true },
                          { label: "Configuration", description: "Configure settings", current: true },
                          { label: "Validation", description: "Validate inputs", completed: false },
                          { label: "Deployment", description: "Deploy changes", completed: false }
                        ]}
                        orientation="vertical"
                      />
                    </div>

                    <div className="p-4 glassmorphic rounded-xl border-glass">
                      <h5 className="font-medium mb-4">Step States</h5>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Complete Flow with Error</p>
                          <StepProgress
                            steps={[
                              { label: "Upload", description: "File uploaded", completed: true },
                              { label: "Process", description: "Processing data", completed: true },
                              { label: "Validate", description: "Validation failed", error: true },
                              { label: "Complete", description: "Ready to finish", completed: false }
                            ]}
                            orientation="horizontal"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">All Completed</p>
                          <StepProgress
                            steps={[
                              { label: "Design", description: "UI Design complete", completed: true },
                              { label: "Develop", description: "Development done", completed: true },
                              { label: "Test", description: "Testing passed", completed: true },
                              { label: "Deploy", description: "Successfully deployed", completed: true }
                            ]}
                            orientation="horizontal"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Semantic Topic Examples */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Semantic Topic Styling</h4>
                      <div className="space-y-6">
                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-medium mb-4">Topic-Based Progress</h5>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Trades Topic</p>
                              <Progress value={75} topic="trades" showLabel label="Trade Progress" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Collaboration Topic</p>
                              <Progress value={60} topic="collaboration" showLabel label="Collaboration Progress" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Community Topic</p>
                              <Progress value={90} topic="community" showLabel label="Community Engagement" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Success Topic</p>
                              <Progress value={100} topic="success" showLabel label="Achievement Complete" />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-medium mb-4">Topic-Based Step Progress</h5>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Trade Workflow</p>
                              <StepProgress
                                steps={[
                                  { label: "Upload", description: "Upload trade files", completed: true },
                                  { label: "Review", description: "Review trade details", completed: true },
                                  { label: "Confirm", description: "Confirm trade terms", current: true },
                                  { label: "Complete", description: "Trade completed", completed: false }
                                ]}
                                topic="trades"
                                orientation="horizontal"
                              />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Collaboration Flow</p>
                              <StepProgress
                                steps={[
                                  { label: "Invite", description: "Send collaboration invite", completed: true },
                                  { label: "Accept", description: "Partner accepts invite", completed: true },
                                  { label: "Plan", description: "Plan collaboration", current: true },
                                  { label: "Execute", description: "Execute collaboration", completed: false },
                                  { label: "Review", description: "Review results", completed: false }
                                ]}
                                topic="collaboration"
                                orientation="horizontal"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 glassmorphic rounded-xl border-glass">
                          <h5 className="font-medium mb-4">Developer Utilities</h5>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Using Presets</p>
                              <div className="bg-gray-900/50 p-3 rounded-lg text-sm font-mono">
                                <div className="text-green-400">// Easy preset usage</div>
                                <div className="text-blue-400">const</div> tradeProgress = <div className="text-yellow-400">getProgressPreset</div>(<div className="text-orange-400">'tradeUpload'</div>);
                                <br />
                                <div className="text-blue-400">&lt;</div><div className="text-purple-400">StepProgress</div> <div className="text-cyan-400">...</div>tradeProgress <div className="text-blue-400">/&gt;</div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Using Patterns</p>
                              <div className="bg-gray-900/50 p-3 rounded-lg text-sm font-mono">
                                <div className="text-green-400">// Common patterns</div>
                                <div className="text-blue-400">const</div> uploadProgress = <div className="text-yellow-400">progressPatterns</div>.<div className="text-orange-400">fileUpload</div>(<div className="text-cyan-400">75</div>, <div className="text-orange-400">'document.pdf'</div>);
                                <br />
                                <div className="text-blue-400">&lt;</div><div className="text-purple-400">Progress</div> <div className="text-cyan-400">...</div>uploadProgress <div className="text-blue-400">/&gt;</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Guidelines</CardTitle>
                <p className="text-sm text-muted-foreground">Best practices for progress indicator accessibility</p>
              </CardHeader>
              <CardContent>
                <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">ARIA Attributes</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• aria-valuenow for current value</li>
                        <li>• aria-valuemin and aria-valuemax</li>
                        <li>• aria-label for descriptive text</li>
                        <li>• role="progressbar" for progress bars</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-secondary">Visual Design</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• High contrast colors</li>
                        <li>• Clear visual hierarchy</li>
                        <li>• Consistent spacing</li>
                        <li>• Semantic color usage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Background Effects Tab */}
          <TabsContent value="effects" className="space-y-8">
            {/* Background Effects */}
            <Card>
              <CardHeader>
                <CardTitle>Background Effects</CardTitle>
                <p className="text-sm text-muted-foreground">WebGL-powered visual effects with motion preferences</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Three.js Header Overlay</h4>
                  <div className="relative p-4 glassmorphic rounded-xl border-glass min-h-[200px] overflow-hidden">
                    <div className="absolute inset-0">
                      <ThreeHeaderOverlay
                        preset="ribbons"
                        opacity={0.1}
                        blendMode="screen"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <h5 className="font-medium">WebGL Background Effects</h5>
                      <p className="text-sm text-muted-foreground">
                        This overlay uses WebGL shaders to create subtle animated backgrounds.
                        The effect automatically respects user motion preferences and provides
                        fallbacks for unsupported browsers.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 glassmorphic rounded border-glass">
                          <strong>Presets:</strong> ribbons, aurora, metaballs, audio
                        </div>
                        <div className="p-2 glassmorphic rounded border-glass">
                          <strong>Blend Modes:</strong> screen, soft-light, overlay
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Features</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Motion Preferences
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Honors prefers-reduced-motion</li>
                          <li>• Lazy loading with Suspense</li>
                          <li>• Automatic fallback to CSS</li>
                          <li>• Performance monitoring</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          WebGL Features
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Custom fragment shaders</li>
                          <li>• Real-time color theming</li>
                          <li>• Configurable intensity</li>
                          <li>• Blend mode support</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Guidelines</CardTitle>
                <p className="text-sm text-muted-foreground">Best practices for background effects accessibility</p>
              </CardHeader>
              <CardContent>
                <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">Motion Sensitivity</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Respect prefers-reduced-motion</li>
                        <li>• Provide static alternatives</li>
                        <li>• Low opacity for readability</li>
                        <li>• pointer-events: none</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-secondary">Performance</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Lazy loading with React.lazy</li>
                        <li>• Graceful WebGL fallbacks</li>
                        <li>• Frame rate monitoring</li>
                        <li>• Memory leak prevention</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-8">
            {/* Chart Placeholders */}
            <Card>
              <CardHeader>
                <CardTitle>Chart Components (Placeholder)</CardTitle>
                <p className="text-sm text-muted-foreground">Themed SVG chart examples with future wrapper API</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Sparkline Chart</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Trading Performance</h5>
                        <Badge variant="success">+12.5%</Badge>
                      </div>
                      <svg width="300" height="60" className="w-full h-16">
                        <polyline
                          fill="none"
                          stroke="url(#sparkline-gradient)"
                          strokeWidth="2"
                          points="0,40 20,35 40,45 60,30 80,25 100,35 120,20 140,30 160,25 180,35 200,40 220,35 240,45 260,30 280,25 300,35"
                        />
                        <defs>
                          <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#0ea5e9" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Bar Chart</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="space-y-4">
                      <h5 className="font-medium">Monthly Trades</h5>
                      <div className="flex items-end justify-between h-32 gap-2">
                        {[65, 80, 45, 90, 70, 85, 95].map((height, index) => (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div 
                              className="w-full rounded-t-sm bg-gradient-to-t from-orange-500 to-blue-500"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-xs text-muted-foreground mt-1">
                              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Future Chart Wrapper API</h4>
                  <div className="p-4 glassmorphic rounded-xl border-glass">
                    <div className="space-y-4">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// Future Chart component API
interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData[];
  theme?: 'light' | 'dark' | 'auto';
  colors?: string[];
  height?: number;
  responsive?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

// Usage example
<Chart
  type="line"
  data={tradingData}
  theme="auto"
  colors={['#f97316', '#0ea5e9']}
  height={300}
  responsive
  showTooltip
/>`}
                        </pre>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-2">Implementation Notes:</p>
                        <ul className="space-y-1">
                          <li>• Defer heavy charting library selection</li>
                          <li>• Create wrapper for consistent theming</li>
                          <li>• Support semantic color integration</li>
                          <li>• Ensure accessibility compliance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Guidelines</CardTitle>
                <p className="text-sm text-muted-foreground">Best practices for chart accessibility</p>
              </CardHeader>
              <CardContent>
                <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-primary">Data Representation</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Alternative text descriptions</li>
                        <li>• Data table fallbacks</li>
                        <li>• High contrast colors</li>
                        <li>• Pattern/texture alternatives</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-secondary">Interaction</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Keyboard navigation support</li>
                        <li>• Screen reader announcements</li>
                        <li>• Focus indicators</li>
                        <li>• Touch-friendly targets</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing" className="space-y-12">
            {/* Padding Scale */}
            <Card>
              <CardHeader>
                <CardTitle>Padding Scale</CardTitle>
                <p className="text-sm text-muted-foreground">Internal spacing within components for consistent layouts</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { class: 'p-1', value: '0.25rem / 4px', description: 'Extra Small' },
                      { class: 'p-2', value: '0.5rem / 8px', description: 'Small' },
                      { class: 'p-3', value: '0.75rem / 12px', description: 'Medium Small' },
                      { class: 'p-4', value: '1rem / 16px', description: 'Medium (Base)' },
                      { class: 'p-6', value: '1.5rem / 24px', description: 'Large' },
                      { class: 'p-8', value: '2rem / 32px', description: 'Extra Large' },
                      { class: 'p-12', value: '3rem / 48px', description: '2X Large' },
                      { class: 'p-16', value: '4rem / 64px', description: '3X Large' },
                      { class: 'p-20', value: '5rem / 80px', description: '4X Large' }
                    ].map((item, index) => (
                      <div key={item.class} className="group">
                        <div className="glassmorphic rounded-xl border-glass shadow-md hover:shadow-lg transition-all duration-300 p-4">
                          <div className={`glassmorphic rounded-lg border-glass shadow-sm ${item.class} transition-all duration-300 group-hover:scale-105 transform`}>
                            <div className="flex items-center justify-center min-h-[40px]">
                              <div className="w-3 h-3 bg-primary-500/30 rounded-full"></div>
                      </div>
                    </div>
                          <div className="mt-3">
                            <div className="font-semibold text-sm">{item.class}</div>
                            <div className="text-xs text-muted-foreground">{item.value}</div>
                            <div className="text-xs text-primary-600 dark:text-primary-400">{item.description}</div>
                      </div>
                    </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Margin Scale */}
            <Card>
              <CardHeader>
                <CardTitle>Margin Scale</CardTitle>
                <p className="text-sm text-muted-foreground">External spacing between components for layout structure</p>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { class: 'm-1', value: '0.25rem / 4px', description: 'Extra Small' },
                      { class: 'm-2', value: '0.5rem / 8px', description: 'Small' },
                      { class: 'm-4', value: '1rem / 16px', description: 'Medium (Base)' },
                      { class: 'm-6', value: '1.5rem / 24px', description: 'Large' },
                      { class: 'm-8', value: '2rem / 32px', description: 'Extra Large' },
                      { class: 'm-12', value: '3rem / 48px', description: '2X Large' }
                    ].map((item, index) => (
                      <div key={item.class} className="group">
                        <div className="glassmorphic rounded-xl border-glass shadow-md hover:shadow-lg transition-all duration-300 p-4">
                          <div className="bg-secondary-500/20 rounded-lg p-4">
                            <div className={`bg-primary-500/20 rounded-lg shadow-sm ${item.class} transition-all duration-300 group-hover:scale-105 transform`}>
                              <div className="flex items-center justify-center min-h-[32px] p-2">
                                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="font-semibold text-sm">{item.class}</div>
                            <div className="text-xs text-muted-foreground">{item.value}</div>
                            <div className="text-xs text-secondary-600 dark:text-secondary-400">{item.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Semantic Spacing Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Semantic Spacing in Context</CardTitle>
                <p className="text-sm text-muted-foreground">Real-world examples showing spacing within components</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Card Component Spacing</h4>
                    <div className="glassmorphic rounded-xl border-glass shadow-lg p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          <h4 className="font-semibold">Trade Card</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">Card with p-6 padding for premium spacing</p>
                        <div className="flex gap-2">
                          <Button variant="premium" size="sm">View Trade</Button>
                          <Button variant="outline" size="sm">Save</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Stack Component Spacing</h4>
                    <div className="glassmorphic rounded-xl border-glass shadow-lg p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 glassmorphic rounded-lg border-glass">
                          <Handshake className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium">Collaboration Item</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 glassmorphic rounded-lg border-glass">
                          <Globe className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                          <span className="text-sm font-medium">Community Item</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 glassmorphic rounded-lg border-glass">
                          <Trophy className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm font-medium">Achievement Item</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spacing Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Spacing Guidelines</CardTitle>
                <p className="text-sm text-muted-foreground">Best practices for consistent spacing across the application</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glassmorphic rounded-xl border-glass shadow-md p-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      Component Internal Spacing
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Use p-4 for standard component padding</li>
                      <li>• Use p-6 for premium/important components</li>
                      <li>• Use p-2 for compact components</li>
                      <li>• Use p-8 for hero sections</li>
                    </ul>
                  </div>
                  <div className="glassmorphic rounded-xl border-glass shadow-md p-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Layout Spacing
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Use m-4 for component margins</li>
                      <li>• Use m-6 for section spacing</li>
                      <li>• Use m-8 for page-level spacing</li>
                      <li>• Use gap-4 for grid layouts</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-12">
            {/* Hover States */}
            <Card>
              <CardHeader>
                <CardTitle>Hover States</CardTitle>
                <p className="text-sm text-muted-foreground">Interactive effects that respond to user hover interactions</p>
              </CardHeader>
              <CardContent>
                <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Scale & Glow</h4>
                      <Button 
                        variant="premium" 
                        className="transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/25"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Premium Hover
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Color Transition</h4>
                      <Button 
                        variant="interactive" 
                        className="transition-all duration-300 hover:bg-primary/20 hover:border-primary/50"
                      >
                        <Handshake className="h-4 w-4 mr-2" />
                        Interactive Hover
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Depth & Tilt</h4>
                      <Button 
                        variant="glassmorphic" 
                        className="transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-1"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Glassmorphic Hover
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Focus States */}
            <Card>
              <CardHeader>
                <CardTitle>Focus States</CardTitle>
                <p className="text-sm text-muted-foreground">Accessible focus indicators with premium glassmorphic styling</p>
              </CardHeader>
              <CardContent>
                <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Subtle Glow Focus</h4>
                      <GlassmorphicInput 
                        placeholder="Focus me for subtle glow..." 
                        className="focus:shadow-lg focus:shadow-primary/20 focus:border-primary/30 focus:bg-white/10 transition-all duration-300 focus:outline-none !outline-none focus-visible:outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Premium Focus</h4>
                      <Button 
                        variant="premium"
                        className="focus:shadow-xl focus:shadow-primary/30 focus:scale-[1.02] focus:bg-gradient-to-r focus:from-primary/90 focus:to-primary transition-all duration-300 focus:outline-none !outline-none focus-visible:outline-none"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Focus Button
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading States */}
            <Card>
              <CardHeader>
                <CardTitle>Loading States</CardTitle>
                <p className="text-sm text-muted-foreground">Visual feedback for disabled and loading interactions</p>
              </CardHeader>
              <CardContent>
                  <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Disabled State</h4>
                        <Button 
                          disabled 
                          variant="premium"
                          className="opacity-50 cursor-not-allowed glassmorphic"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Disabled
                    </Button>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Loading Spinner</h4>
                        <Button 
                          variant="interactive"
                          className="relative overflow-hidden"
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Loading...
                      </div>
                    </Button>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Pulse Animation</h4>
                        <Button 
                          variant="glassmorphic"
                          className="animate-pulse"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Processing
                        </Button>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Semantic Topic Interactions */}
            <Card>
              <CardHeader>
                <CardTitle>Semantic Topic Interactions</CardTitle>
                <p className="text-sm text-muted-foreground">Topic-based interactive elements with semantic theming</p>
              </CardHeader>
              <CardContent>
                  <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Trades Topic</h4>
                        <TopicLink 
                          to="/trades" 
                          topic="trades" 
                          variant="interactive"
                          className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Trade Actions
                        </TopicLink>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Collaboration Topic</h4>
                        <TopicLink 
                          to="/collaborations" 
                          topic="collaboration" 
                          variant="premium"
                          className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-secondary/20"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Collaborate
                        </TopicLink>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Community Topic</h4>
                        <TopicLink 
                          to="/community" 
                          topic="community" 
                          variant="glassmorphic"
                          className="transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/20"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Community
                        </TopicLink>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Advanced Interactions */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Interactions</CardTitle>
                <p className="text-sm text-muted-foreground">Complex interaction patterns with cards and badges</p>
              </CardHeader>
              <CardContent>
                  <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Card Hover Effects</h4>
                        <Card 
                          variant="glass" 
                          className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 group"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Crown className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h5 className="font-semibold">Premium Card</h5>
                                <p className="text-sm text-muted-foreground">Hover for 3D effect</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Interactive Badge</h4>
                        <div className="flex flex-wrap gap-3">
                          <Badge 
                            variant="xp" 
                            className="cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/25"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            +50 XP
                          </Badge>
                          <Badge 
                            variant="achievement" 
                            className="cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/25"
                          >
                            <Trophy className="h-3 w-3 mr-1" />
                            Achievement
                          </Badge>
                          <Badge 
                            variant="level" 
                            className="cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/25"
                          >
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Level Up
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Interaction Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Interaction Guidelines</CardTitle>
                <p className="text-sm text-muted-foreground">Best practices for consistent and accessible interactions</p>
              </CardHeader>
              <CardContent>
                  <div className="glassmorphic rounded-xl border-glass shadow-md p-6 bg-white/5 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-primary">Hover Guidelines</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Scale: 1.05x maximum for subtle feedback</li>
                          <li>• Duration: 300ms for smooth transitions</li>
                          <li>• Shadow: Use semantic color shadows</li>
                          <li>• Always maintain accessibility contrast</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-secondary">Focus Guidelines</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Glow: Subtle shadow with 20-30% opacity</li>
                          <li>• Scale: Minimal 1.02x for premium feel</li>
                          <li>• Border: 30% opacity color enhancement</li>
                          <li>• Background: Slight transparency increase</li>
                        </ul>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Keyboard Navigation</h3>
                  <p className="text-muted-foreground">
                    All interactive elements can be navigated using Tab/Shift+Tab keys.
                    Focus indicators are clearly visible with ring styles.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Screen Reader Support</h3>
                  <p className="text-muted-foreground">
                    All components include proper ARIA labels and semantic HTML elements
                    for screen reader compatibility.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Color Contrast</h3>
                  <p className="text-muted-foreground">
                    All text meets WCAG AA contrast requirements (4.5:1 for normal text).
                    High contrast mode support is available.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Reduced Motion</h3>
                  <p className="text-muted-foreground">
                    Animations respect user preferences for reduced motion.
                    Essential information is never conveyed through motion alone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StyleGuide; 