import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiBase } from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agent, setAgent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const base = getApiBase()
      const url = agent ? `${base}/auth/agent/login` : `${base}/auth/login`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { message?: string }).message || 'Login failed')
        return
      }
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/')
    } catch (err) {
      const msg =
        err instanceof TypeError && (err.message === 'Failed to fetch' || err.message === 'Load failed')
          ? `Cannot reach the API at ${getApiBase()}. Start the backend (npm run start:dev in backend/) and ensure PostgreSQL is running.`
          : err instanceof Error
            ? err.message
            : 'Network or server error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-backdrop p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 md:p-10 shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-[var(--travel-deep)] tracking-tight mb-1">Travel Wallet</h1>
        <p className="text-[var(--travel-muted)] text-sm mb-8">Travel agent portal</p>
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-sm font-medium text-[var(--travel-text)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--travel-card-border)] bg-white/80 px-4 py-2.5 text-[var(--travel-text)] placeholder-[var(--travel-muted)] focus:border-[var(--travel-deep)] focus:ring-2 focus:ring-[var(--travel-deep)]/20 transition"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--travel-text)] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--travel-card-border)] bg-white/80 px-4 py-2.5 text-[var(--travel-text)] placeholder-[var(--travel-muted)] focus:border-[var(--travel-deep)] focus:ring-2 focus:ring-[var(--travel-deep)]/20 transition"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-[var(--travel-muted)] text-sm">
            <input type="checkbox" checked={agent} onChange={(e) => setAgent(e.target.checked)} className="rounded border-[var(--travel-deep)] text-[var(--travel-deep)]" />
            Agent / Admin login
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--travel-warm)] text-white font-semibold py-3 hover:bg-[var(--travel-warm-light)] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
