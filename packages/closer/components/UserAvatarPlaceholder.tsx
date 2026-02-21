import { FC } from 'react';

import { User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const sizeMap = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
  '3xl': 'w-20 h-20',
  '4xl': 'w-36 h-36 md:w-48 md:h-48',
  '5xl': 'w-[160px] h-[160px]',
};

const iconSizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
  '2xl': 'w-8 h-8',
  '3xl': 'w-10 h-10',
  '4xl': 'w-16 h-16',
  '5xl': 'w-20 h-20',
};

type Size = keyof typeof sizeMap;

interface Props {
  size?: Size;
  className?: string;
}

const UserAvatarPlaceholder: FC<Props> = ({ size = 'md', className }) => {
  return (
    <div
      className={twMerge(
        'rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0',
        sizeMap[size],
        className,
      )}
    >
      <User className={twMerge('text-gray-400', iconSizeMap[size])} />
    </div>
  );
};

export default UserAvatarPlaceholder;
