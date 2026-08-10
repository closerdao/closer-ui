import Image from 'next/image';
import Link from 'next/link';

import { cdn } from '../../utils/api';
import UserAvatarPlaceholder from '../UserAvatarPlaceholder';

interface Props {
  userInfo: { name: string; photo: string } | null;
  createdBy: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'preview';
}

const UserInfoButton = ({
  userInfo,
  createdBy,
  size,
  variant = 'button',
}: Props) => {
  const avatarPx = size === 'md' ? 80 : 30;

  if (variant === 'preview') {
    return (
      <Link
        passHref
        href={`/members/${createdBy}`}
        className="group flex max-w-full items-center gap-2 rounded-md py-0.5 pr-1 transition-colors hover:bg-accent-light/70"
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral">
          {userInfo?.photo ? (
            <Image
              src={`${cdn}${userInfo.photo}-profile-lg.jpg`}
              alt={userInfo?.name || ''}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <UserAvatarPlaceholder size="md" />
          )}
        </span>
        <span className="truncate text-sm font-medium text-foreground group-hover:text-accent-dark">
          {userInfo?.name || ''}
        </span>
      </Link>
    );
  }

  return (
    <>
      <Link passHref href={`/members/${createdBy}`}>
        <div className="flex items-center justify-center gap-2 rounded-md bg-neutral p-2 py-1.5 text-center hover:bg-accent hover:text-white">
          {userInfo?.photo ? (
            <Image
              src={`${cdn}${userInfo.photo}-profile-lg.jpg`}
              alt={userInfo?.name || ''}
              width={avatarPx}
              height={avatarPx}
              className="rounded-full"
            />
          ) : (
            <UserAvatarPlaceholder size={size === 'md' ? '3xl' : 'md'} />
          )}
          {userInfo?.name || ''}
        </div>
      </Link>
    </>
  );
};

export default UserInfoButton;
