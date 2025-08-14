import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { TopicLink } from '../components/ui/TopicLink'

const meta: Meta = {
  title: 'Design System/Semantic Topics',
}

export default meta

type Story = StoryObj

export const Buttons: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Button topic="trades">Trades (primary/orange)</Button>
      <Button topic="collaboration">Collaboration (accent/purple)</Button>
      <Button topic="community">Community (secondary/blue)</Button>
      <Button topic="success">Success (green)</Button>
      <div className="mt-2">
        <Button variant="outline">Outline (neutral)</Button>
        <Button variant="link" topic="trades" className="ml-2">Link (trades)</Button>
      </div>
    </div>
  ),
}

export const Badges: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge topic="trades">Active</Badge>
      <Badge topic="collaboration">Team</Badge>
      <Badge topic="community">Live</Badge>
      <Badge topic="success">Rewards</Badge>
    </div>
  ),
}

export const Links: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <TopicLink to="/trades" topic="trades">Browse Trades</TopicLink>
      <TopicLink to="/collaborations" topic="collaboration">Explore Collaborations</TopicLink>
      <TopicLink to="/users" topic="community">Browse Users</TopicLink>
      <TopicLink to="/leaderboard" topic="success">View Leaderboard</TopicLink>
    </div>
  ),
}


