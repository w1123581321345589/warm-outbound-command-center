import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  users, teams, teamMembers, prospects, activities, templates, qcQueueItems, tasks,
  type User, type InsertUser,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember,
  type Prospect, type InsertProspect,
  type Activity, type InsertActivity,
  type Template, type InsertTemplate,
  type QCQueueItem, type InsertQCQueueItem,
  type Task, type InsertTask,
  TaskStatus, QCStatus
} from "@shared/schema";

export interface IStorage {
  // Users (managed by Replit Auth, but we might need read access)
  getUser(id: string): Promise<User | undefined>;
  
  // Teams
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByUserId(userId: string): Promise<Team[]>;
  
  // Team Members
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  
  // Prospects
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  getProspect(id: number): Promise<Prospect | undefined>;
  getProspects(teamId: number, filters?: { stage?: string, assignedToId?: string }): Promise<Prospect[]>;
  updateProspect(id: number, prospect: Partial<InsertProspect>): Promise<Prospect>;
  deleteProspect(id: number): Promise<void>;
  
  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  getTasks(teamId: number, filters?: { assignedToId?: string, status?: string, dueDate?: Date }): Promise<Task[]>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  completeTask(id: number): Promise<Task>;

  // Templates
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: number): Promise<Template | undefined>;
  getTemplates(teamId: number, filters?: { type?: string }): Promise<Template[]>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template>;
  deleteTemplate(id: number): Promise<void>;

  // QC Queue
  createQCItem(item: InsertQCQueueItem): Promise<QCQueueItem>;
  getQCItems(filters?: { status?: string }): Promise<QCQueueItem[]>;
  updateQCItem(id: number, updates: { status: string, feedback?: string, reviewedById: string }): Promise<QCQueueItem>;
  
  // Activities
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(prospectId: number): Promise<Activity[]>;
  
  // Bulk Operations
  createProspectsBulk(prospects: InsertProspect[]): Promise<Prospect[]>;
  
  // Analytics
  getAnalyticsOverview(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Teams
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamsByUserId(userId: string): Promise<Team[]> {
    // This assumes ownerId check. A real implementation would also check teamMembers.
    return await db.select().from(teams).where(eq(teams.ownerId, userId));
  }

  // Team Members
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  // Prospects
  async createProspect(prospect: InsertProspect): Promise<Prospect> {
    const [newProspect] = await db.insert(prospects).values(prospect).returning();
    return newProspect;
  }

  async getProspect(id: number): Promise<Prospect | undefined> {
    const [prospect] = await db.select().from(prospects).where(eq(prospects.id, id));
    return prospect;
  }

  async getProspects(teamId: number, filters?: { stage?: string, assignedToId?: string }): Promise<Prospect[]> {
    let conditions = [eq(prospects.teamId, teamId)];
    
    if (filters?.stage) {
      conditions.push(eq(prospects.stage, filters.stage));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(prospects.assignedToId, filters.assignedToId));
    }

    return await db.select().from(prospects).where(and(...conditions)).orderBy(desc(prospects.updatedAt));
  }

  async updateProspect(id: number, prospectData: Partial<InsertProspect>): Promise<Prospect> {
    const [updated] = await db.update(prospects)
      .set({ ...prospectData, updatedAt: new Date() })
      .where(eq(prospects.id, id))
      .returning();
    return updated;
  }

  async deleteProspect(id: number): Promise<void> {
    await db.delete(prospects).where(eq(prospects.id, id));
  }

  // Tasks
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasks(teamId: number, filters?: { assignedToId?: string, status?: string, dueDate?: Date }): Promise<Task[]> {
    let conditions = [eq(tasks.teamId, teamId)];
    
    if (filters?.assignedToId) {
      conditions.push(eq(tasks.assignedToId, filters.assignedToId));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    if (filters?.dueDate) {
      // Simple date equality check. Real world apps might need range checks.
      // Drizzle handles dates as objects.
       // conditions.push(eq(tasks.dueDate, filters.dueDate)); 
    }

    return await db.select().from(tasks).where(and(...conditions)).orderBy(tasks.dueDate);
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async completeTask(id: number): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set({ 
        status: TaskStatus.COMPLETED,
        completedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  // Templates
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async getTemplates(teamId: number, filters?: { type?: string }): Promise<Template[]> {
    let conditions = [eq(templates.teamId, teamId)];
    
    if (filters?.type) {
      conditions.push(eq(templates.type, filters.type));
    }

    return await db.select().from(templates).where(and(...conditions)).orderBy(desc(templates.createdAt));
  }

  async updateTemplate(id: number, templateData: Partial<InsertTemplate>): Promise<Template> {
    const [updated] = await db.update(templates)
      .set({ ...templateData, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return updated;
  }

  async deleteTemplate(id: number): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }

  // QC Queue
  async createQCItem(item: InsertQCQueueItem): Promise<QCQueueItem> {
    const [newItem] = await db.insert(qcQueueItems).values(item).returning();
    return newItem;
  }

  async getQCItems(filters?: { status?: string }): Promise<QCQueueItem[]> {
    let conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(qcQueueItems.status, filters.status));
    }

    // Default to getting all if no filters, maybe limit?
    return await db.select().from(qcQueueItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qcQueueItems.submittedAt));
  }

  async updateQCItem(id: number, updates: { status: string, feedback?: string, reviewedById: string }): Promise<QCQueueItem> {
    const [updated] = await db.update(qcQueueItems)
      .set({
        status: updates.status,
        feedback: updates.feedback,
        reviewedById: updates.reviewedById,
        reviewedAt: new Date()
      })
      .where(eq(qcQueueItems.id, id))
      .returning();
    return updated;
  }

  // Activities
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async getActivities(prospectId: number): Promise<Activity[]> {
    return await db.select().from(activities)
      .where(eq(activities.prospectId, prospectId))
      .orderBy(desc(activities.createdAt));
  }

  // Bulk Operations
  async createProspectsBulk(prospectData: InsertProspect[]): Promise<Prospect[]> {
    if (prospectData.length === 0) return [];
    const newProspects = await db.insert(prospects).values(prospectData).returning();
    return newProspects;
  }

  // Analytics (Basic Implementation)
  async getAnalyticsOverview(): Promise<any> {
    const prospectsCount = await db.select({ count: sql<number>`count(*)` }).from(prospects);
    const tasksCount = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, TaskStatus.PENDING));
    const qcCount = await db.select({ count: sql<number>`count(*)` }).from(qcQueueItems).where(eq(qcQueueItems.status, QCStatus.PENDING));

    // Group prospects by stage
    const stages = await db.select({ 
      stage: prospects.stage, 
      count: sql<number>`count(*)` 
    }).from(prospects).groupBy(prospects.stage);

    const prospectsByStage = stages.reduce((acc, curr) => {
      acc[curr.stage] = Number(curr.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      prospectsByStage,
      tasksDueToday: Number(tasksCount[0].count),
      qcPending: Number(qcCount[0].count),
      replyRate: 12.5 // Mock/placeholder
    };
  }
}

export const storage = new DatabaseStorage();
