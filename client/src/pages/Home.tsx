import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bike,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Clock3,
  Droplets,
  Flame,
  Gauge,
  Languages,
  Leaf,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Package,
  PlayCircle,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  Users,
  Utensils,
  Wheat,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AlertsModal, CommunityPanel, DietPlanCreator, MessOperations, RecipeScheduleGenerator, ScannerModal, SearchModal, WeeklyReportModal } from "./FeaturePanels";
import { calculateStreak, calculateWellnessScore } from "./featureLogic";

type ModuleKey = "dietician" | "mess" | "monitoring";

type Module = {
  key: ModuleKey;
  label: string;
  kicker: string;
  description: string;
  metric: string;
  metricLabel: string;
  icon: LucideIcon;
  tint: string;
  soft: string;
};

const modules: Module[] = [
  {
    key: "dietician",
    label: "Dietician",
    kicker: "Personal wellness",
    description: "Know what your body needs, one campus meal at a time.",
    metric: "74",
    metricLabel: "wellness score",
    icon: Leaf,
    tint: "bg-[#e7f3df] text-[#2b633f]",
    soft: "bg-[#f2f8ed]",
  },
  {
    key: "mess",
    label: "Mess",
    kicker: "Smarter operations",
    description: "Cook the right amount, stock with confidence, waste less.",
    metric: "12.8",
    metricLabel: "kg saved this week",
    icon: Utensils,
    tint: "bg-[#fff0cf] text-[#9a5c16]",
    soft: "bg-[#fff9eb]",
  },
  {
    key: "monitoring",
    label: "Monitoring",
    kicker: "Campus pulse",
    description: "A living view of nutrition, meals, and impact across GIET.",
    metric: "86",
    metricLabel: "campus health index",
    icon: Activity,
    tint: "bg-[#e6eef6] text-[#315a77]",
    soft: "bg-[#f1f6fb]",
  },
];

const weekData = [
  { day: "Mon", value: 68 },
  { day: "Tue", value: 82 },
  { day: "Wed", value: 74 },
  { day: "Thu", value: 91 },
  { day: "Fri", value: 78 },
  { day: "Sat", value: 88 },
  { day: "Sun", value: 74 },
];

const menu = [
  { meal: "Breakfast", dish: "Pakhala oats bowl", time: "07:30 – 09:30", tag: "High fibre", icon: Wheat, color: "#cf7c35" },
  { meal: "Lunch", dish: "Dalma · Rice · Santula", time: "12:30 – 14:30", tag: "Local pick", icon: Utensils, color: "#4c8a5d" },
  { meal: "Dinner", dish: "Paneer curry · Roti", time: "19:30 – 21:30", tag: "Protein +", icon: Flame, color: "#d15d45" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function TinySparkline({ color = "#4c8a5d", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 34" className={cn("h-8 w-28", flip && "rotate-180")} aria-hidden="true">
      <path d="M1 27 C13 24 17 26 25 18 S39 7 49 15 S65 27 74 18 S89 9 99 12 S109 4 119 6" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M1 27 C13 24 17 26 25 18 S39 7 49 15 S65 27 74 18 S89 9 99 12 S109 4 119 6 V34 H1Z" fill={color} opacity=".10" />
    </svg>
  );
}

function WellnessRing({ score = 74 }: { score?: number }) {
  return (
    <div className="relative grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(#4c8a5d 0 ${score}%, #e7ebdf ${score}% 100%)` }}>
      <div className="grid h-28 w-28 place-items-center rounded-full bg-[#fffdf7] shadow-inner">
        <div className="text-center">
          <div className="font-display text-4xl font-semibold leading-none text-[#1e3c2b]">{score}</div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#7e8a7d]">good start</div>
        </div>
      </div>
    </div>
  );
}

function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center rounded-[14px] bg-[#ef7e3b] text-white shadow-[0_8px_20px_rgba(239,126,59,.23)]">
        <Leaf className="h-5 w-5" strokeWidth={2.5} />
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#fffdf7] bg-[#f3b647]" />
      </div>
      <div className="leading-none">
        <div className="font-display text-[17px] font-semibold tracking-[-.03em] text-[#183a29]">Food4iFe</div>
        <div className="mt-1 text-[9px] font-bold uppercase tracking-[.2em] text-[#8b9689]">campus OS</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, change, detail, color, trend }: { icon: LucideIcon; label: string; value: string; change: string; detail: string; color: string; trend?: "up" | "down" }) {
  return (
    <div className="group rounded-[22px] border border-[#e7e5dc] bg-[#fffdf7] p-4 shadow-[0_8px_30px_rgba(44,56,39,.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(44,56,39,.09)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: `${color}18`, color }}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold", trend === "down" ? "bg-[#fff0dc] text-[#b26a1f]" : "bg-[#eaf5e8] text-[#37754c]")}>
          {trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          {change}
        </div>
      </div>
      <div className="mt-5 font-display text-[28px] font-semibold tracking-[-.04em] text-[#183a29]">{value}</div>
      <div className="mt-1 text-xs font-semibold text-[#627064]">{label}</div>
      <div className="mt-4 text-[10px] font-medium uppercase tracking-[.1em] text-[#9aa297]">{detail}</div>
    </div>
  );
}

function HeroArt({ onScan, onMealPlan }: { onScan: () => void; onMealPlan: () => void }) {
  return (
    <div className="relative min-h-[355px] overflow-hidden rounded-[28px] bg-[#1e4b35] p-5 text-white shadow-[0_20px_50px_rgba(30,75,53,.2)] sm:p-7">
      <img src="/manus-storage/food4ife-hero_ce360816.jpg" alt="A colorful Odia campus meal with dalma, pakhala, and greens" className="absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-luminosity" />
      <div className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(circle at 78% 15%, #f3b647 0, transparent 24%), radial-gradient(circle at 18% 85%, #79a36c 0, transparent 28%), linear-gradient(130deg, #1d563b, #23422f)" }} />
      <div className="absolute -right-12 top-10 h-64 w-64 rounded-full border border-white/15" />
      <div className="absolute -right-2 top-20 h-44 w-44 rounded-full border border-white/15" />
      <div className="absolute right-9 top-28 h-24 w-24 rounded-full bg-[#f7c54d]/80 blur-[1px]" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#f9dd8a]">Today’s plate</span>
          <button onClick={onScan} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20" aria-label="Open food scanner">
            <ScanLine className="h-4 w-4" />
          </button>
        </div>
        <div className="max-w-[250px]">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-[#d6e5d5]"><span className="h-1.5 w-1.5 rounded-full bg-[#f6c553]" /> Balanced choice · 86% match</div>
          <h3 className="font-display text-3xl font-medium leading-[1.05] tracking-[-.045em] text-white sm:text-4xl">A little more dalma, a lot more you.</h3>
          <p className="mt-4 text-xs leading-5 text-[#d6e5d5]">Your smart plate suggestion is built around today’s activity and the food you already love.</p>
          <button onClick={onMealPlan} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f5c453] px-4 py-2.5 text-xs font-bold text-[#3c421d] transition hover:bg-[#ffd778]">
            See meal plan <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module, active, onClick }: { module: Module; active: boolean; onClick: () => void }) {
  const Icon = module.icon;
  return (
    <button onClick={onClick} className={cn("group relative w-full overflow-hidden rounded-[22px] border p-5 text-left transition duration-200 sm:p-6", active ? "border-[#254c36] bg-[#254c36] text-white shadow-[0_16px_34px_rgba(37,76,54,.18)]" : "border-[#e7e5dc] bg-[#fffdf7] text-[#183a29] hover:-translate-y-1 hover:border-[#cfd8c9] hover:shadow-[0_12px_28px_rgba(44,56,39,.07)]")}>
      {active && <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-[#f3b647]/20" />}
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", active ? "bg-white/12 text-[#f6c553]" : module.tint)}><Icon className="h-5 w-5" /></div>
        <ArrowUpRight className={cn("h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5", active ? "text-[#c9dbbf]" : "text-[#98a397]")} />
      </div>
      <div className={cn("mt-6 text-[10px] font-bold uppercase tracking-[.15em]", active ? "text-[#bed3b7]" : "text-[#9aa297]")}>{module.kicker}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h3 className={cn("font-display text-[26px] font-semibold tracking-[-.04em]", active ? "text-white" : "text-[#183a29]")}>{module.label}</h3>
        <div className="text-right"><div className={cn("font-display text-2xl font-semibold", active ? "text-[#f6c553]" : "text-[#254c36]")}>{module.metric}</div><div className={cn("text-[9px] font-bold uppercase tracking-[.12em]", active ? "text-[#b6cbb1]" : "text-[#929e93]")}>{module.metricLabel}</div></div>
      </div>
      <p className={cn("mt-3 max-w-[230px] text-xs leading-5", active ? "text-[#d1e0cd]" : "text-[#6e7b70]")}>{module.description}</p>
      <div className={cn("mt-6 flex items-center gap-1.5 text-[11px] font-bold", active ? "text-[#f7d46f]" : "text-[#4d7856]")}>Open module <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></div>
    </button>
  );
}

function DieticianPanel({ score = 74, onReport, onChartFilter, onAddSnack }: { score?: number; onReport: () => void; onChartFilter: () => void; onAddSnack: () => void }) {
  const personalWeekData = weekData.map((item, index) => index === 6 ? { ...item, value: Math.min(100, item.value + Math.max(0, score - 74)) } : item);
  return (
    <div className="grid gap-5 lg:grid-cols-[.9fr_1.25fr_.8fr]">
      <div className="rounded-[24px] bg-[#fffdf7] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6">
        <div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Your balance</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">Wellness score</h3></div><Gauge className="h-5 w-5 text-[#6a8f67]" /></div>
        <div className="mt-6 flex items-center gap-5"><WellnessRing score={score} /><div className="space-y-3"><div className="flex items-center gap-2 text-xs text-[#657468]"><span className="h-2 w-2 rounded-full bg-[#4c8a5d]" /> Protein on track</div><div className="flex items-center gap-2 text-xs text-[#657468]"><span className="h-2 w-2 rounded-full bg-[#f3b647]" /> Add more iron</div><div className="flex items-center gap-2 text-xs text-[#657468]"><span className="h-2 w-2 rounded-full bg-[#d15d45]" /> Hydration needs love</div></div></div>
        <button onClick={onReport} className="mt-6 flex w-full items-center justify-between rounded-xl bg-[#f3f6ef] px-4 py-3 text-xs font-bold text-[#3c714a] transition hover:bg-[#e9f0e3]">View weekly report <ArrowUpRight className="h-3.5 w-3.5" /></button>
      </div>
      <div className="rounded-[24px] bg-[#fffdf7] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6">
        <div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Last 7 days</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">Nutrition rhythm</h3></div><button onClick={onChartFilter} className="rounded-lg p-1.5 text-[#899588] hover:bg-[#f2f3ec]" aria-label="Change chart view"><MoreHorizontal className="h-5 w-5" /></button></div>
        <div className="mt-8 flex h-[142px] items-end justify-between gap-2 px-1">{personalWeekData.map((item, index) => <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative flex w-full flex-1 items-end justify-center"><div className={cn("w-full max-w-8 rounded-t-lg transition duration-300 hover:opacity-80", index === 3 ? "bg-[#ef7e3b]" : "bg-[#b7d4a9]")} style={{ height: `${item.value}%` }}><span className="sr-only">{item.value}%</span></div></div><div className={cn("text-[10px] font-bold", index === 6 ? "text-[#254c36]" : "text-[#a0aa9e]")}>{item.day}</div></div>)}</div>
        <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#55765b]"><TrendingBadge /> 12% better than last week</div>
      </div>
      <div className="rounded-[24px] bg-[#f4ecd9] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6"><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/60 text-[#b06c2c]"><Sparkles className="h-5 w-5" /></div><div className="rounded-full bg-[#fff8e7] px-2.5 py-1 text-[10px] font-bold text-[#9a5c16]">AI tip</div></div><h3 className="mt-7 max-w-[180px] font-display text-2xl font-semibold leading-[1.06] tracking-[-.035em] text-[#513b27]">Make your snack work harder.</h3><p className="mt-3 text-xs leading-5 text-[#765d43]">Pair your evening chai with roasted chana to close today’s protein gap.</p><button onClick={onAddSnack} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#a45f22]">Add to plan <ChevronRight className="h-3.5 w-3.5" /></button></div>
    </div>
  );
}

function TrendingBadge() {
  return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f2e1] text-[#4c8a5d]"><ArrowUpRight className="h-3 w-3" /></span>;
}

function MessPanel({ onOpenOperations }: { onOpenOperations: () => void }) {
  const demand = [45, 58, 62, 80, 73, 88, 67, 76, 83, 71, 90, 78];
  return <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
    <div className="rounded-[24px] bg-[#fffdf7] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Lunch forecast · today</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">Demand is looking steady</h3></div><div className="rounded-full bg-[#eaf5e8] px-2.5 py-1.5 text-[10px] font-bold text-[#37754c]">92% confidence</div></div><div className="mt-8 flex h-36 items-end gap-2">{demand.map((height, index) => <div key={index} className="flex h-full flex-1 items-end"><div className={cn("w-full rounded-t-md transition hover:opacity-75", index > 7 ? "bg-[#ef7e3b]" : "bg-[#b9d8ae]")} style={{ height: `${height}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#a1aa9f]"><span>11:30</span><span className="text-[#c57432]">13:00 peak</span><span>14:30</span></div></div>
    <div className="rounded-[24px] bg-[#eef4e9] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#78917a]">Kitchen pulse</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">Ready for service</h3></div><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#4c8a5d]" /></div><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/70 p-4"><Package className="h-4 w-4 text-[#7c9b70]" /><div className="mt-4 font-display text-2xl font-semibold text-[#254c36]">8/10</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#849283]">stock checks</div></div><div className="rounded-2xl bg-white/70 p-4"><Trash2 className="h-4 w-4 text-[#d17a40]" /><div className="mt-4 font-display text-2xl font-semibold text-[#254c36]">4.2kg</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#849283]">waste risk</div></div></div><button onClick={onOpenOperations} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#254c36] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#1d402c]">Open mess dashboard <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
  </div>;
}

function MonitoringPanel({ onAlerts }: { onAlerts: () => void }) {
  return <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
    <div className="rounded-[24px] bg-[#fffdf7] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Campus health index</div><h3 className="mt-1 font-display text-xl font-semibold text-[#183a29]">Small choices, visible impact</h3></div><div className="text-right"><div className="font-display text-3xl font-semibold text-[#315a77]">86</div><div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8d9da7]">+4.8 this month</div></div></div><div className="mt-7"><div className="h-3 overflow-hidden rounded-full bg-[#e9eef0]"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-[#6e9a8f] to-[#315a77]" /></div><div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#93a0a8]"><span>Needs care</span><span>Healthy campus</span></div></div><div className="mt-7 grid grid-cols-3 gap-3"><div><div className="font-display text-2xl font-semibold text-[#315a77]">1,284</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#8e9a9d]">meals logged</div></div><div><div className="font-display text-2xl font-semibold text-[#315a77]">18%</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#8e9a9d]">less waste</div></div><div><div className="font-display text-2xl font-semibold text-[#315a77]">72%</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#8e9a9d]">active streaks</div></div></div></div>
    <div className="rounded-[24px] bg-[#e8f0f5] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6"><div className="flex items-center gap-2 text-[#315a77]"><Bell className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.16em]">Live alerts</span></div><div className="mt-6 space-y-3"><div className="flex gap-3 rounded-2xl bg-white/65 p-3"><div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#ef7e3b]" /><div><div className="text-xs font-bold text-[#27485e]">Tomato stock is running low</div><div className="mt-1 text-[10px] text-[#7f949e]">Kitchen store · 12 min ago</div></div></div><div className="flex gap-3 rounded-2xl bg-white/65 p-3"><div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#4c8a5d]" /><div><div className="text-xs font-bold text-[#27485e]">Zero Waste Hero unlocked</div><div className="mt-1 text-[10px] text-[#7f949e]">Block C community · 28 min ago</div></div></div></div><button onClick={onAlerts} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#315a77]">View all alerts <ChevronRight className="h-3.5 w-3.5" /></button></div>
  </div>;
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("dietician");
  const [dark, setDark] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [time, setTime] = useState("09:41");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [localIntake, setLocalIntake] = useState(() => {
    try { return JSON.parse(localStorage.getItem("food4ife-intake") ?? "[]") as Array<{ name: string; calories: number; protein: number; score: number }>; } catch { return []; }
  });
  const { user, isAuthenticated, logout } = useAuth();
  const campusQuery = trpc.campus.dashboard.useQuery();
  const studentQuery = trpc.campus.studentDashboard.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const logNutrition = trpc.campus.logNutrition.useMutation({
    onSuccess: () => {
      void studentQuery.refetch();
      toast.success("Meal logged to your nutrition history.");
    },
    onError: () => toast.error("We could not save that scan yet. Please try again."),
  });
  const saveProfile = trpc.campus.saveStudentProfile.useMutation({
    onSuccess: () => {
      void studentQuery.refetch();
      toast.success("Starter wellness profile saved.");
    },
    onError: () => toast.error("We could not save your profile yet. Please try again."),
  });

  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const active = useMemo(() => modules.find((module) => module.key === activeModule) ?? modules[0], [activeModule]);
  const snapshot = campusQuery.data?.snapshot;
  const intakeCalories = localIntake.reduce((sum, item) => sum + item.calories, 0);
  const intakeProtein = localIntake.reduce((sum, item) => sum + item.protein, 0);
  const wellnessScore = calculateWellnessScore(localIntake);
  const currentStreak = calculateStreak(localIntake.length);
  const liveMenu = useMemo(() => {
    if (!campusQuery.data?.menu?.length) return menu;
    return menu.map((item) => {
      const liveItem = campusQuery.data?.menu.find((entry) => entry.mealType === item.meal.toLowerCase());
      return liveItem ? { ...item, dish: liveItem.dishName, tag: liveItem.tag } : item;
    });
  }, [campusQuery.data?.menu]);

  const openModule = (module: ModuleKey) => {
    setActiveModule(module);
    window.setTimeout(() => document.getElementById("module-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };

  const openCommunity = () => {
    document.getElementById("community-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openDietPlan = () => {
    openModule("dietician");
    window.setTimeout(() => document.getElementById("diet-plan-creator")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const addSnackToPlan = () => {
    const snack = { name: "Roasted chana · lemon water", calories: 190, protein: 9, score: 88 };
    const next = [...localIntake, snack];
    setLocalIntake(next);
    try { localStorage.setItem("food4ife-intake", JSON.stringify(next)); } catch {}
    if (isAuthenticated) logNutrition.mutate({ itemName: snack.name, source: "manual", calories: snack.calories, proteinGrams: snack.protein, score: snack.score });
    toast.success("Roasted chana added to today’s intake and smart plan.");
  };

  const handleScan = () => setScannerOpen(true);

  const handleScannedFood = (item: { name: string; calories: number; protein: number; score: number }) => {
    const next = [...localIntake, item];
    setLocalIntake(next);
    try { localStorage.setItem("food4ife-intake", JSON.stringify(next)); } catch {}
    if (isAuthenticated) logNutrition.mutate({ itemName: item.name, source: "scanner", calories: item.calories, proteinGrams: item.protein, score: item.score });
    else toast.success(`${item.name} added to today’s intake.`);
  };

  const handleProfile = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    saveProfile.mutate({
      age: 19,
      heightCm: 172,
      weightKg: 64,
      gender: "prefer-not-to-say",
      activityLevel: "moderate",
      goals: "balanced nutrition, steady energy",
      dietaryPreferences: "vegetarian-friendly campus meals",
      allergies: "none shared",
      localFoodPreferences: "Dalma, Pakhala, Santula",
      wellnessScore: 74,
      streakDays: 6,
      weeklyRhythm: "68,82,74,91,78,88,74",
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f5ee] text-[#183a29] transition-colors duration-300 dark:bg-[#15271d] dark:text-[#eef4e9]">
      <div className="grain pointer-events-none fixed inset-0 z-50 opacity-[.025]" />
      <header className="sticky top-0 z-40 border-b border-[#e8e6dd]/80 bg-[#f6f5ee]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#15271d]/90">
        <div className="container flex h-[74px] items-center justify-between gap-4">
          <AppLogo />
          <nav className="hidden items-center gap-7 lg:flex">
            {modules.map((module) => <button key={module.key} onClick={() => openModule(module.key)} className={cn("text-xs font-bold transition", activeModule === module.key ? "text-[#ef7e3b]" : "text-[#718074] hover:text-[#254c36] dark:text-[#b2c0b2] dark:hover:text-white")}>{module.label}</button>)}
            <button onClick={openCommunity} className="text-xs font-bold text-[#718074] transition hover:text-[#254c36] dark:text-[#b2c0b2]">Community</button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#dedfd5] bg-white/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#8b9689] xl:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#4c8a5d]" /> Hackathon demo mode</div>
            <button onClick={() => setSearchOpen(true)} className="grid h-9 w-9 place-items-center rounded-full border border-[#dedfd5] bg-white/60 text-[#738077] transition hover:border-[#aabca7] hover:text-[#254c36] dark:border-white/10 dark:bg-white/5 dark:text-[#c2d0c1]" aria-label="Search"><Search className="h-4 w-4" /></button>
            <button onClick={() => setDark((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full border border-[#dedfd5] bg-white/60 text-[#738077] transition hover:border-[#aabca7] hover:text-[#254c36] dark:border-white/10 dark:bg-white/5 dark:text-[#c2d0c1]" aria-label="Toggle dark mode">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            <button onClick={isAuthenticated ? () => void logout() : handleProfile} className="hidden h-9 items-center gap-2 rounded-full bg-[#254c36] px-3 text-xs font-bold text-white transition hover:bg-[#1c402d] sm:flex"><CircleUserRound className="h-4 w-4" /> {isAuthenticated ? (user?.name ?? "Aarav") : "Sign in"}</button>
            <button onClick={() => setMobileNavOpen((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full border border-[#dedfd5] bg-white/60 text-[#738077] lg:hidden" aria-label="Open menu">{mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
          </div>
        </div>
        {mobileNavOpen && <div className="border-t border-[#e8e6dd] bg-[#f6f5ee] px-4 py-3 lg:hidden dark:border-white/10 dark:bg-[#15271d]"><div className="container flex flex-wrap gap-2">{modules.map((module) => <button key={module.key} onClick={() => { openModule(module.key); setMobileNavOpen(false); }} className={cn("rounded-full px-3 py-2 text-xs font-bold", activeModule === module.key ? "bg-[#254c36] text-white" : "bg-white text-[#617063] dark:bg-white/10 dark:text-[#d2dfd0]")}>{module.label}</button>)}<button onClick={() => { openCommunity(); setMobileNavOpen(false); }} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#617063] dark:bg-white/10 dark:text-[#d2dfd0]">Community</button></div></div>}
      </header>

      <main className="container pb-16 pt-8 sm:pt-12">
        <section className="grid items-stretch gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex min-h-[355px] flex-col justify-between rounded-[28px] border border-[#e7e5dc] bg-[#fffdf7] p-6 shadow-[0_8px_35px_rgba(44,56,39,.04)] sm:p-9">
            <div><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#8e9a8e]"><span>Wednesday · 24 September</span><span className="h-1 w-1 rounded-full bg-[#ef7e3b]" /><span>GIET University, Gunupur</span></div><h1 className="mt-7 max-w-[550px] font-display text-[clamp(44px,6vw,76px)] font-medium leading-[.94] tracking-[-.065em] text-[#183a29] dark:text-[#eef4e9]">Make every <span className="relative whitespace-nowrap text-[#ef7e3b]">meal count<span className="absolute -bottom-2 left-0 h-2 w-full rounded-[50%] border-t-2 border-[#f3b647] opacity-80" /></span>.</h1><p className="mt-6 max-w-[440px] text-sm leading-6 text-[#68776a] dark:text-[#b8c7b6]">Food4iFe brings your plate, your mess, and your campus into one clearer, healthier rhythm.</p></div>
            <div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={handleScan} className="inline-flex items-center gap-2 rounded-full bg-[#ef7e3b] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(239,126,59,.2)] transition hover:-translate-y-0.5 hover:bg-[#df6d2d]">Open food scanner <Camera className="h-4 w-4" /></button><button onClick={() => openModule("mess")} className="inline-flex items-center gap-2 rounded-full border border-[#dfe3d9] bg-white px-5 py-3 text-xs font-bold text-[#42654d] transition hover:border-[#b7cdb3] hover:bg-[#f7faf4] dark:border-white/10 dark:bg-white/5 dark:text-[#d5e1d3]">Today’s menu <ChevronRight className="h-4 w-4" /></button><span className="ml-1 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#9ba59a] sm:inline-flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4c8a5d]" /> {campusQuery.isFetching ? "Syncing campus data" : "Live campus data"}</span></div>
          </div>
          <HeroArt onScan={handleScan} onMealPlan={openDietPlan} />
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Gauge} label="Wellness score" value={`${wellnessScore} / 100`} change={localIntake.length ? `+${localIntake.length * 2}%` : "+8.2%"} detail="vs. last week" color="#4c8a5d" />
          <MetricCard icon={Flame} label="Current streak" value={`${currentStreak} days`} change={localIntake.length ? `+${localIntake.length} days` : "+2 days"} detail="personal best: 12" color="#ef7e3b" />
          <MetricCard icon={Trash2} label="Waste reduced" value={`${snapshot?.wasteReducedPercent ?? 18}%`} change="−18%" detail="this week · mess ops" color="#cf7c35" trend="down" />
          <MetricCard icon={Users} label="Expected today" value={`${snapshot?.expectedStudents ?? 482} / ${snapshot?.totalStudents ?? 540}`} change="89%" detail="lunch service" color="#315a77" />
        </section>

        <section className="mt-14" id="modules"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ef7e3b]">One connected campus</div><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.045em] text-[#183a29] dark:text-[#eef4e9] sm:text-4xl">Your day, in three views.</h2></div><div className="flex items-center gap-2 text-xs font-semibold text-[#879287] dark:text-[#b5c3b3]"><span className="hidden sm:inline">Swipe or select a module</span><span className="grid h-7 w-7 place-items-center rounded-full bg-[#eaf1e5] text-[#4c8a5d]"><ChevronRight className="h-3.5 w-3.5" /></span></div></div><div className="mt-6 grid gap-4 md:grid-cols-3">{modules.map((module) => <ModuleCard key={module.key} module={module} active={activeModule === module.key} onClick={() => openModule(module.key)} />)}</div></section>

        <section className="mt-7" id="module-workspace"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><span className="rounded-full bg-[#eaf3e5] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#4c8a5d]">{active.label} workspace</span><h2 className="mt-3 font-display text-2xl font-semibold tracking-[-.04em] text-[#183a29] dark:text-[#eef4e9]">A useful glance, not another chore.</h2></div><button onClick={() => setSearchOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#dfe3d9] bg-white px-4 py-2.5 text-xs font-bold text-[#42654d] transition hover:border-[#b7cdb3] dark:border-white/10 dark:bg-white/5 dark:text-[#d5e1d3]">Find a tool <Search className="h-3.5 w-3.5" /></button></div>{activeModule === "dietician" && <div className="space-y-6"><DieticianPanel score={wellnessScore} onReport={() => setReportOpen(true)} onChartFilter={() => toast.success(`Chart refreshed with ${intakeCalories} kcal and ${intakeProtein}g protein logged.`)} onAddSnack={addSnackToPlan} /><div id="diet-plan-creator" className="scroll-mt-24"><DietPlanCreator /></div><RecipeScheduleGenerator /></div>}{activeModule === "mess" && <div className="space-y-6"><MessPanel onOpenOperations={() => document.getElementById("mess-operations")?.scrollIntoView({ behavior: "smooth", block: "start" })} /><div id="mess-operations" className="scroll-mt-24"><MessOperations menu={campusQuery.data?.menu ?? []} /></div><RecipeScheduleGenerator /></div>}{activeModule === "monitoring" && <MonitoringPanel onAlerts={() => setAlertsOpen(true)} />}</section>

        <section id="community-workspace" className="mt-14 grid scroll-mt-24 gap-5 lg:grid-cols-[1.15fr_.85fr]"><CommunityPanel /><div className="rounded-[24px] border border-[#e7e5dc] bg-[#fffdf7] p-5 shadow-[0_8px_30px_rgba(44,56,39,.04)] sm:p-6"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93a094]">Today’s intake</div><h3 className="mt-1 font-display text-2xl font-semibold tracking-[-.04em] text-[#183a29]">{intakeCalories} kcal logged</h3></div><button onClick={handleScan} className="text-xs font-bold text-[#4c8a5d]">Add meal</button></div><div className="mt-4 space-y-2">{localIntake.length === 0 ? <div className="rounded-2xl bg-[#f7f9f4] p-4 text-xs font-semibold text-[#849283]">Scan a plate or add a meal to start your personal tracker.</div> : localIntake.slice(-4).map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl bg-[#f7f9f4] px-3 py-2.5"><div className="flex items-center gap-2 text-xs font-bold text-[#46624d]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eaf5e8] text-[#4c8a5d]"><Check className="h-3.5 w-3.5" /></span>{item.name}</div><span className="text-[10px] font-bold text-[#819181]">{item.calories} kcal · {item.protein}g protein</span></div>)}</div></div></section>

        <footer className="mt-14 flex flex-col justify-between gap-4 border-t border-[#e4e5db] pt-6 text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa49a] sm:flex-row sm:items-center"><div className="flex items-center gap-3"><AppLogo /><span className="hidden h-4 w-px bg-[#dfe2d9] sm:block" /><span>Smart ideas for nutrition, health & future foods</span></div><div className="flex items-center gap-4"><span>GIET University · Gunupur</span><span className="flex items-center gap-1.5 text-[#4c8a5d]"><span className="h-1.5 w-1.5 rounded-full bg-[#4c8a5d]" /> {time} IST</span></div></footer>
      </main>
      <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#e0e3da] bg-[#fffdf7]/90 p-1.5 shadow-[0_12px_34px_rgba(44,56,39,.14)] backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-[#213c2b]/90"><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="grid h-10 w-10 place-items-center rounded-full bg-[#254c36] text-white"><Gauge className="h-4 w-4" /></button>{modules.map((module) => { const Icon = module.icon; return <button key={module.key} onClick={() => openModule(module.key)} className={cn("grid h-10 w-10 place-items-center rounded-full transition", activeModule === module.key ? "bg-[#f5ead2] text-[#b56d2d]" : "text-[#7c897d] hover:bg-[#f2f3eb]")} aria-label={module.label}><Icon className="h-4 w-4" /></button>; })}<button onClick={handleScan} className="grid h-10 w-10 place-items-center rounded-full text-[#7c897d]" aria-label="Scan food"><CircleUserRound className="h-4 w-4" /></button></div>
      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onLog={handleScannedFood} />
      <WeeklyReportModal open={reportOpen} onClose={() => setReportOpen(false)} intake={localIntake} score={wellnessScore} streak={currentStreak} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={openModule} />
      <AlertsModal open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </div>
  );
}
