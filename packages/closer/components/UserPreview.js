import Image from 'next/image';
import Link from 'next/link';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import Heading from './ui/Heading';

import { cdn } from '../utils/api';

const UserBookingPreview = ({
  user
}) => {

  const photoUrl = user ? `${cdn}${user.get('photo')}-profile-lg.jpg` : null;

  if (!user) return null;

  return (
    <div className="sm:max-w-[330px] min-w-[220px] max-w-full w-full sm:w-1/3 bg-white rounded-lg p-4 shadow-xl flex-1  flex flex-col ">
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
            <FaUser className="text-success w-[3opx] h-[30px] " />
          )}
          </div>
        </div>
        <div>
          <Heading level={3}>
            {user.get('screenname')}
          </Heading>
          <p className="text-sm italic">
            {user.get('about')}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default UserBookingPreview;
