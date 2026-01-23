import Link from 'next/link';

import { FC } from 'react';

import { FaTelegram } from '@react-icons/all-files/fa/FaTelegram';
import { RiFacebookFill } from '@react-icons/all-files/ri/RiFacebookFill';
import { SiInstagram } from '@react-icons/all-files/si/SiInstagram';
import { useConfig } from 'closer';

export const Footer: FC = () => {
  const { INSTAGRAM_URL, FACEBOOK_URL, TEAM_EMAIL } = useConfig() || {};

  return (
    <footer className="w-full mt-16 bg-[#1d1d1f] text-white -mx-4 px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#79FAC1] text-sm font-medium mb-3">
            Building the governance infrastructure for shared abundance
          </p>
          <p className="text-[#a1a1a6] text-sm max-w-xl mx-auto">
            Encoding principles proven across millennia with tools built for tomorrow. 
            Pioneering regenerative villages that unite technology, community & nature.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm">
          <Link href="/philosophy" className="text-white hover:text-[#79FAC1] transition-colors">
            Philosophy
          </Link>
          <span className="text-[#3d3d3d]">·</span>
          <Link href="/philosophy/commons-governance" className="text-[#a1a1a6] hover:text-white transition-colors">
            Commons Governance
          </Link>
          <span className="text-[#3d3d3d]">·</span>
          <Link href="/philosophy/commons-exclosure" className="text-[#a1a1a6] hover:text-white transition-colors">
            Commons Exclosure
          </Link>
          <span className="text-[#3d3d3d]">·</span>
          <Link href="/philosophy/digital-commons" className="text-[#a1a1a6] hover:text-white transition-colors">
            Digital Commons
          </Link>
          <span className="text-[#3d3d3d]">·</span>
          <Link href="/philosophy/shared-abundance" className="text-[#a1a1a6] hover:text-white transition-colors">
            Shared Abundance
          </Link>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          <a
            href="https://t.me/+rdZvSdohTzs0Njlh"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#a1a1a6] hover:bg-[#79FAC1] hover:text-black transition-all"
          >
            <FaTelegram className="w-5 h-5" />
          </a>
          {INSTAGRAM_URL && (
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#a1a1a6] hover:bg-[#79FAC1] hover:text-black transition-all"
            >
              <SiInstagram className="w-5 h-5" />
            </a>
          )}
          {FACEBOOK_URL && (
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer nofollow"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#a1a1a6] hover:bg-[#79FAC1] hover:text-black transition-all"
            >
              <RiFacebookFill className="w-5 h-5" />
            </a>
          )}
        </div>

        {TEAM_EMAIL && (
          <p className="text-center text-[#6e6e73] text-sm mb-8">
            Questions? Reach out at{' '}
            <a href={`mailto:${TEAM_EMAIL}`} className="text-[#a1a1a6] hover:text-white transition-colors">
              {TEAM_EMAIL}
            </a>
          </p>
        )}

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#6e6e73]">
          <p>
            © {new Date().getFullYear()} Closer. The operating system for regenerative communities.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <a 
              href="https://closer.gitbook.io/documentation" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
