import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Brain,
  TrendingUp,
  Shield,
  Target,
  Zap,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { getInsights } from "../api/summary";
import Sidebar from "../components/Sidebar";

const SEV_CONFIG = {
  CRITICAL: {
    icon: AlertCircle,
    cls: "severity-critical",
    iconCls: "text-red-500",
    label: "Critical",
    bgGradient:
      "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
  WARNING: {
    icon: AlertTriangle,
    cls: "severity-warning",
    iconCls: "text-amber-500",
    label: "Warning",
    bgGradient:
      "from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  GOOD: {
    icon: CheckCircle,
    cls: "severity-good",
    iconCls: "text-green-500",
    label: "Good",
    bgGradient:
      "from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  INFO: {
    icon: Info,
    cls: "severity-info",
    iconCls: "text-blue-500",
    label: "Insight",
    bgGradient:
      "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
};

const CATEGORY_ICONS = {
  SAVINGS: Wallet,
  INVESTMENT: TrendingUp,
  SPENDING: AlertTriangle,
  INCOME: Target,
  DEBT: Shield,
  DEFAULT: Brain,
};

export default function Advisor() {
  const userId = useAuthStore((s) => s.userId);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["insights", userId],
    queryFn: () => getInsights(userId).then((r) => r.data),
    enabled: !!userId,
  });

  const counts = insights.reduce((acc, ins) => {
    acc[ins.severity] = (acc[ins.severity] || 0) + 1;
    return acc;
  }, {});

  // Calculate overall health score
  const totalInsights = insights.length;
  const criticalCount = counts.CRITICAL || 0;
  const warningCount = counts.WARNING || 0;
  const healthScore =
    totalInsights > 0
      ? Math.max(0, 100 - criticalCount * 15 - warningCount * 5)
      : 100;

  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.DEFAULT;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            {/* Title and Icon */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                AI Robo-Advisor
              </h1>
            </div>

            {/* Stats on the right */}
            <div className="flex gap-3 mt-4">
              {/* Total Insights */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Insights
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {totalInsights}
                </p>
              </div>

              {/* Action Items */}
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Action Items
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {criticalCount + warningCount}
                </p>
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Take advice from the Financial Expert !
          </p>
        </motion.div>

        {/* Severity summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {Object.entries(SEV_CONFIG).map(([sev, cfg], idx) => {
            const Icon = cfg.icon;
            const count = counts[sev] ?? 0;
            return (
              <motion.div
                key={sev}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className={`bg-gradient-to-br ${cfg.bgGradient} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 border ${cfg.borderColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={22} className={cfg.iconCls} />
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 ${cfg.iconCls}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-200 mt-2">
                  {count}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {count === 1 ? "insight" : "insights"}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Insight cards */}
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
                <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-slate-400 dark:text-slate-600 text-sm mt-4">
                Analysing your financial data...
              </p>
            </motion.div>
          ) : insights.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.map((ins, i) => {
                const cfg = SEV_CONFIG[ins.severity];
                const Icon = cfg.icon;
                const CategoryIcon = getCategoryIcon(ins.category);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.2 }}
                    className={`group bg-gradient-to-br ${cfg.bgGradient} rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border ${cfg.borderColor} overflow-hidden`}
                  >
                    <div className="p-4">
                      <div className="flex gap-2">
                        <div className="flex-shrink-0">
                          <div
                            className={`p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 group-hover:scale-110 transition-transform`}
                          >
                            <Icon size={16} className={cfg.iconCls} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                              {ins.title}
                            </p>
                            {ins.actionableAmount && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm whitespace-nowrap text-indigo-600 dark:text-indigo-400"
                              >
                                {ins.actionableAmount}
                              </motion.span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                            {ins.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div
                                className={`p-1 rounded-lg bg-white/50 dark:bg-slate-800/50`}
                              >
                                <CategoryIcon
                                  size={12}
                                  className="text-slate-500 dark:text-slate-400"
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                {ins.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${cfg.iconCls.replace("text-", "bg-")}`}
                              />
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg text-center py-16 px-4 border border-slate-200 dark:border-slate-800"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="font-semibold text-slate-600 dark:text-slate-400 mb-2">
                No insights available yet
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md mx-auto">
                Add more transactions and financial data to get personalized
                insights from our AI advisor
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pro tip section */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
                  Pro Tip
                </p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  Review your insights regularly and take action on critical and
                  warning items first. Small changes can lead to significant
                  improvements in your financial health!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
