import React from 'react';

import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';
import { isValidNextImageSrc } from '../../utils/nextImageSrc';
import SafeCustomPageImage from './SafeCustomPageImage';

interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    members?: TeamMember[];
  };
}

const CustomTeamMembers = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, t('team_executive_team_label'));
  const title = pick(content?.title, t('team_leadership_title'));
  const description = pick(content?.description, t('team_leadership_desc'));

  const defaultMembers: TeamMember[] = [
    {
      name: 'Samuel Delesque',
      role: t('team_samuel_role'),
      bio: t('team_samuel_desc'),
      twitterUrl: 'https://twitter.com/samdelesque',
      linkedinUrl: 'https://www.linkedin.com/in/samdelesque/',
    },
  ];

  const members =
    content?.members && content.members.length > 0
      ? content.members.map((member) => ({
          name: pick(member.name, member.name),
          role: pick(member.role, member.role),
          bio: member.bio?.trim()
            ? resolveBlockText(member.bio, t)
            : undefined,
          imageUrl: member.imageUrl,
          twitterUrl: member.twitterUrl,
          linkedinUrl: member.linkedinUrl,
        }))
      : defaultMembers;

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <span className="bg-accent text-gray-800 text-sm px-4 py-1 rounded-full font-medium self-start">
              {eyebrow}
            </span>
          ) : null}
          {title ? (
            <Heading level={2} className="font-serif text-3xl text-gray-900">
              {title}
            </Heading>
          ) : null}
          {description ? (
            <p className="text-gray-600">{description}</p>
          ) : null}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {members.map((member, index) => (
            <div
              key={`${member.name}-${index}`}
              className="max-w-lg flex gap-6 p-6 bg-gray-50 rounded-2xl"
            >
              {member.imageUrl && isValidNextImageSrc(member.imageUrl) ? (
                <div className="w-24 h-24 rounded-full flex-shrink-0 overflow-hidden relative">
                  <SafeCustomPageImage
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent-alt rounded-full flex-shrink-0 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-800" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {member.name}
                </h3>
                <p className="text-accent-dark font-medium">{member.role}</p>
                {member.bio ? (
                  <p className="text-sm text-gray-600">{member.bio}</p>
                ) : null}
                {(member.twitterUrl || member.linkedinUrl) && (
                  <div className="flex gap-3">
                    {member.twitterUrl ? (
                      <a
                        href={member.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    ) : null}
                    {member.linkedinUrl ? (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomTeamMembers;
