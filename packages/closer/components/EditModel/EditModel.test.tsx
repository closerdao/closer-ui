import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import EditModel from './EditModel';

const authState = {
  user: { _id: 'u1', roles: ['admin'] },
  isAuthenticated: true,
};

jest.mock('../../contexts/auth', () => ({
  useAuth: () => authState,
}));

const nameField = {
  name: 'name',
  label: 'Title',
  type: 'text',
  public: true,
  editable: true,
};

const renderModel = (endpoint: string, initialData?: Record<string, unknown>) =>
  renderWithNextIntl(
    <EditModel
      endpoint={endpoint}
      fields={[nameField] as any}
      initialData={initialData ?? { name: 'Seed project' }}
    />,
  );

// Both picker variants carry the `dates` testid; only the collapsed one — the
// variant the event form uses — renders it as a button that opens the calendar.
const isCollapsedPicker = (element: HTMLElement) => element.tagName === 'BUTTON';

describe('EditModel date picker', () => {
  it('gives the project form the collapsed picker the event form uses', () => {
    renderModel('/project');

    expect(isCollapsedPicker(screen.getByTestId('dates'))).toBe(true);
  });

  it('spells out the span once the project has both dates', () => {
    renderModel('/project', {
      name: 'Seed project',
      start: '2026-03-01T09:00:00.000Z',
      end: '2026-03-05T09:00:00.000Z',
    });

    expect(screen.getByTestId('dates')).toHaveTextContent(/5 days/i);
  });

  it('leaves the volunteer form on the expanded picker', () => {
    renderModel('/volunteer');

    expect(isCollapsedPicker(screen.getByTestId('dates'))).toBe(false);
  });

  it('renders no picker for endpoints that do not schedule', () => {
    renderModel('/listing');

    expect(screen.queryByTestId('dates')).not.toBeInTheDocument();
  });
});
