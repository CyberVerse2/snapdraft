import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  FAL_API_KEY: z.string().min(1),
  NEXT_PUBLIC_URL: z.string().url().min(1)
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function getEnv(): AppEnv {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Missing or invalid environment variables');
  }
  return parsed.data;
}

