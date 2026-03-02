import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useRef, useCallback, useEffect } from 'react'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCampaigns from './pages/admin/AdminCampaigns'
import AdminTripCampaigns from './pages/admin/AdminTripCampaigns'
import AdminMessages from './pages/admin/AdminMessages'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail'
import AdminVouchers from './pages/admin/AdminVouchers'
import AdminRewards from './pages/admin/AdminRewards'
import AdminGiftCards from './pages/admin/AdminGiftCards'
import AdminReports from './pages/admin/AdminReports'
import AdminBookings from './pages/admin/AdminBookings'
import AdminReservations from './pages/admin/AdminReservations'
import AdminHotels from './pages/admin/AdminHotels'
import AdminFlights from './pages/admin/AdminFlights'
import LoginPage from './pages/LoginPage'
import { api } from './lib/api'
import { NavLink } from 'react-router-dom'
import {
  PosInput,
  PrimaryButton,
  POSNavBar,
} from './components/pos'

/** Glass surface: simple icy card, no internal background window. */
function GlassSurface({
  className = '',
  style,
  frostClassName = '',
  children,
}: {
  className?: string
  style?: React.CSSProperties
  frostClassName?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-white/15 border border-white/30 backdrop-blur-[28px] shadow-[0_22px_70px_rgba(47,125,255,0.20)] ${frostClassName} ${className}`}
      style={style}
    >
      <div className="relative h-full">
        {children}
      </div>
    </div>
  )
}

type CustomerSummary = {
  customer: { id: string; name: string; tier: string } | null
  balance: number
  points: number
}

const READER_HELPER_URL = 'http://localhost:31337'

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium"
      style={{
        background: 'linear-gradient(180deg, #4FA3FF 0%, #2F7DFF 100%)',
        boxShadow: '0 8px 24px rgba(47,125,255,0.4)',
      }}
    >
      {message}
    </div>
  )
}

function POSFullPage() {
  const [nfcUid, setNfcUid] = useState('')
  const [qrToken, setQrToken] = useState('')
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [walletAmount, setWalletAmount] = useState('')
  const [pointsUsed, setPointsUsed] = useState('')
  const [scanning, setScanning] = useState(false)
  const [showCustomerWindow, setShowCustomerWindow] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; phone: string | null; user?: { email: string } }[]>([])
  const [searching, setSearching] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [posBookings, setPosBookings] = useState<{ id: string; title: string | null; bookingType: string; totalAmount: number; currency: string; status: string }[]>([])
  const [posThreads, setPosThreads] = useState<{ id: string; type: string; subject: string | null; createdAt: string }[]>([])
  const seenEmptyAfterDrainRef = useRef(false)
  const lastDisplayedUidRef = useRef<string | null>(null)

  useEffect(() => {
    const cid = customerSummary?.customer?.id
    if (!cid) {
      setPosBookings([])
      setPosThreads([])
      return
    }
    api<typeof posBookings>(`/bookings?customerId=${cid}`).then(setPosBookings).catch(() => setPosBookings([]))
    api<typeof posThreads>(`/messages/threads?customerId=${cid}`).then(setPosThreads).catch(() => setPosThreads([]))
  }, [customerSummary?.customer?.id])

  const stopScanning = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setScanning(false)
  }, [])

  async function clearReaderCache() {
    try {
      await fetch(`${READER_HELPER_URL}/uid/clear`, { method: 'POST' })
    } catch (_) {}
  }

  function startScanCard() {
    stopScanning()
    setError('')
    setCustomerSummary(null)
    setShowCustomerWindow(false)
    setScanning(true)
    setNfcUid('')
    seenEmptyAfterDrainRef.current = false
    lastDisplayedUidRef.current = null
    const DRAIN_MS = 400
    const POLL_MS = 150
    const scanStartedAt = Date.now()
    ;(async () => {
      await clearReaderCache()
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${READER_HELPER_URL}/uid`)
          const data = await res.json()
          const rawUid = data?.uid
          const uid = rawUid && typeof rawUid === 'string' ? rawUid.trim() : ''
          const inDrain = Date.now() - scanStartedAt < DRAIN_MS
          if (inDrain) {
            setNfcUid('')
            return
          }
          if (!uid) {
            seenEmptyAfterDrainRef.current = true
            if (lastDisplayedUidRef.current !== null) {
              lastDisplayedUidRef.current = null
              setNfcUid('')
            }
            return
          }
          if (!seenEmptyAfterDrainRef.current) return
          if (lastDisplayedUidRef.current === uid) return
          lastDisplayedUidRef.current = uid
          stopScanning()
          setNfcUid(uid)
          setError('')
          setLoading(true)
          try {
            const result = await api<CustomerSummary>('/pos/identify/nfc', {
              method: 'POST',
              body: JSON.stringify({ tagUid: uid }),
            })
            setCustomerSummary(result)
            setShowCustomerWindow(true)
            setToast(`Identified by NFC: ${uid}`)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Identify failed')
            setCustomerSummary(null)
          } finally {
            setLoading(false)
          }
        } catch (_) {}
      }, POLL_MS)
    })()
  }

  function closeCustomerWindow() {
    setShowCustomerWindow(false)
    setCustomerSummary(null)
    setNfcUid('')
    clearReaderCache()
  }

  async function refreshSummary(customerId: string) {
    try {
      const data = await api<CustomerSummary>(`/pos/customer/${customerId}`)
      setCustomerSummary((prev) => (prev?.customer ? { ...prev, ...data } : null))
    } catch (_) {}
  }

  async function identifyNfc() {
    if (!nfcUid.trim()) return
    setError('')
    setLoading(true)
    setToast(`Identify by NFC: ${nfcUid.trim()}`)
    try {
      const data = await api<CustomerSummary>('/pos/identify/nfc', {
        method: 'POST',
        body: JSON.stringify({ tagUid: nfcUid.trim() }),
      })
      setCustomerSummary(data)
      if (data?.customer) setShowCustomerWindow(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
      setCustomerSummary(null)
    } finally {
      setLoading(false)
    }
  }

  async function searchCustomer() {
    if (!searchQuery.trim()) return
    setError('')
    setSearching(true)
    setToast('Searched')
    try {
      const list = await api<{ id: string; name: string; phone: string | null; user?: { email: string } }[]>(
        `/admin/customers?search=${encodeURIComponent(searchQuery.trim())}`
      )
      setSearchResults(list.slice(0, 10))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  async function selectCustomer(customerId: string) {
    setError('')
    setLoading(true)
    try {
      const data = await api<CustomerSummary>(`/pos/customer/${customerId}`)
      setCustomerSummary(data)
      setSearchResults([])
      setSearchQuery('')
      if (data?.customer) setShowCustomerWindow(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function identifyQr() {
    const raw = qrToken.trim()
    if (!raw) return
    setError('')
    setLoading(true)
    setToast(`Identify by QR: ${raw.slice(0, 20)}${raw.length > 20 ? '…' : ''}`)
    try {
      if (raw.startsWith('tw:cust:')) {
        const customerId = raw.slice('tw:cust:'.length)
        const data = await api<CustomerSummary>(`/pos/customer/${customerId}`)
        setCustomerSummary(data)
        if (data?.customer) setShowCustomerWindow(true)
      } else {
        const data = await api<CustomerSummary>('/pos/identify/qr', {
          method: 'POST',
          body: JSON.stringify({ token: raw }),
        })
        setCustomerSummary(data)
        if (data?.customer) setShowCustomerWindow(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Identify failed')
      setCustomerSummary(null)
    } finally {
      setLoading(false)
    }
  }

  async function applyRedemption() {
    if (!customerSummary?.customer) return
    const wallet = Number(walletAmount) || 0
    const points = Number(pointsUsed) || 0
    if (wallet <= 0 && points <= 0) {
      setError('Enter wallet amount and/or points to redeem')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api('/pos/redemptions', {
        method: 'POST',
        body: JSON.stringify({
          customerId: customerSummary.customer.id,
          walletAmount: wallet,
          pointsUsed: points,
        }),
      })
      setWalletAmount('')
      setPointsUsed('')
      setCustomerSummary((prev) =>
        prev?.customer
          ? { ...prev, balance: Number(prev.balance) - wallet, points: prev.points - points }
          : null
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Redemption failed')
    } finally {
      setLoading(false)
    }
  }

  if (showCustomerWindow && customerSummary?.customer) {
    return (
      <div className="h-screen overflow-hidden flex flex-col relative">
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: "url(/assets/bg-everest.jpg)" }}
        />
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-50/35 via-sky-200/15 to-blue-500/5" />
        <POSNavBar />
        <main className="flex-1 min-h-0 overflow-auto px-12 pt-8">
          <CustomerWindow
            summary={customerSummary}
            onClose={closeCustomerWindow}
            onRefresh={() => refreshSummary(customerSummary.customer!.id)}
            bookings={posBookings}
            threads={posThreads}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url(/assets/bg-everest.jpg)" }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-50/35 via-sky-200/15 to-blue-500/5" />
      {/* Subtle floating particles overlay - 8% opacity */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: [
            'radial-gradient(circle at 12% 18%, rgba(255,255,255,0.08) 0%, transparent 2%)',
            'radial-gradient(circle at 88% 22%, rgba(255,255,255,0.08) 0%, transparent 2%)',
            'radial-gradient(circle at 25% 75%, rgba(255,255,255,0.08) 0%, transparent 2%)',
            'radial-gradient(circle at 75% 85%, rgba(255,255,255,0.08) 0%, transparent 2%)',
            'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.08) 0%, transparent 1.5%)',
            'radial-gradient(circle at 65% 30%, rgba(255,255,255,0.08) 0%, transparent 1.5%)',
            'radial-gradient(circle at 35% 55%, rgba(255,255,255,0.08) 0%, transparent 1.5%)',
          ].join(', '),
        }}
        aria-hidden
      />
      {/* Header: 72px + glassy segmented pill */}
      <header className="flex-shrink-0 h-[72px] relative z-10 flex items-center justify-between px-12 bg-white/8 border-b border-white/30 backdrop-blur-[30px]">
        <div className="flex items-center gap-3">
          <img src="/assets/icons/logo.svg" alt="" className="w-7 h-7 flex-shrink-0" style={{ width: 28, height: 28 }} />
          <span className="text-[26px] font-bold text-[#2F7DFF]">Appenex</span>
        </div>
        <nav className="flex items-center">
          <GlassSurface className="rounded-[24px] w-[280px] h-12 p-1" frostClassName="bg-white/8">
            <div className="flex items-center w-full h-full">
              <span className="relative flex-1 flex items-center justify-center h-10 rounded-[20px] text-sm font-semibold text-white z-10">
                <span className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-[#5BB6FF] to-[#2F7DFF] shadow-[0_18px_55px_rgba(47,125,255,0.40)]" aria-hidden />
                <span className="relative z-10">POS</span>
              </span>
              <div className="w-8 h-8 mx-1 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0 z-10" style={{ background: 'linear-gradient(135deg, #94b8e0, #c5daf5)' }}>
                <span className="text-xs font-semibold text-[#0B1B3A]/70">?</span>
              </div>
              <NavLink
                to="/admin"
                end={false}
                className={({ isActive }) => `relative flex-1 flex items-center justify-center h-10 rounded-[20px] text-sm font-semibold no-underline z-10 ${isActive ? 'text-white' : 'text-[#0B1B3A]/80'}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-[#5BB6FF] to-[#2F7DFF] shadow-[0_18px_55px_rgba(47,125,255,0.40)]" aria-hidden />
                    )}
                    <span className="relative z-10">Admin</span>
                  </>
                )}
              </NavLink>
            </div>
          </GlassSurface>
        </nav>
      </header>

      {/* Content area: flex-1, allow page to scroll if needed */}
      <main className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 min-h-0 flex flex-col overflow-x-hidden px-12 pt-8">
          <div className="max-w-[1240px] mx-auto flex flex-col flex-1 min-h-0">
            <div className="max-w-[900px] mx-auto text-center pt-4 pb-6 flex-shrink-0">
              <h1 className="text-[56px] font-extrabold text-[#2F7DFF] tracking-tight m-0">
                Point of Sale
              </h1>
              <p className="text-lg font-medium text-[rgba(11,27,58,0.65)] mt-2 m-0" style={{ textShadow: '0 2px 12px rgba(255,255,255,0.35)' }}>
                Identify customer by search, NFC tap, or QR code
              </p>
            </div>

            <section
              className="pos-cards-grid grid gap-[28px] justify-center items-center flex-1 min-h-0"
              style={{ gridTemplateColumns: 'repeat(3, 320px)' }}
            >
              <div className="relative">
                <GlassSurface className="p-6" style={{ width: 320, height: 400 }}>
                  <div className="relative h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center w-full gap-5">
                      <h3 className="text-xl font-bold text-[#0B1B3A]/90 text-center mt-0 mb-0">Search customer</h3>
                      <div className="flex flex-col w-full" style={{ alignItems: 'stretch' }}>
                        <PosInput
                          value={searchQuery}
                          onChange={setSearchQuery}
                          placeholder="Name, email, or phone"
                          iconSrc="/assets/icons/search.svg"
                          onKeyDown={(e) => e.key === 'Enter' && searchCustomer()}
                        />
                        <div className="mt-5" style={{ width: '100%' }}>
                          <button
                            type="button"
                            className="relative overflow-hidden h-[46px] rounded-2xl text-white text-sm font-semibold border-none flex items-center justify-center hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ width: '100%', background: 'linear-gradient(180deg, #5BB6FF 0%, #2F7DFF 100%)', boxShadow: '0 18px 55px rgba(47,125,255,0.40)' }}
                            disabled={searching || !searchQuery.trim()}
                            onClick={searchCustomer}
                          >
                            <span className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent opacity-70 pointer-events-none" aria-hidden />
                            <span className="relative z-10">{searching ? 'Searching…' : 'Search'}</span>
                          </button>
                        </div>
                        {searchResults.length > 0 && (
                          <ul className="w-full mt-4 space-y-1 max-h-28 overflow-y-auto p-0 list-none">
                            {searchResults.map((c) => (
                              <li key={c.id}>
                                <button type="button" onClick={() => selectCustomer(c.id)} className="w-full text-left rounded-2xl px-3 py-2 text-sm bg-transparent border-none cursor-pointer text-[#0B1B3A]/90 hover:bg-white/20">
                                  {c.name} {c.user?.email ? `(${c.user.email})` : ''}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassSurface>
              </div>

              <div className="relative">
                <GlassSurface className="p-6" style={{ width: 320, height: 400 }}>
                  <div className="relative h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center w-full gap-5">
                      <h3 className="text-xl font-bold text-[#0B1B3A]/90 text-center mt-0 mb-0">Tap card (NFC UID)</h3>
                      <div className="flex flex-col w-full" style={{ alignItems: 'stretch' }}>
                        <PosInput value={nfcUid} onChange={setNfcUid} placeholder="Paste or enter NFC tag UID" />
                        <div className="mt-5 grid gap-4 items-stretch" style={{ gridTemplateColumns: '1fr 1fr', width: '100%' }}>
                          <button
                            type="button"
                            className="relative overflow-hidden h-[46px] rounded-2xl text-white text-sm font-semibold border-none flex items-center justify-center hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ width: '100%', minWidth: 0, background: 'linear-gradient(180deg, #5BB6FF 0%, #2F7DFF 100%)', boxShadow: '0 18px 55px rgba(47,125,255,0.40)' }}
                            disabled={loading || !nfcUid.trim()}
                            onClick={identifyNfc}
                          >
                            <span className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent opacity-70 pointer-events-none" aria-hidden />
                            <span className="relative z-10">Identify by NFC</span>
                          </button>
                          <button
                            type="button"
                            className="h-[46px] rounded-2xl text-[#0B1B3A] text-sm font-semibold flex items-center justify-center hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ width: '100%', minWidth: 0, background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)' }}
                            onClick={scanning ? stopScanning : startScanCard}
                            disabled={loading}
                          >
                            {scanning ? 'Cancel' : 'Scan card'}
                          </button>
                        </div>
                        <p className="mt-4 text-center text-xs text-[#0B1B3A]/50 m-0 w-full">Click &quot;Scan card&quot; then tap the card on the reader.</p>
                      </div>
                    </div>
                  </div>
                </GlassSurface>
              </div>

              <div className="relative">
                <GlassSurface className="p-6" style={{ width: 320, height: 400 }}>
                  <div className="relative h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center w-full gap-5">
                      <h3 className="text-xl font-bold text-[#0B1B3A]/90 text-center mt-0 mb-0">Scan QR token</h3>
                      <div className="flex flex-col w-full" style={{ alignItems: 'stretch' }}>
                        <PosInput value={qrToken} onChange={setQrToken} placeholder="Paste QR session token or scan code" />
                        <div className="mt-5" style={{ width: '100%' }}>
                          <button
                            type="button"
                            className="relative overflow-hidden h-[46px] rounded-2xl text-white text-sm font-semibold border-none flex items-center justify-center hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ width: '100%', background: 'linear-gradient(180deg, #5BB6FF 0%, #2F7DFF 100%)', boxShadow: '0 18px 55px rgba(47,125,255,0.40)' }}
                            disabled={loading || !qrToken.trim()}
                            onClick={identifyQr}
                          >
                            <span className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent opacity-70 pointer-events-none" aria-hidden />
                            <span className="relative z-10">Identify by QR</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassSurface>
              </div>
            </section>

            {error && <p className="text-red-300 text-center text-sm mt-4">{error}</p>}

            {customerSummary && !showCustomerWindow && (
              <GlassSurface className="p-6 mt-6 rounded-[28px] flex-shrink-0">
                <h3 className="text-xl font-bold text-[#0B1B3A]/90 text-center mb-4 m-0">Customer</h3>
                {customerSummary.customer ? (
                  <div className="text-sm text-[#0B1B3A]/85 text-center">
                    <p className="m-1"><span className="opacity-60">Name:</span> {customerSummary.customer.name}</p>
                    <p className="m-1"><span className="opacity-60">Tier:</span> {customerSummary.customer.tier}</p>
                    <p className="m-1"><span className="opacity-60">Wallet:</span> ${Number(customerSummary.balance).toFixed(2)}</p>
                    <p className="m-1"><span className="opacity-60">Points:</span> {customerSummary.points}</p>
                    <div className="mt-4 flex flex-wrap gap-4 items-center justify-center">
                      <PosInput type="number" value={walletAmount} onChange={setWalletAmount} placeholder="Wallet amount" />
                      <PosInput type="number" value={pointsUsed} onChange={setPointsUsed} placeholder="Points" />
                      <PrimaryButton onClick={applyRedemption} disabled={loading || ((!walletAmount || Number(walletAmount) <= 0) && (!pointsUsed || Number(pointsUsed) <= 0))}>
                        Apply redemption
                      </PrimaryButton>
                    </div>
                    {posBookings.length > 0 && (
                      <div className="mt-4 text-left border-t border-white/30 pt-3">
                        <p className="font-medium opacity-80 mb-1">Bookings ({posBookings.length})</p>
                        <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                          {posBookings.slice(0, 5).map((b) => (
                            <li key={b.id} className="text-xs">{b.title ?? b.bookingType} · {b.currency} {Number(b.totalAmount).toFixed(2)} · {b.status}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {posThreads.length > 0 && (
                      <div className="mt-2 text-left border-t border-white/30 pt-2">
                        <p className="font-medium opacity-80">Messages ({posThreads.length})</p>
                        <ul className="space-y-0.5 text-xs">
                          {posThreads.slice(0, 3).map((t) => (
                            <li key={t.id}>{t.type}{t.subject ? ` · ${t.subject}` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-[#0B1B3A]/70 m-0">No customer found for this tap/QR.</p>
                )}
              </GlassSurface>
            )}
          </div>
        </div>

        {/* Bottom tiles: fixed height, inside viewport */}
        <section className="flex-shrink-0 h-[120px] flex items-center justify-center gap-[22px] px-4 pb-4">
          <button type="button" onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="Name, email"]')?.focus()} className="cursor-pointer border-0 p-0">
            <GlassSurface className="relative rounded-[28px]" style={{ width: 260, height: 92 }}>
              <div className="relative h-full flex items-center justify-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#5BB6FF] to-[#2F7DFF] shadow-[0_18px_55px_rgba(47,125,255,0.40)] flex items-center justify-center">
                  <img src="/assets/icons/search.svg" alt="" className="w-6 h-6" />
                </div>
                <span className="text-base font-semibold text-[#0B1B3A]/75">Search</span>
              </div>
            </GlassSurface>
          </button>
          <button type="button" onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="NFC tag"]')?.focus()} className="cursor-pointer border-0 p-0">
            <GlassSurface className="relative rounded-[28px]" style={{ width: 260, height: 92 }}>
              <div className="relative h-full flex items-center justify-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#5BB6FF] to-[#2F7DFF] shadow-[0_18px_55px_rgba(47,125,255,0.40)] flex items-center justify-center">
                  <img src="/assets/icons/nfc.svg" alt="" className="w-6 h-6" />
                </div>
                <span className="text-base font-semibold text-[#0B1B3A]/75">NFC Tap</span>
              </div>
            </GlassSurface>
          </button>
          <button type="button" onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="QR session"]')?.focus()} className="cursor-pointer border-0 p-0">
            <GlassSurface className="relative rounded-[28px]" style={{ width: 260, height: 92 }}>
              <div className="relative h-full flex items-center justify-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#5BB6FF] to-[#2F7DFF] shadow-[0_18px_55px_rgba(47,125,255,0.40)] flex items-center justify-center">
                  <img src="/assets/icons/qr.svg" alt="" className="w-6 h-6" />
                </div>
                <span className="text-base font-semibold text-[#0B1B3A]/75">Scan QR</span>
              </div>
            </GlassSurface>
          </button>
        </section>

        {/* Footer: Emollry Creative Group */}
        <footer className="flex-shrink-0 pt-4 pb-6 text-center text-sm" style={{ color: 'rgba(11,27,58,0.75)', textShadow: '0 1px 2px rgba(255,255,255,0.2)' }}>
          <p className="font-medium m-0">A SUBSIDIARY OF THE EMOLLRY CREATIVE GROUP</p>
          <a href="https://www.emollry.com" target="_blank" rel="noopener noreferrer" className="text-[#2F7DFF] hover:underline mt-1 inline-block">
            www.emollry.com
          </a>
        </footer>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function CustomerWindow({
  summary,
  onClose,
  onRefresh,
  bookings = [],
  threads = [],
}: {
  summary: CustomerSummary
  onClose: () => void
  onRefresh: () => Promise<void>
  bookings?: { id: string; title: string | null; bookingType: string; totalAmount: number; currency: string; status: string }[]
  threads?: { id: string; type: string; subject: string | null; createdAt: string }[]
}) {
  const customer = summary.customer!
  const [addCashAmount, setAddCashAmount] = useState('')
  const [redeemCashAmount, setRedeemCashAmount] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [redeemPointsAmount, setRedeemPointsAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleAddCash() {
    const amount = Number(addCashAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await api(`/wallet/${customer.id}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount, source: 'cash' }),
      })
      setAddCashAmount('')
      setMessage(`Added $${amount.toFixed(2)}`)
      await onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRedeemCash() {
    const amount = Number(redeemCashAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (amount > summary.balance) {
      setError('Insufficient balance')
      return
    }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await api('/pos/redemptions', {
        method: 'POST',
        body: JSON.stringify({ customerId: customer.id, walletAmount: amount, pointsUsed: 0 }),
      })
      setRedeemCashAmount('')
      setMessage(`Redeemed $${amount.toFixed(2)}`)
      await onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPurchase() {
    const amount = Number(purchaseAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (amount > summary.balance) {
      setError('Insufficient balance')
      return
    }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const result = await api<{ balance: number; pointsAwarded: number }>(
        `/pos/customer/${customer.id}/purchase`,
        { method: 'POST', body: JSON.stringify({ amount }) }
      )
      setPurchaseAmount('')
      setMessage(`Purchase $${amount.toFixed(2)} — ${result.pointsAwarded} points awarded`)
      await onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRedeemPoints() {
    const points = Number(redeemPointsAmount)
    if (!Number.isFinite(points) || points <= 0) {
      setError('Enter valid points')
      return
    }
    if (points > summary.points) {
      setError('Insufficient points')
      return
    }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await api('/pos/redemptions', {
        method: 'POST',
        body: JSON.stringify({ customerId: customer.id, walletAmount: 0, pointsUsed: points }),
      })
      setRedeemPointsAmount('')
      setMessage(`Redeemed ${points} points`)
      await onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Customer</h2>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold rounded-[16px] text-white"
          style={{
            background: 'linear-gradient(180deg, #4FA3FF 0%, #2F7DFF 100%)',
            boxShadow: '0 4px 20px rgba(47,125,255,0.4)',
          }}
        >
          Close
        </button>
      </div>

      <div
        className="p-6 space-y-2 rounded-[28px] bg-white/[0.16] backdrop-blur-2xl border border-white/30"
        style={{ boxShadow: '0 20px 60px rgba(47,125,255,0.18), inset 0 1px 0 rgba(255,255,255,0.2)' }}
      >
        <p className="text-[#1e293b] font-medium text-lg">{customer.name}</p>
        <p className="text-[#64748b] text-sm">Tier: {customer.tier}</p>
      </div>

      <div
        className="p-6 rounded-[28px] bg-white/[0.16] backdrop-blur-2xl border border-white/30"
        style={{ boxShadow: '0 20px 60px rgba(47,125,255,0.18), inset 0 1px 0 rgba(255,255,255,0.2)' }}
      >
        <h3 className="text-[#64748b] text-sm font-medium mb-1">Wallet balance</h3>
        <p className="text-3xl font-bold text-[#2F7DFF]">${Number(summary.balance).toFixed(2)}</p>
        <p className="text-[#64748b] text-sm mt-1">Points: {summary.points}</p>
      </div>

      {error && <p className="text-red-300">{error}</p>}
      {message && <p className="text-emerald-200">{message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Add cash', value: addCashAmount, setValue: setAddCashAmount, onSubmit: handleAddCash, placeholder: 'Amount' },
          { title: 'Redeem cash', value: redeemCashAmount, setValue: setRedeemCashAmount, onSubmit: handleRedeemCash, placeholder: 'Amount' },
          { title: 'Add purchase', value: purchaseAmount, setValue: setPurchaseAmount, onSubmit: handleAddPurchase, placeholder: 'Amount' },
          { title: 'Redeem points', value: redeemPointsAmount, setValue: setRedeemPointsAmount, onSubmit: handleRedeemPoints, placeholder: 'Points' },
        ].map(({ title, value, setValue, onSubmit, placeholder }) => (
          <div
            key={title}
            className="p-4 space-y-2 rounded-[28px] bg-white/[0.16] backdrop-blur-2xl border border-white/30"
            style={{ boxShadow: '0 20px 60px rgba(47,125,255,0.18), inset 0 1px 0 rgba(255,255,255,0.2)' }}
          >
            <h3 className="font-semibold text-[#2F7DFF]">{title}</h3>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 rounded-[16px] bg-white/80 border border-white/50 text-[#1e293b] focus:outline-none focus:border-[#4FA3FF]"
            />
            <button
              onClick={onSubmit}
              disabled={loading}
              className="w-full py-2 text-sm font-semibold rounded-[16px] text-white disabled:opacity-50"
              style={{
                background: title === 'Redeem cash' ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(180deg, #4FA3FF 0%, #2F7DFF 100%)',
                boxShadow: title === 'Redeem cash' ? '0 4px 20px rgba(245,158,11,0.4)' : '0 4px 20px rgba(47,125,255,0.4)',
              }}
            >
              {title}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/80">
        Add purchase deducts from wallet and awards points based on admin rewards (bonus_points offer).
      </p>

      {bookings.length > 0 && (
        <div className="p-4 rounded-[28px] bg-white/[0.16] backdrop-blur-2xl border border-white/30">
          <h3 className="font-semibold text-[#2F7DFF] mb-2">Bookings ({bookings.length})</h3>
          <ul className="space-y-1 text-sm text-[#1e293b]">
            {bookings.map((b) => (
              <li key={b.id}>{b.title ?? b.bookingType} · {b.currency} {Number(b.totalAmount).toFixed(2)} · {b.status}</li>
            ))}
          </ul>
        </div>
      )}

      {threads.length > 0 && (
        <div className="p-4 rounded-[28px] bg-white/[0.16] backdrop-blur-2xl border border-white/30">
          <h3 className="font-semibold text-[#2F7DFF] mb-2">Messages ({threads.length})</h3>
          <ul className="space-y-1 text-sm text-[#1e293b]">
            {threads.map((t) => (
              <li key={t.id}>{t.type}{t.subject ? ` · ${t.subject}` : ''} · {new Date(t.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}

      <footer className="pt-6 pb-4 text-center text-sm text-white/80">
        <p className="font-medium m-0">A SUBSIDIARY OF THE EMOLLRY CREATIVE GROUP</p>
        <a href="https://www.emollry.com" target="_blank" rel="noopener noreferrer" className="text-[#2F7DFF] hover:underline mt-1 inline-block">
          www.emollry.com
        </a>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pos" element={<ProtectedRoute><POSFullPage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="campaigns" element={<AdminCampaigns />} />
            <Route path="trip-campaigns" element={<AdminTripCampaigns />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="rewards" element={<AdminRewards />} />
            <Route path="gift-cards" element={<AdminGiftCards />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="hotels" element={<AdminHotels />} />
            <Route path="flights" element={<AdminFlights />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
