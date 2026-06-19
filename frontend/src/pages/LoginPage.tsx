import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { Zap, Loader2, Mail, Lock } from 'lucide-react'
import api from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  // Forgot-password state
  const [showForgot, setShowForgot]       = useState(false)
  const [forgotEmail, setForgotEmail]     = useState('')
  const [forgotSent, setForgotSent]       = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const login    = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail })
      setForgotSent(true)
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen animate-mesh-gradient flex items-center justify-center p-6 relative overflow-hidden bg-grid-pattern">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
            className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-200"
          >
            <Zap className="w-8 h-8 text-white fill-white/10" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-extrabold text-slate-900 tracking-tight"
          >
            ChatPlatform
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-slate-500 text-sm mt-1.5 font-medium"
          >
            {showForgot ? 'Reset your account password' : 'Sign in to access your dashboard'}
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
          className="glass-panel rounded-3xl p-8 shadow-xl shadow-indigo-950/5 border border-slate-200/60"
        >
          <AnimatePresence mode="wait">
            {showForgot ? (
              forgotSent ? (
                <motion.div 
                  key="forgot-sent"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-center space-y-4 py-4"
                >
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    If that account exists, a temporary password reset link has been dispatched to your inbox.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail('') }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Back to sign in
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form 
                  key="forgot-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleForgot} 
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        autoFocus
                        className="w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder-slate-400"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all"
                  >
                    {forgotLoading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                    Send reset link
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="w-full text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Back to sign in
                  </button>
                </motion.form>
              )
            ) : (
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmit} 
                className="space-y-5"
              >
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50/80 border border-red-200 text-red-700 text-sm rounded-xl p-3.5 font-medium"
                  >
                    {error}
                  </motion.div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder-slate-400"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder-slate-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all"
                >
                  {loading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                  Sign in
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {!showForgot && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-slate-500 mt-6 font-medium"
          >
            Don't have an account yet?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
              Sign up
            </Link>
          </motion.p>
        )}
      </div>
    </div>
  )
}

