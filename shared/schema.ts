import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth"; // Import Replit Auth users

// Re-export auth models
export * from "./models/auth";

// ============================================
// ENUMS (Application Level)
// ============================================

export const TeamMemberRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  REP: 'REP',
  VA: 'VA'
} as const;

export const ProspectStage = {
  IDENTIFIED: 'IDENTIFIED',
  WARMING: 'WARMING',
  FIRST_TOUCH_READY: 'FIRST_TOUCH_READY',
  FIRST_TOUCH_SENT: 'FIRST_TOUCH_SENT',
  VIDEO_READY: 'VIDEO_READY',
  VIDEO_SENT: 'VIDEO_SENT',
  CALL_BOOKED: 'CALL_BOOKED',
  WON: 'WON',
  LOST: 'LOST',
  UNRESPONSIVE: 'UNRESPONSIVE'
} as const;

export const ActivityType = {
  PROFILE_VIEW: 'PROFILE_VIEW',
  CONTENT_LIKE: 'CONTENT_LIKE',
  CONTENT_COMMENT: 'CONTENT_COMMENT',
  CONNECTION_SENT: 'CONNECTION_SENT',
  CONNECTION_ACCEPTED: 'CONNECTION_ACCEPTED',
  FIRST_TOUCH_SENT: 'FIRST_TOUCH_SENT',
  FIRST_TOUCH_REPLIED: 'FIRST_TOUCH_REPLIED',
  VIDEO_SENT: 'VIDEO_SENT',
  VIDEO_VIEWED: 'VIDEO_VIEWED',
  VIDEO_REPLIED: 'VIDEO_REPLIED',
  CALL_SCHEDULED: 'CALL_SCHEDULED',
  CALL_COMPLETED: 'CALL_COMPLETED',
  NOTE_ADDED: 'NOTE_ADDED',
  STAGE_CHANGED: 'STAGE_CHANGED'
} as const;

export const TemplateType = {
  FIRST_TOUCH: 'FIRST_TOUCH',
  VIDEO_SCRIPT: 'VIDEO_SCRIPT',
  FOLLOW_UP: 'FOLLOW_UP',
  CONNECTION_REQUEST: 'CONNECTION_REQUEST'
} as const;

export const QCItemType = {
  FIRST_TOUCH: 'FIRST_TOUCH',
  VIDEO: 'VIDEO',
  FOLLOW_UP: 'FOLLOW_UP'
} as const;

export const QCStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED'
} as const;

export const TaskType = {
  PROFILE_VIEW: 'PROFILE_VIEW',
  ENGAGE_CONTENT: 'ENGAGE_CONTENT',
  SEND_CONNECTION: 'SEND_CONNECTION',
  SEND_FIRST_TOUCH: 'SEND_FIRST_TOUCH',
  RECORD_VIDEO: 'RECORD_VIDEO',
  SEND_VIDEO: 'SEND_VIDEO',
  FOLLOW_UP: 'FOLLOW_UP',
  CUSTOM: 'CUSTOM'
} as const;

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED'
} as const;


// ============================================
// TABLE DEFINITIONS
// ============================================

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(), // Links to users.id
  settings: jsonb("settings").default({
    warmingPeriodHours: 36,
    firstTouchToVideoHours: 72,
    staleThresholdDays: 14,
    qcEnabled: true
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default(TeamMemberRole.VA),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  unq: uniqueIndex("team_members_team_user_idx").on(t.teamId, t.userId)
}));

export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  linkedinUrl: text("linkedin_url"),
  twitterHandle: text("twitter_handle"),
  company: text("company").notNull(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  sourceDetail: text("source_detail"),
  tags: text("tags").array().default([]),
  customFields: jsonb("custom_fields").default({}),
  stage: text("stage").notNull().default(ProspectStage.IDENTIFIED),
  assignedToId: text("assigned_to_id"),
  
  // Timing fields
  warmingStartedAt: timestamp("warming_started_at"),
  firstTouchSentAt: timestamp("first_touch_sent_at"),
  videoSentAt: timestamp("video_sent_at"),
  callBookedAt: timestamp("call_booked_at"),
  closedAt: timestamp("closed_at"),
  closeReason: text("close_reason"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  details: jsonb("details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdById: text("created_by_id").notNull(),
  timesUsed: integer("times_used").default(0),
  replyCount: integer("reply_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const qcQueueItems = pgTable("qc_queue", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull(),
  templateId: integer("template_id"),
  submittedById: text("submitted_by_id").notNull(),
  reviewedById: text("reviewed_by_id"),
  type: text("type").notNull(),
  draftContent: text("draft_content").notNull(),
  status: text("status").notNull().default(QCStatus.PENDING),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  prospectId: integer("prospect_id"),
  assignedToId: text("assigned_to_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority").default(TaskPriority.MEDIUM),
  status: text("status").default(TaskStatus.PENDING),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  assignedProspects: many(prospects),
  activities: many(activities),
  tasks: many(tasks),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
  prospects: many(prospects),
  templates: many(templates),
  tasks: many(tasks),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const prospectsRelations = relations(prospects, ({ one, many }) => ({
  team: one(teams, {
    fields: [prospects.teamId],
    references: [teams.id],
  }),
  assignedTo: one(users, {
    fields: [prospects.assignedToId],
    references: [users.id],
  }),
  activities: many(activities),
  qcItems: many(qcQueueItems),
  tasks: many(tasks),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  prospect: one(prospects, {
    fields: [activities.prospectId],
    references: [prospects.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  team: one(teams, {
    fields: [templates.teamId],
    references: [teams.id],
  }),
  createdBy: one(users, {
    fields: [templates.createdById],
    references: [users.id],
  }),
}));

export const qcQueueItemsRelations = relations(qcQueueItems, ({ one }) => ({
  prospect: one(prospects, {
    fields: [qcQueueItems.prospectId],
    references: [prospects.id],
  }),
  template: one(templates, {
    fields: [qcQueueItems.templateId],
    references: [templates.id],
  }),
  submittedBy: one(users, {
    fields: [qcQueueItems.submittedById],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [qcQueueItems.reviewedById],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  team: one(teams, {
    fields: [tasks.teamId],
    references: [teams.id],
  }),
  prospect: one(prospects, {
    fields: [tasks.prospectId],
    references: [prospects.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
  }),
}));

// ============================================
// ZOD SCHEMAS
// ============================================

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, createdAt: true });
export const insertProspectSchema = createInsertSchema(prospects).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  warmingStartedAt: true,
  firstTouchSentAt: true,
  videoSentAt: true,
  callBookedAt: true,
  closedAt: true
});
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQCQueueItemSchema = createInsertSchema(qcQueueItems).omit({ id: true, submittedAt: true, reviewedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, completedAt: true });

// Types
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Prospect = typeof prospects.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type QCQueueItem = typeof qcQueueItems.$inferSelect;
export type Task = typeof tasks.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertQCQueueItem = z.infer<typeof insertQCQueueItemSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
