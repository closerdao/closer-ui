import React, { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth.js';
import api, { formatSearch } from '../utils/api';
import CreatePost from './CreatePost';
import Post from './Post';

const PostList = ({
  allowCreate,
  channel,
  parentType,
  parentId,
  visibility,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setErrors] = useState(false);
  const [usersById, setUsersById] = useState({});
  const [posts, setPosts] = useState([]);

  if (user && !usersById[user._id]) {
    setUsersById({ ...usersById, [user._id]: user });
  }

  const loadData = async () => {
    try {
      const usersMap = { ...usersById };

      const where = {
        channel,
        parentType,
        parentId,
      };
      const params = where && {
        params: {
          where: formatSearch(where),
          sort_by: '-created',
          limit: 100,
        },
      };
      const {
        data: { results: posts },
      } = await api.get('/post', params);
      setPosts(posts);

      if (posts && posts.length > 0) {
        const usersToLoad = posts.map((post) => post.createdBy);
        const params = {
          where: formatSearch({ _id: { $in: usersToLoad } }),
        };
        const {
          data: { results },
        } = await api.get('/user', { params });
        if (results) {
          results.forEach((u) => {
            usersMap[u._id] = u;
          });
          setUsersById(usersMap);
        }
      }
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [channel, parentType, parentId]);

  return (
    <div>
      {isAuthenticated && allowCreate && (
        <section className="card">
          <CreatePost
            channel={channel}
            visibility={visibility}
            parentType={parentType}
            parentId={parentId}
            addPost={(post) => setPosts([post, ...posts])}
          />
        </section>
      )}
      <section className="post-list">
        {posts.map((post) => (
          <Post
            {...post}
            usersById={usersById}
            setUsersById={setUsersById}
            key={post._id}
          />
        ))}
      </section>
    </div>
  );
};
PostList.defaultProps = {
  parentType: 'channel',
};

export default PostList;
