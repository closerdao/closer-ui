import Link from 'next/link';

import { FC } from 'react';

import { Project } from '../../types/api';
import { cdn } from '../../utils/api';

const stripHtml = (html: string): string =>
  html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';

const truncate = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}…`;

const toPhotoId = (photo: unknown): string | null =>
  typeof photo === 'string' && photo.length > 0 ? photo : null;

interface Props {
  project: Project;
}

const ProjectPreview: FC<Props> = ({ project }) => {
  if (!project) return null;

  const name = project.name ?? '';
  const description = project.description ?? '';
  const descriptionText = project.descriptionText ?? '';
  const photoId = toPhotoId(project.photo);
  const slug = project.slug ?? '';

  const rawText = descriptionText || stripHtml(description);
  const truncated = rawText ? truncate(rawText, 160) : '';
  const photoUrl =
    cdn && photoId ? `${cdn}${photoId}-post-md.jpg` : null;

  return (
    <div className="rounded-lg border border-neutral-dark bg-neutral-light p-3 sm:p-4">
      <Link
        href={slug ? `/projects/${slug}` : '#'}
        className="flex gap-3 sm:gap-4 no-underline text-inherit hover:opacity-90"
      >
        {photoUrl && (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-md overflow-hidden bg-neutral-200">
            <img
              src={photoUrl}
              alt={name || 'Project'}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
          {name && (
            <span className="font-semibold text-foreground">{name}</span>
          )}
          {truncated && (
            <p className="text-sm text-complimentary-light line-clamp-2">
              {truncated}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProjectPreview;
