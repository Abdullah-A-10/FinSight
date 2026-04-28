import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  PiggyBank,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import {
  getBudgetStatus,
  saveBudget,
  deleteBudget,
  getDashboardSummary,
} from "../api/summary";
import Sidebar from "../components/Sidebar";

const EXPENSE_CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "HOUSING",
  "HEALTH",
  "EDUCATION",
  "ENTERTAINMENT",
  "SHOPPING",
  "UTILITIES",
  "OTHER",
];

// recommended % of income per category
const RECOMMENDED = {
  HOUSING: 30,
  FOOD: 15,
  TRANSPORT: 10,
  UTILITIES: 8,
  HEALTH: 7,
  EDUCATION: 5,
  ENTERTAINMENT: 5,
  SHOPPING: 5,
  OTHER: 5,
};

const EMPTY_FORM = {
  category: "FOOD",
  monthlyLimit: "",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-PK").format(Math.round(Number(n) || 0));

// progress bar colour based on % used
function barColor(pct) {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-green-500";
}

function barBg(pct) {
  if (pct >= 100) return "bg-red-100 dark:bg-red-950/40";
  if (pct >= 80) return "bg-amber-100 dark:bg-amber-950/40";
  return "bg-slate-100 dark:bg-slate-800";
}

export default function Budgets() {
  const userId = useAuthStore((s) => s.userId);
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

  // ── fetch budget status (limit + spent) ───────
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgetStatus", userId],
    queryFn: () => getBudgetStatus(userId).then((r) => r.data),
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  // ── save / update budget ──────────────────────
  const saveMut = useMutation({
    mutationFn: () =>
      saveBudget({
        userId,
        category: form.category,
        monthlyLimit: Number(form.monthlyLimit),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["budgetStatus", userId],
      });
      qc.invalidateQueries({
        queryKey: ["insights", userId],
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      setFormError(null);
    },
    onError: () => setFormError("Failed to save budget."),
  });

  // ── delete budget ─────────────────────────────
  const delMut = useMutation({
    mutationFn: (id) => deleteBudget(id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["budgetStatus", userId],
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ["dashboardSummary", userId],
    queryFn: () => getDashboardSummary(userId).then((r) => r.data),
    enabled: !!userId,
  });
  //Auto-calculate recommended amount
  const monthlyIncome = Number(summary?.monthlyIncome || 0);
  const getRecommendedAmount = (category) => {
    if (!monthlyIncome || !RECOMMENDED[category]) return "";

    return Math.round((RECOMMENDED[category] / 100) * monthlyIncome);
  };

  // ── helpers ───────────────────────────────────
  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    if (!form.monthlyLimit || Number(form.monthlyLimit) <= 0) {
      setFormError("Enter a limit greater than 0.");
      return;
    }
    setFormError(null);
    saveMut.mutate();
  };

  // ── summary metrics ───────────────────────────
  const overBudgetCount = budgets.filter((b) => b.isOverBudget).length;
  const totalLimit = budgets.reduce((s, b) => s + Number(b.limit), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0);

  // categories not yet budgeted
  const budgetedCats = budgets.map((b) => b.category);
  const remaining = EXPENSE_CATEGORIES.filter((c) => !budgetedCats.includes(c));

  return (
    <div
      className="flex min-h-screen bg-slate-50
      dark:bg-slate-950"
    >
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* ── header ──────────────────────────────── */}
        <div
          className="flex items-start
          justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-semibold">Budgets</h1>
            <p className="text-slate-500 text-sm mt-1">
              Set monthly limits · track spending against them live
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowForm((v) => !v)}
            disabled={remaining.length === 0}
          >
            <Plus size={16} />
            Add budget
          </button>
        </div>

        {/* ── summary metrics ─────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="metric-card">
            <p
              className="text-xs text-slate-500
              font-medium uppercase tracking-wide"
            >
              Total budgeted
            </p>
            <p className="text-2xl font-semibold">PKR {fmt(totalLimit)}</p>
            <p className="text-xs text-slate-400">
              across {budgets.length} categories
            </p>
          </div>
          <div className="metric-card">
            <p
              className="text-xs text-slate-500
              font-medium uppercase tracking-wide"
            >
              Total spent
            </p>
            <p
              className={`text-2xl font-semibold
              ${
                totalSpent > totalLimit
                  ? "text-red-500"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              PKR {fmt(totalSpent)}
            </p>
            <p className="text-xs text-slate-400">this month</p>
          </div>
          <div className="metric-card">
            <p
              className="text-xs text-slate-500
              font-medium uppercase tracking-wide"
            >
              Over budget
            </p>
            <p
              className={`text-2xl font-semibold
              ${overBudgetCount > 0 ? "text-red-500" : "text-green-600"}`}
            >
              {overBudgetCount}
            </p>
            <p className="text-xs text-slate-400">
              {overBudgetCount === 0
                ? "All within limit"
                : "categories exceeded"}
            </p>
          </div>
        </div>

        {/* ──  budget form ─────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="card">
                <h2 className="font-semibold mb-4">Set monthly budget</h2>

                <AnimatePresence>
                  {formError && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-50 dark:bg-red-950
                        text-red-600 dark:text-red-400
                        text-sm px-4 py-3 rounded-xl
                        mb-4"
                    >
                      {formError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className="grid grid-cols-1
                  md:grid-cols-3 gap-4 mb-4"
                >
                  <div>
                    <label className="label">Category</label>
                    <select
                      className="input"
                      value={form.category}
                      onChange={field("category")}
                    >
                      {remaining.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      {/* also show budgeted for editing */}
                      {budgetedCats.map((c) => (
                        <option key={c + "_e"} value={c}>
                          {c} (update)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Monthly limit (PKR)</label>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      placeholder={
                        monthlyIncome && RECOMMENDED[form.category]
                          ? `e.g. ${fmt(getRecommendedAmount(form.category))}`
                          : "Enter amount"
                      }
                      value={form.monthlyLimit}
                      onChange={field("monthlyLimit")}
                    />
                    {RECOMMENDED[form.category] && monthlyIncome > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        Recommended: ~{RECOMMENDED[form.category]}% (PKR{" "}
                        {fmt(getRecommendedAmount(form.category))})
                      </p>
                    )}
                  </div>

                  <div className="flex items-end">
                    <div className="flex gap-3 w-full">
                      <button
                        className="btn-primary flex-1"
                        onClick={handleSave}
                        disabled={saveMut.isPending}
                      >
                        {saveMut.isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setShowForm(false);
                          setForm(EMPTY_FORM);
                          setFormError(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── loading skeletons ───────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card h-24 animate-pulse
                  bg-slate-100 dark:bg-slate-800
                  border-0"
              />
            ))}
          </div>
        )}

        {/* ── budget cards ────────────────────────── */}
        {!isLoading && budgets.length > 0 && (
          <div className="space-y-3">
            {budgets.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card"
              >
                <div
                  className="flex items-start
                  justify-between mb-3"
                >
                  <div className="flex items-center gap-3">
                    {/* status icon */}
                    {b.isOverBudget ? (
                      <AlertTriangle
                        size={17}
                        className="text-red-500
                            flex-shrink-0"
                      />
                    ) : b.percentUsed >= 80 ? (
                      <AlertTriangle
                        size={17}
                        className="text-amber-500
                            flex-shrink-0"
                      />
                    ) : (
                      <CheckCircle
                        size={17}
                        className="text-green-500
                            flex-shrink-0"
                      />
                    )}

                    <div>
                      <p className="font-semibold text-sm">{b.category}</p>
                      <p className="text-xs text-slate-400">
                        PKR {fmt(b.spent)} spent of PKR {fmt(b.limit)} limit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold
                        ${
                          b.isOverBudget
                            ? "text-red-500"
                            : b.percentUsed >= 80
                              ? "text-amber-500"
                              : "text-green-600"
                        }`}
                      >
                        {b.percentUsed.toFixed(0)}%
                      </p>
                      <p className="text-xs text-slate-400">
                        {b.isOverBudget
                          ? `PKR ${fmt(Number(b.spent) - Number(b.limit))} over`
                          : `PKR ${fmt(b.remaining)} left`}
                      </p>
                    </div>
                    <button
                      onClick={() => delMut.mutate(b.id)}
                      disabled={delMut.isPending}
                      className="text-slate-400
                        hover:text-red-500
                        transition-colors
                        disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* progress bar */}
                <div
                  className={`h-2.5 rounded-full
                  overflow-hidden
                  ${barBg(b.percentUsed)}`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(b.percentUsed, 100)}%`,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.05,
                      ease: "easeOut",
                    }}
                    className={`h-full rounded-full
                      ${barColor(b.percentUsed)}`}
                  />
                </div>

                {/* over budget warning strip */}
                {b.isOverBudget && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs
                      text-red-600 dark:text-red-400
                      bg-red-50 dark:bg-red-950/40
                      px-3 py-1.5 rounded-lg
                      flex items-center gap-1.5"
                  >
                    <AlertTriangle size={12} />
                    Budget exceeded by PKR{" "}
                    {fmt(Number(b.spent) - Number(b.limit))}
                    {" — AI advisor has flagged this"}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* ── empty state ─────────────────────────── */}
        {!isLoading && budgets.length === 0 && (
          <div className="card text-center py-16">
            <PiggyBank size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-medium text-slate-500">No budgets set yet</p>
            <p
              className="text-sm text-slate-400 mt-1
              max-w-sm mx-auto"
            >
              Set a monthly limit for each spending category. The AI advisor
              compares your real spending against these limits.
            </p>
            <button
              className="btn-primary mt-6 mx-auto"
              onClick={() => setShowForm(true)}
            >
              Set first budget
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
