import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Receipt, TrendingUp,
         Brain, Wallet, LogOut, Sparkles,PiggyBank }
  from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts',  icon: Wallet,          label: 'Accounts'  },
  { to: '/expenses',  icon: Receipt,         label: 'Expenses'  },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/life-events', icon: Calendar, label: 'Life Events' },
  { to: '/simulate',  icon: TrendingUp,      label: 'Forecast'  },
  { to: '/advisor',   icon: Brain,           label: 'AI Advisor'},
]

// generate initials from name or email
function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2)
      return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email)
    return email.slice(0, 2).toUpperCase()
  return 'FS'
}

// truncate long email for display
function truncate(str, max = 26) {
  if (!str) return ''
  return str.length > max
    ? str.slice(0, max) + '…'
    : str
}

export default function Sidebar() {
  const logout   = useAuthStore((s) => s.logout)
  const email    = useAuthStore((s) => s.email)
  const fullName = useAuthStore((s) => s.fullName)

  const initials    = getInitials(fullName, email)
  const displayName = fullName || email?.split('@')[0] || 'User'

  return (
    <>
      {/* ── fixed sidebar ──────────────────────────── */}
      <aside className="fixed left-0 top-0 w-64 h-screen
        bg-white dark:bg-slate-900/95 backdrop-blur-sm
        border-r border-slate-200 dark:border-slate-800
        flex flex-col shadow-xl z-50">

        {/* ── logo ──────────────────────────────────── */}
        <div className="px-4 py-6 mb-4 border-b
          border-slate-200 dark:border-slate-800">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-indigo-500
              to-purple-500 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold
                bg-gradient-to-r from-indigo-600
                to-purple-600 dark:from-indigo-400
                dark:to-purple-400 bg-clip-text
                text-transparent">
                FinSight
              </div>
              <p className="text-xs text-slate-400
                dark:text-slate-500 mt-0.5">
                AI Financial Assistant
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── nav links ─────────────────────────────── */}
        <nav className="flex flex-col gap-1.5 flex-1
          px-3 py-4">
          {links.map(({ to, icon: Icon, label }, index) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative flex items-center
                    gap-3 px-3 py-2.5 rounded-xl
                    text-sm font-medium transition-all
                    duration-200 group
                    ${isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}>

                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-8
                        bg-gradient-to-b from-indigo-500
                        to-purple-500 rounded-r-full"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.2 }} />
                  )}

                  <div className={`transition-transform
                    duration-200 group-hover:scale-110
                    ${isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : ''}`}>
                    <Icon size={18} />
                  </div>

                  <span>{label}</span>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-auto w-1.5 h-1.5
                        rounded-full bg-indigo-500" />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── user info card ─────────────────────────── */}
        <div className="px-3 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 px-3 py-3
              rounded-xl bg-slate-50
              dark:bg-slate-800/60
              border border-slate-200
              dark:border-slate-700/50">

            {/* avatar with gradient initials */}
            <div className="w-9 h-9 rounded-xl
              bg-gradient-to-br from-indigo-500
              to-purple-600 flex items-center
              justify-center flex-shrink-0
              shadow-sm">
              <span className="text-white text-xs
                font-bold tracking-wide">
                {initials}
              </span>
            </div>

            {/* name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold
                text-slate-800 dark:text-slate-200
                truncate leading-tight">
                {truncate(displayName, 18)}
              </p>
              <p className="text-xs text-slate-400
                dark:text-slate-500 truncate
                mt-0.5 leading-tight">
                {truncate(email, 24)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── sign out ───────────────────────────────── */}
        <div className="p-3 border-t border-slate-200
          dark:border-slate-800">
          <motion.button
            onClick={logout}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3
              px-3 py-2.5 rounded-xl text-sm
              font-medium text-red-600
              dark:text-red-400 hover:bg-red-50
              dark:hover:bg-red-950/30
              transition-all duration-200 group">
            <LogOut
              size={18}
              className="transition-transform
                duration-200 group-hover:scale-110" />
            <span>Sign out</span>
          </motion.button>
        </div>

      </aside>

      {/* spacer for fixed sidebar */}
      <div className="w-64 flex-shrink-0" />
    </>
  )
}