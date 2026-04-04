import { Types } from 'mongoose';
import { Like } from '@models/Like';
import { Post } from '@models/Post';
import { Comment } from '@models/Comment';
import { Reply } from '@models/Reply';
import { LikeTarget } from '@validators/like';
import type { LeanLikeUser, LeanLike } from '../types/lean';

export type { LikeTarget };

const DEFAULT_LIMIT = 20;

const TARGET_MODELS = { post: Post, comment: Comment, reply: Reply } as const;

/** $inc likesCount on the correct model; returns the updated likesCount. */
const updateCount = async (target: LikeTarget, targetId: string, inc: 1 | -1): Promise<number> => {
  // Cast to a common interface — all three models share likesCount
  const model = TARGET_MODELS[target] as typeof Post;
  const doc = await model.findByIdAndUpdate(
    targetId, { $inc: { likesCount: inc } }, { new: true, select: 'likesCount' },
  );
  return Math.max(0, (doc?.likesCount as number | undefined) ?? 0);
};

/**
 * Toggle like on a post, comment, or reply.
 * Returns the new liked state and the current count.
 */
const toggle = async (userId: string, target: LikeTarget, targetId: string) => {
  const filter = { user: userId, [target]: new Types.ObjectId(targetId) };
  const existing = await Like.findOneAndDelete(filter);

  if (existing) {
    const count = await updateCount(target, targetId, -1);
    return { liked: false, count };
  }

  // Upsert avoids duplicate-key errors on concurrent likes
  await Like.updateOne(filter, { $setOnInsert: filter }, { upsert: true });

  const count = await updateCount(target, targetId, 1);
  return { liked: true, count };
};

/**
 * Cursor-paginated list of users who liked a target.
 */
const getLikers = async (target: LikeTarget, targetId: string, cursor?: string, limit = DEFAULT_LIMIT) => {
  const filter: Record<string, unknown> = { [target]: new Types.ObjectId(targetId) };
  if (cursor) filter['createdAt'] = { $lt: new Date(cursor) };

  const likes = await Like
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate<{ user: LeanLikeUser }>('user', 'firstName lastName avatarUrl')
    .lean<LeanLike[]>();

  const hasMore = likes.length > limit;
  if (hasMore) likes.pop();

  const lastLike = likes[likes.length - 1];
  const nextCursor = hasMore && lastLike ? lastLike.createdAt.toISOString() : null;

  return {
    likers: likes.map(l => ({
      id:        l.user._id.toString(),
      firstName: l.user.firstName,
      lastName:  l.user.lastName,
      avatarUrl: l.user.avatarUrl ?? null,
    })),
    nextCursor,
    hasMore,
  };
};

/** Check if a user has liked a specific target (single-item hydration). */
const userHasLiked = async (userId: string, target: LikeTarget, targetId: string): Promise<boolean> => {
  const like = await Like.exists({ user: userId, [target]: new Types.ObjectId(targetId) });
  return !!like;
};

export const LikeService = { toggle, getLikers, userHasLiked };
