import { z } from 'zod';

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post content must be 5000 characters or less'),

  imageUrl: z
    .string()
    .optional(),

  visibility: z
    .enum(['PUBLIC', 'PRIVATE'], {
      error: "Visibility must be 'PUBLIC' or 'PRIVATE'",
    })
    .default('PUBLIC'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
