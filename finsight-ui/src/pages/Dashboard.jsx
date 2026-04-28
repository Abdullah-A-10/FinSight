import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceDot,
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Shield,
  Brain,
  Calendar,
  Target,
  Sparkles,
  DollarSign,
  Activity,
  Award,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  Landmark,
  Coins,
  Scale,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import {
  getDashboardSummary,
  getInsights,
  getStrategy,
  runSimulation,
  updateStrategy,
} from "../api/summary";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";

const fmt = (n) =>
  new Intl.NumberFormat("en-PK", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

const fmtFull = (n) => new Intl.NumberFormat("en-PK").format(n);

// Complete Strategy options
const STRATEGIES = {
  CASH_ONLY: {
    name: "Cash Only",
    description: "No risk, no returns - pure liquidity",
    color: "#94A3B8",
    icon: Coins,
    risk: "Minimal",
    returns: "0-2%",
  },
  CONSERVATIVE: {
    name: "Conservative",
    description: "Low risk, stable growth",
    color: "#10B981",
    icon: Shield,
    risk: "Low",
    returns: "5-8%",
  },
  BALANCED: {
    name: "Balanced",
    description: "Moderate risk, steady growth",
    color: "#4F46E5",
    icon: Scale,
    risk: "Moderate",
    returns: "8-12%",
  },
  AGGRESSIVE: {
    name: "Aggressive",
    description: "High risk, high potential",
    color: "#F59E0B",
    icon: Zap,
    risk: "High",
    returns: "12-18%",
  },
  FIXED_DEPOSIT: {
    name: "Fixed Deposit",
    description: "Guaranteed returns, locked liquidity",
    color: "#8B5CF6",
    icon: Landmark,
    risk: "Very Low",
    returns: "7-10%",
  },
};

// Severity configuration
const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: AlertCircle,
    bgGradient:
      "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    iconBg: "bg-red-200 dark:bg-red-800",
    iconColor: "text-red-700 dark:text-red-300",
    label: "Critical",
  },
  HIGH: {
    icon: AlertTriangle,
    bgGradient:
      "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    iconBg: "bg-red-200 dark:bg-red-800",
    iconColor: "text-red-700 dark:text-red-300",
    label: "High",
  },
  WARNING: {
    icon: AlertTriangle,
    bgGradient:
      "from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-200 dark:bg-amber-800",
    iconColor: "text-amber-700 dark:text-amber-300",
    label: "Warning",
  },
  MEDIUM: {
    icon: AlertTriangle,
    bgGradient:
      "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    iconBg: "bg-yellow-200 dark:bg-yellow-800",
    iconColor: "text-yellow-700 dark:text-yellow-300",
    label: "Medium",
  },
  GOOD: {
    icon: CheckCircle,
    bgGradient:
      "from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    iconBg: "bg-green-200 dark:bg-green-800",
    iconColor: "text-green-700 dark:text-green-300",
    label: "Good",
  },
  INFO: {
    icon: Info,
    bgGradient:
      "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-200 dark:bg-blue-800",
    iconColor: "text-blue-700 dark:text-blue-300",
    label: "Insight",
  },
};

function MetricCard({ label, value, sub, accent, icon: Icon, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 group-hover:scale-110 transition-transform">
                <Icon
                  className={`w-4 h-4 ${accent.replace("text-", "text-")}`}
                />
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
              {label}
            </p>
          </div>
          <p className={`text-2xl font-bold ${accent} mb-1`}>{value}</p>
          {sub && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {sub}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {typeof trend === "number" &&
                (trend > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ))}
              <span
                className={`text-xs ${
                  typeof trend === "number"
                    ? trend > 0
                      ? "text-green-500"
                      : "text-red-500"
                    : trend === "Growing! 📈"
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                }`}
              >
                {typeof trend === "number"
                  ? `${Math.abs(trend).toFixed(1)}% from last month`
                  : trend}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const [strategy, setStrategy] = useState("BALANCED");

  // Get current strategy from backend
  const { data: currentStrategy, isLoading: strategyLoading } = useQuery({
    queryKey: ["strategy", userId],
    queryFn: () => getStrategy(userId).then((r) => r.data),
    enabled: !!userId,
  });

  // Update local state when currentStrategy is fetched
  useEffect(() => {
    if (currentStrategy) {
      setStrategy(currentStrategy);
    }
  }, [currentStrategy]);

  // Update strategy mutation
  const updateStrategyMutation = useMutation({
    mutationFn: (newStrategy) =>
      updateStrategy(userId, newStrategy).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(["quicksim", userId]);
      queryClient.invalidateQueries(["strategy", userId]);
    },
    onError: (error) => {
      console.error("Failed to update strategy:", error);
      alert("Failed to update investment strategy. Please try again.");
    },
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["summary", userId],
    queryFn: () => getDashboardSummary(userId).then((r) => r.data),
    enabled: !!userId,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["insights", userId],
    queryFn: () => getInsights(userId).then((r) => r.data),
    enabled: !!userId,
  });

  const {
    data: sim,
    isLoading: simLoading,
    isFetching: simFetching,
  } = useQuery({
    queryKey: ["quicksim", userId, strategy],
    queryFn: () =>
      runSimulation({
        userId,
        strategy,
        years: 10,
        simulations: 1000,
        useSmoothed: true,
        includeLifeEvents: true,
        inflationRate: 0.06,
      }).then((r) => r.data),
    enabled: !!userId,
  });

  const lifeEvents = sim?.lifeEvents || [];
  const eventMap = {};

  lifeEvents.forEach((e) => {
    eventMap[e.atYear] = e;
  });
  const chartData =
    sim?.trajectory?.map((v, i) => ({
      year: `Y${i}`,
      nominal: Math.round(v),
      real: Math.round(sim.realTrajectory?.[i] ?? v),
      event: eventMap[i]?.eventName || null,
      eventAmount: eventMap[i]?.lumpSumAmount || eventMap[i]?.monthlyDelta,
    })) ?? [];

  const s = summary;

  const trends = {
    income: s?.lastMonthlyIncome
      ? ((s.monthlyIncome - s.lastMonthlyIncome) / s.lastMonthlyIncome) * 100
      : 0,
    expenses: s?.lastMonthlyExpenses
      ? ((s.monthlyExpenses - s.lastMonthlyExpenses) / s.lastMonthlyExpenses) *
        100
      : 0,
    surplus: s?.lastMonthlySurplus
      ? ((s.monthlySurplus - s.lastMonthlySurplus) / s.lastMonthlySurplus) * 100
      : 0,
    netWorth: s?.monthlySurplus >= 0 ? "Growing! 📈" : "Shrinking! 📉",
  };

  // Enhanced Health Score with Trend Analysis
  const calculateHealthScore = () => {
    const savingsRate = s?.actualSavingsRate ?? 0;
    const emergencyRunway = s?.emergencyRunway ?? 0;

    const savingsScore = Math.min(savingsRate * 1.2, 30);
    const runwayScore = Math.min(emergencyRunway * 4, 30);
    const baseScore = savingsScore + runwayScore;

    let trendScore = 0;
    let trendDetails = [];

    if (trends.income > 5) {
      trendScore += 10;
      trendDetails.push("📈 Income growing strongly");
    } else if (trends.income > 0) {
      trendScore += 7;
      trendDetails.push("📈 Income increasing");
    } else if (trends.income > -5) {
      trendScore += 3;
      trendDetails.push("➡️ Income stable");
    } else if (trends.income > -15) {
      trendScore += 0;
      trendDetails.push("📉 Income declining");
    } else {
      trendScore -= 5;
      trendDetails.push("⚠️ Income dropping sharply");
    }

    if (trends.expenses < -10) {
      trendScore += 10;
      trendDetails.push("💚 Expenses decreasing significantly");
    } else if (trends.expenses < -3) {
      trendScore += 7;
      trendDetails.push("💚 Expenses decreasing");
    } else if (trends.expenses < 3) {
      trendScore += 4;
      trendDetails.push("➡️ Expenses stable");
    } else if (trends.expenses < 10) {
      trendScore += 0;
      trendDetails.push("⚠️ Expenses increasing");
    } else {
      trendScore -= 5;
      trendDetails.push("🚨 Expenses skyrocketing");
    }

    if (trends.surplus > 10) {
      trendScore += 10;
      trendDetails.push("💰 Surplus growing fast");
    } else if (trends.surplus > 0) {
      trendScore += 7;
      trendDetails.push("💰 Surplus increasing");
    } else if (trends.surplus > -10) {
      trendScore += 2;
      trendDetails.push("➡️ Surplus stable");
    } else {
      trendScore -= 5;
      trendDetails.push("⚠️ Surplus declining");
    }

    if (savingsRate >= 30) {
      trendScore += 10;
      trendDetails.push("🏆 Excellent savings discipline");
    } else if (savingsRate >= 20) {
      trendScore += 7;
      trendDetails.push("⭐ Good savings rate");
    } else if (savingsRate >= 10) {
      trendScore += 4;
      trendDetails.push("📊 Moderate savings");
    } else if (savingsRate >= 5) {
      trendScore += 1;
      trendDetails.push("⚠️ Low savings rate");
    } else {
      trendScore -= 3;
      trendDetails.push("🚨 Critical savings rate");
    }

    trendScore = Math.max(-10, Math.min(40, trendScore));
    let totalScore = baseScore + trendScore;

    if (savingsRate >= 30 && emergencyRunway >= 12) {
      totalScore += 5;
      trendDetails.unshift("🏆 Elite financial health!");
    } else if (savingsRate >= 25 && emergencyRunway >= 8) {
      totalScore += 3;
      trendDetails.unshift("⭐ Outstanding financial position");
    }

    if (emergencyRunway < 1) {
      totalScore -= 10;
      trendDetails.push("🚨 No emergency fund!");
    } else if (emergencyRunway < 3) {
      totalScore -= 5;
      trendDetails.push("⚠️ Low emergency fund");
    }

    totalScore = Math.min(100, Math.max(0, totalScore));

    return {
      score: Math.round(totalScore),
      baseScore: Math.round(baseScore),
      trendScore: Math.round(trendScore),
      trendDetails: trendDetails.slice(0, 3),
    };
  };

  const healthData = calculateHealthScore();
  const healthScore = healthData.score;
  const currentStrategyData = STRATEGIES[strategy] || STRATEGIES.BALANCED;
  const StrategyIcon = currentStrategyData.icon;

  const getSeverityConfig = (severity) => {
    const upperSeverity = severity?.toUpperCase() || "INFO";
    return SEVERITY_CONFIG[upperSeverity] || SEVERITY_CONFIG.INFO;
  };

  const handleStrategyChange = (e) => {
    const newStrategy = e.target.value;
    setStrategy(newStrategy);
    updateStrategyMutation.mutate(newStrategy);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Your financial snapshot — live from real transactions
          </p>
        </motion.div>

        {(summaryLoading || insightsLoading || simLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 mb-8"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
              <DollarSign className="w-8 h-8 text-indigo-600 dark:text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-400 dark:text-slate-600 text-sm mt-4">
              Loading your financial data...
            </p>
          </motion.div>
        )}

        {/* Enhanced Health Score Card */}
        {!summaryLoading && s && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 rounded-2xl shadow-xl mb-8 p-6 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24" />

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <p className="text-sm font-medium opacity-90">
                      Financial Health Score
                    </p>
                  </div>
                  <p className="text-5xl font-bold mb-2">{healthScore}</p>
                  <p className="text-sm opacity-90">
                    {healthScore >= 80
                      ? "Excellent! You're on the right track!"
                      : healthScore >= 60
                        ? "Good progress! Keep it up!"
                        : healthScore >= 40
                          ? "Needs attention - review insights"
                          : "Critical - take action immediately"}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                    <p className="text-xs opacity-90">Current Savings</p>
                    <p className="text-lg font-semibold">
                      PKR {fmt(s?.netSavings ?? 0)}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                    <p className="text-xs opacity-90">Net Worth</p>
                    <p className="text-lg font-semibold">
                      PKR {fmt(s?.netWorth ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/20">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-xs opacity-75">Base Score</p>
                  <p className="text-lg font-semibold">
                    {healthData.baseScore}/60
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-xs opacity-75">Trend Impact</p>
                  <p
                    className={`text-lg font-semibold ${healthData.trendScore >= 0 ? "text-green-300" : "text-red-300"}`}
                  >
                    {healthData.trendScore >= 0 ? "+" : ""}
                    {healthData.trendScore}
                  </p>
                </div>
                {healthData.trendDetails.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex-1">
                    <p className="text-xs opacity-75">Key Trends</p>
                    <p className="text-xs font-medium">
                      {healthData.trendDetails.join(" • ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            label="Monthly income"
            value={`PKR ${fmt(s?.monthlyIncome ?? 0)}`}
            accent="text-green-600 dark:text-green-400"
            icon={TrendingUp}
            trend={trends.income}
          />
          <MetricCard
            label="Monthly expenses"
            value={`PKR ${fmt(s?.monthlyExpenses ?? 0)}`}
            accent="text-red-500 dark:text-red-400"
            icon={TrendingDown}
            trend={trends.expenses}
          />
          <MetricCard
            label="Monthly surplus"
            value={`PKR ${fmt(s?.monthlySurplus ?? 0)}`}
            accent="text-indigo-600 dark:text-indigo-400"
            icon={Wallet}
            trend={trends.surplus}
          />
          <MetricCard
            label="Actual savings rate"
            value={`${s?.actualSavingsRate ?? 0}%`}
            sub={`Potential: ${s?.theoreticalSavingsRate ?? 0}%`}
            accent="text-slate-800 dark:text-slate-100"
            icon={Target}
          />
          <MetricCard
            label="Emergency runway"
            value={`${s?.emergencyRunway ?? 0} mo`}
            sub="target: 6 months"
            accent="text-slate-800 dark:text-slate-100"
            icon={Shield}
          />
          <MetricCard
            label="Net worth"
            value={`PKR ${fmt(s?.netWorth ?? 0)}`}
            accent="text-indigo-600 dark:text-indigo-400"
            icon={PieChart}
            trend={trends.netWorth}
          />
        </div>

        {/* Chart with Strategy Dropdown */}
        {!simLoading && sim && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-8 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                    10-year wealth projection
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <StrategyIcon className="w-3 h-3 text-slate-500" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {currentStrategyData.risk} Risk ·{" "}
                      {currentStrategyData.returns} Returns
                    </p>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {currentStrategyData.description} · 6% inflation adjusted
                  </p>
                </div>
              </div>

              <div className="relative">
                <select
                  value={strategy}
                  onChange={handleStrategyChange}
                  disabled={updateStrategyMutation.isPending}
                  className="appearance-none bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-indigo-200 dark:border-indigo-700 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                >
                  {Object.entries(STRATEGIES).map(([key, strat]) => (
                    <option key={key} value={key}>
                      {strat.name} Strategy
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
                {updateStrategyMutation.isPending && (
                  <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              {simFetching && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Updating projection...
                    </span>
                  </div>
                </div>
              )}

              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  {chartData.map((d, i) =>
                    d.event ? (
                      <ReferenceDot
                        key={i}
                        x={d.year}
                        y={d.nominal}
                        r={6}
                        fill={d.eventAmount >= 0 ? "#10b981" : "#ef4444"}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ) : null,
                  )}
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tickFormatter={fmt}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    formatter={(v) => `PKR ${fmtF(v)}`}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0)
                        return null;

                      const data = payload[0]?.payload;
                      if (!data) return null;

                      const nominalValue = data.nominal;
                      const realValue = data.real;
                      const isPositive = data.eventAmount >= 0;
                      const sign = isPositive ? "+" : "-";

                      return (
                        <div
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.98)",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            padding: "10px 14px",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            fontSize: "14px",
                            minWidth: "200px",
                          }}
                        >
                          <p
                            style={{
                              fontWeight: "bold",
                              marginBottom: "8px",
                              color: "#1e293b",
                              borderBottom: "1px solid #e2e8f0",
                              paddingBottom: "4px",
                            }}
                          >
                            Year {data.year.replace("Y", "")}
                          </p>
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{ color: "#4F46E5", fontWeight: 500 }}>
                              💰 Account balance:
                            </span>
                            <span
                              style={{ marginLeft: "8px", fontWeight: 600 }}
                            >
                              PKR {fmtFull(nominalValue)}
                            </span>
                          </div>
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{ color: "#fb923c", fontWeight: 500 }}>
                              📉 Purchasing power:
                            </span>
                            <span
                              style={{ marginLeft: "8px", fontWeight: 600 }}
                            >
                              PKR {fmtFull(realValue)}
                            </span>
                          </div>
                          {data.event && (
                            <div
                              style={{
                                marginTop: "8px",
                                paddingTop: "6px",
                                borderTop: "1px solid #e2e8f0",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  marginBottom: "4px",
                                  fontSize: "12px",
                                }}
                              >
                                📌 {data.event}
                              </div>
                              <div
                                style={{
                                  color: isPositive ? "#10b981" : "#ef4444",
                                  fontSize: "11px",
                                }}
                              >
                                {sign} PKR {fmtFull(Math.abs(data.eventAmount))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                    iconType="circle"
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="nominal"
                    stroke={currentStrategyData.color}
                    strokeWidth={3}
                    dot={false}
                    name="Account balance"
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="real"
                    stroke="#fb923c"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={false}
                    name="Real purchasing power"
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                💡{" "}
                {strategy === "CASH_ONLY" &&
                  "Cash only strategy preserves capital but loses value to inflation over time"}
                {strategy === "CONSERVATIVE" &&
                  "Conservative strategy focuses on capital preservation with modest growth"}
                {strategy === "BALANCED" &&
                  "Balanced strategy offers steady growth with moderate risk tolerance"}
                {strategy === "AGGRESSIVE" &&
                  "Aggressive strategy maximizes growth potential with higher risk"}
                {strategy === "FIXED_DEPOSIT" &&
                  "Fixed deposit provides guaranteed returns but limits liquidity access"}
              </p>
            </div>
          </motion.div>
        )}

        {/* AI Insights */}
        {!insightsLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                    AI Insights
                  </h2>
                </div>
                <motion.a
                  href="/advisor"
                  whileHover={{ x: 4 }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  View all insights →
                </motion.a>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(insights ?? []).slice(0, 3).map((ins, i) => {
                  const severityConfig = getSeverityConfig(ins.severity);
                  const Icon = severityConfig.icon;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={`group bg-gradient-to-br ${severityConfig.bgGradient} rounded-xl transition-all duration-300 cursor-pointer border ${severityConfig.borderColor} overflow-hidden`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${severityConfig.iconBg} flex-shrink-0 group-hover:scale-110 transition-transform`}
                          >
                            <Icon
                              size={16}
                              className={severityConfig.iconColor}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2">
                                {ins.title}
                              </p>
                              {ins.actionableAmount && (
                                <span className="text-xs font-bold bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                                  {ins.actionableAmount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                              {ins.message}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className={`text-xs font-medium ${severityConfig.iconColor} opacity-70 uppercase tracking-wide`}
                              >
                                {severityConfig.label}
                              </span>
                              {ins.category && (
                                <>
                                  <span className="text-xs text-slate-400">
                                    •
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-500">
                                    {ins.category}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {(insights ?? []).length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 dark:text-slate-600">
                    No insights available yet. Add more transactions to get
                    personalized insights!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Achievement Section */}
        {s && s.netWorth > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Achievement Unlocked!
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {s.netWorth >= 1000000
                    ? "🎉 You've crossed the 1 Million PKR milestone! Keep building your wealth."
                    : s.netWorth >= 500000
                      ? "🌟 Great job reaching half a million! Next stop: 1 Million!"
                      : s.actualSavingsRate >= 20
                        ? "💪 Excellent savings discipline! You're saving over 20% of your income."
                        : "📈 You're on your way to financial freedom. Every transaction counts!"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
