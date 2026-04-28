import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Calendar,
  Tag,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  getCategoryBreakdown,
} from "../api/summary";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";

const COLORS = [
  "#4F46E5",
  "#fb923c",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
];

// CATEGORY MAPPING (based on TYPE)
const CATEGORY_MAP = {
  EXPENSE: [
    "FOOD",
    "TRANSPORT",
    "HOUSING",
    "HEALTH",
    "EDUCATION",
    "ENTERTAINMENT",
    "SHOPPING",
    "UTILITIES",
    "OTHER",
  ],
  INCOME: ["SALARY", "FREELANCE", "OTHER"],
  SAVINGS: ["SAVINGS", "INVESTMENT"],
};

const EMPTY_FORM = {
  amount: "",
  type: "EXPENSE",
  category: "FOOD",
  description: "",
  date: new Date().toISOString().split("T")[0],
  accountId: "",
  targetAccountId: "",
};

export default function Expenses() {
  const userId = useAuthStore((s) => s.userId);
  const qc = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ── transactions ─────────────────────────────
  const { data: txs = [] } = useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => getTransactions(userId).then((r) => r.data),
    enabled: !!userId,
  });

  // ── category breakdown ───────────────────────
  const { data: cats = {} } = useQuery({
    queryKey: ["categories", userId],
    queryFn: () => getCategoryBreakdown(userId).then((r) => r.data),
    enabled: !!userId,
  });

  // ── accounts ────────────────────────────────
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", userId],
    queryFn: () => api.get(`/accounts/user/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  // auto-select default account
  useEffect(() => {
    if (accounts.length > 0 && !form.accountId) {
      const defaultAcc = accounts.find((a) => a.isDefault) ?? accounts[0];
      setForm((f) => ({ ...f, accountId: defaultAcc.id }));
    }
  }, [accounts]);

  //
  useEffect(() => {
    setForm((f) => ({
      ...f,
      category: CATEGORY_MAP[f.type][0],
      targetAccountId: "",
    }));
  }, [form.type]);

  //filtered transactions
  const filteredTxs = txs.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // ── pie data ────────────────────────────────
  const pieData = Object.values(
    filteredTxs
          .filter((t) => t.type === "EXPENSE") // only expenses in pie
          .reduce((acc, t) => {
            if (!acc[t.category]) {
              acc[t.category] = { name: t.category, value: 0 };
            }
            acc[t.category].value += Number(t.amount);
            return acc;
          }, {}),
  );

  // ── add transaction ─────────────────────────
  const addMut = useMutation({
    mutationFn: () => {
      if (!form.accountId) {
        throw new Error("Please select an account.");
      }

      if (form.type === "SAVINGS" && !form.targetAccountId) {
        throw new Error("Select a target account for savings.");
      }

      return addTransaction({
        userId,
        sourceAccountId: Number(form.accountId),
        targetAccountId:
          form.type === "SAVINGS" ? Number(form.targetAccountId) : null,
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        description: form.description,
        date: form.date,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", userId] });
      qc.invalidateQueries({ queryKey: ["summary", userId] });
      qc.invalidateQueries({ queryKey: ["categories", userId] });
      qc.invalidateQueries({ queryKey: ["accounts", userId] });
      qc.invalidateQueries({ queryKey: ["networth", userId] });
      qc.invalidateQueries({ queryKey: ["quicksim", userId] });

      setForm((f) => ({
        ...f,
        amount: "",
        description: "",
        targetAccountId: "",
      }));

      setError(null);
      setSuccess("Transaction added successfully ✅");

      // auto-hide after 2 sec
      setTimeout(() => setSuccess(null), 2000);
    },
  });

  // ── delete ──────────────────────────────────
  const delMut = useMutation({
    mutationFn: (id) => deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", userId] });
      qc.invalidateQueries({ queryKey: ["summary", userId] });
      qc.invalidateQueries({ queryKey: ["categories", userId] });
      qc.invalidateQueries({ queryKey: ["accounts", userId] });
      qc.invalidateQueries({ queryKey: ["networth", userId] });
    },
  });

  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = () => {
    if (!form.amount || isNaN(Number(form.amount))) {
      setError("Enter a valid amount.");
      return;
    }
    if (Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    addMut.mutate();
  };

  // Calculate summary statistics
  const totalIncome = filteredTxs
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTxs
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = filteredTxs
    .filter((t) => t.type === "SAVINGS")
    .reduce((sum, t) => sum + t.amount, 0);
  // Custom label (percentage + name)
  const renderCustomLabel = ({ name, percent }) => {
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {data.name}
          </p>
          <p className="text-sm text-indigo-500 font-semibold">
            ${data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header  */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Expense Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your finances with ease
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Total Monthly Income
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  ${totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Total Monthly Expenses
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  ${totalExpense.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Total Monthly Savings
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  ${totalSavings.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <PiggyBank className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* FORM  */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Log Transaction
              </h2>
            </div>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-xl mb-4 border border-green-200 dark:border-green-800"
              >
                {success}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 border border-red-200 dark:border-red-800"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              {/* TYPE with icons */}
              <div className="relative">
                <select
                  className="input pl-10 appearance-none cursor-pointer hover:border-indigo-300 transition-colors"
                  value={form.type}
                  onChange={field("type")}
                >
                  <option>EXPENSE</option>
                  <option>INCOME</option>
                  <option>SAVINGS</option>
                </select>
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              {/* SOURCE ACCOUNT */}
              <div className="relative">
                <select
                  className="input pl-10 appearance-none cursor-pointer hover:border-indigo-300 transition-colors"
                  value={form.accountId}
                  onChange={field("accountId")}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              {/* TARGET ACCOUNT (only savings) */}
              {form.type === "SAVINGS" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="relative"
                >
                  <select
                    className="input pl-10 appearance-none cursor-pointer hover:border-indigo-300 transition-colors"
                    value={form.targetAccountId}
                    onChange={field("targetAccountId")}
                  >
                    <option value="">Select target account</option>
                    {accounts
                      .filter((a) => a.id !== Number(form.accountId))
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                  </select>
                  <PiggyBank className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </motion.div>
              )}

              {/* Amount */}
              <input
                className="input pl-10 hover:border-indigo-300 transition-colors"
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={field("amount")}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                $
              </div>

              {/* CATEGORY */}
              <div className="relative">
                <select
                  className="input pl-10 appearance-none cursor-pointer hover:border-indigo-300 transition-colors"
                  value={form.category}
                  onChange={field("category")}
                >
                  {CATEGORY_MAP[form.type].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              <input
                className="input hover:border-indigo-300 transition-colors"
                placeholder="Description"
                value={form.description}
                onChange={field("description")}
              />

              <div className="relative">
                <input
                  className="input pl-10 hover:border-indigo-300 transition-colors"
                  type="date"
                  value={form.date}
                  onChange={field("date")}
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleSubmit}
              >
                Add transaction
              </motion.button>
            </div>
          </motion.div>

          {/* PIE CHART  */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Spending Breakdown
              </h2>
              {pieData.length > 0 && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Total: $
                  {pieData
                    .reduce((sum, item) => sum + item.value, 0)
                    .toLocaleString()}
                </div>
              )}
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  {/* Center Text */}
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-700 dark:fill-slate-200"
                  >
                    <tspan x="50%" dy="-5" className="text-lg font-semibold">
                      $
                      {pieData
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </tspan>
                    <tspan x="50%" dy="20" className="text-xs text-slate-500">
                      Total Spent
                    </tspan>
                  </text>

                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={3}
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        className="cursor-pointer hover:opacity-80 transition-all duration-200"
                      />
                    ))}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />

                  {/* Legend */}
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-slate-400 dark:text-slate-600">
                No transaction data available
              </div>
            )}
          </motion.div>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Transactions
          </h2>

          <div className="flex gap-2">
            {/* Month */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>

            {/* Year */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Recent Transactions
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            <AnimatePresence>
              {filteredTxs.length > 0 ? (
                filteredTxs.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {tx.description || tx.category}
                        </span>
                        {tx.type === "SAVINGS" && tx.targetAccount && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                            → {tx.targetAccount.accountName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {new Date(tx.date).toLocaleDateString()} • {tx.category}
                      </div>
                    </div>

                    <div className="flex gap-4 items-center">
                      <span
                        className={`font-semibold text-lg ${
                          tx.type === "INCOME"
                            ? "text-green-600 dark:text-green-400"
                            : tx.type === "SAVINGS"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {tx.type === "INCOME"
                          ? "+"
                          : tx.type === "SAVINGS"
                            ? "→"
                            : "-"}
                        ${tx.amount.toLocaleString()}
                      </span>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => delMut.mutate(tx.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2
                          size={16}
                          className="text-red-500 dark:text-red-400"
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                  No transactions yet. Add your first transaction above!
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
