import { FC } from 'react';

import {
  Calculator,
  Globe,
  Heart,
  House,
  KeyRound,
  LucideIcon,
  PenTool,
  Share2,
  Shield,
  Star,
  Tag,
  Trees,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export type RoleTagSize = 'sm' | 'md';

type RoleStyle = {
  /** Shown before the label, tinted with the role's accent. */
  Icon: LucideIcon;
  iconClassName: string;
  className: string;
  /**
   * Translation key for the label. Defaults to `role_tag_<role>`, which is only
   * spelled out here for roles that already have a label elsewhere.
   */
  labelKey?: string;
};

const DEFAULT_STYLE: RoleStyle = {
  Icon: Tag,
  iconClassName: 'text-gray-400',
  className: 'border-gray-200 bg-gray-50 text-gray-600',
};

const ROLE_STYLES: Record<string, RoleStyle> = {
  ambassador: {
    Icon: Globe,
    iconClassName: 'text-[#0FA968]',
    className: 'border-[#C2F0DA] bg-[#E2FAEE] text-[#0B7A4C]',
    labelKey: 'ambassadors_badge_label',
  },
  member: {
    Icon: Star,
    iconClassName: 'text-amber-500',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  citizen: {
    Icon: Star,
    iconClassName: 'text-amber-500',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    labelKey: 'role_tag_member',
  },
  steward: {
    Icon: Shield,
    iconClassName: 'text-teal-500',
    className: 'border-teal-200 bg-teal-50 text-teal-700',
  },
  admin: {
    Icon: KeyRound,
    iconClassName: 'text-rose-500',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  'space-host': {
    Icon: House,
    iconClassName: 'text-sky-500',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  team: {
    Icon: Users,
    iconClassName: 'text-violet-500',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  'community-curator': {
    Icon: Heart,
    iconClassName: 'text-fuchsia-500',
    className: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  },
  'content-creator': {
    Icon: PenTool,
    iconClassName: 'text-orange-500',
    className: 'border-orange-200 bg-orange-50 text-orange-700',
  },
  'land-manager': {
    Icon: Trees,
    iconClassName: 'text-lime-600',
    className: 'border-lime-200 bg-lime-50 text-lime-700',
  },
  accounting: {
    Icon: Calculator,
    iconClassName: 'text-slate-400',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  'affiliate-manager': {
    Icon: Share2,
    iconClassName: 'text-cyan-500',
    className: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  },
};

const SIZE_CLASSES: Record<RoleTagSize, string> = {
  sm: 'text-[11px] px-2.5 py-1',
  md: 'text-[12.5px] px-3.5 py-1.5',
};

const ICON_CLASSES: Record<RoleTagSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
};

/**
 * `member` and `citizen` are the same standing to a reader, so both roles
 * collapse onto one tag — a profile carrying both shows a single Citizen chip.
 */
export const getRoleTagKey = (role: string) =>
  role === 'citizen' ? 'member' : role;

type RoleTagProps = {
  role: string;
  size?: RoleTagSize;
  className?: string;
};

const RoleTag: FC<RoleTagProps> = ({ role, size = 'sm', className = '' }) => {
  const t = useTranslations();
  const { Icon, iconClassName, ...style } = ROLE_STYLES[role] || DEFAULT_STYLE;
  const labelKey = style.labelKey || `role_tag_${role}`;
  // Roles come from the API, so a brand new one can reach this before it has a
  // translation — fall back to the role name with its dashes opened up.
  const label = t.has(labelKey) ? t(labelKey) : role.replace(/-/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.1em] whitespace-nowrap ${style.className} ${SIZE_CLASSES[size]} ${className}`}
    >
      <Icon
        className={`shrink-0 ${ICON_CLASSES[size]} ${iconClassName}`}
        strokeWidth={2.5}
        aria-hidden="true"
      />
      {label}
    </span>
  );
};

export default RoleTag;
