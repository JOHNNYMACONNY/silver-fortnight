import React, { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Modal } from '../components/ui/Modal';
import { SimpleModal } from '../components/ui/SimpleModal';
import { Toast } from '../components/ui/Toast';
import { Tooltip } from '../components/ui/Tooltip';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonText, SkeletonCircle, SkeletonButton } from '../components/ui/skeletons/Skeleton';
import { CardSkeleton } from '../components/ui/skeletons/CardSkeleton';
import { Transition } from '../components/ui/transitions/Transition';
import SkillSelector from '../components/ui/SkillSelector';
import { cn } from '../utils/cn';

const ComponentTestPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  // Initialize to false so we can see the entering transition when first clicking the button
  const [showTransition, setShowTransition] = useState(false);
  const [skills, setSkills] = useState<Array<{ name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert' }>>([]);

  const handleShowToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    setToastType(type);
    setShowToast(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background-primary">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-text-primary mb-8">Component Test Page</h1>
          <ThemeToggle />
        </div>

        {/* Theme Toggle */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Theme Toggle</h2>
          <div className="backdrop-blur-md bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 rounded-xl p-6 shadow-glass">
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Buttons</h2>
          <div className="backdrop-blur-md bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 rounded-xl p-6 shadow-glass">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-text-primary">Variants</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="tertiary">Tertiary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="success">Success</Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-text-primary">Sizes</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-text-primary">States</h3>
                <div className="flex flex-wrap gap-2">
                  <Button isLoading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button rounded>Rounded</Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="glass" className="backdrop-blur-md bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 shadow-glass">
              <CardBody>
                <p className="text-text-primary">Glassmorphic Card</p>
              </CardBody>
            </Card>

            <Card variant="glass" className="backdrop-blur-md bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 shadow-glass">
              <CardHeader>
                <h3 className="text-xl font-semibold text-text-primary">Card with Header</h3>
              </CardHeader>
              <CardBody>
                <p className="text-text-primary">This card has a header and body with glassmorphic styling.</p>
              </CardBody>
            </Card>

            <Card variant="glass" className="backdrop-blur-md bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 shadow-glass">
              <CardHeader>
                <h3 className="text-xl font-semibold text-text-primary">Elevated Card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-text-primary">This card has an elevated glassmorphic variant.</p>
              </CardBody>
              <CardFooter>
                <div className="flex justify-end">
                  <Button variant="primary" size="sm">Action</Button>
                </div>
              </CardFooter>
            </Card>

            <Card variant="glass" className="backdrop-blur-md bg-white/75 dark:bg-neutral-800/65 border border-white/20 dark:border-neutral-700/30 shadow-glass">
              <CardHeader>
                <h3 className="text-xl font-semibold text-text-primary">Interactive Card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-text-primary">This card has interactive glassmorphic styling.</p>
              </CardBody>
              <CardFooter>
                <div className="flex justify-end">
                  <Button variant="primary" size="sm">Action</Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Basic Input"
              placeholder="Enter text here"
            />

            <Input
              label="With Helper Text"
              placeholder="Enter text here"
              helperText="This is some helper text"
            />

            <Input
              label="With Error"
              placeholder="Enter text here"
              error="This field is required"
            />

            <Input
              label="With Left Icon"
              placeholder="Search..."
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />

            <Input
              label="With Right Icon"
              placeholder="Enter text here"
              rightIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            />

            <Input
              label="Disabled Input"
              placeholder="This input is disabled"
              disabled
            />

            <Input
              label="Full Width Input"
              placeholder="This input takes full width"
              fullWidth
            />
          </div>
        </section>

        {/* Avatars */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Avatars</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar alt="User" size="xs" />
            <Avatar alt="User" size="sm" />
            <Avatar alt="User" size="md" />
            <Avatar alt="User" size="lg" />
            <Avatar alt="User" size="xl" />
            <Avatar src="https://i.pravatar.cc/300" alt="User with image" size="lg" />
          </div>
        </section>

        {/* Modal */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Modals</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-text-primary">Regular Modal</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    console.log('Opening modal, current state:', !isModalOpen);
                    setIsModalOpen(true);
                  }}
                >
                  Open Modal
                </Button>
              </div>
              <div className="p-4 bg-background-secondary rounded-lg mt-2">
                <p className="text-sm text-text-secondary">
                  Modal state: {isModalOpen ? 'OPEN' : 'CLOSED'}
                </p>
              </div>
              <Modal
                isOpen={isModalOpen}
                onClose={() => {
                  console.log('Closing modal');
                  setIsModalOpen(false);
                }}
                title="Modal Title"
                size="md"
                footer={
                  <div className="flex justify-end space-x-2">
                    <Button variant="tertiary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setIsModalOpen(false)}>Confirm</Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <p className="text-text-primary">
                    This is the content of the modal. You can put any React components here.
                  </p>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <p className="text-sm text-text-secondary">
                      The modal has the following features:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li className="text-sm text-text-secondary">Closes when you click outside</li>
                      <li className="text-sm text-text-secondary">Closes when you press ESC key</li>
                      <li className="text-sm text-text-secondary">Prevents scrolling of the background</li>
                    </ul>
                  </div>
                  <Input
                    label="Sample Input"
                    placeholder="Enter something..."
                  />
                </div>
              </Modal>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-text-primary">Simple Modal</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    console.log('Opening simple modal, current state:', !isSimpleModalOpen);
                    setIsSimpleModalOpen(true);
                  }}
                >
                  Open Simple Modal
                </Button>
              </div>
              <div className="p-4 bg-background-secondary rounded-lg mt-2">
                <p className="text-sm text-text-secondary">
                  Simple Modal state: {isSimpleModalOpen ? 'OPEN' : 'CLOSED'}
                </p>
              </div>
              <SimpleModal
                isOpen={isSimpleModalOpen}
                onClose={() => {
                  console.log('Closing simple modal');
                  setIsSimpleModalOpen(false);
                }}
                title="Simple Modal Title"
              >
                <p>This is a very simple modal implementation without any fancy features.</p>
                <div style={{ marginTop: '20px' }}>
                  <Button
                    variant="primary"
                    onClick={() => setIsSimpleModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </SimpleModal>
            </div>
          </div>
        </section>

        {/* Toast */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Toast</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleShowToast('success')}>Success Toast</Button>
            <Button onClick={() => handleShowToast('error')}>Error Toast</Button>
            <Button onClick={() => handleShowToast('warning')}>Warning Toast</Button>
            <Button onClick={() => handleShowToast('info')}>Info Toast</Button>
          </div>
          {showToast && (
            <div className="fixed bottom-4 right-4 z-50">
              <Toast
                type={toastType}
                message={`This is a ${toastType} toast message`}
                onClose={() => setShowToast(false)}
              />
            </div>
          )}
        </section>

        {/* Tooltip */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Tooltip</h2>
          <div className="flex flex-wrap gap-4">
            <Tooltip content="This is a tooltip" position="top">
              <Button>Hover me (Top)</Button>
            </Tooltip>
            <Tooltip content="This is a tooltip" position="right">
              <Button>Hover me (Right)</Button>
            </Tooltip>
            <Tooltip content="This is a tooltip" position="bottom">
              <Button>Hover me (Bottom)</Button>
            </Tooltip>
            <Tooltip content="This is a tooltip" position="left">
              <Button>Hover me (Left)</Button>
            </Tooltip>
          </div>
        </section>

        {/* Empty State */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Empty State</h2>
          <EmptyState
            title="No Items Found"
            description="There are no items to display. Please add some items to see them here."
            actionLabel="Add Item"
            onAction={() => alert('Action clicked!')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2z" /></svg>}
          />
        </section>

        {/* Skeletons */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Skeletons</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <SkeletonText className="w-[80%]" />
              <SkeletonText className="w-[60%]" />
              <div className="flex items-center gap-4">
                <SkeletonCircle className="h-12 w-12" />
                <div className="w-full space-y-2">
                  <SkeletonText className="w-[90%]" />
                  <SkeletonText className="w-[70%]" />
                </div>
              </div>
              <SkeletonButton />
            </div>
            <CardSkeleton hasImage hasFooter />
          </div>
        </section>

        {/* Transitions */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Transitions</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowTransition(!showTransition)}>
                {showTransition ? 'Hide' : 'Show'} Elements
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-text-primary">Fade</h3>
                <Transition show={showTransition} type="fade" duration={600}>
                  <Card>
                    <CardBody>
                      <p className="text-text-primary">Fade Transition</p>
                    </CardBody>
                  </Card>
                </Transition>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-text-primary">Slide</h3>
                <Transition show={showTransition} type="slide" duration={600}>
                  <Card>
                    <CardBody>
                      <p className="text-text-primary">Slide Transition</p>
                    </CardBody>
                  </Card>
                </Transition>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-text-primary">Zoom</h3>
                <Transition show={showTransition} type="zoom" duration={600}>
                  <Card>
                    <CardBody>
                      <p className="text-text-primary">Zoom Transition</p>
                    </CardBody>
                  </Card>
                </Transition>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-text-primary">Bounce</h3>
                <Transition show={showTransition} type="bounce" duration={600}>
                  <Card>
                    <CardBody>
                      <p className="text-text-primary">Bounce Transition</p>
                    </CardBody>
                  </Card>
                </Transition>
              </div>
            </div>
          </div>
        </section>

        {/* Skill Selector */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">Skill Selector</h2>
          <SkillSelector
            selectedSkills={skills}
            onChange={setSkills}
            maxSkills={5}
          />
        </section>
      </div>
    </div>
  );
};

export default ComponentTestPage;
