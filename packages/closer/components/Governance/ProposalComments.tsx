import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { Proposal } from 'closer/types';
import { useTranslations } from 'next-intl';

interface ProposalCommentsProps {
  proposal: Proposal;
  className?: string;
}

interface Comment {
  _id: string;
  content: string;
  createdBy: string;
  created: string;
  parentType?: string;
  parentId?: string;
  replies?: Comment[];
  author?: {
    _id: string;
    name?: string;
    email?: string;
    photo?: string;
  };
}

const ProposalComments: React.FC<ProposalCommentsProps> = ({
  proposal,
  className = '',
}) => {
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  const t = useTranslations();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  // Filter for comments
  const commentFilter = {
    where: {
      parentType: 'proposal',
      parentId: proposal._id,
    },
    limit: 1000,
  };

  // Get comments from platform context
  const commentsMap = platform.post.find(commentFilter) || new Map();
  const isLoading = platform.post.areLoading(commentFilter);

  // Load comments
  useEffect(() => {
    if (proposal._id && platform?.post) {
      // Always load if we don't have any comments in the cache
      if (!hasLoaded.current || commentsMap.size === 0) {
        hasLoaded.current = true;
        platform.post.get(commentFilter);
      }
    }
  }, [proposal._id, platform, commentsMap.size]);

  // Load users after comments are loaded
  useEffect(() => {
    if (commentsMap.size > 0 && platform?.user) {
      try {
        // Get unique user IDs from comments and replies
        const userIds = Array.from(commentsMap.values())
          .map((comment: any) => comment.get('createdBy'))
          .filter((id: string) => id);

        // Fetch only the users needed for the displayed comments
        platform.user.get({ _id: { $in: userIds } });
      } catch (error) {
        // Silently handle error - users will show as anonymous
      }
    }
  }, [commentsMap, platform?.user]);

  // Load replies for each comment - recalculate whenever commentsMap changes
  const commentsWithReplies = useMemo(() => {
    return Array.from(commentsMap.values()).map((comment: any) => {
      const repliesMap =
        platform.post.find({
          where: {
            parentType: 'post',
            parentId: comment.get('_id'),
          },
        }) || new Map();

      const replies = Array.from(repliesMap.values()).map((reply: any) => ({
        _id: reply.get('_id'),
        content: reply.get('content'),
        createdBy: reply.get('createdBy'),
        created: reply.get('created'),
        parentType: reply.get('parentType'),
        parentId: reply.get('parentId'),
      }));

      return {
        _id: comment.get('_id'),
        content: comment.get('content'),
        createdBy: comment.get('createdBy'),
        created: comment.get('created'),
        parentType: comment.get('parentType'),
        parentId: comment.get('parentId'),
        replies,
      };
    });
  }, [commentsMap, platform.post]);

  // Get user data by ID using platform.user.findOne
  const getUserData = (userId: string) => {
    const user = platform.user.findOne(userId);
    return user
      ? {
          _id: (user as any).get('_id'),
          screenname: (user as any).get('screenname'),
          email: (user as any).get('email'),
          photo: (user as any).get('photo'),
        }
      : null;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    console.log('ProposalComments: handleSubmitComment called');
    e.preventDefault();

    console.log('ProposalComments: Form validation check:', {
      hasContent: !!newComment.trim(),
      hasUser: !!user,
      newComment: newComment,
      user: user,
      proposal: proposal,
      platform: !!platform,
      platformPost: !!platform?.post,
    });

    if (!newComment.trim() || !user) {
      console.log(
        'ProposalComments: Cannot submit comment - missing content or user:',
        {
          hasContent: !!newComment.trim(),
          hasUser: !!user,
          user: user,
        },
      );
      return;
    }

    console.log('ProposalComments: Starting comment submission process');
    setIsSubmitting(true);
    setError(null);

    try {
      const commentData = {
        content: newComment.trim(),
        parentType: 'proposal',
        parentId: proposal._id,
        createdBy: user._id,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        visibleBy: [],
        attributes: [],
        managedBy: [],
      };

      console.log('ProposalComments: Comment data prepared:', commentData);
      console.log('ProposalComments: About to call platform.post.post');

      const response = await platform.post.post(commentData);
      console.log('ProposalComments: Comment submission response:', response);

      console.log('ProposalComments: Clearing comment input');
      setNewComment('');

      // The platform context should now automatically update the filter cache
      // No need for manual cache management or refetching
      console.log(
        'ProposalComments: Comment submitted successfully, cache should update automatically',
      );
    } catch (err) {
      console.error('ProposalComments: Error submitting comment:', err);
      console.error('ProposalComments: Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        err: err,
      });
      setError('Failed to submit comment');
    } finally {
      console.log('ProposalComments: Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (
    e: React.FormEvent,
    parentCommentId: string,
  ) => {
    e.preventDefault();

    if (!replyContent.trim() || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const replyData = {
        content: replyContent.trim(),
        parentType: 'post',
        parentId: parentCommentId,
        createdBy: user._id,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        visibleBy: [],
        attributes: [],
        managedBy: [],
      };

      console.log('ProposalComments: Submitting reply:', replyData);
      const response = await platform.post.post(replyData);
      console.log('ProposalComments: Reply submission response:', response);

      setReplyContent('');
      setReplyingTo(null);

      // Manually add the new reply to the platform context
      if (response?.results) {
        console.log(
          'ProposalComments: Manually adding reply to platform context',
        );
        platform.post.set(response.results);
      }

      // Also try to refetch to ensure we have the latest data
      console.log('ProposalComments: About to reload comments after reply');
      platform.post.get(commentFilter);
    } catch (err) {
      console.error('ProposalComments: Error submitting reply:', err);
      setError('Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const author = getUserData(comment.createdBy);
    return (
      <div key={comment._id} className={`${isReply ? 'ml-8 mt-3' : 'mb-6'}`}>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-medium">
              {(author?.screenname || author?.email || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">
                  {author?.screenname || author?.email || 'Anonymous'}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(comment.created)}
                </span>
              </div>
              <div
                className="markdown text-gray-700"
                style={{ whiteSpace: 'pre' }}
              >
                <ReactMarkdown>{comment.content}</ReactMarkdown>
              </div>
              {!isReply && (
                <button
                  onClick={() =>
                    setReplyingTo(
                      replyingTo === comment._id ? null : comment._id,
                    )
                  }
                  className="mt-2 text-sm text-accent hover:text-accent-dark"
                >
                  {t('governance_reply')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply form */}
        {replyingTo === comment._id && (
          <form
            onSubmit={(e) => handleSubmitReply(e, comment._id)}
            className="mt-3"
          >
            <div className="flex space-x-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                rows={2}
                placeholder={t('governance_write_reply')}
              />
              <div className="flex flex-col space-y-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                  className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('governance_reply')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  {t('governance_cancel')}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold mb-4">
        {t('governance_comments')} ({commentsWithReplies.length})
      </h3>

      {/* New comment form */}
      {user && (
        <form
          onSubmit={(e) => {
            console.log('ProposalComments: Form submit event triggered');
            handleSubmitComment(e);
          }}
          className="mb-6"
        >
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-medium">
              {(user.screenname || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => {
                  console.log(
                    'ProposalComments: Comment input changed:',
                    e.target.value,
                  );
                  setNewComment(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                rows={3}
                placeholder={t('governance_write_comment')}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  onClick={() => {
                    console.log('ProposalComments: Submit button clicked', {
                      isSubmitting,
                      hasContent: !!newComment.trim(),
                      newComment: newComment,
                    });
                  }}
                  className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? t('governance_posting')
                    : t('governance_post_comment')}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {!user && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">{t('governance_login_to_comment')}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="text-center py-4">
          <p className="text-gray-500">{t('governance_loading_comments')}</p>
        </div>
      ) : commentsWithReplies.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('governance_no_comments_yet')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {commentsWithReplies.map((comment: Comment) =>
            renderComment(comment),
          )}
        </div>
      )}
    </div>
  );
};

export default ProposalComments;
