import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { register } from '../api/auth'
import { useAuthStore } from '../store/useAuthStore'
import { Eye, EyeOff, User, Mail, Lock, Sparkles, TrendingUp, Shield, Brain, CheckCircle, XCircle } from 'lucide-react'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const setAuth = useAuthStore((s) => s.login)
  const nav     = useNavigate()

  //  strength logic
  const getPasswordStrength = (pwd) => {
    let score = 0
    if (!pwd) return { score: 0, label: '', color: '', bgGradient: '' }

    if (pwd.length >= 6) score += 20
    if (pwd.length >= 8) score += 10
    if (pwd.length >= 12) score += 10
    if (/[A-Z]/.test(pwd)) score += 20
    if (/[a-z]/.test(pwd)) score += 10
    if (/[0-9]/.test(pwd)) score += 20
    if (/[^A-Za-z0-9]/.test(pwd)) score += 10

    score = Math.min(score, 100)

    if (score < 40) return { score, label: 'Weak', color: 'bg-red-500', bgGradient: 'from-red-500 to-red-600' }
    if (score < 70) return { score, label: 'Medium', color: 'bg-yellow-400', bgGradient: 'from-yellow-400 to-yellow-500' }
    return { score, label: 'Strong', color: 'bg-green-500', bgGradient: 'from-green-500 to-green-600' }
  }

  // Password requirements checklist
  const getPasswordRequirements = (pwd) => {
    return {
      length: pwd.length >= 6,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    }
  }

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required.'
    if (!email.trim()) return 'Email is required.'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Invalid email address.'

    if (!password) return 'Password is required.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (!/[A-Z]/.test(password)) return 'Include at least 1 uppercase letter.'
    if (!/[0-9]/.test(password)) return 'Include at least 1 number.'

    if (password !== confirmPassword) return 'Passwords do not match.'

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data } = await register(fullName, email, password )
      setAuth({ token: data.token, email: data.email, fullName : data.fullName, userId: data.userId })
      nav('/dashboard')
    } catch {
      setError('Email exists ! . Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength(password)
  const requirements = getPasswordRequirements(password)

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      {/* Left Panel */}
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
                Join FinSight and<br />take control of<br />your finances
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

      {/* Right Form */}
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
                Create your account
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Start your journey with FinSight
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
              {/* Full Name */}
              <div>
                <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="input pl-10 hover:border-indigo-300 transition-colors"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ali Khan"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="input pl-10 hover:border-indigo-300 transition-colors"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ali@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="input pl-10 pr-10 hover:border-indigo-300 transition-colors"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength Meter */}
                {password && (
                  <div className="mt-3">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${strength.score}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-2 bg-gradient-to-r ${strength.bgGradient} rounded-full`}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Password strength</span>
                      <span className={`text-xs font-semibold ${
                        strength.label === 'Weak' ? 'text-red-500' :
                        strength.label === 'Medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {strength.label}
                      </span>
                    </div>

                    {/* Password Requirements Checklist */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        {requirements.length ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <XCircle size={12} className="text-slate-400" />
                        )}
                        <span className={`text-xs ${
                          requirements.length ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          At least 6 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {requirements.uppercase ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <XCircle size={12} className="text-slate-400" />
                        )}
                        <span className={`text-xs ${
                          requirements.uppercase ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          At least 1 uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {requirements.number ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <XCircle size={12} className="text-slate-400" />
                        )}
                        <span className={`text-xs ${
                          requirements.number ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          At least 1 number
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="input pl-10 pr-10 hover:border-indigo-300 transition-colors"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <div className="flex items-center gap-2">
                      {password === confirmPassword ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )}
                      <p className={`text-xs ${
                        password === confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                      }`}>
                        {password === confirmPassword
                          ? 'Passwords match'
                          : 'Passwords do not match'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  required
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  I agree to the{' '}
                  <Link to="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </div>

              {/* Submit */}
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
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </motion.button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}