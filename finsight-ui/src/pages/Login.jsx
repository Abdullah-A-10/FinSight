import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, LogIn, Sparkles, Eye, EyeOff, TrendingUp, Shield, Brain } from 'lucide-react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const setAuth = useAuthStore((s) => s.login)
  const nav     = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const { data } = await login(email, password)
      setAuth({ token: data.token, email: data.email, fullName : data.fullName,
                userId: data.userID })
      nav('/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 text-white relative overflow-hidden">
        
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-10 rounded-full -ml-40 -mb-40" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white opacity-5 rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold">FinSight</div>
          </div>
          
          <div className="space-y-8">
            <div>
              <p className="text-5xl font-bold leading-tight mb-6">
                See your financial<br />future at a glance
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-brand-100">
                  <div className="bg-white/20 rounded-lg p-1.5">
                    <TrendingUp size={16} />
                  </div>
                  <span>Monte Carlo simulations</span>
                </div>
                <div className="flex items-center gap-3 text-brand-100">
                  <div className="bg-white/20 rounded-lg p-1.5">
                    <Brain size={16} />
                  </div>
                  <span>AI-powered insights</span>
                </div>
                <div className="flex items-center gap-3 text-brand-100">
                  <div className="bg-white/20 rounded-lg p-1.5">
                    <Shield size={16} />
                  </div>
                  <span>Real spending data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          <p className="text-brand-200 text-sm">
            FinSight © 2026 — Secure Financial Intelligence
          </p>
        </div>
      </div>

      {/* Right — form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                FinSight
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                Welcome back
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Sign in to your FinSight account
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 border border-red-200 dark:border-red-800"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="input pl-10 hover:border-indigo-300 transition-colors"
                    type="email"
                    placeholder="ali@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="input pl-10 pr-10 hover:border-indigo-300 transition-colors"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign in
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                No account?{' '}
                <Link to="/register"
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-colors">
                  Create one
                </Link>
              </p>
            </div>

            {/* Demo credentials hint */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Demo: demo@finsight.com / demo123
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}