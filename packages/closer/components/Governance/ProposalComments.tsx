import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import EmailDisplay from 'closer/components/display/emailDisplay';
import { proposalMarkdownComponents } from 'closer/components/display/proposalMarkdown';
import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { Proposal } from 'closer/types';
import { cdn } from 'closer/utils/api';
import { useLocale, useTranslations } from 'next-intl';

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
  replyCount?: number;
}

// Stable empty stand-in so an unloaded filter does not change identity every
// render and re-trigger the memos below.
const EMPTY_COLLECTION: any = new Map();

const ProposalComments: React.FC<ProposalCommentsProps> = ({
  proposal,
  className = '',
}) => {
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  const t = useTranslations();
  const locale = useLocale();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(
    new Set(),
  );
  const hasLoaded = useRef(false);

  // Filter for comments
  const commentFilter = {
    where: {
      parentType: 'proposal',
      parentId: proposal._id,
    },
    limit: 1000,
  };

  const commentsMap = platform.post.find(commentFilter) || EMPTY_COLLECTION;
  const isLoading = platform.post.areLoading(commentFilter);

  useEffect(() => {
    if (proposal._id && platform?.post) {
      if (!hasLoaded.current || commentsMap.size === 0) {
        hasLoaded.current = true;
        platform.post.get(commentFilter);
      }
    }
  }, [proposal._id, platform, commentsMap.size]);

  const commentIds = useMemo(
    () =>
      Array.from(commentsMap.values())
        .map((comment: any) => comment.get('_id'))
        .filter(Boolean)
        .sort(),
    [commentsMap],
  );

  // Every reply of every comment is fetched in a single request, so threads
  // and their counts are visible without expanding anything first.
  const repliesFilter = useMemo(
    () =>
      commentIds.length > 0
        ? {
            where: { parentType: 'post', parentId: { $in: commentIds } },
            limit: 1000,
          }
        : null,
    [commentIds],
  );

  useEffect(() => {
    if (!platform?.post || !repliesFilter) return;
    platform.post.get(repliesFilter);
  }, [platform?.post, repliesFilter]);

  const repliesMap =
    (repliesFilter && platform.post.find(repliesFilter)) || EMPTY_COLLECTION;

  const repliesByParent = useMemo(() => {
    const grouped = new Map<string, Comment[]>();

    Array.from(repliesMap.values()).forEach((reply: any) => {
      const parentId = reply.get('parentId');
      if (!parentId) return;

      const entry: Comment = {
        _id: reply.get('_id'),
        content: reply.get('content'),
        createdBy: reply.get('createdBy'),
        created: reply.get('created'),
        parentType: reply.get('parentType'),
        parentId,
      };

      const existing = grouped.get(parentId);
      if (existing) {
        existing.push(entry);
      } else {
        grouped.set(parentId, [entry]);
      }
    });

    grouped.forEach((replies) =>
      replies.sort(
        (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
      ),
    );

    return grouped;
  }, [repliesMap]);

  const commentsWithReplies = useMemo(() => {
    const comments = Array.from(commentsMap.values()).map((comment: any) => {
      const commentId = comment.get('_id');
      const replies = repliesByParent.get(commentId) || [];

      return {
        _id: commentId,
        content: comment.get('content'),
        createdBy: comment.get('createdBy'),
        created: comment.get('created'),
        parentType: comment.get('parentType'),
        parentId: comment.get('parentId'),
        replies,
        replyCount: replies.length,
      };
    });

    return comments.sort(
      (a, b) =>
        new Date(a.created).getTime() - new Date(b.created).getTime(),
    );
  }, [commentsMap, repliesByParent]);

  const showReplies = (commentId: string) =>
    setCollapsedComments((prev) => {
      if (!prev.has(commentId)) return prev;
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });

  const toggleReplies = (commentId: string) =>
    setCollapsedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });

  useEffect(() => {
    if (!platform?.user || commentsWithReplies.length === 0) return;

    const userIds = new Set<string>();
    commentsWithReplies.forEach((comment) => {
      if (comment.createdBy) userIds.add(comment.createdBy);
      comment.replies?.forEach((reply) => {
        if (reply.createdBy) userIds.add(reply.createdBy);
      });
    });

    userIds.forEach((userId) => {
      if (!platform.user.findOne(userId)) {
        platform.user.getOne(userId);
      }
    });
  }, [commentsWithReplies, platform?.user]);

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
        visibility: 'public',
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
      setError(t('governance_failed_submit_comment'));
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
        visibility: 'public',
      };

      await platform.post.post(replyData);

      setReplyContent('');
      showReplies(parentCommentId);

      // The bulk replies filter uses $in, which the platform cache cannot
      // match against a freshly posted reply, so refetch it.
      if (repliesFilter) {
        await platform.post.get(repliesFilter, { force: true });
      }
    } catch (err) {
      console.error('ProposalComments: Error submitting reply:', err);
      setError(t('governance_failed_submit_reply'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return t('governance_just_now');

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' });
    if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), 'minute');
    if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), 'hour');
    if (diffSec < 604800) return rtf.format(-Math.floor(diffSec / 86400), 'day');

    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  const renderAvatar = (
    name: string | undefined,
    photo: string | undefined,
    size: 'sm' | 'md',
  ) => {
    const sizeClass = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';
    const initial = (name || 'U').charAt(0).toUpperCase();

    const label = name || t('governance_anonymous');

    if (photo) {
      return (
        <img
          src={`${cdn}${photo}-profile-sm.jpg`}
          alt={label}
          className={`shrink-0 rounded-full object-cover ${sizeClass}`}
        />
      );
    }

    return (
      <div
        role="img"
        aria-label={label}
        className={`flex shrink-0 items-center justify-center rounded-full bg-gray-900 font-medium text-white ${sizeClass}`}
      >
        {initial}
      </div>
    );
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const author = getUserData(comment.createdBy);
    const replyCount = comment.replyCount ?? 0;
    const areRepliesHidden = collapsedComments.has(comment._id);

    return (
      <div key={comment._id}>
        <div className="flex items-start gap-2">
          {renderAvatar(
            author?.screenname || author?.email,
            author?.photo,
            isReply ? 'sm' : 'md',
          )}
          <div className="min-w-0 flex-1">
            <div className="inline-block rounded-2xl bg-gray-100 px-3 py-1.5">
              <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                {author?.screenname ? (
                  <span className="truncate text-[13px] font-semibold text-gray-900">
                    {author.screenname}
                  </span>
                ) : author?.email ? (
                  <EmailDisplay
                    email={author.email}
                    className="min-w-0 max-w-full truncate text-[13px] font-semibold text-gray-900"
                  />
                ) : (
                  <span className="text-[13px] font-semibold text-gray-900">
                    {t('governance_anonymous')}
                  </span>
                )}
                <span className="text-[11px] text-gray-400">
                  {formatDate(comment.created)}
                </span>
              </div>
              <div className="markdown min-w-0 max-w-full break-words text-[13px] text-gray-800">
                <ReactMarkdown components={proposalMarkdownComponents}>
                  {comment.content}
                </ReactMarkdown>
              </div>
            </div>
            {!isReply && (
              <div className="flex items-center gap-3 pl-3 pt-0.5">
                <button
                  onClick={() => {
                    setReplyingTo((prev) =>
                      prev === comment._id ? null : comment._id,
                    );
                    setReplyContent('');
                    showReplies(comment._id);
                  }}
                  className="text-[11px] font-semibold text-gray-500 hover:text-gray-900"
                >
                  {t('governance_reply')}
                </button>
                {replyCount > 0 && (
                  <button
                    onClick={() => toggleReplies(comment._id)}
                    className="text-[11px] font-semibold text-accent hover:underline"
                  >
                    {areRepliesHidden
                      ? t('governance_show_replies_count', {
                          count: replyCount,
                        })
                      : t('governance_hide_replies')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {!isReply && !areRepliesHidden && replyCount > 0 && (
          <div className="ml-5 flex flex-col gap-1.5 border-l-2 border-gray-200 pl-4 pt-1">
            {comment.replies?.map((reply) => renderComment(reply, true))}
          </div>
        )}

        {!isReply && replyingTo === comment._id && (
          <div className="ml-5 border-l-2 border-gray-200 pl-4 pt-1">
            <form
              onSubmit={(e) => handleSubmitReply(e, comment._id)}
              className="flex items-center gap-2 py-1"
            >
              {renderAvatar(user?.screenname || user?.email, user?.photo, 'sm')}
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[13px] placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={t('governance_write_reply')}
              />
              <button
                type="submit"
                disabled={isSubmitting || !replyContent.trim()}
                aria-label={
                  isSubmitting ? t('governance_posting') : t('governance_reply')
                }
                className="shrink-0 rounded-full bg-gray-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-black disabled:opacity-30"
              >
                {isSubmitting ? t('governance_posting') : t('governance_reply')}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}
    >
      <h3 className="mb-4 text-base font-semibold">
        {t('governance_comments')}
        {user && ` (${commentsWithReplies.length})`}
      </h3>

      {!user ? (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">{t('governance_login_to_view_comments')}</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="py-4 text-center">
              <p className="text-gray-500">{t('governance_loading_comments')}</p>
            </div>
          ) : commentsWithReplies.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-400">{t('governance_no_comments_yet')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {commentsWithReplies.map((comment: Comment) =>
                renderComment(comment),
              )}
            </div>
          )}

          <form
          onSubmit={(e) => {
            handleSubmitComment(e);
          }}
          className="mt-4"
        >
          <div className="flex items-start gap-2.5">
            {renderAvatar(
              user.screenname || user.email,
              user.photo,
              'md',
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
                placeholder={t('governance_write_comment')}
              />
              <div className="mt-1.5 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {isSubmitting ? t('governance_posting') : t('governance_post_comment')}
                </button>
              </div>
            </div>
          </div>
        </form>
        </>
      )}
    </div>
  );
};

export default ProposalComments;
