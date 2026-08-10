import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../contexts/platform';
import Loading from './Loading';
import Pagination from './Pagination';
import ProfilePhoto from './ProfilePhoto';
import Tag from './Tag';
import TimeSince from './TimeSince';

const UsersTable = ({ where = {}, limit = 50 }) => {
  const t = useTranslations();

  const { platform } = usePlatform();
  const [page, setPage] = useState(1);
  const [addRole, setAddRole] = useState({});
  const [error, setErrors] = useState(false);
  const params = useMemo(
    () => ({ where, sort_by: '-created', limit, page }),
    [where, limit, page],
  );
  const users = platform.user.find(params);
  const totalUsers = platform.user.findCount(params);
  const loading = platform.user.areLoading(params);

  const loadData = async () => {
    try {
      await Promise.all([
        platform.user.get(params),
        platform.user.getCount(params),
      ]);
    } catch (err) {
      console.error(err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [where, page, params, limit]);

  return (
    <div className="card">
      {loading ? (
        <Loading />
      ) : users && users.count() > 0 ? (
        <div className="users-table -mt-4 -ml-4 -mr-4">
          {error && <div className="error">{error}</div>}
          <table className="table-auto w-full">
            <thead className="card-header text-xs font-semibold uppercase text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300">
              <tr>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">
                    {t('users_table_name')}
                  </div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">
                    {t('users_table_created')}
                  </div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">
                    {t('users_table_roles')}
                  </div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">
                    {t('users_table_email')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y bg-gray-200 dark:bg-gray-700 divide-gray-50 dark:divide-gray-800">
              {users.map((row) => {
                // Fetch the itemized object which can have been patched
                const user = platform.user.findOne(row.get('_id'));
                return (
                  <tr key={row.get('_id')}>
                    <td className="p-2 whitespace-nowrap">
                      <span className="flex items-center">
                        <span className="w-10 h-10 flex-shrink-0 mr-2 sm:mr-3">
                          <Link href={`/members/${user.get('slug')}`}>
                            <ProfilePhoto user={user.toJS()} size="sm" />
                          </Link>
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          <Link href={`/members/${user.get('slug')}`}>
                            {user.get('screenname')}
                          </Link>
                        </span>
                      </span>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          <TimeSince time={user.get('created')} />
                        </div>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <div className="space-x-2 space-y-2 flex flex-wrap justify-start items-center">
                        {user.get('roles') &&
                          user.get('roles').map((role) => (
                            <Tag
                              key={role}
                              color="primary"
                              remove={() =>
                                platform.user.patch(user.get('_id'), {
                                  roles: user
                                    .get('roles')
                                    .filter((r) => r !== role),
                                })
                              }
                            >
                              {role}
                            </Tag>
                          ))}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (addRole[user.get('_id')]) {
                              platform.user.patch(user.get('_id'), {
                                roles: user
                                  .get('roles')
                                  .concat(addRole[user.get('_id')]),
                              });
                              setAddRole({
                                ...addRole,
                                [user.get('_id')]: '',
                              });
                            } else {
                              alert('Cannot add empty role!');
                            }
                          }}
                        >
                          <input
                            type="text"
                            className="p-2"
                            value={addRole[user.get('_id')] || ''}
                            placeholder="Add role"
                            onChange={(e) => {
                              setAddRole({
                                ...addRole,
                                [user.get('_id')]: e.target.value,
                              });
                            }}
                          />
                        </form>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        <Link href={`mailto:${user.get('email')}`}>
                          {user.get('email')}
                        </Link>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
        </div>
      ) : (
        <div className="p-8 text-center">
          <i>{t('users_table_empty')}</i>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
