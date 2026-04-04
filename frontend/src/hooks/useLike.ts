import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FeedResponse, Post, LikeTarget } from '@/types';

interface LikeArgs {
  target: LikeTarget;
  targetId: string;
  postId: string;
}

interface LikeResponse {
  liked: boolean;
  count: number;
}

type PostsInfiniteData = InfiniteData<FeedResponse>;

export function useLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ target, targetId }: LikeArgs) => {
      const path =
        target === 'post'
          ? `/posts/${targetId}/like`
          : target === 'comment'
          ? `/comments/${targetId}/like`
          : `/replies/${targetId}/like`;
      const { data } = await api.post<{ data: LikeResponse }>(path);
      return data.data;
    },

    onMutate: async ({ target, targetId, postId }) => {
      if (target !== 'post') return;

      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const snapshot = queryClient.getQueryData<PostsInfiniteData>(['posts']);

      queryClient.setQueryData<PostsInfiniteData>(['posts'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p: Post) =>
              p.id === postId
                ? {
                    ...p,
                    userLiked: !p.userLiked,
                    likesCount: p.userLiked ? p.likesCount - 1 : p.likesCount + 1,
                  }
                : p,
            ),
          })),
        };
      });

      return { snapshot };
    },

    onError: (_err, { target }, context) => {
      if (target === 'post' && context?.snapshot) {
        queryClient.setQueryData(['posts'], context.snapshot);
      }
    },

    onSettled: (_data, _err, { target, postId }) => {
      if (target === 'post') {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
    },
  });
}
