import { describe, expect, it } from "vitest";
import { averagePlanTotals, calculateStreak, calculateWasteMetrics, calculateWellnessScore, getGoalCalorieMultiplier, scaleRecipeQuantity } from "../client/src/pages/featureLogic";

describe("Food4iFe feature calculations", () => {
  it("adjusts calorie targets by goal", () => {
    expect(getGoalCalorieMultiplier("Muscle gain")).toBe(1.16);
    expect(getGoalCalorieMultiplier("Weight loss")).toBe(0.84);
    expect(getGoalCalorieMultiplier("General health")).toBe(1);
  });

  it("averages four-meal macro totals across plan days", () => {
    const meal = { calories: 100, protein: 10, carbs: 20, fats: 5 };
    expect(averagePlanTotals([{ breakfast: meal, lunch: meal, snack: meal, dinner: meal }, { breakfast: meal, lunch: meal, snack: meal, dinner: meal }])).toEqual({ calories: 400, protein: 40, carbs: 80, fats: 20 });
    expect(averagePlanTotals([])).toBeNull();
  });

  it("scales recipe quantities for a changed headcount", () => {
    expect(scaleRecipeQuantity("22 kg", 1.2)).toBe("26.4 kg");
    expect(scaleRecipeQuantity("3.5 L", 0.5)).toBe("1.8 L");
    expect(scaleRecipeQuantity("to taste", 2)).toBe("to taste");
  });

  it("calculates waste safely and clamps consumed weight", () => {
    expect(calculateWasteMetrics(96, 84)).toEqual({ wasteKg: 12, wastePercent: 13 });
    expect(calculateWasteMetrics(10, 15)).toEqual({ wasteKg: 0, wastePercent: 0 });
    expect(calculateWasteMetrics(0, 0)).toEqual({ wasteKg: 0, wastePercent: 0 });
  });

  it("updates wellness score and streak from logged meals", () => {
    expect(calculateWellnessScore([])).toBe(74);
    expect(calculateWellnessScore([{ score: 91 }, { score: 54 }])).toBe(77);
    expect(calculateWellnessScore(Array.from({ length: 30 }, () => ({ score: 100 })))).toBe(100);
    expect(calculateStreak(-2)).toBe(6);
    expect(calculateStreak(3)).toBe(9);
    expect(calculateStreak(20)).toBe(12);
  });
});
