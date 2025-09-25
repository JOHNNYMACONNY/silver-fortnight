import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    expect(screen.getByText('Secondary Badge')).toBeInTheDocument();
  });

  it('renders with status-glow variant', () => {
    render(<Badge variant="status-glow">Live</Badge>);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('renders with semantic topic', () => {
    render(<Badge variant="default" topic="trades">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with collaboration topic', () => {
    render(<Badge variant="default" topic="collaboration">Team</Badge>);
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('renders with success topic', () => {
    render(<Badge variant="default" topic="success">Rewards</Badge>);
    expect(screen.getByText('Rewards')).toBeInTheDocument();
  });

  it('renders with community topic', () => {
    render(<Badge variant="default" topic="community">Community</Badge>);
    expect(screen.getByText('Community')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders all variants without crashing', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline', 'success', 'status', 'status-glow'] as const;
    
    variants.forEach(variant => {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders all topics without crashing', () => {
    const topics = ['trades', 'collaboration', 'community', 'success'] as const;
    
    topics.forEach(topic => {
      const { unmount } = render(<Badge variant="default" topic={topic}>{topic}</Badge>);
      expect(screen.getByText(topic)).toBeInTheDocument();
      unmount();
    });
  });
});
