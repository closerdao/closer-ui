import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { usePlatform } from '../contexts/platform';
import Pagination from './Pagination';
import ProfilePhoto from './ProfilePhoto';
import { useTranslations } from 'next-intl';


/**
 * @param {Object} props
 * @param {boolean} [props.list]
 * @param {boolean} [props.preview]
 * @param {boolean} [props.showTitle]
 * @param {string} [props.channel]
 * @param {Object} [props.filter]
 * @param {string} [props.title]
 * @param {number} [props.limit]
 */
const MemberList = ({
  list = false,
  preview = false,
  showTitle = true,
  channel,
  filter,
  title,
  limit = 50,
}) => {
  const t = useTranslations();

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
    <section className={list ? '' : 'member-page'}>
      {showTitle && (
        <h3 className="mt-9 mb-8 text-4xl font-light">
          {title || t('members_community_members')}
        </h3>
      )}
      {error && <div className="validation-error">{error}</div>}
      <div
        className={
          list
            ? 'flex flex-col gap-1'
            : 'grid gap-6 md:grid-cols-2 justify-start items-start mb-4'
        }
      >
        {users && users.count() > 0 ? (
          users.map((user) =>
            list ? (
              <Link
                key={user.get('_id')}
                href={`/members/${user.get('slug')}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-light transition-colors"
              >
                <ProfilePhoto user={user.toJS()} size="10" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.get('screenname')}
                  </p>
                  {user.get('about') && (
                    <p className="text-xs text-gray-500 truncate">
                      {user.get('about').substring(0, 80)}
                    </p>
                  )}
                </div>
              </Link>
            ) : (
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
                      {t('member_list_see_profile')}
                    </div>
                  </div>
                </div>
              </Link>
            ),
          )
        ) : (
          <p className="text-sm text-gray-500">{t('member_list_error_message')}</p>
        )}
      </div>

      {!list && (
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
      )}
    </section>
  );
};
export default MemberList;
