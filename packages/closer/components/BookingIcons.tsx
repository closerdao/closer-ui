import {
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineChevronLeft,
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineMail,
  HiOutlineUsers,
  HiOutlineXCircle,
} from 'react-icons/hi';
import { FaBirthdayCake, FaCircle, FaUtensils, FaWrench } from 'react-icons/fa';

const iconSize = 22;
const iconClass = 'shrink-0 text-foreground';

interface IconProps {
  className?: string;
}

export const IconCalendar = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineCalendar size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconHome = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineHome size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconBanknote = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineCurrencyDollar size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconFileText = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineDocumentText size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconUtensils = ({ className = 'mr-2' }: IconProps) => (
  <FaUtensils size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconClipboardList = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineClipboardList size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconPartyPopper = ({ className = 'mr-2' }: IconProps) => (
  <FaBirthdayCake size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconCheckCircle = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineCheckCircle size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconXCircle = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineXCircle size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconMail = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineMail size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconUsers = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineUsers size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconCircle = ({ className = 'mr-2' }: IconProps) => (
  <FaCircle size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconChevronLeft = ({ className = 'mr-2' }: IconProps) => (
  <HiOutlineChevronLeft size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
export const IconWrench = ({ className = 'mr-2' }: IconProps) => (
  <FaWrench size={iconSize} className={`${iconClass} ${className}`} aria-hidden />
);
