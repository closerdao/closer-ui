import Link from 'next/link';

import React, { useEffect, useMemo, useState } from 'react';

import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import Pagination from './Pagination';
import ProfilePhoto from './ProfilePhoto';

const MemberList = ({ list, preview, channel, filter, title, limit }) => {
  const { platform } = usePlatform();
  const [page, setPage] = useState(1);
  const [error, setErrors] = useState(false);
  const where = Object.assign(
    {},
    filter,
    channel && {
      category: channel,
    },
  );
  const params = useMemo(
    () => ({ where, sort_by: 'created', limit, page }),
    [where, limit, page],
  );
  const users = platform.user.find(params);
  const totalUsers = platform.user.findCount(params);

  const loadData = async () => {
    try {
      await Promise.all([
        platform.user.get(params),
        platform.user.getCount(params),
      ]);
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [channel, filter, limit, page]);

  return (
    <section className="member-page">
      <h3 className="mt-9 mb-8 text-4xl font-light">
        {title || 'Community members'}
      </h3>
      {error && <div className="validation-error">{error}</div>}
      <div
        className={`grid gap-6 ${
          list ? 'md:grid-cols-1' : 'md:grid-cols-2'
        }  justify-start items-start mb-4`}
      >
        {users && users.count() > 0 ? (
          users.map((user) => (
            <Link
              key={user.get('_id')}
              passHref
              as={`/members/${user.get('slug')}`}
              href="/members/[slug]"
              legacyBehavior
            >
              <div className="flex flex-row items-center w-full card cursor-pointer">
                <div className="w-20 mr-4">
                  <ProfilePhoto user={user.toJS()} size="20" />
                </div>
                <div className="flex flex-col justify-start">
                  <h4 className="font-light text-2xl md:text-2xl">
                    {user.get('screenname')}
                    <span className="ml-3 text-xs text-gray-500">
                      {user.get('timezone')}
                    </span>
                  </h4>
                  {user.get('about') && (
                    <p className="py-2 text-sm">
                      {preview
                        ? user.get('about').substring(0, 120).concat('...')
                        : user.get('about')}
                    </p>
                  )}
                  <div className="pt-2 text-accent">
                    {__('member_list_see_profile')}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p>{__('member_list_error_message')}</p>
        )}
      </div>

      <div className="card-footer">
        <Pagination
          loadPage={(page) => {
            setPage(page);
            loadData();
          }}
          page={page}
          limit={limit}
          total={totalUsers}
          items={users}
        />
      </div>
    </section>
  );
};
MemberList.defaultProps = {
  limit: 50,
};

export default MemberList;
