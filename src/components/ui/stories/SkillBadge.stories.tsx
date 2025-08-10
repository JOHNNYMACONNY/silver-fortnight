import { SkillBadge } from '../SkillBadge';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SkillBadge> = {
  title: 'UI/SkillBadge',
  component: SkillBadge,
};
export default meta;

type Story = StoryObj<typeof SkillBadge>;

export const Default: Story = {
  args: {
    skill: 'Example Skill',
    level: 'intermediate',
    size: 'md',
  },
};
