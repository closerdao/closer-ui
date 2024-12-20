import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import api, { formatSearch } from '../utils/api';
import Autocomplete from './Autocomplete';
import ProfilePhoto from './ProfilePhoto';

const UserList = ({
  channel,
  limit,
  title,
  titleLink,
  canInviteUsers,
  seeAllLink,
}) => {
  const t = useTranslations();

  const [users, setUsers] = useState([]);
  const [error, setErrors] = useState(false);

  const addMember = async (member) => {
    try {
      await api.post(`/moderator/channel/${channel}/add`, member);
      setUsers(users.concat(member));
    } catch (err) {
      console.error(err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const where = channel && {
          viewChannels: channel,
        };
        const params = {
          where: where && formatSearch(where),
          sort_by: '-created',
          limit,
        };
        const {
          data: { results },
        } = await api.get('/user', { params });
        setUsers(results);
      } catch (err) {
        console.error(err);
        setErrors(err.message);
      }
    };
    loadData();
  }, [channel, limit, setUsers]);

  return (
    <section className="new-users card">
      <h3 className="card-title">
        {titleLink ? <Link href={titleLink}>{title}</Link> : title}
      </h3>
      <div className="card-body">
        {error && <div className="error">{error}</div>}
        <div className="user-list">
          {users && users.length > 0 ? (
            users.map((user) => (
              <Link
                key={user._id}
                as={`/members/${user.slug}`}
                href="/members/[slug]"
                className="user-preview"
              >
                <ProfilePhoto user={user} size="sm" />
                <span className="ellipsis name">{user.screenname}</span>
              </Link>
            ))
          ) : (
            <p>{t('user_list_empty')}</p>
          )}
        </div>
        {seeAllLink && (
          <div className="see-all">
            <Link href={seeAllLink}>{t('user_list_all')}</Link>
          </div>
        )}
      </div>
      {canInviteUsers && (
        <div className="card-footer">
          <Autocomplete
            endpoint="/user"
            placeholder="Add Member"
            where={{ viewChannels: { $nin: [channel] } }}
            value={users}
            onChange={(list, member, actionType) => {
              if (actionType === 'ADD') {
                addMember(member);
              }
            }}
          />
        </div>
      )}
    </section>
  );
};
UserList.defaultProps = {
  title: 'New Users',
  limit: 12,
  seeAllLink: null,
  titleLink: null,
};

export default UserList;
