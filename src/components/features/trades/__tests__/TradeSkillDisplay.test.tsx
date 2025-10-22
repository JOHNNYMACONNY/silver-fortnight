import { render, screen } from '@testing-library/react';
import { TradeSkillDisplay } from '../TradeSkillDisplay';

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
});