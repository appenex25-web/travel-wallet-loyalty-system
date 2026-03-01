import { Outlet, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getApiBase } from '../lib/api'

function BackendBanner() {
  const [unreachable, setUnreachable] = useState<boolean | null>(null)
  useEffect(() => {
    const base = getApiBase()
    fetch(`${base}/health`, { method: 'GET' })
      .then((r) => (r.ok ? setUnreachable(false) : setUnreachable(true)))
      .catch(() => setUnreachable(true))
  }, [])
  if (unreachable !== true) return null
  return (
    <div
      className="px-4 py-2 text-center text-sm text-white bg-amber-600 border-b border-amber-700"
      role="alert"
    >
      Cannot reach the API at {getApiBase()}. Start the backend{' '}
      <code className="bg-black/20 px-1 rounded">npm run start:dev</code> in the{' '}
      <code className="bg-black/20 px-1 rounded">backend/</code> folder and ensure PostgreSQL is running, then refresh.
    </div>
  )
}

function LogoIcon() {
  return (
    <svg className="w-8 h-8 text-[#4FA3FF] flex-shrink-0" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 30V16" />
      <path d="M16 16c-4 0-7 3-7 7H23c0-4-3-7-7-7z" />
      <path d="M12 12c0-2 2-4 4-4s4 2 4 4M16 10v2" />
    </svg>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col app-backdrop">
      <BackendBanner />
      <header
        className="flex-shrink-0 h-[72px] flex items-center justify-between px-6 border-b border-white/30"
        style={{
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        <div className="flex items-center gap-3">
          <LogoIcon />
          <span className="text-[#4FA3FF] font-semibold text-lg tracking-tight">
            Travel Wallet
          </span>
        </div>
        <nav className="flex items-center">
          <div
            className="flex items-center rounded-full overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 2px 12px rgba(47,125,255,0.15)',
            }}
          >
            <NavLink
              to="/pos"
              className={({ isActive }) =>
                `relative px-5 py-2.5 text-sm font-medium transition-all ${
                  isActive ? 'text-white' : 'text-white/90 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-l-full"
                      style={{
                        background: 'linear-gradient(180deg, #4FA3FF 0%, #2F7DFF 100%)',
                        boxShadow: '0 2px 10px rgba(47,125,255,0.45)',
                      }}
                    />
                  )}
                  <span className="relative z-10">POS</span>
                </>
              )}
            </NavLink>
            <div className="w-9 h-9 rounded-full flex-shrink-0 mx-0.5 border-2 border-white/50 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)' }}>
              <span className="text-white text-xs font-medium">?</span>
            </div>
            <NavLink
              to="/admin"
              end={false}
              className={({ isActive }) =>
                `relative px-5 py-2.5 text-sm font-medium transition-all ${
                  isActive ? 'text-white' : 'text-white/95 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-r-full"
                      style={{
                        background: 'linear-gradient(180deg, #4FA3FF 0%, #2F7DFF 100%)',
                        boxShadow: '0 2px 10px rgba(47,125,255,0.45)',
                      }}
                    />
                  )}
                  <span className="relative z-10">Admin</span>
                </>
              )}
            </NavLink>
          </div>
        </nav>
      </header>
      <main className="flex-1 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
