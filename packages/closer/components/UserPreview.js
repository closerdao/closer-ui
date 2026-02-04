import Image from 'next/image';
import Link from 'next/link';

import { User } from 'lucide-react';

import { cdn } from '../utils/api';
import Heading from './ui/Heading';

const UserBookingPreview = ({ user }) => {
  const photoUrl =
    user && user.get('photo')
      ? `${cdn}${user.get('photo')}-profile-lg.jpg`
      : null;

  if (!user) return null;

  return (
    <div className="sm:max-w-[330px] min-w-[220px] max-w-full w-full sm:w-1/3 bg-dominant rounded-lg p-4 shadow-xl flex-1  flex flex-col ">
      <Link passHref href={`/members/${user.get('slug')}`}>
        <div className="rounded-md flex items-center gap-2 justify-center">
          <div className="mb-2">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={user.get('screenname')}
                width={160}
                height={160}
                className="rounded-full"
              />
            ) : (
              <div className="rounded-full overflow-hidden">
                <User className="text-neutral w-[160px] h-[160px]" />
              </div>
            )}
          </div>
        </div>
        <div>
          <Heading level={3}>{user.get('screenname')}</Heading>
          <p className="text-sm italic">{user.get('about')}</p>
        </div>
      </Link>
    </div>
  );
};

export default UserBookingPreview;
