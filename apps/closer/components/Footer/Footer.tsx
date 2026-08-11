import Link from 'next/link';

import { FC } from 'react';

import { FaTelegram } from '@react-icons/all-files/fa/FaTelegram';
import { RiFacebookFill } from '@react-icons/all-files/ri/RiFacebookFill';
import { SiInstagram } from '@react-icons/all-files/si/SiInstagram';
import { useConfig } from 'closer';

const DOCS_URL = 'https://closer.gitbook.io/documentation';
const OASA_URL = 'https://oasa.earth';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const platformLinks: FooterLink[] = [
  { label: 'Why regenerative hubs', href: '/#why' },
  { label: 'How it works', href: '/#how' },
  { label: 'Features', href: '/#features' },
  { label: 'Village Fund', href: '/#fund' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Closer Agent', href: '/agent' },
];

// Philosophy sub-pages are reachable from /philosophy itself — one link is enough here.
const exploreLinks: FooterLink[] = [
  { label: 'Communities', href: '/#communities' },
  { label: 'Map', href: '/map' },
  { label: 'Ambassadors', href: '/ambassadors' },
  { label: 'Villages', href: '/villages' },
  { label: 'Philosophy', href: '/philosophy' },
  { label: 'Blog', href: '/blog' },
  { label: 'Resources', href: '/resources' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'OASA', href: OASA_URL, external: true },
];

const companyLinks: FooterLink[] = [
  { label: 'Invest', href: '/invest' },
  // Roles is behind the same flag that gates it in the nav.
  ...(process.env.NEXT_PUBLIC_FEATURE_ROLES === 'true'
    ? [{ label: 'Work with us', href: '/roles' }]
    : []),
  { label: 'Documentation', href: DOCS_URL, external: true },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

const FooterColumn: FC<{ title: string; links: FooterLink[] }> = ({
  title,
  links,
}) => (
  <div>
    <h3 className="text-xs uppercase tracking-[0.18em] text-accent-foreground font-semibold mb-4">
      {title}
    </h3>
    <ul className="flex flex-col gap-2.5">
      {links.map((link) => (
        <li key={`${link.label}-${link.href}`}>
          {link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#4A6357] hover:text-accent-foreground transition-colors"
            >
              {link.label}
            </a>
          ) : (
            <Link
              href={link.href}
              className="text-sm text-[#4A6357] hover:text-accent-foreground transition-colors"
            >
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export const Footer: FC = () => {
  const { INSTAGRAM_URL, FACEBOOK_URL, TEAM_EMAIL } = useConfig() || {};

  return (
    <footer className="w-full bg-accent-light text-accent-foreground px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 md:gap-8 mb-14">
          <div className="max-w-xs">
            <p className="font-serif text-2xl mb-3">
              Build your village,{' '}
              <em className="italic text-accent-alt-dark">
                not your software.
              </em>
            </p>
            <p className="text-sm text-[#4A6357] leading-relaxed">
              The operating system for regenerative communities — part of the
              OASA network, moving land from ownership to stewardship.
            </p>
          </div>

          <FooterColumn title="Platform" links={platformLinks} />
          <FooterColumn title="Explore" links={exploreLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        <div className="flex gap-3 mb-10">
          <a
            href="https://t.me/+rdZvSdohTzs0Njlh"
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
            className="w-10 h-10 rounded-full bg-accent-foreground/5 flex items-center justify-center text-[#4A6357] hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <FaTelegram className="w-5 h-5" />
          </a>
          {INSTAGRAM_URL && (
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-accent-foreground/5 flex items-center justify-center text-[#4A6357] hover:bg-accent hover:text-accent-foreground transition-all"
            >
              <SiInstagram className="w-5 h-5" />
            </a>
          )}
          {FACEBOOK_URL && (
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer nofollow"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-accent-foreground/5 flex items-center justify-center text-[#4A6357] hover:bg-accent hover:text-accent-foreground transition-all"
            >
              <RiFacebookFill className="w-5 h-5" />
            </a>
          )}
        </div>

        <div className="border-t border-accent-foreground/10 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-[#4A6357]">
          <p>
            © {new Date().getFullYear()} Closer, part of{' '}
            <b className="text-accent-foreground">OASA</b> — from ownership to
            stewardship.
          </p>
          {TEAM_EMAIL && (
            <a
              href={`mailto:${TEAM_EMAIL}`}
              className="hover:text-accent-foreground transition-colors"
            >
              {TEAM_EMAIL}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};
