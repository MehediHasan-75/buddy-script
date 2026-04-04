'use client';

import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { LikeButton } from './LikesModal';
import { useLike } from '@/hooks/useLike';
import type { Reply, User } from '@/types';

interface ReplyItemProps {
  reply: Reply;
  postId: string;
  currentUser: User;
  onDelete: (replyId: string) => void;
  deleting: boolean;
}

export function ReplyItem({ reply, postId, currentUser, onDelete, deleting }: ReplyItemProps) {
  const likeMutation = useLike();
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
            <span className="_time_link" style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo}</span>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{reply.content}</span>
            </p>
          </div>
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <LikeButton
                    liked={reply.userLiked}
                    count={reply.likesCount}
                    loading={likeMutation.isPending}
                    onToggle={() =>
                      likeMutation.mutate({ target: 'reply', targetId: reply.id, postId })
                    }
                    target="reply"
                    targetId={reply.id}
                  />
                </li>
                {isAuthor && (
                  <li>
                    <span
                      style={{ cursor: 'pointer', color: '#cf1322', fontSize: 12 }}
                      onClick={() => !deleting && onDelete(reply.id)}
                    >
                      Delete
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
