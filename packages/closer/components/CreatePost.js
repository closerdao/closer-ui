import Link from 'next/link';

import React, { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import api, { cdn } from '../utils/api';
import { getHashTags, getUrls } from '../utils/helpers';
import { __ } from '../utils/helpers';
import UploadPhoto from './UploadPhoto';

const filterTags = (tags) => Array.from(new Set(tags));

const CreatePost = ({
  addPost,
  channel,
  parentType,
  parentId,
  isReply,
  visibility,
}) => {
  const { isAuthenticated } = useAuth();
  const [error, setErrors] = useState(null);
  const initialPost = {
    content: '',
    tags: [],
    attachment: null,
  };
  const [newPost, setNewPost] = useState(initialPost);
  const [exploredUrls, setExploredUrls] = useState([]);
  const fetchUrlMeta = async (url) => {
    try {
      const {
        data: { results: attachment },
      } = await api.get(`/url-lookup/${encodeURIComponent(url)}`);
      setNewPost({ ...newPost, attachment });
    } catch (err) {
      console.warn('Failed to fetch attached URL', url, err);
    }
  };
  useEffect(() => {
    if (!newPost.attachment) {
      const urls = getUrls(newPost.content);
      for (const url of urls) {
        if (!exploredUrls.includes(url)) {
          fetchUrlMeta(url);
          setExploredUrls([...exploredUrls, url]);
          return;
        }
      }
    }
  }, [newPost]);
  const updateContent = (content) => {
    const postTags = getHashTags(content) || [];
    setNewPost({
      ...newPost,
      content,
      tags: filterTags(postTags),
    });
  };

  const postToChannel = async (request) => {
    try {
      const {
        data: { results: post },
      } = await api.post('/post', {
        ...request,
        channel,
        parentType,
        parentId,
        visibility,
      });
      addPost(post);
      setNewPost(initialPost);
      setErrors(null);
    } catch (err) {
      console.log(err);
      setErrors(err.response?.data?.error || err.message);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <form
      action="#"
      className="create-post"
      onSubmit={(e) => {
        e.preventDefault();
        postToChannel(newPost);
      }}
    >
      {!isReply && (
        <div className="card-title">
          <h3>{__('create_post_title')}</h3>
        </div>
      )}
      {newPost.photo && (
        <div className="card-body">
          <img src={`${cdn}${newPost.photo}-post-md.jpg`} alt="" />
        </div>
      )}
      <div className="card-body">
        {error && <div className="validation-error">{error}</div>}
        <div className="form-row">
          {isReply ? (
            <input
              type="text"
              value={newPost.content}
              placeholder={'Add reply'}
              onKeyPress={(e) => {
                if (e.which === 13) {
                  e.preventDefault();
                  e.stopPropagation();
                  postToChannel(newPost);
                }
              }}
              onChange={(e) => updateContent(e.target.value)}
            />
          ) : (
            <textarea
              type="text"
              value={newPost.content}
              placeholder={'What would you like to share with the community?'}
              onChange={(e) => updateContent(e.target.value)}
            />
          )}
        </div>
        {newPost.attachment && (
          <div className="card-body">
            <a
              className="danger-link"
              href="#"
              onClick={() => setNewPost({ ...newPost, attachment: null })}
            >
              {__('create_post_remove')}
            </a>
            {newPost.attachment.image && newPost.attachment.image && (
              <a
                href={newPost.attachment.url}
                target="_blank"
                rel="noreferrer nofollow"
              >
                <img src={newPost.attachment.image} alt="" />
              </a>
            )}
            {newPost.attachment.title && (
              <h3>
                <a
                  href={newPost.attachment.url}
                  target="_blank"
                  rel="noreferrer nofollow"
                >
                  {newPost.attachment.title}
                </a>
              </h3>
            )}
            {newPost.attachment.description && (
              <p>{newPost.attachment.description}</p>
            )}
          </div>
        )}
        {!isReply && (
          <div className="form-row">
            <div className="tags">
              {newPost.tags &&
                newPost.tags.length > 0 &&
                newPost.tags.map((tag) => (
                  <Link
                    key={tag}
                    as={`/search/${tag}`}
                    href="/search/[keyword]"
                    className="tag"
                  >
                    <span className="ellipsis">{tag}</span>
                  </Link>
                ))}
              {/* <input
                type="text"
                className="inline"
                placeholder="add tag"
                value={ addTag }
                title="You can also write #tag in your post content."
                onKeyPress={ e => {
                  if (e.which === 13) {
                    e.preventDefault();
                    e.stopPropagation();
                    setNewPost({...newPost, tags: filterTags(newPost.tags.concat(addTag)) });
                    addManualTag(addTag);
                    setAddTag('');
                  }
                }}
                onChange={e => setAddTag(e.target.value)}
              /> */}
            </div>
          </div>
        )}
      </div>
      {!isReply && (
        <div className="card-footer">
          <div className="flex flex-row justify-between items-end">
            <UploadPhoto
              isMinimal
              onSave={(id) => setNewPost({ ...newPost, photo: id })}
              label={newPost.photo ? 'Change photo' : 'Add photo'}
            />
            <div>
              <button
                type="submit"
                className="btn-primary"
                disabled={newPost.content.length === 0}
              >
                {__('create_post_submit_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
CreatePost.defaultProps = {
  visibility: 'private',
  isReply: false,
};

export default CreatePost;
