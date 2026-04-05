'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { useLike } from '@/hooks/useLike';
import { LikesModal } from './LikesModal';
import type { Reply, User } from '@/types';

interface ReplyItemProps {
  reply: Reply;
  postId: string;
  commentId: string;
  currentUser: User;
  onDelete: (replyId: string) => void;
  deleting: boolean;
}

export function ReplyItem({ reply, postId, commentId, currentUser, onDelete, deleting }: ReplyItemProps) {
  const likeMutation = useLike();
  const [showLikesModal, setShowLikesModal] = useState(false);
  const isAuthor = reply.author.id === currentUser.id;

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <div className="_comment_main" style={{ paddingLeft: 48 }}>
      <div className="_comment_image">
        <Avatar
          avatarUrl={reply.author.avatarUrl}
          firstName={reply.author.firstName}
          lastName={reply.author.lastName}
          size={32}
          className="_comment_img1"
        />
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <h4 className="_comment_name_title" style={{ fontSize: 13 }}>
                {reply.author.firstName} {reply.author.lastName}
              </h4>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{reply.content}</span>
            </p>
          </div>

          {reply.likesCount > 0 && (
            <div className="_total_reactions">
              <div className="_total_react">
                <span className="_reaction_like">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1890FF" stroke="none">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </span>
                <span className="_reaction_heart">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#E0245E" stroke="none">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </span>
              </div>
              <button
                onClick={() => setShowLikesModal(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: '#666' }}
              >
                {reply.likesCount}
              </button>
            </div>
          )}

          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, flexWrap: 'wrap' }}>
                <span
                  style={{ cursor: 'pointer', color: reply.userLiked ? '#E0245E' : '#555', fontWeight: reply.userLiked ? 600 : undefined }}
                  onClick={() => !likeMutation.isPending && likeMutation.mutate({ target: 'reply', targetId: reply.id, postId, commentId })}
                >
                  Like
                </span>
                {isAuthor && (
                  <>
                    <span style={{ color: '#ccc' }}>·</span>
                    <span
                      style={{ cursor: 'pointer', color: '#cf1322' }}
                      onClick={() => !deleting && onDelete(reply.id)}
                    >
                      Delete
                    </span>
                  </>
                )}
                <span style={{ color: '#ccc' }}>·</span>
                <span style={{ color: '#999', fontSize: 11 }}>{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        target="reply"
        targetId={reply.id}
        count={reply.likesCount}
      />
    </div>
  );
}
