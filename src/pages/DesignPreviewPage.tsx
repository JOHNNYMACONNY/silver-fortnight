import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import AnimatedHeading from '../components/ui/AnimatedHeading';
import GradientMeshBackground from '../components/ui/GradientMeshBackground';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import Card3D from '../components/ui/Card3D';
import { Input } from '../components/ui/Input';
import AnimatedList from '../components/ui/AnimatedList';
import PageTransition from '../components/ui/PageTransition';
import StateTransition, { UIState } from '../components/ui/StateTransition';
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

const DesignPreviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('enhanced-inputs');
  const [demoState, setDemoState] = useState<UIState>('idle');
  const [demoTimeout, setDemoTimeout] = useState<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (demoTimeout) {
        clearTimeout(demoTimeout);
      }
    };
  }, [demoTimeout]);

  // Function to simulate state transitions
  const simulateStateTransition = () => {
    // Clear any existing timeout
    if (demoTimeout) {
      clearTimeout(demoTimeout);
    }

    // Start with loading state
    setDemoState('loading');

    // Set a timeout to transition to success or error state
    const timeout = setTimeout(() => {
      // Randomly choose between success and error (80% success rate)
      const nextState = Math.random() > 0.2 ? 'success' : 'error';
      setDemoState(nextState);
    }, 2000);

    setDemoTimeout(timeout);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <AnimatedHeading as="h1" className="text-4xl font-bold text-foreground mb-8" animation="kinetic">
          Design Preview
        </AnimatedHeading>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['enhanced-inputs', 'animated-list', 'page-transitions', 'state-transitions', 'glassmorphism', 'animated-headings', 'gradient-backgrounds', 'bento-grid', 'card-3d'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-primary/10'
              }`}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* Enhanced Inputs */}
        {activeTab === 'enhanced-inputs' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              Enhanced Input Components
            </AnimatedHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Standard vs Enhanced
                </AnimatedHeading>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-2">Standard Input</h4>
                    <Input
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-2">Enhanced Input</h4>
                    <Input
                      placeholder="Enter your username"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Validation States
                </AnimatedHeading>

                <div className="space-y-4">
                  <Input
                    placeholder="Enter your email"
                  />

                  <Input
                    type="password"
                    placeholder="Enter your password"
                  />

                  <Input
                    placeholder="Enter your username"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Floating Label Animation
                </AnimatedHeading>

                <div className="space-y-4">
                  <Input
                    placeholder="Enter your first name"
                  />

                  <Input
                    placeholder="Enter your last name"
                  />

                  <Input
                    placeholder="Search for anything..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Form Example
                </AnimatedHeading>

                <Card variant="glass">
                  <CardBody>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter your full name"
                      />

                      <Input
                        placeholder="Enter your email"
                      />

                      <Input
                        type="password"
                        placeholder="Enter your password"
                      />

                      <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                        Submit
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Animated List */}
        {activeTab === 'animated-list' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              Animated List Components
            </AnimatedHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Basic Animated List
                </AnimatedHeading>

                <Card>
                  <CardBody>
                    <AnimatedList
                      className="space-y-4"
                      animation="fade"
                      staggerDelay={0.1}
                    >
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="p-4 bg-background rounded-lg shadow-sm">
                          <h4 className="text-lg font-medium text-foreground">List Item {item}</h4>
                          <p className="text-sm text-muted-foreground">
                            This item fades in with a staggered delay.
                          </p>
                        </div>
                      ))}
                    </AnimatedList>
                  </CardBody>
                </Card>
              </div>

              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Animation Variants
                </AnimatedHeading>

                <Card>
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-medium text-foreground mb-2">Slide Animation</h4>
                        <AnimatedList
                          className="space-y-2"
                          animation="slideUp"
                          staggerDelay={0.05}
                        >
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="p-3 bg-background rounded-lg">
                              Item {item} - Slides up
                            </div>
                          ))}
                        </AnimatedList>
                      </div>

                      <div>
                        <h4 className="text-lg font-medium text-foreground mb-2">Scale Animation</h4>
                        <AnimatedList
                          className="space-y-2"
                          animation="scale"
                          staggerDelay={0.05}
                        >
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="p-3 bg-background rounded-lg">
                              Item {item} - Scales in
                            </div>
                          ))}
                        </AnimatedList>
                      </div>

                      <div>
                        <h4 className="text-lg font-medium text-foreground mb-2">Pop Animation</h4>
                        <AnimatedList
                          className="space-y-2"
                          animation="popIn"
                          staggerDelay={0.05}
                        >
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="p-3 bg-background rounded-lg">
                              Item {item} - Pops in
                            </div>
                          ))}
                        </AnimatedList>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Using items and renderItem
                </AnimatedHeading>

                <Card>
                  <CardBody>
                    {(() => {
                      const mockItems = [
                        { id: 1, title: 'Web Development', icon: <BriefcaseIcon className="h-5 w-5" /> },
                        { id: 2, title: 'UI/UX Design', icon: <StarIcon className="h-5 w-5" /> },
                        { id: 3, title: 'Content Writing', icon: <ChatBubbleLeftIcon className="h-5 w-5" /> },
                        { id: 4, title: 'Digital Marketing', icon: <HeartIcon className="h-5 w-5" /> },
                      ];

                      return (
                        <AnimatedList
                          className="space-y-4"
                          animation="slideUp"
                          staggerDelay={0.1}
                        >
                          {mockItems.map((item) => (
                            <div key={item.id} className="flex items-center p-4 bg-background rounded-lg shadow-sm">
                              <div className="mr-3 text-primary">
                                {item.icon}
                              </div>
                              <div>
                                <h4 className="text-lg font-medium text-foreground">
                                  {item.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Using map pattern for dynamic content
                                </p>
                              </div>
                            </div>
                          ))}
                        </AnimatedList>
                      );
                    })()}
                  </CardBody>
                </Card>
              </div>

              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Card Integration
                </AnimatedHeading>

                <Card>
                  <CardBody>
                    {(() => {
                      const mockTrades = [
                        { id: 1, title: 'Logo Design', skills: ['Illustrator', 'Branding'] },
                        { id: 2, title: 'Website Development', skills: ['React', 'Node.js'] },
                        { id: 3, title: 'Content Writing', skills: ['Copywriting', 'SEO'] },
                      ];

                      return (
                        <AnimatedList
                          className="space-y-4"
                          animation="scale"
                          staggerDelay={0.1}
                        >
                          {mockTrades.map((trade) => (
                            <Card key={trade.id} variant="glass" hover>
                              <CardBody>
                                <h4 className="text-lg font-medium text-foreground mb-1">
                                  {trade.title}
                                </h4>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {trade.skills.map((skill) => (
                                    <span key={skill} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </AnimatedList>
                      );
                    })()}
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Page Transitions */}
        {activeTab === 'page-transitions' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              Page Transition Components
            </AnimatedHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Transition Types
                </AnimatedHeading>

                <Card>
                  <CardBody>
                    <div className="space-y-6">
                      {/* Fade Transition */}
                      <div>
                        <h4 className="text-lg font-medium text-foreground mb-2">Fade Transition</h4>
                        <div className="border border-neutral-200 rounded-lg overflow-hidden">
                          <PageTransition animation="fade" className="p-4">
                            <div className="p-4 bg-background rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                This content uses a fade transition. The transition is triggered when the key prop changes.
                              </p>
                            </div>
                          </PageTransition>
                        </div>
                      </div>

                      {/* Slide Transition */}
                      <div>
                        <h4 className="text-lg font-medium text-foreground mb-2">Slide Transition</h4>
                        <div className="border border-neutral-200 rounded-lg overflow-hidden">
                          <PageTransition animation="slide" className="p-4">
                            <div className="p-4 bg-background rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                This content uses a slide transition. The content slides in from the left and out to the right.
                              </p>
                            </div>
                          </PageTransition>
                        </div>
                      </div>

                      {/* Scale Transition */}
                      <div>
                        <h4 className="text-lg font-medium text-foreground mb-2">Scale Transition</h4>
                        <div className="border border-neutral-200 rounded-lg overflow-hidden">
                          <PageTransition animation="scale" className="p-4">
                            <div className="p-4 bg-background rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                This content uses a scale transition. The content scales up when entering and scales down when exiting.
                              </p>
                            </div>
                          </PageTransition>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Interactive Demo
                </AnimatedHeading>

                <Card>
                  <CardBody>
                    <div className="space-y-4">
                      {/* Transition Controls */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => setActiveTab('page-transitions')}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                        >
                          Refresh Transition
                        </button>
                      </div>

                      {/* Transition Container */}
                      <div className="border border-neutral-200 rounded-lg overflow-hidden h-64">
                        <PageTransition
                          animation="fade"
                          className="h-full p-6 bg-gradient-to-br from-primary to-secondary"
                          location={activeTab} // Use activeTab as the key to trigger transitions
                        >
                          <div className="h-full flex flex-col items-center justify-center text-center">
                            <h3 className="text-2xl font-bold text-foreground mb-2">Page Transition Demo</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              This demonstrates how page transitions would work in a real application.
                              Click the button above to see the transition again.
                            </p>
                            <div className="flex gap-2">
                              <span className="px-3 py-1 bg-primary/10 text-primary">
                                Smooth
                              </span>
                              <span className="px-3 py-1 bg-secondary/10 text-secondary">
                                Elegant
                              </span>
                              <span className="px-3 py-1 bg-accent/10 text-accent">
                                Professional
                              </span>
                            </div>
                          </div>
                        </PageTransition>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            <div className="mb-12">
              <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                Usage with React Router
              </AnimatedHeading>

              <Card>
                <CardBody>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The PageTransition component can be used with React Router to create smooth transitions between routes.
                      Here's an example of how to integrate it:
                    </p>

                    <div className="bg-background p-4 rounded-lg overflow-auto">
                      <pre className="text-sm">
{`// In your App.tsx or layout component
import { Routes, Route, useLocation } from 'react-router-dom';
import PageTransition from './components/ui/PageTransition';

function App() {
  const location = useLocation();

  return (
    <PageTransition location={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </PageTransition>
  );
}`}
                      </pre>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      This setup ensures that transitions occur when the route changes, creating a more polished user experience.
                      The PageTransition component respects users' reduced motion preferences for accessibility.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {/* State Transitions */}
        {activeTab === 'state-transitions' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              State Transition Components
            </AnimatedHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  UI State Transitions
                </AnimatedHeading>

                <Card>
                  <CardBody>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        The StateTransition component provides smooth transitions between different UI states like
                        loading, success, error, and empty states. It helps create a more polished user experience
                        when data is being fetched or processed.
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={simulateStateTransition}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                          disabled={demoState === 'loading'}
                        >
                          Simulate API Request
                        </button>
                        <button
                          onClick={() => setDemoState('empty')}
                          className="px-4 py-2 rounded-lg bg-background text-foreground"
                        >
                          Show Empty State
                        </button>
                        <button
                          onClick={() => setDemoState('idle')}
                          className="px-4 py-2 rounded-lg bg-background text-foreground"
                        >
                          Reset
                        </button>
                      </div>

                      <div className="border border-neutral-200 rounded-lg overflow-hidden min-h-[300px]">
                        <StateTransition state={demoState} className="h-full">
                          <div className="p-6 h-full flex flex-col items-center justify-center">
                            <div className="text-success">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-medium text-success">Success!</h3>
                            <p className="text-sm text-muted-foreground mt-1 text-center">
                              Data loaded successfully. This is the success state of the StateTransition component.
                            </p>
                          </div>
                        </StateTransition>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="space-y-6">
                <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                  Custom State Components
                </AnimatedHeading>

                <Card>
                  <CardBody>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        You can customize the appearance of each state by providing custom components.
                        Here are examples of the default state components:
                      </p>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="border border-neutral-200 rounded-lg overflow-hidden">
                          <div className="p-4 bg-background">
                            <h4 className="text-lg font-medium text-foreground mb-2">Loading State</h4>
                            <div className="flex items-center justify-center p-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-primary"></div>
                            </div>
                          </div>
                        </div>

                        <div className="border border-neutral-200 rounded-lg overflow-hidden">
                          <div className="p-4 bg-background">
                            <h4 className="text-lg font-medium text-foreground mb-2">Error State</h4>
                            <div className="flex items-center p-4 text-error">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>An error occurred while loading data.</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-neutral-200 rounded-lg overflow-hidden">
                          <div className="p-4 bg-background">
                            <h4 className="text-lg font-medium text-foreground mb-2">Empty State</h4>
                            <div className="flex items-center p-4 text-muted">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                              <span>No data available.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            <div className="mb-12">
              <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                Usage Example
              </AnimatedHeading>

              <Card>
                <CardBody>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Here's an example of how to use the StateTransition component in a real application:
                    </p>

                    <div className="bg-background p-4 rounded-lg overflow-auto">
                      <pre className="text-sm">
{`// In a component that fetches data
import React, { useState, useEffect } from 'react';
import StateTransition from '../components/ui/StateTransition';

const DataFetchingComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/data');
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Determine the current UI state
  const uiState = loading ? 'loading' : error ? 'error' : data.length === 0 ? 'empty' : 'success';

  return (
    <StateTransition
      state={uiState}
      errorComponent={<ErrorMessage error={error} />}
    >
      <DataTable data={data} />
    </StateTransition>
  );
};`}
                      </pre>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      This pattern makes it easy to handle different UI states in a consistent way across your application.
                      The StateTransition component ensures smooth transitions between states and respects users' reduced motion preferences.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {/* Glassmorphism Cards */}
        {activeTab === 'glassmorphism' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              Glassmorphism Cards
            </AnimatedHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Standard Card */}
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold text-foreground">Standard Card</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-muted-foreground">
                    This is a standard card with the default elevated variant.
                  </p>
                </CardBody>
                <CardFooter>
                  <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">
                    Action
                  </button>
                </CardFooter>
              </Card>

              {/* Glassmorphism Card */}
              <Card variant="glass">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-foreground">Glassmorphism Card</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-muted-foreground">
                    This card uses the new glassmorphism effect with backdrop blur.
                  </p>
                </CardBody>
                <CardFooter>
                  <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">
                    Action
                  </button>
                </CardFooter>
              </Card>

              {/* Glassmorphism Card with Hover */}
              <Card variant="glass" hover>
                <CardHeader>
                  <h3 className="text-xl font-semibold text-foreground">Hover Effect</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-muted-foreground">
                    This glassmorphism card has a hover effect. Try hovering over it!
                  </p>
                </CardBody>
                <CardFooter>
                  <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">
                    Action
                  </button>
                </CardFooter>
              </Card>
            </div>

            {/* Glassmorphism with Background */}
            <div className="relative mb-12 p-12 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary"></div>
              <div className="absolute inset-0 backdrop-blur-[2px]"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {[1, 2, 3].map((i) => (
                  <Card key={i} variant="glass" hover>
                    <CardBody>
                      <h3 className="text-lg font-medium text-foreground mb-2">Glassmorphism on Background</h3>
                      <p className="text-sm text-muted-foreground">
                        Glassmorphism cards work great on colorful backgrounds, creating a frosted glass effect.
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Animated Headings */}
        {activeTab === 'animated-headings' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              Animated Headings
            </AnimatedHeading>

            <div className="space-y-12 mb-12">
              <div className="p-6 bg-background rounded-xl">
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-4" animation="fade">
                  Fade Animation
                </AnimatedHeading>
                <p className="text-sm text-muted-foreground">
                  This heading uses a simple fade animation when it enters the viewport.
                </p>
              </div>

              <div className="p-6 bg-background rounded-xl">
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-4" animation="slide">
                  Slide Animation
                </AnimatedHeading>
                <p className="text-sm text-muted-foreground">
                  This heading slides up and fades in when it enters the viewport.
                </p>
              </div>

              <div className="p-6 bg-background rounded-xl">
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-4" animation="kinetic">
                  Kinetic Animation
                </AnimatedHeading>
                <p className="text-sm text-muted-foreground">
                  This heading uses a spring animation for a more dynamic entrance.
                </p>
              </div>

              <div className="p-6 bg-background rounded-xl">
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-4" animation="wave">
                  Wave Animation
                </AnimatedHeading>
                <p className="text-sm text-muted-foreground">
                  This heading animates each character with a staggered delay, creating a wave effect.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gradient Backgrounds */}
        {activeTab === 'gradient-backgrounds' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              Gradient Mesh Backgrounds
            </AnimatedHeading>

            <div className="space-y-12 mb-12">
              {/* Primary Variant */}
              <GradientMeshBackground className="p-8 rounded-xl" variant="primary">
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-4">
                  Primary Gradient
                </AnimatedHeading>
                <p className="text-sm text-muted-foreground">
                  This section uses a primary color gradient mesh background.
                </p>
              </GradientMeshBackground>

              {/* Secondary Variant */}
              <GradientMeshBackground className="p-8 rounded-xl" variant="secondary">
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-4">
                  Secondary Gradient
                </AnimatedHeading>
                <p className="text-sm text-muted-foreground">
                  This section uses a secondary color gradient mesh background.
                </p>
              </GradientMeshBackground>

              {/* Accent Variant */}
              <GradientMeshBackground className="p-8 rounded-xl" variant="accent">
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-4">
                  Accent Gradient
                </AnimatedHeading>
                <p className="text-sm text-muted-foreground">
                  This section uses an accent color gradient mesh background.
                </p>
              </GradientMeshBackground>

              {/* Animated Variant */}
              <GradientMeshBackground className="p-8 rounded-xl" variant="primary" animated>
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-4">
                  Animated Gradient
                </AnimatedHeading>
                <p className="text-sm text-muted-foreground">
                  This section uses an animated gradient mesh background.
                </p>
              </GradientMeshBackground>

              {/* With Cards */}
              <GradientMeshBackground className="p-8 rounded-xl" variant="secondary" intensity="strong">
                <AnimatedHeading as="h3" className="text-2xl font-semibold text-foreground mb-6">
                  Gradient with Cards
                </AnimatedHeading>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card variant="glass" hover>
                    <CardBody>
                      <h4 className="text-lg font-medium text-foreground mb-2">Glassmorphism Card</h4>
                      <p className="text-sm text-muted-foreground">
                        Glassmorphism cards work great on gradient backgrounds.
                      </p>
                    </CardBody>
                  </Card>

                  <Card variant="glass" hover>
                    <CardBody>
                      <h4 className="text-lg font-medium text-foreground mb-2">Glassmorphism Card</h4>
                      <p className="text-sm text-muted-foreground">
                        The backdrop blur creates a frosted glass effect.
                      </p>
                    </CardBody>
                  </Card>
                </div>
              </GradientMeshBackground>
            </div>
          </div>
        )}

        {/* Bento Grid */}
        {activeTab === 'bento-grid' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              Bento Grid Layout
            </AnimatedHeading>

            <div className="mb-12">
              <BentoGrid columns={3} gap="md" className="mb-12">
                <BentoItem colSpan={2} rowSpan={2} className="bg-background p-6">
                  <h3 className="text-2xl font-semibold text-foreground mb-4">Featured Item</h3>
                  <p className="text-sm text-muted-foreground">
                    This is a featured item that spans 2 columns and 2 rows. The Bento Grid layout is perfect for creating modern, asymmetrical layouts.
                  </p>
                </BentoItem>

                <BentoItem className="bg-background p-6">
                  <h4 className="text-lg font-medium text-foreground mb-2">Regular Item</h4>
                  <p className="text-sm text-muted-foreground">
                    A standard grid item.
                  </p>
                </BentoItem>

                <BentoItem className="bg-background p-6">
                  <h4 className="text-lg font-medium text-foreground mb-2">Regular Item</h4>
                  <p className="text-sm text-muted-foreground">
                    A standard grid item.
                  </p>
                </BentoItem>

                <BentoItem colSpan={3} className="bg-background p-6">
                  <h4 className="text-lg font-medium text-foreground mb-2">Full Width Item</h4>
                  <p className="text-sm text-muted-foreground">
                    This item spans the full width of the grid (3 columns).
                  </p>
                </BentoItem>
              </BentoGrid>

              <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                Bento Grid with Cards
              </AnimatedHeading>

              <BentoGrid columns={4} gap="md">
                <BentoItem colSpan={2} rowSpan={2} className="overflow-hidden">
                  <Card variant="glass" hover className="h-full">
                    <CardBody>
                      <h3 className="text-2xl font-semibold text-foreground mb-2">Featured Card</h3>
                      <p className="text-sm text-muted-foreground">
                        Combining Bento Grid with our Glassmorphism Cards creates a modern, visually appealing layout.
                      </p>
                    </CardBody>
                  </Card>
                </BentoItem>

                <BentoItem className="overflow-hidden">
                  <Card variant="glass" hover className="h-full">
                    <CardBody>
                      <h4 className="text-lg font-medium text-foreground mb-2">Card 1</h4>
                      <p className="text-sm text-muted-foreground">
                        Regular card item.
                      </p>
                    </CardBody>
                  </Card>
                </BentoItem>

                <BentoItem className="overflow-hidden">
                  <Card variant="glass" hover className="h-full">
                    <CardBody>
                      <h4 className="text-lg font-medium text-foreground mb-2">Card 2</h4>
                      <p className="text-sm text-muted-foreground">
                        Regular card item.
                      </p>
                    </CardBody>
                  </Card>
                </BentoItem>

                <BentoItem colSpan={2} className="overflow-hidden">
                  <Card variant="glass" hover className="h-full">
                    <CardBody>
                      <h4 className="text-lg font-medium text-foreground mb-2">Wide Card</h4>
                      <p className="text-sm text-muted-foreground">
                        This card spans 2 columns.
                      </p>
                    </CardBody>
                  </Card>
                </BentoItem>

                <BentoItem colSpan={2} className="overflow-hidden">
                  <Card variant="glass" hover className="h-full">
                    <CardBody>
                      <h4 className="text-lg font-medium text-foreground mb-2">Wide Card</h4>
                      <p className="text-sm text-muted-foreground">
                        This card spans 2 columns.
                      </p>
                    </CardBody>
                  </Card>
                </BentoItem>
              </BentoGrid>
            </div>
          </div>
        )}

        {/* Card 3D */}
        {activeTab === 'card-3d' && (
          <div>
            <AnimatedHeading as="h2" className="text-3xl font-bold text-foreground mb-6">
              3D Cards
            </AnimatedHeading>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card3D className="bg-background p-6" intensity={15} shadow>
                <h3 className="text-xl font-semibold text-foreground mb-2">Basic 3D Card</h3>
                <p className="text-sm text-muted-foreground">
                  This card has a 3D effect when you hover over it. Try moving your mouse around!
                </p>
              </Card3D>

              <Card3D className="bg-background p-6" intensity={10} shadow border>
                <h3 className="text-xl font-semibold text-foreground mb-2">3D Card with Border</h3>
                <p className="text-sm text-muted-foreground">
                  This card has a border and a more subtle 3D effect.
                </p>
              </Card3D>

              <Card3D className="bg-background p-6" intensity={20} shadow glare>
                <h3 className="text-xl font-semibold text-foreground mb-2">3D Card with Glare</h3>
                <p className="text-sm text-muted-foreground">
                  This card has a glare effect that follows your mouse movement.
                </p>
              </Card3D>
            </div>

            <div className="mb-12">
              <AnimatedHeading as="h3" className="text-xl font-semibold text-foreground mb-4">
                3D Cards with Content
              </AnimatedHeading>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card3D intensity={15} shadow glare className="overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <h3 className="text-white text-2xl font-bold">Featured Image</h3>
                  </div>
                  <div className="p-6 bg-background">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Media Card</h3>
                    <p className="text-sm text-muted-foreground">
                      This 3D card contains media content and text. The 3D effect adds depth to the UI.
                    </p>
                  </div>
                </Card3D>

                <Card3D intensity={15} shadow glare className="overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                    <h3 className="text-white text-2xl font-bold">Featured Image</h3>
                  </div>
                  <div className="p-6 bg-background">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Media Card</h3>
                    <p className="text-sm text-muted-foreground">
                      This 3D card contains media content and text. The 3D effect adds depth to the UI.
                    </p>
                  </div>
                </Card3D>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignPreviewPage;
