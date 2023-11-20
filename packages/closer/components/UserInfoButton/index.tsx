import Image from 'next/image';
import Link from 'next/link';

import React from 'react';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import { cdn } from '../../utils/api';

interface Props {
  userInfo: { name: string; photo: string } | null;
  createdBy: string;
}

const UserInfoButton = ({ userInfo, createdBy }: Props) => {
  return (
    <>
      <Link passHref href={`/members/${createdBy}`}>
        <div className="bg-neutral rounded-md py-1.5 text-center flex items-center gap-2 hover:bg-accent hover:text-white justify-center">
          {userInfo?.photo ? (
            <Image
              src={`${cdn}${userInfo.photo}-profile-lg.jpg`}
              alt={userInfo?.name || ''}
              width={30}
              height={30}
              className="rounded-full"
            />
          ) : (
            <FaUser className="text-success w-[3opx] h-[30px] " />
          )}
          {userInfo?.name || ''}
        </div>
      </Link>
    </>
  );
};

export default UserInfoButton;
