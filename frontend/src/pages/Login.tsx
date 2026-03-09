import { useState } from 'react'
import type { FormEvent } from 'react'
import { signIn } from '../lib/auth-client'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useSessionContext } from '../contexts/SessionContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { setSession } = useSessionContext()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn.email({ email, password })
    if (result.error) {
      setError(result.error.message || 'Login failed')
    } else {
      setSession(result.data)
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#1e1e1e' }}
    >
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(0,122,204,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,122,204,0.04) 0%, transparent 50%)' }} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full blur-3xl animate-pulse" style={{ top: '20%', left: '15%', width: '380px', height: '380px', background: 'rgba(0,122,204,0.08)' }} />
        <div className="absolute rounded-full blur-3xl animate-pulse" style={{ bottom: '20%', right: '15%', width: '340px', height: '340px', background: 'rgba(0,122,204,0.06)', animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-sm relative z-10" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.6))' }}>
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-4"
          style={{ backgroundColor: '#323233', borderRadius: '8px 8px 0 0', height: '32px', borderBottom: '1px solid #3c3c3c' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#febc2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28c840' }} />
          </div>
          <span className="text-xs" style={{ color: '#858585', fontFamily: 'monospace' }}>HR-Sense — sign-in.ts</span>
          <div className="w-12" />
        </div>

        {/* Editor panel */}
        <div style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          {/* Tab bar */}
          <div style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid #3c3c3c', display: 'flex', alignItems: 'stretch' }}>
            <div
              className="flex items-center gap-2 px-4 py-2 text-xs"
              style={{ color: '#cccccc', borderBottom: '1px solid #007acc', backgroundColor: '#1e1e1e', fontFamily: 'monospace' }}
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              sign-in.ts
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl leading-none">HR-Sense</p>
                  <p className="text-xs mt-0.5" style={{ color: '#858585' }}>Powered by EverSense</p>
                </div>
              </div>
              <p className="text-sm font-medium mt-1" style={{ color: '#858585' }}>Welcome back</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-medium" style={{ color: '#9cdcfe', fontFamily: 'monospace' }}>
                  // identifier
                </label>
                <input
                  type="email" id="email" placeholder="user@company.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 text-sm outline-none transition-colors"
                  style={{ backgroundColor: '#3c3c3c', border: '1px solid #3c3c3c', borderRadius: '4px', color: '#cccccc', fontFamily: 'monospace' }}
                  onFocus={e => (e.target.style.borderColor = '#007acc')}
                  onBlur={e => (e.target.style.borderColor = '#3c3c3c')}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-medium" style={{ color: '#9cdcfe', fontFamily: 'monospace' }}>
                  // password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} id="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full px-3 py-2 pr-10 text-sm outline-none transition-colors"
                    style={{ backgroundColor: '#3c3c3c', border: '1px solid #3c3c3c', borderRadius: '4px', color: '#cccccc', fontFamily: 'monospace' }}
                    onFocus={e => (e.target.style.borderColor = '#007acc')}
                    onBlur={e => (e.target.style.borderColor = '#3c3c3c')}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#858585' }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = '#cccccc')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = '#858585')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="px-3 py-2 text-xs rounded"
                  style={{ backgroundColor: 'rgba(244,71,71,0.1)', border: '1px solid rgba(244,71,71,0.3)', color: '#f47171', fontFamily: 'monospace' }}
                >
                  ✗ {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-2 text-sm font-medium transition-all duration-200"
                style={{ backgroundColor: loading ? '#0a4d7a' : '#0e639c', color: '#ffffff', border: '1px solid #1177bb', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'monospace' }}
                onMouseEnter={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#1177bb') }}
                onMouseLeave={e => { if (!loading) (e.currentTarget.style.backgroundColor = '#0e639c') }}
              >
                {loading ? '▶ Signing in...' : '▶ Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-between px-3 text-xs"
          style={{ backgroundColor: '#007acc', color: '#ffffff', height: '22px', borderRadius: '0 0 8px 8px', fontFamily: 'monospace' }}
        >
          <span>⎇ main</span>
          <span>HR-Sense v1.0</span>
        </div>
      </div>
    </div>
  )
}
