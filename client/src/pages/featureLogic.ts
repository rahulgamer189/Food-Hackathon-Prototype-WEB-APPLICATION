export type MacroMeal = { calories: number; protein: number; carbs: number; fats: number };

export function getGoalCalorieMultiplier(goal: string) {
  if (goal === "Muscle gain") return 1.16;
  if (goal === "Weight loss") return 0.84;
  if (goal === "Exam energy") return 1.06;
  return 1;
}

export function averagePlanTotals(plan: Array<{ breakfast: MacroMeal; lunch: MacroMeal; snack: MacroMeal; dinner: MacroMeal }>) {
  if (!plan.length) return null;
  const totals = plan.reduce((acc, day) => {
    for (const meal of [day.breakfast, day.lunch, day.snack, day.dinner]) {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fats += meal.fats;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  return {
    calories: Math.round(totals.calories / plan.length),
    protein: Math.round(totals.protein / plan.length),
    carbs: Math.round(totals.carbs / plan.length),
    fats: Math.round(totals.fats / plan.length),
  };
}

export function scaleRecipeQuantity(quantity: string, multiplier: number) {
  const match = quantity.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return quantity;
  const scaled = (Number(match[1]) * multiplier).toFixed(1).replace(/\.0$/, "");
  return `${scaled} ${match[2]}`;
}

export function calculateWasteMetrics(prepared: number, consumed: number) {
  const safePrepared = Math.max(0, prepared);
  const safeConsumed = Math.max(0, Math.min(consumed, safePrepared));
  const wasteKg = safePrepared - safeConsumed;
  return {
    wasteKg,
    wastePercent: safePrepared ? Math.round((wasteKg / safePrepared) * 100) : 0,
  };
}

export function calculateWellnessScore(items: Array<{ score: number }>) {
  return Math.min(100, 74 + items.reduce((sum, item) => sum + (item.score >= 80 ? 2 : 1), 0));
}

export function calculateStreak(logCount: number) {
  return 6 + Math.min(6, Math.max(0, logCount));
}
