import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  campusSnapshots,
  inventoryItems,
  meals,
  nutritionLogs,
  studentProfiles,
  users,
  wasteLogs,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export const DEMO_DATE = "2026-09-24";

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const demoMeals = [
  { menuDate: DEMO_DATE, mealType: "breakfast" as const, dishName: "Pakhala oats bowl", tag: "High fibre", calories: 420, proteinGrams: 16, fiberGrams: 9, expectedServings: 470, preparedServings: 480, consumedServings: 438, nutritionScore: 82 },
  { menuDate: DEMO_DATE, mealType: "lunch" as const, dishName: "Dalma · Rice · Santula", tag: "Local pick", calories: 620, proteinGrams: 24, fiberGrams: 12, expectedServings: 482, preparedServings: 500, consumedServings: 456, nutritionScore: 89 },
  { menuDate: DEMO_DATE, mealType: "dinner" as const, dishName: "Paneer curry · Roti", tag: "Protein +", calories: 540, proteinGrams: 28, fiberGrams: 7, expectedServings: 440, preparedServings: 455, consumedServings: 401, nutritionScore: 84 },
];

export async function ensureDemoData() {
  const db = await getDb();
  if (!db) return;

  const existingMeals = await db.select({ id: meals.id }).from(meals).limit(1);
  if (existingMeals.length === 0) await db.insert(meals).values(demoMeals);

  const existingInventory = await db.select({ id: inventoryItems.id }).from(inventoryItems).limit(1);
  if (existingInventory.length === 0) {
    await db.insert(inventoryItems).values([
      { name: "Rice", unit: "kg", stock: 86, reorderLevel: 40, expiryDate: "2026-11-12", status: "ok" },
      { name: "Tomato", unit: "kg", stock: 18, reorderLevel: 25, expiryDate: "2026-09-28", status: "low" },
      { name: "Toor dal", unit: "kg", stock: 42, reorderLevel: 24, expiryDate: "2027-01-18", status: "ok" },
      { name: "Paneer", unit: "kg", stock: 11, reorderLevel: 12, expiryDate: "2026-09-26", status: "expiring" },
    ]);
  }

  const existingWaste = await db.select({ id: wasteLogs.id }).from(wasteLogs).limit(1);
  if (existingWaste.length === 0) {
    await db.insert(wasteLogs).values([
      { menuDate: DEMO_DATE, mealType: "breakfast", preparedKg: 58, consumedKg: 53, savedKg: 5, co2SavedKg: 12, costSavedPaise: 1800 },
      { menuDate: DEMO_DATE, mealType: "lunch", preparedKg: 96, consumedKg: 84, savedKg: 12, co2SavedKg: 29, costSavedPaise: 4200 },
      { menuDate: DEMO_DATE, mealType: "dinner", preparedKg: 82, consumedKg: 73, savedKg: 9, co2SavedKg: 21, costSavedPaise: 3100 },
    ]);
  }

  const existingSnapshot = await db.select({ id: campusSnapshots.id }).from(campusSnapshots).where(eq(campusSnapshots.snapshotDate, DEMO_DATE)).limit(1);
  if (existingSnapshot.length === 0) {
    await db.insert(campusSnapshots).values({ snapshotDate: DEMO_DATE, healthScore: 86, mealsLogged: 1284, wasteReducedPercent: 18, activeStreaks: 72, expectedStudents: 482, totalStudents: 540 });
  }
}

export async function getCampusDashboard() {
  const db = await getDb();
  if (!db) return null;
  await ensureDemoData();

  const [snapshot] = await db.select().from(campusSnapshots).where(eq(campusSnapshots.snapshotDate, DEMO_DATE)).limit(1);
  const menu = await db.select().from(meals).where(eq(meals.menuDate, DEMO_DATE));
  const inventory = await db.select().from(inventoryItems);
  const waste = await db.select().from(wasteLogs).orderBy(desc(wasteLogs.createdAt)).limit(7);
  return { snapshot, menu, inventory, waste, demoDate: DEMO_DATE };
}

export async function getStudentDashboard(userId: number) {
  const db = await getDb();
  if (!db) return null;
  await ensureDemoData();

  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  const logs = await db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, userId)).orderBy(desc(nutritionLogs.loggedAt)).limit(20);
  return { profile, logs };
}

export async function saveStudentProfile(userId: number, profile: Omit<typeof studentProfiles.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");

  await db.insert(studentProfiles).values({ userId, ...profile }).onDuplicateKeyUpdate({
    set: { ...profile, updatedAt: new Date() },
  });
  const [saved] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  return saved;
}

export async function addNutritionLog(userId: number, log: Omit<typeof nutritionLogs.$inferInsert, "id" | "userId" | "loggedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(nutritionLogs).values({ userId, ...log });
  const [saved] = await db.select().from(nutritionLogs).where(and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.itemName, log.itemName))).orderBy(desc(nutritionLogs.loggedAt)).limit(1);
  return saved;
}

export async function updateInventoryItem(id: number, stock: number, status: "ok" | "low" | "expiring") {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(inventoryItems).set({ stock, status, updatedAt: new Date() }).where(eq(inventoryItems.id, id));
  const [saved] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
  return saved;
}
