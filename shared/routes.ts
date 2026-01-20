import { z } from 'zod';
import { insertVideoSchema, videos } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  videos: {
    list: {
      method: 'GET' as const,
      path: '/api/videos',
      input: z.object({
        search: z.string().optional(),
        platform: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof videos.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/videos/:id',
      responses: {
        200: z.custom<typeof videos.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/videos',
      input: insertVideoSchema,
      responses: {
        201: z.custom<typeof videos.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/videos/:id',
      input: insertVideoSchema.partial(),
      responses: {
        200: z.custom<typeof videos.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/videos/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    metadata: {
      method: 'POST' as const,
      path: '/api/videos/metadata',
      input: z.object({
        url: z.string().url(),
      }),
      responses: {
        200: z.object({
          title: z.string(),
          thumbnail: z.string().optional(),
          authorName: z.string().optional(),
          platform: z.string(),
          aspectRatio: z.string().optional(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
