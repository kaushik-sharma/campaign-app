import { z } from 'zod';

import { ServiceError } from './errors';

/** Checks input before it reaches a backend, so every backend reports the same field errors. */
export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    throw new ServiceError('validation', 'Check the highlighted fields', fieldErrors);
  }
  return parsed.data;
}

export const emailInput = z.object({
  email: z.email('Enter a valid email address').transform((s) => s.trim().toLowerCase()),
});
export const credentials = emailInput.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export const signUpInput = credentials.extend({
  name: z.string().trim().min(2, 'Enter your name').max(60),
});
