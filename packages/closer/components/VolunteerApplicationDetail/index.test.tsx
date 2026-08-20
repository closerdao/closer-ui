import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import type { Project } from '../../types/api';
import type { VolunteerInfo } from '../../types/booking';
import VolunteerApplicationDetail from './index';

const seedProject = {
  _id: '6a16c00a169f414b172a0596',
  name: 'Costume organizer & repair',
  slug: 'seed-project',
  status: 'open',
  photo: '6a7ec98db9f647b3ffa146b2',
  start: '2026-09-01T10:00:00.000Z',
  end: '2026-11-30T11:00:00.000Z',
} as unknown as Project;

const residenceInfo = {
  bookingType: 'residence',
  skills: ['carpentry'],
  diet: [],
  suggestions: '',
  projectId: [seedProject._id],
  application: {
    about: { fullName: 'Ada' },
    experience: {},
    health: {},
    agreement: {},
  },
} as unknown as VolunteerInfo;

describe('VolunteerApplicationDetail project preview', () => {
  it('previews the project the residence application is for', () => {
    renderWithNextIntl(
      <VolunteerApplicationDetail
        volunteerInfo={residenceInfo}
        projects={[seedProject]}
        canViewHealth={false}
      />,
    );

    const link = screen.getByRole('link', {
      name: /Costume organizer & repair/,
    });
    expect(link).toHaveAttribute('href', '/projects/seed-project');
    expect(screen.getByText(/Sep 1, 2026 – Nov 30, 2026/)).toBeInTheDocument();
    expect(screen.getByText('Open for applications')).toBeInTheDocument();
  });

  it('links an unknown project id rather than dropping it', () => {
    renderWithNextIntl(
      <VolunteerApplicationDetail
        volunteerInfo={residenceInfo}
        projects={[]}
        canViewHealth={false}
      />,
    );

    expect(
      screen.getByRole('link', { name: seedProject._id }),
    ).toHaveAttribute('href', `/projects/${seedProject._id}`);
  });

  it('shows no project section when the application names none', () => {
    renderWithNextIntl(
      <VolunteerApplicationDetail
        volunteerInfo={
          { ...residenceInfo, projectId: [] } as unknown as VolunteerInfo
        }
        projects={[seedProject]}
        canViewHealth={false}
      />,
    );

    expect(screen.queryByText('🧱 Build projects')).not.toBeInTheDocument();
    expect(
      screen.getByText('👷🏽‍♀️ Residence application'),
    ).toBeInTheDocument();
  });
});
