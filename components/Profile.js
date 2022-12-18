import Link from 'next/link';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import { useAuth } from '../contexts/auth.js';
import { cdn } from '../utils/api';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-row items-start">
      <div className="absolute z-10 left-0 top-0 right-0">
        <div className="flex mb-4 justify-center items-center">
          {user.photo ? (
            <img
              src={`${cdn}${user.photo}-profile-lg.jpg`}
              loading="lazy"
              alt={user.screenname}
              className="w-32 md:w-44 mt-4 md:mt-0 rounded-full"
            />
          ) : (
            <FaUser className="text-gray-200 text-6xl" />
          )}
        </div>
      </div>
      <div className="space-y-5 w-full card pt-20">
        <div className="text-center w-full">
          <h3 className="font-medium text-5xl md:text-6xl">
            {user.screenname}
          </h3>

          <div className="mt-1 w-full">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
