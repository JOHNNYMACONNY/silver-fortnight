import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Alert, AlertDescription } from './Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { classPatterns, componentVariants } from '../../utils/designSystem';

/**
 * TradeYa Style Guide Component
 * 
 * This component provides a comprehensive visual reference for the design system,
 * showcasing colors, typography, components, and interaction patterns.
 */
export const StyleGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('colors');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="glassmorphic">Glassmorphic</TabsTrigger>
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
                    {[
                      { shade: 50, color: '#fff7ed' },
                      { shade: 100, color: '#ffedd5' },
                      { shade: 200, color: '#fed7aa' },
                      { shade: 300, color: '#fdba74' },
                      { shade: 400, color: '#fb923c' },
                      { shade: 500, color: '#f97316' },
                      { shade: 600, color: '#ea580c' },
                      { shade: 700, color: '#c2410c' },
                      { shade: 800, color: '#9a3412' },
                      { shade: 900, color: '#7c2d12' },
                      { shade: 950, color: '#431407' }
                    ].map(({ shade, color }) => (
                      <div key={shade} className="text-center">
                        <div 
                          className="w-16 h-16 rounded-lg mb-2 mx-auto shadow-glass border border-border"
                          style={{ backgroundColor: color }}
                          title={`Primary ${shade}: ${color}`}
                        />
                        <span className="text-sm text-muted-foreground">{shade}</span>
                        <div className="text-xs text-muted-foreground font-mono">{color}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secondary Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Secondary (Blue)</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {[
                      { shade: 50, color: '#f0f9ff' },
                      { shade: 100, color: '#e0f2fe' },
                      { shade: 200, color: '#bae6fd' },
                      { shade: 300, color: '#7dd3fc' },
                      { shade: 400, color: '#38bdf8' },
                      { shade: 500, color: '#0ea5e9' },
                      { shade: 600, color: '#0284c7' },
                      { shade: 700, color: '#0369a1' },
                      { shade: 800, color: '#075985' },
                      { shade: 900, color: '#0c4a6e' },
                      { shade: 950, color: '#082f49' }
                    ].map(({ shade, color }) => (
                      <div key={shade} className="text-center">
                        <div 
                          className="w-16 h-16 rounded-lg mb-2 mx-auto shadow-glass border border-border"
                          style={{ backgroundColor: color }}
                          title={`Secondary ${shade}: ${color}`}
                        />
                        <span className="text-sm text-muted-foreground">{shade}</span>
                        <div className="text-xs text-muted-foreground font-mono">{color}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accent Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Accent (Purple)</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {[
                      { shade: 50, color: '#f5f3ff' },
                      { shade: 100, color: '#ede9fe' },
                      { shade: 200, color: '#ddd6fe' },
                      { shade: 300, color: '#c4b5fd' },
                      { shade: 400, color: '#a78bfa' },
                      { shade: 500, color: '#8b5cf6' },
                      { shade: 600, color: '#7c3aed' },
                      { shade: 700, color: '#6d28d9' },
                      { shade: 800, color: '#5b21b6' },
                      { shade: 900, color: '#4c1d95' },
                      { shade: 950, color: '#2e1065' }
                    ].map(({ shade, color }) => (
                      <div key={shade} className="text-center">
                        <div 
                          className="w-16 h-16 rounded-lg mb-2 mx-auto shadow-glass border border-border"
                          style={{ backgroundColor: color }}
                          title={`Accent ${shade}: ${color}`}
                        />
                        <span className="text-sm text-muted-foreground">{shade}</span>
                        <div className="text-xs text-muted-foreground font-mono">{color}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Semantic Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { name: 'Success', color: '#22c55e' },
                      { name: 'Warning', color: '#f59e0b' },
                      { name: 'Error', color: '#ef4444' },
                      { name: 'Info', color: '#3b82f6' }
                    ].map(({ name, color }) => (
                      <div key={name} className="text-center">
                        <div 
                          className="w-16 h-16 rounded-lg mb-2 mx-auto shadow-glass border border-border"
                          style={{ backgroundColor: color }}
                          title={`${name}: ${color}`}
                        />
                        <span className="text-sm text-muted-foreground">{name}</span>
                        <div className="text-xs text-muted-foreground font-mono">{color}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Typography Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Headings */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Headings</h3>
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">Heading 1 (text-4xl)</h1>
                    <h2 className="text-3xl font-bold text-foreground">Heading 2 (text-3xl)</h2>
                    <h3 className="text-2xl font-semibold text-foreground">Heading 3 (text-2xl)</h3>
                    <h4 className="text-xl font-semibold text-foreground">Heading 4 (text-xl)</h4>
                    <h5 className="text-lg font-medium text-foreground">Heading 5 (text-lg)</h5>
                    <h6 className="text-base font-medium text-foreground">Heading 6 (text-base)</h6>
                  </div>
                </div>

                {/* Body Text */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Body Text</h3>
                  <div className="space-y-4">
                    <p className="text-lg text-foreground">Large body text (text-lg)</p>
                    <p className="text-base text-foreground">Regular body text (text-base)</p>
                    <p className="text-sm text-muted-foreground">Small body text (text-sm)</p>
                    <p className="text-xs text-muted-foreground">Extra small text (text-xs)</p>
                  </div>
                </div>

                {/* Font Weights */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Font Weights</h3>
                  <div className="space-y-2">
                    <p className="font-thin text-foreground">Thin (font-thin)</p>
                    <p className="font-light text-foreground">Light (font-light)</p>
                    <p className="font-normal text-foreground">Normal (font-normal)</p>
                    <p className="font-medium text-foreground">Medium (font-medium)</p>
                    <p className="font-semibold text-foreground">Semibold (font-semibold)</p>
                    <p className="font-bold text-foreground">Bold (font-bold)</p>
                    <p className="font-extrabold text-foreground">Extrabold (font-extrabold)</p>
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
                  <h3 className="text-lg font-semibold mb-4">Button Variants (Actual App Variants)</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="default">Default</Button>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="accent">Accent</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="warning">Warning</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="tertiary">Tertiary</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Button Sizes (All Available Sizes)</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="xs">Extra Small</Button>
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                    <Button size="icon">Icon</Button>
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
                  <h3 className="text-lg font-semibold mb-4">Input Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Input</label>
                      <Input placeholder="Enter text..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Disabled Input</label>
                      <Input placeholder="Disabled" disabled />
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
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>This is a default alert message.</AlertDescription>
                </Alert>
                <Alert className="border-success bg-success/10">
                  <AlertDescription>This is a success alert message.</AlertDescription>
                </Alert>
                <Alert className="border-warning bg-warning/10">
                  <AlertDescription>This is a warning alert message.</AlertDescription>
                </Alert>
                <Alert className="border-destructive bg-destructive/10">
                  <AlertDescription>This is an error alert message.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Card Variants Showcase */}
            <Card variant="glass" className="glassmorphic">
              <CardHeader>
                <CardTitle>Card Variants (All Available)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete showcase of all card variants used throughout the TradeYa application
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Default Card */}
                  <Card variant="default" className="p-6">
                    <h4 className="font-semibold mb-2">Default Card</h4>
                    <p className="text-sm text-muted-foreground">Standard card with basic styling</p>
                    <div className="mt-4">
                      <Badge variant="default">Default</Badge>
                    </div>
                  </Card>

                  {/* Glass Card */}
                  <Card variant="glass" className="p-6">
                    <h4 className="font-semibold mb-2">Glass Card</h4>
                    <p className="text-sm text-muted-foreground">Glassmorphic effect with backdrop blur</p>
                    <div className="mt-4">
                      <Badge variant="secondary">Glass</Badge>
                    </div>
                  </Card>

                  {/* Elevated Card */}
                  <Card variant="elevated" className="p-6">
                    <h4 className="font-semibold mb-2">Elevated Card</h4>
                    <p className="text-sm text-muted-foreground">Enhanced shadow for depth</p>
                    <div className="mt-4">
                      <Badge variant="outline">Elevated</Badge>
                    </div>
                  </Card>

                  {/* Premium Card */}
                  <Card variant="premium" className="p-6">
                    <h4 className="font-semibold mb-2">Premium Card</h4>
                    <p className="text-sm text-muted-foreground">Glassmorphic with premium effects</p>
                    <div className="mt-4">
                      <Badge variant="default">Premium</Badge>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Real App Components */}
            <Card variant="glass" className="glassmorphic">
              <CardHeader>
                <CardTitle>Real App Components</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Actual components and patterns used throughout the TradeYa application
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trade Card Example */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Trade Card (Real App Component)</h3>
                  <div className="glassmorphic p-6 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">JS</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">JavaScript Development</h4>
                          <p className="text-sm text-muted-foreground">React, TypeScript, Node.js</p>
                        </div>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Looking for a skilled developer to help with a React project. 
                      Experience with TypeScript and modern React patterns required.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>💰 $50-75/hr</span>
                        <span>⏱️ 20-30 hours</span>
                        <span>📍 Remote</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm">Apply</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Profile Card */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">User Profile Card</h3>
                  <div className="glassmorphic p-6 rounded-xl border border-border/50">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">JD</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">John Developer</h4>
                        <p className="text-sm text-muted-foreground">Senior Full-Stack Developer</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="default">React Expert</Badge>
                          <Badge variant="secondary">TypeScript</Badge>
                          <Badge variant="outline">Node.js</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">47</div>
                        <div className="text-xs text-muted-foreground">Trades</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-secondary">4.9</div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-accent">98%</div>
                        <div className="text-xs text-muted-foreground">Success</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Challenge Card Example */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Challenge Card (Real App Component)</h3>
                  <Card variant="premium" className="h-[300px] flex flex-col cursor-pointer overflow-hidden" tilt={true} depth="lg" glow="subtle" glowColor="purple" hover interactive>
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <CardTitle className="truncate text-base font-semibold">
                            Complete 5 React Projects
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">🎯</span>
                          </div>
                          <Badge variant="outline">95%</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden px-4 pb-4">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        Build 5 complete React applications using modern patterns and best practices. 
                        Each project should demonstrate different aspects of React development.
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <Badge variant="default">Beginner</Badge>
                        <div className="flex items-center space-x-4">
                          <span>⭐ 150 XP</span>
                          <span>⏱️ 2 weeks</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Collaboration Card Example */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Collaboration Card (Real App Component)</h3>
                  <Card variant="glass" className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">E-commerce Platform</h4>
                        <p className="text-sm text-muted-foreground">Building a modern e-commerce solution</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="default">Leader</Badge>
                          <Badge variant="secondary">React</Badge>
                          <Badge variant="outline">Node.js</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">68%</div>
                        <div className="text-xs text-muted-foreground">Progress</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Team Members</span>
                        <span className="font-medium">4/5</span>
                      </div>
                      <div className="flex -space-x-2">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full border-2 border-background flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{i}</span>
                          </div>
                        ))}
                        <div className="w-8 h-8 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">+</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm">Continue</Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Profile Card Example */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Profile Card (Real App Component)</h3>
                  <Card variant="premium" className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">SM</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-lg">Sarah Miller</h4>
                          <Badge variant="default">Verified</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Full-Stack Developer</p>
                        <p className="text-xs text-muted-foreground">📍 San Francisco, CA</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">4.9</div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default">React</Badge>
                          <Badge variant="secondary">TypeScript</Badge>
                          <Badge variant="outline">Node.js</Badge>
                          <Badge variant="outline">Python</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-primary">23</div>
                          <div className="text-xs text-muted-foreground">Projects</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-secondary">156</div>
                          <div className="text-xs text-muted-foreground">Trades</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-accent">98%</div>
                          <div className="text-xs text-muted-foreground">Success</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Notification Example */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notification Component</h3>
                  <div className="space-y-3">
                    <div className="glassmorphic p-4 rounded-lg border-l-4 border-success">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Trade Completed Successfully</p>
                          <p className="text-xs text-muted-foreground">Your JavaScript project has been completed</p>
                        </div>
                        <span className="text-xs text-muted-foreground">2m ago</span>
                      </div>
                    </div>
                    <div className="glassmorphic p-4 rounded-lg border-l-4 border-warning">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-warning rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New Message Received</p>
                          <p className="text-xs text-muted-foreground">You have a new message from Sarah</p>
                        </div>
                        <span className="text-xs text-muted-foreground">5m ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Design System Integration */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Design System Integration</h3>
                  <div className="space-y-4">
                    <div className="glassmorphic p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Using classPatterns</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">classPatterns.heading1</code>
                          <div className={classPatterns.heading1}>This is heading1</div>
                        </div>
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">classPatterns.bodyLarge</code>
                          <div className={classPatterns.bodyLarge}>This is bodyLarge text</div>
                        </div>
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">classPatterns.glassCard</code>
                          <div className={classPatterns.glassCard + ' p-4 rounded-lg'}>This is a glass card</div>
                        </div>
                      </div>
                    </div>

                    <div className="glassmorphic p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Using componentVariants</h4>
                      <div className="space-y-2">
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">componentVariants.button.primary</code>
                          <div className="mt-2">
                            <button className={componentVariants.button.primary}>Primary Button</button>
                          </div>
                        </div>
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">componentVariants.badge.success</code>
                          <div className="mt-2">
                            <span className={componentVariants.badge.success}>Success Badge</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glassmorphic Tab */}
          <TabsContent value="glassmorphic" className="space-y-8">
            <Card variant="glass" className="glassmorphic">
              <CardHeader>
                <CardTitle>Glassmorphic Effects</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Modern glassmorphic design patterns used throughout the TradeYa app
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Glassmorphic Cards */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Glassmorphic Cards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glassmorphic p-6 rounded-xl">
                      <h4 className="text-lg font-semibold mb-2">Standard Glass Card</h4>
                      <p className="text-sm text-muted-foreground">
                        Uses the <code className="bg-muted px-1 rounded">glassmorphic</code> class
                      </p>
                    </div>
                    <div className="glassmorphic p-6 rounded-xl border border-primary/20">
                      <h4 className="text-lg font-semibold mb-2">Glass Card with Border</h4>
                      <p className="text-sm text-muted-foreground">
                        Enhanced with primary color border accent
                      </p>
                    </div>
                    <div className="glassmorphic p-6 rounded-xl shadow-lg">
                      <h4 className="text-lg font-semibold mb-2">Glass Card with Shadow</h4>
                      <p className="text-sm text-muted-foreground">
                        Additional shadow for depth
                      </p>
                    </div>
                  </div>
                </div>

                {/* Glassmorphic Forms */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Glassmorphic Forms</h3>
                  <div className="space-y-4">
                    <div className="glassmorphic p-6 rounded-2xl">
                      <h4 className="text-lg font-semibold mb-4">Form Container</h4>
                      <div className="space-y-4">
                        <Input placeholder="Enter your name..." className="glassmorphic" />
                        <Textarea placeholder="Enter your message..." className="glassmorphic" />
                        <Button className="w-full">Submit</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glassmorphic Navigation */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Glassmorphic Navigation</h3>
                  <div className="glassmorphic p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary rounded-full"></div>
                        <span className="font-semibold">TradeYa</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">Home</Button>
                        <Button variant="ghost" size="sm">Trades</Button>
                        <Button variant="ghost" size="sm">Profile</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glassmorphic Modals */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Glassmorphic Modals & Overlays</h3>
                  <div className="relative">
                    <div className="glassmorphic p-6 rounded-xl border border-border/50">
                      <h4 className="text-lg font-semibold mb-2">Modal Content</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Glassmorphic modals with backdrop blur effects
                      </p>
                      <div className="flex space-x-2">
                        <Button size="sm">Confirm</Button>
                        <Button variant="outline" size="sm">Cancel</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Implementation Notes */}
                <div className="glassmorphic p-6 rounded-xl">
                  <h4 className="text-lg font-semibold mb-2">Implementation Notes</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Use <code className="bg-muted px-1 rounded">glassmorphic</code> class for standard glass effects</p>
                    <p>• Combine with <code className="bg-muted px-1 rounded">backdrop-blur-xl</code> for enhanced blur</p>
                    <p>• Add <code className="bg-muted px-1 rounded">border border-border</code> for subtle borders</p>
                    <p>• Use <code className="bg-muted px-1 rounded">shadow-glass</code> for glass-specific shadows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Spacing Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Padding Examples</h3>
                  <div className="space-y-4">
                    <div className="bg-primary/10 p-2 rounded">
                      <span className="text-sm">p-2 (0.5rem / 8px)</span>
                    </div>
                    <div className="bg-primary/10 p-4 rounded">
                      <span className="text-sm">p-4 (1rem / 16px)</span>
                    </div>
                    <div className="bg-primary/10 p-6 rounded">
                      <span className="text-sm">p-6 (1.5rem / 24px)</span>
                    </div>
                    <div className="bg-primary/10 p-8 rounded">
                      <span className="text-sm">p-8 (2rem / 32px)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Margin Examples</h3>
                  <div className="space-y-4">
                    <div className="bg-secondary/10 p-4 rounded">
                      <div className="bg-background m-2 p-2 rounded">
                        <span className="text-sm">m-2 (0.5rem / 8px)</span>
                      </div>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded">
                      <div className="bg-background m-4 p-2 rounded">
                        <span className="text-sm">m-4 (1rem / 16px)</span>
                      </div>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded">
                      <div className="bg-background m-6 p-2 rounded">
                        <span className="text-sm">m-6 (1.5rem / 24px)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Interaction Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Hover States</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button className="transition-all duration-200 hover:scale-105">
                      Scale on Hover
                    </Button>
                    <Button variant="outline" className="transition-colors duration-200 hover:bg-primary hover:text-primary-foreground">
                      Color Change
                    </Button>
                    <Button variant="ghost" className="transition-all duration-200 hover:shadow-md">
                      Shadow on Hover
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Focus States</h3>
                  <div className="flex flex-wrap gap-4">
                    <Input placeholder="Focus me..." className="focus:ring-2 focus:ring-primary" />
                    <Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
                      Focus Button
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Loading States</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button disabled className="opacity-50 cursor-not-allowed">
                      Disabled State
                    </Button>
                    <Button className="relative">
                      <span className="opacity-0">Loading...</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </div>
                    </Button>
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