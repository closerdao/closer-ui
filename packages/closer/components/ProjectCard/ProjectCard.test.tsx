import { fireEvent, screen } from '@testing-library/react';

import type { Project } from '../../types/api';
import { renderWithNextIntl } from '../../test/utils';
import ProjectCard from './ProjectCard';

const baseProject = {
  _id: 'p1',
  slug: 'seed-project',
  name: 'Seed project',
  descriptionText: 'A first build.',
  skills: ['Carpentry'],
} as unknown as Project;

describe('ProjectCard', () => {
  it('renders no image when the project has no photo', () => {
    renderWithNextIntl(
      <ProjectCard project={baseProject} canManageProject={false} />,
    );

    expect(screen.getByText('Seed project')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the photo when the project has one', () => {
    renderWithNextIntl(
      <ProjectCard
        project={{ ...baseProject, photo: 'photo-id' } as Project}
        canManageProject={false}
      />,
    );

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toContain('photo-id');
  });

  it('drops the image area when the photo fails to load', () => {
    renderWithNextIntl(
      <ProjectCard
        project={{ ...baseProject, photo: 'gone' } as Project}
        canManageProject={false}
      />,
    );

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Seed project')).toBeInTheDocument();
  });

  it('shows the edit link only to people who can manage projects', () => {
    const { rerender } = renderWithNextIntl(
      <ProjectCard project={baseProject} canManageProject={false} />,
    );
    expect(
      screen.queryByRole('link', { name: /edit project/i }),
    ).not.toBeInTheDocument();

    rerender(<ProjectCard project={baseProject} canManageProject={true} />);
    expect(
      screen.getByRole('link', { name: /edit project/i }),
    ).toHaveAttribute('href', '/projects/seed-project/edit');
  });
});
