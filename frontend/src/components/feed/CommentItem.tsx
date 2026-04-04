'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { ReplyItem } from './ReplyItem';
import { CommentComposer } from './CommentComposer';
import { useLike } from '@/hooks/useLike';
import { useReplies } from '@/hooks/useComments';
import type { Comment, User } from '@/types';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUser: User;
  onDelete: (commentId: string) => void;
  deleting: boolean;
  onCreateReply: (commentId: string, content: string) => Promise<void>;
  onDeleteReply: (replyId: string, commentId: string) => Promise<void>;
}

export function CommentItem({
  comment,
  postId,
  currentUser,
  onDelete,
  deleting,
  onCreateReply,
  onDeleteReply,
}: CommentItemProps) {
  const likeMutation = useLike();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const isAuthor = comment.author.id === currentUser.id;

  const { data: repliesData, isLoading: repliesLoading } = useReplies(comment.id, showReplies);

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <Avatar
          avatarUrl={comment.author.avatarUrl}
          firstName={comment.author.firstName}
          lastName={comment.author.lastName}
          size={36}
          className="_comment_img1"
        />
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <h4 className="_comment_name_title">
                {comment.author.firstName} {comment.author.lastName}
              </h4>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{comment.content}</span>
            </p>
          </div>
          <div className="_total_reactions">
            <div className="_total_react">
              <span
                className="_reaction_like"
                style={{ cursor: 'pointer' }}
                onClick={() => likeMutation.mutate({ target: 'comment', targetId: comment.id, postId })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
              </span>
              <span className="_reaction_heart">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </span>
            </div>
            <span className="_total">{comment.likesCount || 198}</span>
          </div>
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li><span>Like.</span></li>
                <li>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowReplyComposer(p => !p)}
                  >
                    Reply.
                  </span>
                </li>
                <li><span>Share</span></li>
                <li><span className="_time_link">{timeAgo}</span></li>
                {isAuthor && (
                  <li>
                    <span
                      style={{ cursor: 'pointer', color: '#cf1322' }}
                      onClick={() => !deleting && onDelete(comment.id)}
                    >
                      Delete.
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {comment.repliesCount > 0 && (
            <button
              type="button"
              className="_previous_comment_txt"
              onClick={() => setShowReplies(p => !p)}
              style={{ marginTop: 4 }}
            >
              {showReplies ? 'Hide replies' : `View ${comment.repliesCount} repl${comment.repliesCount !== 1 ? 'ies' : 'y'}`}
            </button>
          )}

          {showReplies && (
            <div style={{ marginTop: 8 }}>
              {repliesLoading && <p style={{ fontSize: 12, color: '#888' }}>Loading replies...</p>}
              {repliesData?.replies.map(reply => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  postId={postId}
                  currentUser={currentUser}
                  onDelete={(replyId) => onDeleteReply(replyId, comment.id)}
                  deleting={false}
                />
              ))}
            </div>
          )}

          {showReplyComposer && (
            <CommentComposer
              currentUser={currentUser}
              onSubmit={async (content) => {
                await onCreateReply(comment.id, content);
                setShowReplies(true);
              }}
              placeholder={`Reply to ${comment.author.firstName}...`}
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
}
