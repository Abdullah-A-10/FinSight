import { useState } from 'react'
import { useQuery, useMutation, useQueryClient }
  from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calendar,
         TrendingUp, TrendingDown,
         AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { getLifeEvents, addLifeEvent,
         deleteLifeEvent } from '../api/summary'
import Sidebar from '../components/Sidebar'

// preset event templates for quick add
const PRESETS = [
  {
    label: 'Wedding',
    eventName: 'Wedding',
    lumpSumAmount: -600000,
    monthlyDelta: 0,
    isPositive: false,
  },
  {
    label: 'Car purchase',
    eventName: 'Car purchase',
    lumpSumAmount: -1500000,
    monthlyDelta: 0,
    isPositive: false,
  },
  {
    label: 'Home down payment',
    eventName: 'Home down payment',
    lumpSumAmount: -3000000,
    monthlyDelta: 0,
    isPositive: false,
  },
  {
    label: 'Salary hike',
    eventName: 'Salary hike',
    lumpSumAmount: 0,
    monthlyDelta: 20000,
    isPositive: true,
  },
  {
    label: 'Side income',
    eventName: 'Side income',
    lumpSumAmount: 0,
    monthlyDelta: 25000,
    isPositive: true,
  },
  {
    label: 'Child education',
    eventName: 'Child education',
    lumpSumAmount: -500000,
    monthlyDelta: 0,
    isPositive: false,
  },
]

const EMPTY_FORM = {
  eventName:     '',
  atYear:        1,
  lumpSumAmount: '',
  monthlyDelta:  '',
  isPositive:    false,
}

const fmt = (n) =>
  new Intl.NumberFormat('en-PK')
           .format(Math.abs(Number(n) || 0))

export default function LifeEvents() {
  const userId = useAuthStore((s) => s.userId)
  const qc     = useQueryClient()

  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)

  // ── fetch life events ─────────────────────────
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['lifeEvents', userId],
    queryFn:  () =>
      getLifeEvents(userId).then((r) => r.data),
    enabled: !!userId,
  })

  // ── add event ─────────────────────────────────
  const addMut = useMutation({
    mutationFn: () =>
      addLifeEvent({
        userId,
        eventName:     form.eventName,
        atYear:        Number(form.atYear),
        lumpSumAmount: form.lumpSumAmount !== ''
          ? Number(form.lumpSumAmount)
          : 0,
        monthlyDelta: form.monthlyDelta !== ''
          ? Number(form.monthlyDelta)
          : 0,
        isPositive: form.isPositive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['lifeEvents', userId] })
      qc.invalidateQueries({
        queryKey: ['simulation', userId] })
      setForm(EMPTY_FORM)
      setShowForm(false)
      setFormError(null)
    },
    onError: () =>
      setFormError('Failed to save event. Try again.'),
  })

  // ── delete event ──────────────────────────────
  const delMut = useMutation({
    mutationFn: (id) => deleteLifeEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['lifeEvents', userId] })
      qc.invalidateQueries({
        queryKey: ['simulation', userId] })
    },
  })

  // ── apply preset ──────────────────────────────
  const applyPreset = (p) => {
    setForm((f) => ({
      ...f,
      eventName:     p.eventName,
      lumpSumAmount: p.lumpSumAmount || '',
      monthlyDelta:  p.monthlyDelta  || '',
      isPositive:    p.isPositive,
    }))
    setShowForm(true)
  }

  // ── field helper ──────────────────────────────
  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // ── validate + submit ─────────────────────────
  const handleAdd = () => {
    if (!form.eventName.trim()) {
      setFormError('Event name is required.')
      return
    }
    if (!form.atYear || form.atYear < 1) {
      setFormError('Year must be 1 or more.')
      return
    }
    if (!form.lumpSumAmount && !form.monthlyDelta) {
      setFormError(
        'Enter a lump sum, a monthly change, or both.')
      return
    }
    setFormError(null)
    addMut.mutate()
  }

  // ── total lump impact ─────────────────────────
  const totalImpact = events.reduce(
    (sum, e) => sum + (Number(e.lumpSumAmount) || 0), 0)

  return (
    <div className="flex min-h-screen bg-slate-50
      dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">

        {/* ── header ──────────────────────────────── */}
        <div className="flex items-start
          justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">
              Life events
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Plan future milestones — they're injected
              into every Monte Carlo simulation
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} />
            Add event
          </button>
        </div>

        {/* ── impact summary card ─────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="metric-card">
            <p className="text-xs text-slate-500
              font-medium uppercase tracking-wide">
              Planned events
            </p>
            <p className="text-2xl font-semibold">
              {events.length}
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs text-slate-500
              font-medium uppercase tracking-wide">
              Total lump impact
            </p>
            <p className={`text-2xl font-semibold
              ${totalImpact >= 0
                ? 'text-green-600'
                : 'text-red-500'}`}>
              {totalImpact >= 0 ? '+' : '-'}
              PKR {fmt(totalImpact)}
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs text-slate-500
              font-medium uppercase tracking-wide">
              Simulation status
            </p>
            <p className="text-sm font-medium
              text-green-600 mt-1">
              {events.length > 0
                ? 'Active in simulations'
                : 'No events yet'}
            </p>
          </div>
        </div>

        {/* ── quick presets ───────────────────────── */}
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">
            Quick add
          </h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label}
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-xl
                  text-xs font-medium border
                  transition-all
                  ${p.isPositive
                    ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:text-green-400 dark:bg-green-950/30'
                    : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:bg-red-950/30'
                  }`}>
                {p.isPositive ? '+' : '−'}
                {' '}{p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── add form (animated) ─────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6">
              <div className="card">
                <h2 className="font-semibold mb-4">
                  New life event
                </h2>

                <AnimatePresence>
                  {formError && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-50 dark:bg-red-950
                        text-red-600 dark:text-red-400
                        text-sm px-4 py-3 rounded-xl mb-4
                        flex items-center gap-2">
                      <AlertCircle size={14} />
                      {formError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1
                  md:grid-cols-2 lg:grid-cols-3
                  gap-4 mb-4">

                  <div>
                    <label className="label">
                      Event name
                    </label>
                    <input className="input"
                      placeholder="Wedding, car, salary hike..."
                      value={form.eventName}
                      onChange={field('eventName')} />
                  </div>

                  <div>
                    <label className="label">
                      At year (from now)
                    </label>
                    <input className="input"
                      type="number" min={1} max={30}
                      placeholder="3"
                      value={form.atYear}
                      onChange={field('atYear')}/>
                  </div>

                  <div>
                    <label className="label">
                      Type
                    </label>
                    <select className="input"
                      value={form.isPositive}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          isPositive: e.target.value === 'true',
                        }))}>
                      <option value="false">
                        Expense (reduces wealth)
                      </option>
                      <option value="true">
                        Income (increases wealth)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      One-time amount (PKR)
                    </label>
                    <input className="input"
                      type="number"
                      placeholder="600000 — leave 0 if none"
                      value={form.lumpSumAmount}
                      onChange={field('lumpSumAmount')} />
                    <p className="text-xs text-slate-400 mt-1">
                      e.g. wedding cost, car price,
                      bonus payout
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      Monthly change (PKR)
                    </label>
                    <input className="input"
                      type="number"
                      placeholder="20000 — leave 0 if none"
                      value={form.monthlyDelta}
                      onChange={field('monthlyDelta')} />
                    <p className="text-xs text-slate-400 mt-1">
                      e.g. salary hike, recurring
                      expense after event
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="btn-primary"
                    onClick={handleAdd}
                    disabled={addMut.isPending}>
                    {addMut.isPending
                      ? 'Saving...'
                      : 'Save event'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowForm(false)
                      setForm(EMPTY_FORM)
                      setFormError(null)
                    }}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── loading skeleton ────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i}
                className="card h-20 animate-pulse
                  bg-slate-100 dark:bg-slate-800
                  border-0" />
            ))}
          </div>
        )}

        {/* ── timeline ────────────────────────────── */}
        {!isLoading && events.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-6">
              Your timeline
            </h2>
            <div className="relative">

              {/* vertical line */}
              <div className="absolute left-8 top-0
                bottom-0 w-px
                bg-slate-200 dark:bg-slate-700" />

              <div className="space-y-4">
                {events.map((ev, i) => {
                  const hasLump   = Number(ev.lumpSumAmount) !== 0
                  const hasMonthly = Number(ev.monthlyDelta)  !== 0
                  const positive  = ev.isPositive

                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-4
                        pl-2">

                      {/* year bubble */}
                      <div className={`relative z-10 w-12 h-12
                        rounded-xl flex flex-col
                        items-center justify-center
                        flex-shrink-0 text-white
                        shadow-sm text-xs font-bold
                        ${positive
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                          : 'bg-gradient-to-br from-red-500 to-rose-600'
                        }`}>
                        <span className="text-white/70
                          text-xs leading-none">
                          Yr
                        </span>
                        <span className="text-base
                          leading-tight">
                          {ev.atYear}
                        </span>
                      </div>

                      {/* event card */}
                      <div className="flex-1 bg-slate-50
                        dark:bg-slate-800/60 rounded-xl
                        px-4 py-3 border border-slate-200
                        dark:border-slate-700">
                        <div className="flex items-start
                          justify-between gap-4">

                          <div className="flex-1">
                            <div className="flex items-center
                              gap-2 mb-2">
                              {positive
                                ? <TrendingUp size={15}
                                    className="text-green-500" />
                                : <TrendingDown size={15}
                                    className="text-red-500" />
                              }
                              <p className="font-semibold text-sm">
                                {ev.eventName}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-3
                              text-xs">
                              {hasLump && (
                                <span className={`font-medium
                                  ${positive
                                    ? 'text-green-600'
                                    : 'text-red-500'}`}>
                                  {positive ? '+' : '−'}
                                  PKR {fmt(ev.lumpSumAmount)}
                                  {' one-time'}
                                </span>
                              )}
                              {hasMonthly && (
                                <span className={`font-medium
                                  ${positive
                                    ? 'text-green-600'
                                    : 'text-red-500'}`}>
                                  {positive ? '+' : '−'}
                                  PKR {fmt(ev.monthlyDelta)}
                                  {' /mo ongoing'}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              delMut.mutate(ev.id)}
                            disabled={delMut.isPending}
                            className="text-slate-400
                              hover:text-red-500
                              transition-colors
                              flex-shrink-0
                              disabled:opacity-40">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── empty state ─────────────────────────── */}
        {!isLoading && events.length === 0 && (
          <div className="card text-center py-16">
            <Calendar size={40}
              className="text-slate-300 mx-auto mb-4" />
            <p className="font-medium text-slate-500">
              No life events planned yet
            </p>
            <p className="text-sm text-slate-400 mt-1
              max-w-sm mx-auto">
              Add events like a wedding, car purchase,
              or salary hike — they'll be reflected
              in every wealth simulation automatically.
            </p>
            <button
              className="btn-primary mt-6 mx-auto"
              onClick={() => setShowForm(true)}>
              Add first event
            </button>
          </div>
        )}

      </main>
    </div>
  )
}