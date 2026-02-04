import Image from 'next/image';
import Link from 'next/link';

import { User } from 'lucide-react';

import { cdn } from '../../utils/api';

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
            <User className={`text-success ${size === 'md' ? 'w-20 h-20' : 'w-8 h-8'}`} />
          )}
          {userInfo?.name || ''}
        </div>
      </Link>
    </>
  );
};

export default UserInfoButton;
