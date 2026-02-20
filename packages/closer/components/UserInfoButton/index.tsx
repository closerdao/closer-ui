import Image from 'next/image';
import Link from 'next/link';

import { cdn } from '../../utils/api';
import UserAvatarPlaceholder from '../UserAvatarPlaceholder';

interface Props {
  userInfo: { name: string; photo: string } | null;
  createdBy: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserInfoButton = ({ userInfo, createdBy, size }: Props) => {
  return (
    <>
      <Link passHref href={`/members/${createdBy}`}>
        <div className="p-2 bg-neutral rounded-md py-1.5 text-center flex items-center gap-2 hover:bg-accent hover:text-white justify-center">
          {userInfo?.photo ? (
            <Image
              src={`${cdn}${userInfo.photo}-profile-lg.jpg`}
              alt={userInfo?.name || ''}
              width={size === 'md' ? 80 : 30}
              height={size === 'md' ? 80 : 30}
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
