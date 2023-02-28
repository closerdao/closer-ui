import Link from 'next/link';

import React, { useEffect, useState } from 'react';
import Linkify from 'react-linkify';

import { useAuth } from '../contexts/auth.js';
import api, { cdn, formatSearch } from '../utils/api';
import { __ } from '../utils/helpers';
import CreatePost from './CreatePost';
import ProfilePhoto from './ProfilePhoto';
import TimeSince from './TimeSince';

const Post = ({
  _id,
  attachment,
  channel,
  tags,
  createdBy,
  created,
  content,
  photo,
  replyCount,
  showChannel,
  usersById,
  setUsersById,
  channelsById,
}) => {
  const [posts, setPosts] = useState([]);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [error, setErrors] = useState(null);
  const [deleted, setDeleted] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(replyCount || 0);
  const { user, isAuthenticated } = useAuth();

  const deletePost = async () => {
    if (confirm('Really delete this post?')) {
      try {
        await api.delete(`/post/${_id}`);
        setDeleted(true);
      } catch (err) {
        setErrors(err.message);
      }
    }
  };

  // Load replies
  useEffect(() => {
    const loadData = async () => {
      try {
        const usersMap = { ...usersById };

        const where = {
          channel,
          parentType: 'post',
          parentId: _id,
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
          const usersToLoad = posts
            .map((post) => post.createdBy)
            .filter((u) => !usersById[u]);
          if (usersToLoad.length > 0) {
            const params = {
              where: formatSearch({ _id: { $in: usersToLoad } }),
            };
            const {
              data: { results: users },
            } = await api.get('/user', { params });
            if (setUsersById) {
              users.forEach((u) => {
                usersMap[u._id] = u;
              });
              setUsersById(usersMap);
            }
          }
        }
        // Add current user to map in case of posting
      } catch (err) {
        console.log('Load error', err);
        setErrors(err.message);
      }
    };
    loadData();
  }, [_id, channel, setUsersById, usersById]);

  if (deleted) {
    return (
      <div className="post card">
        <div className="card-body">
          <h3>{__('post_delete_message')}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="post card">
      {showChannel && channel && channelsById[channel] && (
        <div className="card-title">
          <i>
            In #
            <Link
              as={`/channel/${
                channelsById[channel] ? channelsById[channel].slug : channel
              }`}
              href="/channel/[channel]"
            >

              {channelsById[channel]
                ? channelsById[channel].name
                : 'unknown channel'}

            </Link>
          </i>
        </div>
      )}
      <div className="card-title">
        {usersById[createdBy] && (
          (<Link
            key={createdBy}
            as={`/members/${usersById[createdBy].slug}`}
            href="/members/[slug]"
            className="from user-preview flex flex-row justify-start items-center">

            <ProfilePhoto size="sm" user={usersById[createdBy]} />
            <span className="name ml-4">
              {usersById[createdBy].screenname}
            </span>

          </Link>)
        )}
        <TimeSince time={created} />
      </div>
      {photo && (
        <div className="card-body">
          <img src={`${cdn}${photo}-max-lg.jpg`} alt="" />
        </div>
      )}
      {error && (
        <div className="card-body">
          <div className="validation-error">{error}</div>
        </div>
      )}
      <div className="card-body">
        <div className="body">
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <a
                target="_blank"
                rel="nofollow noreferrer"
                href={decoratedHref}
                key={key}
                onClick={(e) => e.stopPropagation()}
              >
                {decoratedText}
              </a>
            )}
          >
            {content}
          </Linkify>
        </div>
        {tags && tags.length > 0 && (
          <div className="tags">
            {tags.map((tag) => (
              (<Link key={tag} as={`/search/${tag}`} href="/search/[keyword]" className="tag">

                <span className="ellipsis">{tag}</span>

              </Link>)
            ))}
          </div>
        )}
      </div>
      {attachment && (
        <div className="card-body">
          {attachment.image && attachment.image && (
            <a href={attachment.url} target="_blank" rel="nofollow noreferrer">
              <img src={attachment.image} alt={`${attachment.url} preview`} />
            </a>
          )}
          {attachment.title && (
            <h3>
              <a
                href={attachment.url}
                target="_blank"
                rel="nofollow noreferrer"
              >
                {attachment.title}
              </a>
            </h3>
          )}
          {attachment.description && <p>{attachment.description}</p>}
        </div>
      )}
      {isAuthenticated && (
        <div className="card-footer">
          <div className="action-row">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setRepliesOpen(!repliesOpen);
              }}
            >
              {localReplyCount} {__('post_replies')}
            </a>
            {createdBy === user._id && (
              <a
                href="#"
                className="danger-link"
                onClick={(e) => {
                  e.preventDefault();
                  deletePost();
                }}
              >
                {__('post_delete')}
              </a>
            )}
          </div>
        </div>
      )}
      {isAuthenticated && repliesOpen && (
        <div className="card-footer">
          <div className="replies">
            <div className="reply-body">
              <CreatePost
                isReply
                channel={channel}
                parentType={'post'}
                parentId={_id}
                addPost={(post) => {
                  setPosts([post, ...posts]);
                  setLocalReplyCount(localReplyCount + 1);
                }}
              />
              {posts.map(
                (post) =>
                  usersById[post.createdBy] && (
                    <div className="reply" key={post._id}>
                      {post.photo && (
                        <div className="reply-photo">
                          <img src={`${cdn}${post.photo}-max-lg.jpg`} alt="" />
                        </div>
                      )}
                      <div className="flex flex-row items-center">
                        <Link
                          as={`/members/${usersById[post.createdBy].slug}`}
                          href="/members/[slug]"
                          className="from user-preview mr-2">

                          <ProfilePhoto
                            size="sm"
                            user={usersById[post.createdBy]}
                          />

                        </Link>
                        <p>
                          <b className="mr-2">
                            {usersById[post.createdBy].screenname ||
                              'Anonymous otter'}
                            :{' '}
                          </b>
                          {post.content}
                        </p>
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
Post.defaultProps = {
  replyCount: 0,
};

export default Post;
