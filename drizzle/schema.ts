import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Student nutrition onboarding and progress state. */
export const studentProfiles = mysqlTable("studentProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  age: int("age"),
  heightCm: int("heightCm"),
  weightKg: int("weightKg"),
  gender: varchar("gender", { length: 32 }),
  activityLevel: varchar("activityLevel", { length: 48 }),
  goals: text("goals"),
  dietaryPreferences: text("dietaryPreferences"),
  allergies: text("allergies"),
  localFoodPreferences: text("localFoodPreferences"),
  wellnessScore: int("wellnessScore").default(74).notNull(),
  streakDays: int("streakDays").default(6).notNull(),
  weeklyRhythm: varchar("weeklyRhythm", { length: 64 }).default("68,82,74,91,78,88,74").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdUnique: uniqueIndex("studentProfiles_userId_unique").on(table.userId),
}));

/** Menu and service demand data used by the mess dashboard. */
export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  menuDate: varchar("menuDate", { length: 10 }).notNull(),
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner"]).notNull(),
  dishName: varchar("dishName", { length: 160 }).notNull(),
  tag: varchar("tag", { length: 64 }).notNull(),
  calories: int("calories").default(0).notNull(),
  proteinGrams: int("proteinGrams").default(0).notNull(),
  fiberGrams: int("fiberGrams").default(0).notNull(),
  expectedServings: int("expectedServings").default(0).notNull(),
  preparedServings: int("preparedServings").default(0).notNull(),
  consumedServings: int("consumedServings").default(0).notNull(),
  nutritionScore: int("nutritionScore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Current kitchen stock and reorder signals. */
export const inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  unit: varchar("unit", { length: 24 }).notNull(),
  stock: int("stock").default(0).notNull(),
  reorderLevel: int("reorderLevel").default(0).notNull(),
  expiryDate: varchar("expiryDate", { length: 10 }),
  status: mysqlEnum("status", ["ok", "low", "expiring"]).default("ok").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Prepared-versus-consumed waste records for impact reporting. */
export const wasteLogs = mysqlTable("wasteLogs", {
  id: int("id").autoincrement().primaryKey(),
  menuDate: varchar("menuDate", { length: 10 }).notNull(),
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner"]).notNull(),
  preparedKg: int("preparedKg").default(0).notNull(),
  consumedKg: int("consumedKg").default(0).notNull(),
  savedKg: int("savedKg").default(0).notNull(),
  co2SavedKg: int("co2SavedKg").default(0).notNull(),
  costSavedPaise: int("costSavedPaise").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Optional food scan and meal logging events; anonymous demo logs are allowed. */
export const nutritionLogs = mysqlTable("nutritionLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  itemName: varchar("itemName", { length: 160 }).notNull(),
  source: mysqlEnum("source", ["scanner", "menu", "manual"]).default("scanner").notNull(),
  calories: int("calories").default(0).notNull(),
  proteinGrams: int("proteinGrams").default(0).notNull(),
  score: int("score").default(0).notNull(),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
});

/** Campus-level snapshot used by the monitoring module. */
export const campusSnapshots = mysqlTable("campusSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotDate: varchar("snapshotDate", { length: 10 }).notNull().unique(),
  healthScore: int("healthScore").default(86).notNull(),
  mealsLogged: int("mealsLogged").default(1284).notNull(),
  wasteReducedPercent: int("wasteReducedPercent").default(18).notNull(),
  activeStreaks: int("activeStreaks").default(72).notNull(),
  expectedStudents: int("expectedStudents").default(482).notNull(),
  totalStudents: int("totalStudents").default(540).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type WasteLog = typeof wasteLogs.$inferSelect;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type CampusSnapshot = typeof campusSnapshots.$inferSelect;
