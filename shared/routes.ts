import { z } from 'zod';
import { 
  insertTeamSchema, 
  insertProspectSchema, 
  insertTaskSchema,
  insertTemplateSchema,
  insertQCQueueItemSchema,
  insertActivitySchema,
  teams,
  prospects,
  tasks,
  templates,
  qcQueueItems,
  activities,
  users
} from './schema';

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
};

export const api = {
  teams: {
    list: {
      method: 'GET' as const,
      path: '/api/teams',
      responses: {
        200: z.array(z.custom<typeof teams.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/teams',
      input: insertTeamSchema,
      responses: {
        201: z.custom<typeof teams.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/teams/:id',
      responses: {
        200: z.custom<typeof teams.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  prospects: {
    list: {
      method: 'GET' as const,
      path: '/api/prospects',
      input: z.object({
        teamId: z.coerce.number().optional(),
        stage: z.string().optional(),
        assignedToId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof prospects.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/prospects',
      input: insertProspectSchema,
      responses: {
        201: z.custom<typeof prospects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/prospects/:id',
      responses: {
        200: z.custom<typeof prospects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/prospects/:id',
      input: insertProspectSchema.partial(),
      responses: {
        200: z.custom<typeof prospects.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/prospects/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    import: {
      method: 'POST' as const,
      path: '/api/prospects/import',
      input: z.object({
        teamId: z.coerce.number(),
        source: z.string(),
        prospects: z.array(z.object({
          firstName: z.string(),
          lastName: z.string(),
          email: z.string().optional(),
          company: z.string(),
          title: z.string(),
          linkedinUrl: z.string().optional(),
          twitterHandle: z.string().optional(),
        }))
      }),
      responses: {
        201: z.object({
          imported: z.number(),
          duplicates: z.number(),
        }),
        400: errorSchemas.validation,
      },
    }
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      input: z.object({
        teamId: z.coerce.number().optional(),
        assignedToId: z.string().optional(),
        status: z.string().optional(),
        dueDate: z.string().optional(), // Date string
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/tasks/:id/complete',
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  templates: {
    list: {
      method: 'GET' as const,
      path: '/api/templates',
      input: z.object({
        teamId: z.coerce.number().optional(),
        type: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof templates.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/templates',
      input: insertTemplateSchema,
      responses: {
        201: z.custom<typeof templates.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/templates/:id',
      input: insertTemplateSchema.partial(),
      responses: {
        200: z.custom<typeof templates.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/templates/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  qc: {
    list: {
      method: 'GET' as const,
      path: '/api/qc-queue',
      input: z.object({
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof qcQueueItems.$inferSelect>()),
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/qc-queue',
      input: insertQCQueueItemSchema,
      responses: {
        201: z.custom<typeof qcQueueItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    review: {
      method: 'PATCH' as const,
      path: '/api/qc-queue/:id',
      input: z.object({
        status: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
        feedback: z.string().optional(),
        reviewedById: z.string(),
      }),
      responses: {
        200: z.custom<typeof qcQueueItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  analytics: {
    overview: {
      method: 'GET' as const,
      path: '/api/analytics/overview',
      responses: {
        200: z.object({
          prospectsByStage: z.record(z.number()),
          tasksDueToday: z.number(),
          qcPending: z.number(),
          replyRate: z.number(),
        }),
      }
    }
  }
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
