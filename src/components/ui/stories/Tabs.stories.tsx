import Tabs, { TabsList, TabsTrigger, TabsContent } from '../Tabs';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
};
export default meta;

type Story = StoryObj<typeof Tabs>;

const ExampleTabs = (props: any) => {
  const [value, setValue] = useState('tab1');
  return (
    <Tabs value={value} onValueChange={setValue} {...props}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  );
};

export const Default: Story = {
  render: () => <ExampleTabs />,
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="other">Other</TabsTrigger>
      </TabsList>
      <TabsContent value="active">Active Content</TabsContent>
      <TabsContent value="disabled">Disabled Content</TabsContent>
      <TabsContent value="other">Other Content</TabsContent>
    </Tabs>
  ),
};

export const NoTabs: Story = {
  render: () => <Tabs></Tabs>,
};
// Add more stories for edge cases or new variants as needed.
