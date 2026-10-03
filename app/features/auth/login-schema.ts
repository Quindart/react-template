import { z } from 'zod';
import { AUTH_MESSAGES } from './auth-messages';

export const loginSchema = z.object({
  username: z.string().trim().min(1, AUTH_MESSAGES.usernameRequired),
  password: z.string().min(1, AUTH_MESSAGES.passwordRequired),
});

export type LoginValues = z.infer<typeof loginSchema>;
