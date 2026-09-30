import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addNutritionLog, getCampusDashboard, getStudentDashboard, saveStudentProfile, updateInventoryItem } from "./db";

const profileInput = z.object({
  age: z.number().int().min(13).max(100).optional(),
  heightCm: z.number().int().min(100).max(240).optional(),
  weightKg: z.number().int().min(25).max(250).optional(),
  gender: z.string().max(32).optional(),
  activityLevel: z.string().max(48).optional(),
  goals: z.string().max(500).optional(),
  dietaryPreferences: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
  localFoodPreferences: z.string().max(500).optional(),
  wellnessScore: z.number().int().min(0).max(100).optional(),
  streakDays: z.number().int().min(0).max(365).optional(),
  weeklyRhythm: z.string().max(64).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  campus: router({
    dashboard: publicProcedure.query(() => getCampusDashboard()),
    studentDashboard: protectedProcedure.query(({ ctx }) => getStudentDashboard(ctx.user.id)),
    saveStudentProfile: protectedProcedure.input(profileInput).mutation(({ ctx, input }) => saveStudentProfile(ctx.user.id, input)),
    logNutrition: protectedProcedure.input(z.object({
      itemName: z.string().min(1).max(160),
      source: z.enum(["scanner", "menu", "manual"]).default("scanner"),
      calories: z.number().int().min(0).max(3000),
      proteinGrams: z.number().int().min(0).max(300),
      score: z.number().int().min(0).max(100),
    })).mutation(({ ctx, input }) => addNutritionLog(ctx.user.id, input)),
    updateInventory: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      stock: z.number().int().min(0),
      status: z.enum(["ok", "low", "expiring"]),
    })).mutation(({ input }) => updateInventoryItem(input.id, input.stock, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
