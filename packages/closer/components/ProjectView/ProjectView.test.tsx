import { screen } from '@testing-library/react';

import models from '../../models';
import { renderWithNextIntl } from '../../test/utils';
import type { Project } from '../../types/api';
import ProjectView from './ProjectView';

const authState: { user: Record<string, unknown> | null; isAuthenticated: boolean } =
  { user: null, isAuthenticated: false };

jest.mock('../../contexts/auth', () => ({
  useAuth: () => authState,
}));

const baseProject = {
  _id: 'p1',
  slug: 'seed-project',
  name: 'Seed project',
  description: '<p>A first build.</p>',
  status: 'open',
} as unknown as Project;

describe('ProjectView residency window', () => {
  it('reads the window from the project start and end dates', () => {
    renderWithNextIntl(
      <ProjectView
        project={
          {
            ...baseProject,
            start: '2026-03-01T09:00:00.000Z',
            end: '2026-04-15T09:00:00.000Z',
          } as Project
        }
      />,
    );

    expect(screen.getByText('Residency window')).toBeInTheDocument();
    expect(screen.getByText(/March 1st 2026/)).toBeInTheDocument();
    expect(screen.getByText(/April 15th 2026/)).toBeInTheDocument();
  });

  it('marks a window whose end date has passed', () => {
    renderWithNextIntl(
      <ProjectView
        project={
          {
            ...baseProject,
            start: '2020-03-01T09:00:00.000Z',
            end: '2020-04-15T09:00:00.000Z',
          } as Project
        }
      />,
    );

    expect(screen.getByText(/Opportunity ended/)).toBeInTheDocument();
  });

  it('shows a start date on its own when there is no end date', () => {
    renderWithNextIntl(
      <ProjectView
        project={{ ...baseProject, start: '2026-03-01T09:00:00.000Z' } as Project}
      />,
    );

    expect(screen.getByText(/March 1st 2026/)).toBeInTheDocument();
  });

  it('shows the window for the seed-project record as the API returns it', () => {
    // Verbatim from GET /project/seed-project, so a shape change in the API
    // response shows up here rather than as an empty row on the page.
    const seedProject = {
      name: 'Costume organizer & repair',
      status: 'open',
      category: 'Art projects',
      photo: '6a7ec98db9f647b3ffa146b2',
      slug: 'seed-project',
      description: '<p>A sample project for local development.</p>',
      start: '2026-09-01T10:00:00.000Z',
      end: '2026-11-30T11:00:00.000Z',
      reward: { val: 1, cur: 'TDF' },
      visibility: 'public',
      createdBy: '6a16bff839fad05906276dd9',
      _id: '6a16c00a169f414b172a0596',
    } as unknown as Project;

    renderWithNextIntl(<ProjectView project={seedProject} />);

    expect(screen.getByText('Project details')).toBeInTheDocument();
    expect(screen.getByText('Residency window')).toBeInTheDocument();
    expect(
      screen.getByText(/September 1st 2026 – November 30th 2026/),
    ).toBeInTheDocument();
  });

  it('omits the row entirely when the project has no dates', () => {
    renderWithNextIntl(<ProjectView project={baseProject} />);

    expect(screen.queryByText('Residency window')).not.toBeInTheDocument();
    expect(screen.getByText('Seed project')).toBeInTheDocument();
  });
});

describe('project model', () => {
  it('leaves start and end to the date picker rather than form fields', () => {
    const names = models.project.map((field: any) => field.name);
    expect(names).not.toContain('start');
    expect(names).not.toContain('end');
  });
});
