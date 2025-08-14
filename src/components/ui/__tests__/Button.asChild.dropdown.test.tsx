import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link } from 'react-router-dom';

import { Button } from '../../ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../ui/DropdownMenu';

describe('Button asChild with Radix DropdownMenu', () => {
  it('acts as a valid trigger and shows content without errors', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button asChild variant="ghost">
              <Link to="#">
                <span>Open Menu</span>
              </Link>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item A</DropdownMenuItem>
            <DropdownMenuItem>Item B</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </MemoryRouter>
    );

    // Click the trigger
    await user.click(screen.getByText('Open Menu'));

    // Assert menu items appear (no runtime errors)
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
  });

  it('ignores leftIcon/rightIcon props in asChild mode (single child only)', () => {
    // This should not throw, and should render the single child only.
    render(
      <MemoryRouter>
        <Button asChild leftIcon={<span data-testid="left" />} rightIcon={<span data-testid="right" />}>
          <Link to="#">Only Child</Link>
        </Button>
      </MemoryRouter>
    );

    expect(screen.getByText('Only Child')).toBeInTheDocument();
    expect(screen.queryByTestId('left')).toBeNull();
    expect(screen.queryByTestId('right')).toBeNull();
  });
});


