import { MemoryRouter } from 'react-router-dom';

export const withMemoryRouter = (Story: any) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
);
export const withMemoryRouterDecorator = {
  decorators: [withMemoryRouter],
};
