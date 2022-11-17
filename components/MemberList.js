import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useMemo, useState } from 'react';


import { useAuth } from '../contexts/auth.js';
import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import Loading from './Loading';
import Pagination from './Pagination';
import ProfilePhoto from './ProfilePhoto';

const MemberList = ({
  list,
  preview,
  card,
  children,
  channel,
  filter,
  title,
  limit,
}) => {
  const { user } = useAuth();
  const { platform } = usePlatform();
  const [page, setPage] = useState(1);
  const [error, setErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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
      {loading ? (
        <Loading />
      ) : (
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
              >
                <div className="flex flex-col justify-start card">
                  <div className="flex flex-row items-center justify-between w-full">
                    <h4 className="font-light text-2xl md:text-2xl">
                      {user.get('screenname')}
                      <span className="ml-3 text-xs text-gray-500">
                        {user.get('timezone')}
                      </span>
                    </h4>
                    <ProfilePhoto user={user.toJS()} width="12" height="12" />
                  </div>
                  {user.get('about') && (
                    <p className="py-2 text-sm">
                      {preview
                        ? user.get('about').substring(0, 120).concat('...')
                        : user.get('about')}
                    </p>
                  )}
                  <div className="pt-2">
                    <button className="btn-primary">
                      {__('member_list_see_profile')}
                    </button>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>{__('member_list_error_message')}</p>
          )}
        </div>
      )}
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
