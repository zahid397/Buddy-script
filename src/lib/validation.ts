import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the terms & conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterFormInput = z.infer<typeof registerFormSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const postVisibilitySchema = z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']);

export const createPostSchema = z.object({
  content: z.string().trim().max(5000),
  imageUrl: z.string().url().optional().nullable(),
  imageBlurHash: z.string().max(200).optional().nullable(),
  visibility: postVisibilitySchema.optional().default('PUBLIC'),
}).refine((data) => data.content.trim().length > 0 || Boolean(data.imageUrl), {
  message: 'Post cannot be empty',
  path: ['content'],
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const shareSchema = z.object({
  content: z.string().trim().max(1000).optional().default(''),
});
export type ShareInput = z.infer<typeof shareSchema>;

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createReplySchema = z.object({
  content: z.string().trim().min(1, 'Reply cannot be empty').max(2000),
});
export type CreateReplyInput = z.infer<typeof createReplySchema>;

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE ?? 5 * 1024 * 1024);

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(4000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  bio: z.string().trim().max(280).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(72),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const contactPermissionSchema = z.enum(['EVERYONE', 'FRIENDS', 'NOBODY']);

export const updatePrivacySchema = z.object({
  profileVisibility: postVisibilitySchema.optional(),
  defaultPostVisibility: postVisibilitySchema.optional(),
  whoCanSendFriendRequest: contactPermissionSchema.optional(),
  whoCanMessage: contactPermissionSchema.optional(),
});
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;

export const updateNotificationPrefsSchema = z.object({
  notifyOnMessage: z.boolean().optional(),
  notifyOnFriendRequest: z.boolean().optional(),
  notifyOnComment: z.boolean().optional(),
  notifyOnGroupActivity: z.boolean().optional(),
  notifyOnEvent: z.boolean().optional(),
});
export type UpdateNotificationPrefsInput = z.infer<typeof updateNotificationPrefsSchema>;

export const updateAppearanceSchema = z.object({
  themePreference: z.enum(['LIGHT', 'DARK']).optional(),
  feedDensity: z.enum(['COMFORTABLE', 'COMPACT']).optional(),
});
export type UpdateAppearanceInput = z.infer<typeof updateAppearanceSchema>;

export const createGroupPostSchema = z.object({
  content: z.string().trim().min(1, 'Post cannot be empty').max(3000),
});
export type CreateGroupPostInput = z.infer<typeof createGroupPostSchema>;

export const submitGameScoreSchema = z.object({
  gameType: z.enum(['TIC_TAC_TOE', 'MEMORY_MATCH', 'REACTION_TIMER']),
  score: z.number().int().min(0).max(1_000_000),
});
export type SubmitGameScoreInput = z.infer<typeof submitGameScoreSchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  type: z.enum(['all', 'users', 'posts', 'events']).optional().default('all'),
});
