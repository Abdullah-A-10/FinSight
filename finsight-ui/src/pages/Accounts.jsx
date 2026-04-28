import { useState } from 'react'
import { useQuery, useMutation, useQueryClient }
  from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, Star, Building2,
         Banknote, Smartphone, TrendingUp,
         Bitcoin, X, Edit2, Eye, EyeOff,
         ArrowUpCircle, ArrowDownCircle, 
         Sparkles, TrendingDown, PieChart, Shield,
         Percent, Calendar, Rocket } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

// ── number formatters ────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-PK').format(Number(n) || 0)

const fmtCompact = (n) =>
  new Intl.NumberFormat('en-PK', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(n) || 0)

const fmtPercent = (n) =>
  new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)

// ── account type options ─────────────────────────
const ACCOUNT_TYPES = [
  'BANK', 'CASH', 'MOBILE_WALLET', 'SAVINGS',
  'INVESTMENT', 'CRYPTO',
]

// Types that can have growth (annual return rate)
const GROWTH_TYPES = ['SAVINGS', 'INVESTMENT', 'CRYPTO']

// ── colour + icon config per type ───────────────
const TYPE_CONFIG = {
  BANK: {
    icon:   Building2,
    badge:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    accent: 'border-t-blue-500',
    gradient: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20',
    shadow: 'shadow-blue-500/10',
    growthBadge: 'bg-blue-50 text-blue-600',
  },
  CASH: {
    icon:   Banknote,
    badge:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    accent: 'border-t-emerald-500',
    gradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20',
    shadow: 'shadow-emerald-500/10',
    growthBadge: 'bg-emerald-50 text-emerald-600',
  },
  MOBILE_WALLET: {
    icon:   Smartphone,
    badge:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    accent: 'border-t-purple-500',
    gradient: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20',
    shadow: 'shadow-purple-500/10',
    growthBadge: 'bg-purple-50 text-purple-600',
  },
  SAVINGS: {
    icon: Wallet,
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    accent: 'border-t-indigo-500',
    gradient: 'from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20',
    shadow: 'shadow-indigo-500/10',
    growthBadge: 'bg-indigo-50 text-indigo-600',
  },
  INVESTMENT: {
    icon:   TrendingUp,
    badge:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    accent: 'border-t-amber-500',
    gradient: 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20',
    shadow: 'shadow-amber-500/10',
    growthBadge: 'bg-amber-50 text-amber-600',
  },
  CRYPTO: {
    icon:   Bitcoin,
    badge:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    accent: 'border-t-orange-500',
    gradient: 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20',
    shadow: 'shadow-orange-500/10',
    growthBadge: 'bg-orange-50 text-orange-600',
  },
}

const EMPTY_FORM = {
  accountName:    '',
  accountType:    'BANK',
  currentBalance: '',
  annualReturnRate: '',
}

// ─────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────
export default function Accounts() {
  const userId = useAuthStore((s) => s.userId)
  const qc     = useQueryClient()

  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [hoveredAccount, setHoveredAccount] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showGrowthDetails, setShowGrowthDetails] = useState(false)

  // ── 1. fetch all accounts with growth data ─────
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accountsWithGrowth', userId],
    queryFn:  () =>
      api.get(`/accounts/user/${userId}`)
         .then((r) => r.data),
    enabled: !!userId,
  })

  // ── 2. fetch net worth (with growth) ───────────
  const { data: netWorth = 0 } = useQuery({
    queryKey: ['networth', userId],
    queryFn:  () =>
      api.get(`/accounts/networth/${userId}`)
         .then((r) => r.data),
    enabled: !!userId,
  })

  // ── 3. fetch net savings (with growth) ─────────
  const { data: netSavings = 0 } = useQuery({
    queryKey: ['netSavings', userId],
    queryFn:  () =>
      api.get(`/accounts/netSavings/${userId}`)
         .then((r) => r.data),
    enabled: !!userId,
  })

  // ── 4. create account with optional growth rate ─
  const addMut = useMutation({
    mutationFn: () => {
      const payload = {
        userId,
        name: form.accountName,
        type: form.accountType,
        openingBalance: Number(form.currentBalance),
      }
      
      // Add annual return rate if it's a growth account type
      if (GROWTH_TYPES.includes(form.accountType) && form.annualReturnRate) {
        payload.annualReturnRate = Number(form.annualReturnRate) / 100
      }
      
      return api.post('/accounts', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accountsWithGrowth', userId] })
      qc.invalidateQueries({ queryKey: ['networth', userId] })
      qc.invalidateQueries({ queryKey: ['netSavings', userId] })
      qc.invalidateQueries({ queryKey: ['summary', userId] })
      setForm(EMPTY_FORM)
      setShowForm(false)
      setFormError(null)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message
      setFormError(msg || 'Failed to create account. Try again.')
    },
  })

  // ── client-side validation ────────────────────
  const handleAdd = () => {
    if (!form.accountName.trim()) {
      setFormError('Account name is required.')
      return
    }
    if (!form.currentBalance ||
        isNaN(Number(form.currentBalance)) ||
        Number(form.currentBalance) < 0) {
      setFormError('Enter a valid opening balance (0 or more).')
      return
    }
    
    // Validate growth rate for growth account types
    if (GROWTH_TYPES.includes(form.accountType)) {
      if (form.annualReturnRate && 
          (isNaN(Number(form.annualReturnRate)) || 
           Number(form.annualReturnRate) < 0 || 
           Number(form.annualReturnRate) > 100)) {
        setFormError('Annual return rate must be between 0% and 100%.')
        return
      }
    }
    
    setFormError(null)
    addMut.mutate()
  }

  // ── helpers ───────────────────────────────────
  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const closeForm = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  // Calculate account distribution
  const totalEffectiveBalance = accounts.reduce((sum, acc) => sum + (acc.effectiveBalance || acc.currentBalance || 0), 0)
  const totalProfit = accounts.reduce((sum, acc) => sum + (acc.profit || 0), 0)
  
  const accountTypesCount = accounts.reduce((acc, curr) => {
    const type = curr.type || 'BANK'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  // Calculate top account by effective balance
  const topAccount = accounts.reduce((max, acc) => 
    ((acc.effectiveBalance || acc.currentBalance) > (max?.effectiveBalance || max?.currentBalance || 0) ? acc : max), null)

  // Calculate best performing account (highest profit percentage)
  const bestPerformer = accounts.reduce((best, acc) => 
    ((acc.profitPercentage || 0) > (best?.profitPercentage || 0) ? acc : best), null)

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">

        {/* ── page header ─────── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-2 rounded-xl">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-600 dark:from-white dark:via-indigo-400 dark:to-slate-400 bg-clip-text text-transparent">
                Accounts
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 ml-12">
              Manage your money accounts and track growth with automatic returns
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              showForm 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl'
            }`}
            onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add account'}
          </motion.button>
        </motion.div>

        {/* ── net worth hero with growth stats ──── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl mb-8 p-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full -ml-40 -mb-40" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-indigo-200" />
                  <p className="text-sm font-medium text-indigo-100">
                    Your Financial Snapshot
                  </p>
                </div>
                <p className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                  PKR {fmtCompact(netWorth)}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-sm text-indigo-100">
                      {accounts.length} active account{accounts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <p className="text-sm text-indigo-100">
                      {Object.keys(accountTypesCount).length} account types
                    </p>
                  </div>
                  {topAccount && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-300" />
                      <p className="text-sm text-indigo-100">
                        Top: {topAccount.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 min-w-[200px]">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
                  <p className="text-xs text-indigo-200 mb-1">Net Savings</p>
                  <p className="text-lg font-semibold">
                    PKR {fmtCompact(netSavings)}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
                  <p className="text-xs text-indigo-200 mb-1">Total Growth</p>
                  <p className="text-lg font-semibold">
                    +PKR {fmtCompact(totalProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── add account form ────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-1.5 rounded-lg">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                    Create New Account
                  </h2>
                </div>

                {/* error message */}
                <AnimatePresence>
                  {formError && (
                    <motion.div
                      key="form-err"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 border border-red-200/50 dark:border-red-800/50">
                      {formError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Account name
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
                      placeholder="HBL Savings, JazzCash..."
                      value={form.accountName}
                      onChange={field('accountName')} />
                  </div>

                  <div>
                    <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Account type
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 transition-all duration-300"
                      value={form.accountType}
                      onChange={field('accountType')}>
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Opening balance (PKR)
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 transition-all duration-300"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="50000"
                      value={form.currentBalance}
                      onChange={field('currentBalance')} />
                  </div>

                  {GROWTH_TYPES.includes(form.accountType) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
                        <Percent size={14} />
                        Annual return rate (%)
                      </label>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 transition-all duration-300"
                        type="number"
                        min="0"
                        max="100"
                        
                        placeholder="e.g., 5.5"
                        value={form.annualReturnRate}
                        onChange={field('annualReturnRate')} />
                      <p className="text-xs text-slate-400 mt-1">
                        Account will grow automatically at this annual rate
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25 transition-all duration-300"
                    onClick={handleAdd}
                    disabled={addMut.isPending}>
                    {addMut.isPending
                      ? 'Creating...'
                      : 'Create account'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium transition-all duration-300"
                    onClick={closeForm}>
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── loading skeleton ────────────────── */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i}
                className="bg-white/80 dark:bg-slate-900/80 rounded-2xl h-56 animate-pulse shadow-lg" />
            ))}
          </div>
        )}

        {/* ── account cards  ── */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc, i) => {
              const type = acc.type ?? 'BANK'
              const cfg  = TYPE_CONFIG[type] ?? TYPE_CONFIG.BANK
              const Icon = cfg.icon
              const currentBalance = acc.currentBalance || 0
              const effectiveBalance = acc.effectiveBalance || currentBalance
              const profit = acc.profit || 0
              const profitPercentage = acc.profitPercentage || 0
              const isGrowth = GROWTH_TYPES.includes(type)
              const balancePercentage = totalEffectiveBalance > 0 ? (effectiveBalance / totalEffectiveBalance) * 100 : 0
              const isPositiveGrowth = profit > 0
              const returnRate = (acc.annualReturnRate*100).toFixed(1) || 0

              return (
                <motion.div
                  key={acc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  onHoverStart={() => setHoveredAccount(acc.id)}
                  onHoverEnd={() => setHoveredAccount(null)}
                  className={`group bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200/50 dark:border-slate-800/50 cursor-pointer`}>
                  
                  {/* Gradient top bar with growth indicator */}
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.6 }}
                    className={`h-1.5 bg-gradient-to-r ${cfg.gradient} origin-left ${isGrowth && isPositiveGrowth ? 'relative' : ''}`}>
                    {isGrowth && isPositiveGrowth && (
                      <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-r from-transparent to-emerald-400/30" />
                    )}
                  </motion.div>

                  <div className="p-5">
                    {/* top row — name + type + default */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          whileHover={{ rotate: 5, scale: 1.05 }}
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-md ${cfg.shadow}`}>
                          <Icon size={20} className="text-slate-700 dark:text-slate-300" />
                        </motion.div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {acc.name}
                          </p>
                          <div className="flex gap-1 mt-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${cfg.badge}`}>
                              {type.replace('_', ' ')}
                            </span>
                            {isGrowth && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${cfg.growthBadge} bg-opacity-50`}>
                                <Rocket size={10} className="inline mr-0.5" />
                                Growth {returnRate} %
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* default badge */}
                      {acc.isDefault && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 border border-indigo-200 dark:border-indigo-800">
                          <Star size={11} className="fill-indigo-600 dark:fill-indigo-400" />
                          Default
                        </motion.div>
                      )}
                    </div>

                    {/* balances - current and effective */}
                    <div className="mb-3">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Current balance
                        </p>
                        {isGrowth && effectiveBalance !== currentBalance && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            +{fmtPercent(profitPercentage)}% growth
                          </p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        PKR {fmt(currentBalance)}
                      </p>
                      
                      {isGrowth && effectiveBalance !== currentBalance && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-400">
                              Effective value (with growth)
                            </p>
                            <div className="flex items-center gap-1">
                              {isPositiveGrowth ? (
                                <TrendingUp size={12} className="text-emerald-500" />
                              ) : profit < 0 ? (
                                <TrendingDown size={12} className="text-red-500" />
                              ) : null}
                              <p className={`text-sm font-semibold ${isPositiveGrowth ? 'text-emerald-600 dark:text-emerald-400' : profit < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600'}`}>
                                PKR {fmt(effectiveBalance)}
                              </p>
                            </div>
                          </div>
                          {profit !== 0 && (
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-slate-400">Total profit</p>
                              <p className={`text-xs font-medium ${isPositiveGrowth ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isPositiveGrowth ? '+' : ''}{fmt(profit)} PKR
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>Portfolio share</span>
                          <span className="font-medium">{balancePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${balancePercentage}%` }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* additional info */}
                    <motion.div 
                      animate={{ opacity: hoveredAccount === acc.id ? 1 : 0.6 }}
                      className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${cfg.gradient}`} />
                        <span className="text-xs text-slate-400">
                          {acc.currency ?? 'PKR'} Account
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {isGrowth && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex item-center gap-1 text-indigo-500 text-xs dark:text-indigo-400 hover:text-indigo-600 transition-colors"
                            onClick={() => {
                              setSelectedAccount(acc)
                              setShowGrowthDetails(true)
                            }}
                          > Growth Details <Percent size={14} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 transition-colors"
                        >
                          <Eye size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}

            {/* empty state  */}
            {accounts.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-lg text-center py-16 px-4 border border-slate-200/50 dark:border-slate-800/50">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-2xl opacity-20" />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Wallet size={48} className="text-slate-400 dark:text-slate-500" />
                  </div>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-lg mb-2">
                  No accounts yet
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
                  Add your first account to start tracking your financial journey
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25 transition-all duration-300"
                  onClick={() => setShowForm(true)}>
                  <Plus size={16} />
                  Add your first account
                </motion.button>
              </motion.div>
            )}
          </div>
        )}

        {/* Growth Details Modal */}
        <AnimatePresence>
          {showGrowthDetails && selectedAccount && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowGrowthDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Growth Details
                  </h3>
                  <button
                    onClick={() => setShowGrowthDetails(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Account</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedAccount.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Current Balance</p>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        PKR {fmt(selectedAccount.currentBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Effective Value</p>
                      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        PKR {fmt(selectedAccount.effectiveBalance)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Growth</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          +{fmtPercent(selectedAccount.profitPercentage)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      +PKR {fmt(selectedAccount.profit)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      This account has grown through automatic returns based on its annual rate
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  )
}