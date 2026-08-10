import Link from 'next/link';

import { FC } from 'react';

import { LandProject, LandProjectMapItem } from '../../types/landProject';

type LandProjectCardProps = {
  project: LandProject | LandProjectMapItem;
  href?: string;
};

const LandProjectCard: FC<LandProjectCardProps> = ({ project, href }) => {
  const path =
    href ||
    (project.slug
      ? `/villages/${project.slug}`
      : project._id
        ? `/villages/${project._id}`
        : undefined);

  const content = (
    <article className="flex flex-col gap-2 py-4 border-b border-gray-200">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
        {project.closer ? (
          <span className="text-xs uppercase tracking-wide text-accent-foreground bg-accent/20 px-2 py-0.5 rounded">
            Closer
          </span>
        ) : null}
        {'verificationBadge' in project &&
        project.verificationBadge &&
        project.verificationBadge !== 'unverified' ? (
          <span className="text-xs uppercase tracking-wide text-foreground bg-gray-100 px-2 py-0.5 rounded">
            {project.verificationBadge}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-gray-600">{project.country}</p>
      <p className="text-sm text-gray-700 line-clamp-3">{project.description}</p>
      {project.tags?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );

  if (!path) return content;

  return (
    <Link href={path} className="block hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
};

export default LandProjectCard;
