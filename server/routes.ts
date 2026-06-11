import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Teams
  app.get(api.teams.list.path, asyncHandler(async (req: any, res: any) => {
    const userId = req.user?.claims?.sub;
    if (userId) {
      const teams = await storage.getTeamsByUserId(userId);
      res.json(teams);
    } else {
      res.json([]);
    }
  }));

  app.post(api.teams.create.path, asyncHandler(async (req: any, res: any) => {
    try {
      const input = api.teams.create.input.parse(req.body);
      const team = await storage.createTeam(input);
      res.status(201).json(team);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  }));

  app.get(api.teams.get.path, asyncHandler(async (req: any, res: any) => {
    const team = await storage.getTeam(Number(req.params.id));
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  }));

  // Prospects
  app.get(api.prospects.list.path, asyncHandler(async (req: any, res: any) => {
    const teamId = req.query.teamId ? Number(req.query.teamId) : 1;
    const filters = {
      stage: req.query.stage as string,
      assignedToId: req.query.assignedToId as string
    };
    const prospects = await storage.getProspects(teamId, filters);
    res.json(prospects);
  }));

  app.post(api.prospects.create.path, asyncHandler(async (req: any, res: any) => {
    try {
      const input = api.prospects.create.input.parse(req.body);
      const prospect = await storage.createProspect(input);
      res.status(201).json(prospect);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  }));

  app.get(api.prospects.get.path, asyncHandler(async (req: any, res: any) => {
    const prospect = await storage.getProspect(Number(req.params.id));
    if (!prospect) return res.status(404).json({ message: "Prospect not found" });
    res.json(prospect);
  }));

  app.patch(api.prospects.update.path, asyncHandler(async (req: any, res: any) => {
    try {
      const input = api.prospects.update.input.parse(req.body);
      const prospectId = Number(req.params.id);

      const currentProspect = await storage.getProspect(prospectId);
      if (!currentProspect) {
        return res.status(404).json({ message: "Prospect not found" });
      }

      const prospect = await storage.updateProspect(prospectId, input);

      if (input.stage && input.stage !== currentProspect.stage) {
        const userId = req.user?.claims?.sub || "system";
        await storage.createActivity({
          prospectId: prospect.id,
          userId,
          type: "STAGE_CHANGED",
          details: { fromStage: currentProspect.stage, toStage: input.stage }
        });

        const timingUpdates: any = {};
        if (input.stage === "WARMING" && !currentProspect.warmingStartedAt) {
          timingUpdates.warmingStartedAt = new Date();
        } else if (input.stage === "FIRST_TOUCH_SENT" && !currentProspect.firstTouchSentAt) {
          timingUpdates.firstTouchSentAt = new Date();
        } else if (input.stage === "VIDEO_SENT" && !currentProspect.videoSentAt) {
          timingUpdates.videoSentAt = new Date();
        } else if (input.stage === "CALL_BOOKED" && !currentProspect.callBookedAt) {
          timingUpdates.callBookedAt = new Date();
        } else if ((input.stage === "WON" || input.stage === "LOST") && !currentProspect.closedAt) {
          timingUpdates.closedAt = new Date();
        }

        if (Object.keys(timingUpdates).length > 0) {
          await storage.updateProspect(prospectId, timingUpdates);
        }
      }

      res.json(prospect);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  }));

  app.delete(api.prospects.delete.path, asyncHandler(async (req: any, res: any) => {
    await storage.deleteProspect(Number(req.params.id));
    res.status(204).send();
  }));

  app.post(api.prospects.import.path, asyncHandler(async (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const input = api.prospects.import.input.parse(req.body);
      const userId = req.user.claims?.sub || "system";

      const prospectsToCreate = input.prospects.map(p => ({
        teamId: input.teamId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        company: p.company,
        title: p.title,
        source: input.source,
        linkedinUrl: p.linkedinUrl,
        twitterHandle: p.twitterHandle,
        stage: "IDENTIFIED" as const
      }));

      const created = await storage.createProspectsBulk(prospectsToCreate);

      res.status(201).json({
        imported: created.length,
        duplicates: 0
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  }));

  // Tasks
  app.get(api.tasks.list.path, asyncHandler(async (req: any, res: any) => {
    const teamId = req.query.teamId ? Number(req.query.teamId) : 1;
    const filters = {
      assignedToId: req.query.assignedToId as string,
      status: req.query.status as string,
      dueDate: req.query.dueDate ? new Date(req.query.dueDate as string) : undefined
    };
    const tasks = await storage.getTasks(teamId, filters);
    res.json(tasks);
  }));

  app.post(api.tasks.create.path, asyncHandler(async (req: any, res: any) => {
    const input = api.tasks.create.input.parse(req.body);
    const task = await storage.createTask(input);
    res.status(201).json(task);
  }));

  app.patch(api.tasks.update.path, asyncHandler(async (req: any, res: any) => {
    const input = api.tasks.update.input.parse(req.body);
    const task = await storage.updateTask(Number(req.params.id), input);
    res.json(task);
  }));

  app.post(api.tasks.complete.path, asyncHandler(async (req: any, res: any) => {
    const task = await storage.completeTask(Number(req.params.id));
    res.json(task);
  }));

  // Templates
  app.get(api.templates.list.path, asyncHandler(async (req: any, res: any) => {
    const teamId = req.query.teamId ? Number(req.query.teamId) : 1;
    const filters = { type: req.query.type as string };
    const templates = await storage.getTemplates(teamId, filters);
    res.json(templates);
  }));

  app.post(api.templates.create.path, asyncHandler(async (req: any, res: any) => {
    const input = api.templates.create.input.parse(req.body);
    const template = await storage.createTemplate(input);
    res.status(201).json(template);
  }));

  app.patch(api.templates.update.path, asyncHandler(async (req: any, res: any) => {
    const input = api.templates.update.input.parse(req.body);
    const template = await storage.updateTemplate(Number(req.params.id), input);
    res.json(template);
  }));

  app.delete(api.templates.delete.path, asyncHandler(async (req: any, res: any) => {
    await storage.deleteTemplate(Number(req.params.id));
    res.status(204).send();
  }));

  // QC Queue
  app.get(api.qc.list.path, asyncHandler(async (req: any, res: any) => {
    const filters = { status: req.query.status as string };
    const items = await storage.getQCItems(filters);
    res.json(items);
  }));

  app.post(api.qc.submit.path, asyncHandler(async (req: any, res: any) => {
    const input = api.qc.submit.input.parse(req.body);
    const item = await storage.createQCItem(input);
    res.status(201).json(item);
  }));

  app.patch(api.qc.review.path, asyncHandler(async (req: any, res: any) => {
    const input = api.qc.review.input.parse(req.body);
    const item = await storage.updateQCItem(Number(req.params.id), input);
    res.json(item);
  }));

  // Analytics
  app.get(api.analytics.overview.path, asyncHandler(async (req: any, res: any) => {
    const stats = await storage.getAnalyticsOverview();
    res.json(stats);
  }));

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const demoUserId = "demo-user";

  await authStorage.upsertUser({
    id: demoUserId,
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: null
  });

  const existingTeams = await storage.getTeamsByUserId(demoUserId);
  if (existingTeams.length > 0) return;

  console.log("Seeding database...");

  const team = await storage.createTeam({
    name: "Growth Team",
    ownerId: demoUserId,
    settings: {
      warmingPeriodHours: 36,
      firstTouchToVideoHours: 72,
      staleThresholdDays: 14,
      qcEnabled: true
    }
  });

  await storage.addTeamMember({
    teamId: team.id,
    userId: demoUserId,
    role: "ADMIN"
  });

  const prospects = [
    {
      teamId: team.id,
      firstName: "Sarah",
      lastName: "Connor",
      company: "Skynet Corp",
      title: "CTO",
      source: "LinkedIn",
      stage: "IDENTIFIED",
      email: "sarah@skynet.com",
      linkedinUrl: "https://linkedin.com/in/sarahconnor"
    },
    {
      teamId: team.id,
      firstName: "John",
      lastName: "Doe",
      company: "Acme Inc",
      title: "VP Sales",
      source: "Clay",
      stage: "WARMING",
      email: "john@acme.com"
    },
    {
      teamId: team.id,
      firstName: "Jane",
      lastName: "Smith",
      company: "TechStar",
      title: "CEO",
      source: "Referral",
      stage: "FIRST_TOUCH_READY",
      email: "jane@techstar.com"
    }
  ];

  for (const p of prospects) {
    await storage.createProspect(p);
  }

  await storage.createTemplate({
    teamId: team.id,
    name: "General Connection Request",
    type: "CONNECTION_REQUEST",
    content: "Hi {firstName}, saw your post about AI sales tools. Would love to connect!",
    createdById: demoUserId
  });

  await storage.createTemplate({
    teamId: team.id,
    name: "Value-First Touch",
    type: "FIRST_TOUCH",
    content: "Hi {firstName}, noticed you're hiring SDRs. We built a tool that helps them book 2x more meetings. Worth a chat?",
    createdById: demoUserId
  });

  console.log("Database seeded successfully!");
}
