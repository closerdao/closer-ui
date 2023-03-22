import Link from 'next/link';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import { useAuth } from '../contexts/auth';
import { cdn } from '../utils/api';
import { __ } from '../utils/helpers.js';

const Profile = () => {
  const { user } = useAuth();
  return (
    <div className="w-full">
      <div className="flex justify-center items-center w-24 h-24 absolute left-0 right-0 mx-auto -translate-y-1/2 z-20">
        <Link
          href={`/members/${user?.slug}`}
          passHref
          title="View profile"
          className="md:flex md:flex-row items-center cursor-pointer"
        >
          {user.photo ? (
            <img
              src={`${cdn}${user.photo}-profile-lg.jpg`}
              loading="lazy"
              alt={user.screenname}
              className="w-32 md:w-44 rounded-full"
            />
          ) : (
            <FaUser className="text-gray-200 text-6xl" />
          )}
        </Link>
      </div>

      <div className="pt-14 px-4 pb-8 shadow-xl relative rounded-lg w-full">
        <div className="text-center">
          <p className="font-black uppercase">{user.screenname}</p>
          <p>{__('navigation_member')}</p>
          {/* <div className="mt-1 w-full">
            {user.roles && (
              <div className="text-sm mt-1 tags">
                {user.roles.map((role) => (
                  <Link
                    as={`/members?role=${encodeURIComponent(role)}`}
                    href="/members"
                    key={role}
                  >
                    <a className="tag">{role}</a>
                  </Link>
                ))}
              </div>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Profile;
