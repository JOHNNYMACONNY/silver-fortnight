import { render, screen } from '@testing-library/react';
import { TradeSkillDisplay } from '../TradeSkillDisplay';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('span', props, children);
    }
  }
}));

describe('TradeSkillDisplay', () => {
  const mockSkill = {
    name: 'React',
    level: 'expert' as const
  };

  it('renders skill name and level', () => {
    render(<TradeSkillDisplay skill={mockSkill} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('(expert)')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const className = 'custom-class';
    const { container } = render(<TradeSkillDisplay skill={mockSkill} className={className} />);
    expect(container.firstChild).toHaveClass(className);
  });

  it('renders with different skill levels', () => {
    const beginner = { name: 'CSS', level: 'beginner' as const };
    const intermediate = { name: 'JavaScript', level: 'intermediate' as const };
    
    const { rerender } = render(<TradeSkillDisplay skill={beginner} />);
    expect(screen.getByText('(beginner)')).toBeInTheDocument();
    
    rerender(<TradeSkillDisplay skill={intermediate} />);
    expect(screen.getByText('(intermediate)')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<TradeSkillDisplay skill={mockSkill} variant="offered" />);
    expect(screen.getByText('React')).toBeInTheDocument();
    
    rerender(<TradeSkillDisplay skill={mockSkill} variant="requested" />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<TradeSkillDisplay skill={mockSkill} size="sm" />);
    expect(screen.getByText('React')).toBeInTheDocument();
    
    rerender(<TradeSkillDisplay skill={mockSkill} size="lg" />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('hides level when showLevel is false', () => {
    render(<TradeSkillDisplay skill={mockSkill} showLevel={false} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByText('(expert)')).not.toBeInTheDocument();
  });
});