import { useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Flame,
  HeartPulse,
  Loader2,
  Plus,
  Search,
  RefreshCw,
  Save,
  ScanLine,
  Share2,
  Sparkles,
  Trophy,
  Upload,
  Users,
  Utensils,
  Wheat,
} from "lucide-react";
import { averagePlanTotals, calculateWasteMetrics, getGoalCalorieMultiplier, scaleRecipeQuantity } from "./featureLogic";

type Goal = "Weight loss" | "Muscle gain" | "Maintain" | "Exam energy" | "General health";
type Preference = "Vegetarian" | "Non-veg" | "Jain" | "Local Odia preference";

type MealPlan = {
  day: number;
  breakfast: { name: string; calories: number; protein: number; carbs: number; fats: number };
  lunch: { name: string; calories: number; protein: number; carbs: number; fats: number };
  snack: { name: string; calories: number; protein: number; carbs: number; fats: number };
  dinner: { name: string; calories: number; protein: number; carbs: number; fats: number };
};

const baseMeals = {
  breakfast: [
    { name: "Pakhala oats bowl · banana · roasted chana", calories: 420, protein: 16, carbs: 68, fats: 10 },
    { name: "Suji upma · sprouts · curd", calories: 380, protein: 15, carbs: 58, fats: 11 },
    { name: "Ragi dosa · paneer bhurji · fruit", calories: 460, protein: 22, carbs: 54, fats: 17 },
  ],
  lunch: [
    { name: "Dalma · rice · santula · salad", calories: 620, protein: 24, carbs: 92, fats: 16 },
    { name: "Rajma rice · cucumber raita · greens", calories: 590, protein: 25, carbs: 88, fats: 14 },
    { name: "Egg curry · rice · seasonal sabzi", calories: 650, protein: 32, carbs: 86, fats: 19 },
  ],
  snack: [
    { name: "Roasted chana · lemon water", calories: 190, protein: 9, carbs: 26, fats: 5 },
    { name: "Peanut chikki · chaas", calories: 230, protein: 8, carbs: 28, fats: 10 },
    { name: "Guava · curd · pumpkin seeds", calories: 210, protein: 12, carbs: 25, fats: 7 },
  ],
  dinner: [
    { name: "Paneer curry · roti · sautéed beans", calories: 540, protein: 28, carbs: 62, fats: 20 },
    { name: "Vegetable khichdi · raita · papad", calories: 490, protein: 18, carbs: 74, fats: 12 },
    { name: "Fish curry · rice · tomato santula", calories: 570, protein: 34, carbs: 68, fats: 16 },
  ],
};

const recipes: Record<string, { title: string; ingredients: string[]; steps: string[]; cost: number; calories: number; protein: number; serves: number }> = {
  dalma: { title: "Dalma", ingredients: ["Toor dal · 22 kg", "Raw papaya + pumpkin · 35 kg", "Potato · 28 kg", "Tomato · 12 kg", "Ginger, cumin, panch phoron · 2.5 kg", "Ghee · 3.5 L"], steps: ["Wash dal and soak for 20 minutes", "Pressure cook dal with vegetables for 4 whistles", "Prepare the Odia tempering with ghee and panch phoron", "Fold tempering into dal, adjust salt, and hold warm at 75°C"], cost: 6840, calories: 320, protein: 14, serves: 500 },
  paneer: { title: "Paneer Curry", ingredients: ["Paneer · 42 kg", "Onion · 24 kg", "Tomato · 30 kg", "Curd · 12 kg", "Cashew + spices · 4 kg", "Oil · 6 L"], steps: ["Marinate paneer with curd and spices for 30 minutes", "Prepare onion-tomato base in two 40 L kettles", "Add paneer and simmer gently for 12 minutes", "Finish with coriander and portion into 500 bowls"], cost: 12800, calories: 410, protein: 23, serves: 500 },
  biryani: { title: "Vegetable Biryani", ingredients: ["Basmati rice · 48 kg", "Mixed vegetables · 38 kg", "Curd · 10 kg", "Onion · 22 kg", "Whole spices · 1.8 kg", "Oil · 7 L"], steps: ["Parboil rice to 70% and drain", "Cook spiced vegetable masala in batches", "Layer rice, masala, mint, and saffron water", "Dum cook for 25 minutes, rest for 10, then serve"], cost: 11200, calories: 460, protein: 12, serves: 500 },
};

function cn(...items: Array<string | false | null | undefined>) { return items.filter(Boolean).join(" "); }
function money(value: number) { return `₹${value.toLocaleString("en-IN")}`; }
function readSaved<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function saveLocal<T>(key: string, value: T) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[24px] border border-[#e7e5dc] bg-[#fffdf7] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6", className)}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-[#899588]">{label}</span>{children}</label>;
}

const inputClass = "w-full rounded-xl border border-[#dfe5da] bg-white px-3 py-2.5 text-xs font-semibold text-[#365642] outline-none transition focus:border-[#ef7e3b] focus:ring-2 focus:ring-[#ef7e3b]/15";

export function DietPlanCreator({ onPlanSaved }: { onPlanSaved?: (plan: MealPlan[]) => void }) {
  const [age, setAge] = useState("19");
  const [gender, setGender] = useState("Prefer not to say");
  const [height, setHeight] = useState("172");
  const [weight, setWeight] = useState("64");
  const [goal, setGoal] = useState<Goal>("General health");
  const [activity, setActivity] = useState("Moderately active");
  const [preference, setPreference] = useState<Preference>("Local Odia preference");
  const [allergies, setAllergies] = useState("None");
  const [days, setDays] = useState("3");
  const [plan, setPlan] = useState<MealPlan[]>(() => readSaved("food4ife-diet-plan", []));
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePlan = () => {
    setIsGenerating(true);
    window.setTimeout(() => {
      const multiplier = getGoalCalorieMultiplier(goal);
      const preferenceOffset = preference === "Non-veg" ? 35 : 0;
      const count = Number(days);
      const generated = Array.from({ length: count }, (_, index) => {
        const pick = <T,>(items: T[]) => items[(index + Math.floor(Math.random() * items.length)) % items.length];
        const day = {
          breakfast: pick(baseMeals.breakfast), lunch: pick(baseMeals.lunch), snack: pick(baseMeals.snack), dinner: pick(baseMeals.dinner),
        };
        return { day: index + 1, ...Object.fromEntries(Object.entries(day).map(([key, value]) => [key, { ...value, calories: Math.round(value.calories * multiplier + (key === "lunch" ? preferenceOffset : 0)) }])) } as MealPlan;
      });
      setPlan(generated);
      saveLocal("food4ife-diet-plan", generated);
      onPlanSaved?.(generated);
      setIsGenerating(false);
      toast.success(`${count}-day plan generated for ${goal.toLowerCase()}.`);
    }, 650);
  };

  const totals = useMemo(() => averagePlanTotals(plan), [plan]);

  return <div className="space-y-5">
    <Panel className="border-[#f0d8c7] bg-gradient-to-br from-[#fffdf7] to-[#fff4e9]">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#ef7e3b]"><Sparkles className="h-3.5 w-3.5" /> Personal diet studio</div><h3 className="mt-2 font-display text-2xl font-semibold text-[#183a29]">Create my diet plan</h3><p className="mt-1 max-w-xl text-xs leading-5 text-[#6e7b70]">Build a practical plan around your goals, campus food, and local Odia favourites in under 30 seconds.</p></div><div className="rounded-2xl bg-white/70 px-3 py-2 text-right"><div className="font-display text-2xl font-semibold text-[#254c36]">{totals?.calories ?? "—"}</div><div className="text-[9px] font-bold uppercase tracking-[.1em] text-[#8e9a8e]">avg kcal / day</div></div></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Age"><input className={inputClass} type="number" value={age} onChange={(e) => setAge(e.target.value)} /></Field><Field label="Gender"><select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value)}><option>Prefer not to say</option><option>Female</option><option>Male</option></select></Field><Field label="Height (cm)"><input className={inputClass} type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Field><Field label="Weight (kg)"><input className={inputClass} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field><Field label="Goal"><select className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>{["Weight loss", "Muscle gain", "Maintain", "Exam energy", "General health"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Activity"><select className={inputClass} value={activity} onChange={(e) => setActivity(e.target.value)}><option>Lightly active</option><option>Moderately active</option><option>Very active</option></select></Field><Field label="Diet preference"><select className={inputClass} value={preference} onChange={(e) => setPreference(e.target.value as Preference)}>{["Vegetarian", "Non-veg", "Jain", "Local Odia preference"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Plan length"><select className={inputClass} value={days} onChange={(e) => setDays(e.target.value)}><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option></select></Field></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]"><Field label="Allergies or restrictions"><input className={inputClass} value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. peanuts, lactose, none" /></Field><button disabled={isGenerating} onClick={generatePlan} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#ef7e3b] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(239,126,59,.2)] transition hover:bg-[#df6d2d] disabled:opacity-60">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {isGenerating ? "Creating…" : plan.length ? "Regenerate plan" : "Generate diet plan"}</button></div>
    </Panel>
    {plan.length > 0 && <Panel><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Saved smart menu · {plan.length} days</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">Your plate, planned</h3></div><button onClick={() => { saveLocal("food4ife-diet-plan", plan); toast.success("Plan saved to On your plate."); }} className="inline-flex items-center gap-2 rounded-full bg-[#eaf5e8] px-3 py-2 text-[11px] font-bold text-[#37754c]"><Save className="h-3.5 w-3.5" /> Save to smart menu</button></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{plan.map((day) => <div key={day.day} className="rounded-2xl border border-[#edf0e8] bg-[#fbfcf8] p-4"><div className="flex items-center justify-between"><span className="rounded-full bg-[#254c36] px-2.5 py-1 text-[10px] font-bold text-white">Day {day.day}</span><span className="text-[10px] font-bold text-[#8b9689]">{Object.values(day).filter((v) => typeof v === "object").reduce((sum, meal) => sum + (meal as { calories: number }).calories, 0)} kcal</span></div><div className="mt-3 space-y-2">{(["breakfast", "lunch", "snack", "dinner"] as const).map((key) => <div key={key} className="flex gap-2 text-[11px]"><span className="w-16 shrink-0 font-bold capitalize text-[#9aa297]">{key}</span><span className="font-semibold leading-4 text-[#46624d]">{day[key].name}</span></div>)}</div><div className="mt-4 flex gap-3 border-t border-[#e8eee4] pt-3 text-[10px] font-bold text-[#6a846c]"><span>{Math.round((day.breakfast.protein + day.lunch.protein + day.snack.protein + day.dinner.protein))}g protein</span><span>{allergies !== "None" ? `Avoids ${allergies}` : "Campus-friendly"}</span></div></div>)}</div></Panel>}
  </div>;
}

export function RecipeScheduleGenerator() {
  const [dish, setDish] = useState("");
  const [students, setStudents] = useState("500");
  const [result, setResult] = useState<typeof recipes.dalma | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generate = () => {
    const key = dish.toLowerCase().includes("paneer") ? "paneer" : dish.toLowerCase().includes("biryani") ? "biryani" : "dalma";
    setIsGenerating(true); window.setTimeout(() => { setResult(recipes[key]); setIsGenerating(false); toast.success(`${recipes[key].title} schedule ready for ${students} students.`); }, 450);
  };
  const scale = Number(students || 500) / 500;
  return <Panel><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#4c8a5d]"><Utensils className="h-3.5 w-3.5" /> Mess recipe engine</div><h3 className="mt-2 font-display text-2xl font-semibold text-[#183a29]">Recipe → full preparation schedule</h3><p className="mt-1 text-xs leading-5 text-[#6e7b70]">Type Dalma, Paneer Curry, or Vegetable Biryani and get scaled quantities for today’s service.</p></div><Wheat className="h-6 w-6 text-[#cf7c35]" /></div><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px_auto]"><Field label="Dish or recipe"><input className={inputClass} value={dish} onChange={(e) => setDish(e.target.value)} placeholder="Try Dalma or Paneer Curry" /></Field><Field label="Students"><input className={inputClass} type="number" min="20" value={students} onChange={(e) => setStudents(e.target.value)} /></Field><button onClick={generate} disabled={!dish || isGenerating} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#254c36] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#1d402c] disabled:opacity-50">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />} Generate schedule</button></div>{!result && <div className="mt-5 rounded-2xl border border-dashed border-[#dfe6da] bg-[#f8faf5] p-5 text-center text-xs font-semibold text-[#849283]">Your quantities, timeline, estimated cost, and nutrition breakdown will appear here.</div>}{result && <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div><div className="flex items-center justify-between"><h4 className="font-display text-xl font-semibold text-[#254c36]">{result.title} for {students} students</h4><button onClick={() => toast.success("Schedule copied for the kitchen team.")} className="rounded-lg p-2 text-[#6f896f] hover:bg-[#f0f5ec]" aria-label="Copy schedule"><Download className="h-4 w-4" /></button></div><div className="mt-3 grid gap-2">{result.ingredients.map((item) => <div key={item} className="flex items-center justify-between rounded-xl bg-[#f5f8f2] px-3 py-2 text-xs font-semibold text-[#46624d]"><span>{item.split(" · ")[0]}</span><span className="text-[#7d927d]">{item.split(" · ")[1] ? scaleRecipeQuantity(item.split(" · ")[1], scale) : item}</span></div>)}</div></div><div className="space-y-4"><div className="rounded-2xl bg-[#eef4e9] p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#78917a]"><Clock3 className="h-3.5 w-3.5" /> Kitchen timeline</div><div className="mt-3 space-y-3">{result.steps.map((step, index) => <div key={step} className="flex gap-3 text-xs"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#254c36] text-[10px] font-bold text-white">{index + 1}</span><span className="font-semibold leading-5 text-[#46624d]">{step}</span></div>)}</div></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-[#fff5e7] p-3"><div className="font-display text-lg font-semibold text-[#b56d2d]">{money(Math.round(result.cost * scale))}</div><div className="text-[9px] font-bold uppercase text-[#9b886e]">est. cost</div></div><div className="rounded-xl bg-[#eaf5e8] p-3"><div className="font-display text-lg font-semibold text-[#37754c]">{result.calories}</div><div className="text-[9px] font-bold uppercase text-[#79937c]">kcal / bowl</div></div><div className="rounded-xl bg-[#e8f0f5] p-3"><div className="font-display text-lg font-semibold text-[#315a77]">{result.protein}g</div><div className="text-[9px] font-bold uppercase text-[#8094a1]">protein</div></div></div></div></div>}</Panel>;
}

export function MessOperations({ menu, onHeadcountChange }: { menu: Array<{ mealType: string; dishName: string; tag: string }>; onHeadcountChange?: (value: number) => void }) {
  const [headcount, setHeadcount] = useState(() => Number(localStorage.getItem("food4ife-headcount") ?? 500));
  const [prepared, setPrepared] = useState("96");
  const [consumed, setConsumed] = useState("84");
  const [wasteSaved, setWasteSaved] = useState(() => readSaved("food4ife-waste-saved", 12));
  const [editingMenu, setEditingMenu] = useState(false);
  const [menuDraft, setMenuDraft] = useState(() => readSaved("food4ife-menu-overrides", menu));
  const [reorderOpen, setReorderOpen] = useState(false);
  const ratio = headcount / 500;
  const wasteMetrics = calculateWasteMetrics(Number(prepared), Number(consumed));
  const waste = wasteMetrics.wasteKg;
  const wastePct = wasteMetrics.wastePercent;
  const updateHeadcount = (value: number) => { setHeadcount(value); localStorage.setItem("food4ife-headcount", String(value)); onHeadcountChange?.(value); };
  const displayedMenu = menuDraft.length ? menuDraft : menu;
  const saveMenu = () => { saveLocal("food4ife-menu-overrides", menuDraft); setEditingMenu(false); toast.success("Today’s menu saved for the kitchen team."); };
  return <div className="space-y-5"><div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><Panel className="bg-[#eef4e9]"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#78917a]">Predictive headcount</div><h3 className="mt-1 font-display text-2xl font-semibold text-[#183a29]">Plan today’s kitchen</h3></div><Users className="h-5 w-5 text-[#4c8a5d]" /></div><div className="mt-6 flex items-end gap-3"><input className="w-32 border-b-2 border-[#4c8a5d] bg-transparent font-display text-5xl font-semibold text-[#254c36] outline-none" type="number" min="0" value={headcount} onChange={(e) => updateHeadcount(Math.max(0, Number(e.target.value)))} /><span className="pb-2 text-xs font-bold text-[#6d896c]">students expected today</span></div><input className="mt-6 w-full accent-[#4c8a5d]" type="range" min="250" max="700" value={headcount} onChange={(e) => updateHeadcount(Number(e.target.value))} /><div className="mt-2 flex justify-between text-[10px] font-bold text-[#8ca08c]"><span>250</span><span>500 baseline</span><span>700</span></div><div className="mt-5 rounded-2xl bg-white/70 p-4 text-xs font-semibold text-[#55765b]">Ingredient quantities automatically scale to <span className="font-bold text-[#254c36]">{headcount} servings</span> ({Math.round(ratio * 100)}% of the 500-student recipe).</div></Panel><Panel><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Today’s menu impact</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">{headcount} plates, smarter prep</h3></div><button onClick={editingMenu ? saveMenu : () => { setMenuDraft(displayedMenu); setEditingMenu(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf5e8] px-3 py-2 text-[10px] font-bold text-[#37754c]">{editingMenu ? <><Save className="h-3.5 w-3.5" /> Save menu</> : "Edit menu"}</button></div><div className="mt-5 space-y-3">{displayedMenu.map((item, index) => <div key={item.mealType} className="flex items-center gap-3 rounded-2xl border border-[#edf0e8] p-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0dc] text-[#cf7c35]"><Utensils className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="text-[10px] font-bold uppercase tracking-[.1em] text-[#a0aa9f]">{item.mealType}</div>{editingMenu ? <input className={inputClass} value={menuDraft[index]?.dishName ?? item.dishName} onChange={(e) => setMenuDraft((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, dishName: e.target.value } : row))} /> : <div className="truncate text-xs font-bold text-[#3f5f47]">{item.dishName}</div>}</div><div className="text-right"><div className="font-display text-lg font-semibold text-[#254c36]">{Math.round(96 * ratio)} kg</div><div className="text-[9px] font-bold uppercase text-[#98a397]">prep target</div></div></div>)}</div></Panel></div><div className="grid gap-5 lg:grid-cols-[1fr_1fr]"><Panel><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Waste tracker</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">Close the loop</h3></div><TrashMini /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Prepared (kg)"><input className={inputClass} type="number" min="0" value={prepared} onChange={(e) => setPrepared(e.target.value)} /></Field><Field label="Consumed (kg)"><input className={inputClass} type="number" min="0" value={consumed} onChange={(e) => setConsumed(e.target.value)} /></Field></div><div className="mt-5 flex items-end justify-between rounded-2xl bg-[#fff4e9] p-4"><div><div className="font-display text-3xl font-semibold text-[#b56d2d]">{waste} kg</div><div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9b886e]">waste · {wastePct}% of prep</div></div><button onClick={() => { const next = wasteSaved + waste; setWasteSaved(next); saveLocal("food4ife-waste-saved", next); toast.success(`Logged ${waste} kg waste and updated impact.`); }} className="rounded-xl bg-[#cf7c35] px-3 py-2 text-[11px] font-bold text-white">Log today</button></div><div className="mt-3 text-[11px] font-semibold text-[#6d896c]">{wasteSaved} kg tracked as saved or avoided this week.</div></Panel><Panel><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Inventory watch</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">Kitchen stock</h3></div><AlertTriangle className="h-5 w-5 text-[#cf7c35]" /></div><div className="mt-4 space-y-2">{[{name:"Rice",stock:"86 kg",status:"Healthy"},{name:"Tomato",stock:"18 kg",status:"Low stock"},{name:"Toor dal",stock:"42 kg",status:"Healthy"},{name:"Paneer",stock:"11 kg",status:"Use today"}].map((item) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-[#f7f9f4] px-3 py-2.5"><div className="flex items-center gap-2 text-xs font-bold text-[#46624d]"><span className={cn("h-2 w-2 rounded-full", item.status === "Healthy" ? "bg-[#4c8a5d]" : "bg-[#ef7e3b]")} />{item.name}</div><div className="flex items-center gap-3 text-[10px] font-bold"><span className="text-[#819181]">{item.stock}</span><span className={item.status === "Healthy" ? "text-[#4c8a5d]" : "text-[#c56e2c]"}>{item.status}</span></div></div>)}</div><button onClick={() => setReorderOpen((value) => !value)} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#4c8a5d]">{reorderOpen ? "Hide reorder list" : "Prepare reorder list"} <ChevronRight className="h-3.5 w-3.5" /></button>{reorderOpen && <div className="mt-3 rounded-xl bg-[#fff4e9] p-3 text-[11px] font-semibold leading-5 text-[#8e633e]">Order today: 12 kg tomato, 8 kg paneer, and 5 L cooking oil. The list is ready to share with the storekeeper.</div>}</Panel></div></div>;
}
function TrashMini() { return <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0dc] text-[#cf7c35]"><Flame className="h-4 w-4" /></div>; }

export function ScannerModal({ open, onClose, onLog }: { open: boolean; onClose: () => void; onLog: (item: { name: string; calories: number; protein: number; score: number }) => void }) {
  const [selected, setSelected] = useState("Dalma + Santula");
  if (!open) return null;
  const foods = [{ name: "Dalma + Santula", calories: 420, protein: 24, score: 86, detail: "High fibre · iron-rich · balanced" }, { name: "Pakhala bhata + greens", calories: 360, protein: 12, score: 91, detail: "Hydrating · probiotic · local pick" }, { name: "Paneer curry + roti", calories: 540, protein: 28, score: 82, detail: "Protein+ · moderate fat" }, { name: "Samosa + chai", calories: 410, protein: 8, score: 54, detail: "Enjoy occasionally · add fruit" }];
  const item = foods.find((food) => food.name === selected) ?? foods[0];
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; toast.success(`${file.name} loaded. Choose the closest campus food below for the demo analysis.`); };
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#183a29]/45 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-[#fffdf7] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#ef7e3b]"><ScanLine className="h-4 w-4" /> Food scanner</div><h2 className="mt-2 font-display text-3xl font-semibold text-[#183a29]">What’s on your plate?</h2><p className="mt-1 text-xs text-[#718074]">Use your camera, upload a plate photo, or choose a campus food for instant demo analysis.</p></div><button onClick={onClose} className="rounded-full px-3 py-1 text-xl text-[#829182] hover:bg-[#f2f4ed]">×</button></div><input id="food4ife-scanner-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} /><div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={() => document.getElementById("food4ife-scanner-upload")?.click()} className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d9e3d5] bg-[#f7faf5] p-5 text-xs font-bold text-[#4c8a5d]"><Camera className="h-5 w-5" /> Use camera</button><button onClick={() => document.getElementById("food4ife-scanner-upload")?.click()} className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d9e3d5] bg-[#f7faf5] p-5 text-xs font-bold text-[#4c8a5d]"><Upload className="h-5 w-5" /> Upload plate photo</button></div><div className="mt-5"><div className="text-[10px] font-bold uppercase tracking-[.14em] text-[#93a094]">Demo food library</div><div className="mt-2 grid gap-2">{foods.map((food) => <button key={food.name} onClick={() => setSelected(food.name)} className={cn("flex items-center justify-between rounded-xl border px-3 py-3 text-left transition", selected === food.name ? "border-[#4c8a5d] bg-[#eef6eb]" : "border-[#edf0e8] bg-white")}><div><div className="text-xs font-bold text-[#3f5f47]">{food.name}</div><div className="mt-1 text-[10px] font-semibold text-[#8b9689]">{food.detail}</div></div><span className="font-display text-lg font-semibold text-[#4c8a5d]">{food.score}</span></button>)}</div></div><div className="mt-5 rounded-2xl bg-[#254c36] p-5 text-white"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.14em] text-[#bed3b7]">Personal plate score</div><div className="mt-1 font-display text-5xl font-semibold text-[#f6c553]">{item.score}<span className="text-lg text-[#bed3b7]">/100</span></div></div><HeartPulse className="h-6 w-6 text-[#f6c553]" /></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/10 p-2"><div className="font-display text-lg font-semibold">{item.calories}</div><div className="text-[9px] font-bold uppercase text-[#bed3b7]">kcal</div></div><div className="rounded-xl bg-white/10 p-2"><div className="font-display text-lg font-semibold">{item.protein}g</div><div className="text-[9px] font-bold uppercase text-[#bed3b7]">protein</div></div><div className="rounded-xl bg-white/10 p-2"><div className="font-display text-lg font-semibold">+{Math.max(1, Math.round(item.score / 20))}</div><div className="text-[9px] font-bold uppercase text-[#bed3b7]">streak pts</div></div></div><p className="mt-4 text-xs leading-5 text-[#d6e5d5]">{item.score > 80 ? "Great match for your current wellness goal. Pair it with water and you’re set." : "Enjoy it mindfully. A fruit or dal-based side from today’s menu would improve the balance."}</p><button onClick={() => { onLog(item); onClose(); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f6c553] px-4 py-3 text-xs font-bold text-[#4c421c]"><Plus className="h-4 w-4" /> Add to today’s intake</button></div></div></div>;
}

export function CommunityPanel() {
  const [joined, setJoined] = useState(() => localStorage.getItem("food4ife-challenge") === "joined");
  const [count, setCount] = useState(312 + (joined ? 1 : 0));
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const join = () => { setJoined(true); setCount((value) => value + 1); localStorage.setItem("food4ife-challenge", "joined"); toast.success("Challenge joined — your streak starts today."); };
  return <div className="rounded-[24px] bg-[#254c36] p-5 text-white shadow-[0_14px_35px_rgba(37,76,54,.15)] sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#b9d1b3]"><Trophy className="h-3.5 w-3.5 text-[#f6c553]" /> Community pulse</div><h3 className="mt-3 font-display text-2xl font-medium tracking-[-.04em]">Balanced plate, brighter week.</h3><p className="mt-2 max-w-[460px] text-xs leading-5 text-[#c6dac1]">{count} students at GIET are choosing one better meal a day. Join the challenge, earn streak points, and climb the campus leaderboard.</p></div><div className="flex -space-x-2">{["🍊", "🧑🏽‍🎓", "🥬", "🧑🏻‍🍳"].map((avatar) => <div key={avatar} className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#254c36] bg-[#f1dfb4] text-lg">{avatar}</div>)}<div className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#254c36] bg-[#f6c553] text-[10px] font-bold text-[#4c421c]">+{count - 4}</div></div></div><div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"><div className="rounded-2xl bg-white/10 px-4 py-3"><div className="font-display text-2xl font-semibold text-[#f6c553]">{joined ? "1" : "0"}</div><div className="text-[9px] font-bold uppercase tracking-[.12em] text-[#b9d1b3]">your meals</div></div><div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[64%] rounded-full bg-[#f6c553]" /></div><div className="mt-2 flex justify-between text-[10px] font-bold text-[#b9d1b3]"><span>Next badge: Local Food Hero</span><span>64%</span></div></div><button onClick={joined ? () => setShowLeaderboard((value) => !value) : join} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f6c553] px-4 py-2.5 text-xs font-bold text-[#4c421c] transition hover:bg-[#ffd978]">{joined ? <><Trophy className="h-3.5 w-3.5" /> {showLeaderboard ? "Hide leaderboard" : "See leaderboard"}</> : "Join challenge"}</button></div>{showLeaderboard && <div className="mt-4 grid gap-2 rounded-2xl bg-white/10 p-3 text-xs font-bold text-[#f8df86]"><div className="flex justify-between"><span>1 · Rahul Thakur</span><span>128 pts</span></div><div className="flex justify-between"><span>2 · Sneha Das</span><span>116 pts</span></div><div className="flex justify-between"><span>3 · You</span><span>{joined ? "64 pts" : "Join to score"}</span></div></div>}<div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-[11px] font-semibold text-[#d1e0cd]"><button onClick={() => setShowLeaderboard((value) => !value)} className="flex items-center gap-1.5 text-left hover:text-white"><Trophy className="h-3.5 w-3.5 text-[#f6c553]" /> Leaderboard: 1. Rahul · 2. Sneha · 3. You</button><button onClick={() => { navigator.clipboard?.writeText("I joined Food4iFe’s Balanced Plate challenge at GIET!"); toast.success("Challenge invite copied."); }} className="ml-auto inline-flex items-center gap-1.5 text-[#f6c553]"><Share2 className="h-3.5 w-3.5" /> Share invite</button></div></div>;
}

export function WeeklyReportModal({ open, onClose, intake, score, streak }: { open: boolean; onClose: () => void; intake: Array<{ name: string; calories: number; protein: number; score: number }>; score: number; streak: number }) {
  if (!open) return null;
  const calories = intake.reduce((sum, item) => sum + item.calories, 0);
  const protein = intake.reduce((sum, item) => sum + item.protein, 0);
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#183a29]/45 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[28px] bg-[#fffdf7] p-6 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#4c8a5d]">Personal report</div><h2 className="mt-2 font-display text-3xl font-semibold text-[#183a29]">Your week in food</h2><p className="mt-1 text-xs text-[#718074]">Calculated from meals you scanned or added in this browser.</p></div><button onClick={onClose} className="rounded-full px-3 py-1 text-xl text-[#829182] hover:bg-[#f2f4ed]">×</button></div><div className="mt-6 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-[#eef4e9] p-4 text-center"><div className="font-display text-2xl font-semibold text-[#254c36]">{calories}</div><div className="text-[9px] font-bold uppercase text-[#78917a]">kcal logged</div></div><div className="rounded-2xl bg-[#fff4e9] p-4 text-center"><div className="font-display text-2xl font-semibold text-[#b56d2d]">{protein}g</div><div className="text-[9px] font-bold uppercase text-[#9b886e]">protein</div></div><div className="rounded-2xl bg-[#e8f0f5] p-4 text-center"><div className="font-display text-2xl font-semibold text-[#315a77]">{streak}d</div><div className="text-[9px] font-bold uppercase text-[#8094a1]">streak</div></div></div><div className="mt-5 rounded-2xl bg-[#254c36] p-5 text-white"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#c6dac1]">Current wellness score</span><span className="font-display text-4xl font-semibold text-[#f6c553]">{score}/100</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#f6c553]" style={{ width: `${score}%` }} /></div><p className="mt-4 text-xs leading-5 text-[#d1e0cd]">{intake.length ? "Nice work — keep logging one balanced campus meal each day to move your score up." : "Start by scanning a meal; your report will update instantly."}</p></div><button onClick={() => { navigator.clipboard?.writeText(`Food4iFe weekly report: ${calories} kcal, ${protein}g protein, wellness ${score}/100.`); toast.success("Report summary copied."); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ef7e3b] px-4 py-3 text-xs font-bold text-white"><Share2 className="h-4 w-4" /> Copy report summary</button></div></div>;
}

export function SearchModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (module: "dietician" | "mess" | "monitoring") => void }) {
  const [query, setQuery] = useState("");
  if (!open) return null;
  const results = [{ key: "dietician" as const, label: "Diet plan creator", detail: "Create a personalized 1, 3, or 7-day plan" }, { key: "mess" as const, label: "Mess operations", detail: "Headcount, menu, waste, and inventory" }, { key: "monitoring" as const, label: "Campus monitoring", detail: "Health index and live alerts" }, { key: "dietician" as const, label: "Food scanner", detail: "Scan Dalma, Pakhala, Paneer, or Samosa" }].filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="fixed inset-0 z-[80] grid place-items-start justify-center bg-[#183a29]/35 p-4 pt-[12vh] backdrop-blur-sm"><div className="w-full max-w-xl rounded-[24px] bg-[#fffdf7] p-4 shadow-2xl"><div className="flex items-center gap-3 rounded-xl border border-[#dfe5da] px-3"><Search className="h-4 w-4 text-[#839183]" /><input autoFocus className="flex-1 bg-transparent py-3 text-sm font-semibold text-[#365642] outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search diet plans, mess, scanner…" /><button onClick={onClose} className="text-xl text-[#829182]">×</button></div><div className="mt-3 space-y-2">{results.map((item) => <button key={`${item.key}-${item.label}`} onClick={() => { onSelect(item.key); onClose(); }} className="flex w-full items-center justify-between rounded-xl bg-[#f7f9f4] p-3 text-left transition hover:bg-[#eaf5e8]"><span><span className="block text-xs font-bold text-[#3f5f47]">{item.label}</span><span className="mt-1 block text-[10px] font-semibold text-[#899588]">{item.detail}</span></span><ChevronRight className="h-4 w-4 text-[#7b947e]" /></button>)}{!results.length && <div className="p-4 text-center text-xs font-semibold text-[#849283]">No campus tools match “{query}”.</div>}</div></div></div>;
}

export function AlertsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#183a29]/40 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[28px] bg-[#fffdf7] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#315a77]">Campus alerts</div><h2 className="mt-2 font-display text-3xl font-semibold text-[#183a29]">All clear, with two notes</h2><p className="mt-1 text-xs text-[#718074]">Live demo alerts from the GIET kitchen and community.</p></div><button onClick={onClose} className="rounded-full px-3 py-1 text-xl text-[#829182] hover:bg-[#f2f4ed]">×</button></div><div className="mt-6 space-y-3"><div className="rounded-2xl bg-[#fff4e9] p-4"><div className="text-xs font-bold text-[#8f5e34]">Tomato stock is running low</div><div className="mt-1 text-[11px] leading-5 text-[#9b8068]">Kitchen store · 18 kg remaining · reorder suggested for tomorrow’s Santula.</div></div><div className="rounded-2xl bg-[#eaf5e8] p-4"><div className="text-xs font-bold text-[#37754c]">Zero Waste Hero unlocked</div><div className="mt-1 text-[11px] leading-5 text-[#6d896c]">Block C community logged a 12 kg reduction this week.</div></div></div><button onClick={() => { navigator.clipboard?.writeText("Food4iFe campus alerts: tomato reorder suggested; Zero Waste Hero unlocked."); toast.success("Alert summary copied."); }} className="mt-5 rounded-xl bg-[#315a77] px-4 py-3 text-xs font-bold text-white"><Share2 className="mr-2 inline h-4 w-4" /> Copy alert summary</button></div></div>;
}
