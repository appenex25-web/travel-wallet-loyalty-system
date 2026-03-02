import { useState, useRef, useCallback, useEffect } from 'react'
import { api } from '../lib/api'

type CustomerSummary = {
  customer: { id: string; name: string; tier: string } | null
  balance: number
  points: number
}

type Booking = { id: string; title: string | null; bookingType: string; totalAmount: number; currency: string; status: string }
type MessageThread = { id: string; type: string; subject: string | null; createdAt: string }

const READER_HELPER_URL = 'http://localhost:31337'

/* ----- Inline SVG icons ----- */
function IconSearch() {
  return (
    <svg className="w-5 h-5 text-[#2F7DFF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function IconNFC() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}
function IconQR() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-lg"
      style={{
        background: 'linear-gradient(180deg, #4FA3FF 0%, #2F7DFF 100%)',
        boxShadow: '0 8px 24px rgba(47,125,255,0.4)',
      }}
    >
      {message}
    </div>
  )
}

export default function PosPage() {
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
  const simulateRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seenEmptyAfterDrainRef = useRef(false)
  const [posBookings, setPosBookings] = useState<Booking[]>([])
  const [posThreads, setPosThreads] = useState<MessageThread[]>([])

  useEffect(() => {
    const cid = customerSummary?.customer?.id
    if (!cid) {
      setPosBookings([])
      setPosThreads([])
      return
    }
    api<Booking[]>(`/bookings?customerId=${cid}`).then(setPosBookings).catch(() => setPosBookings([]))
    api<MessageThread[]>(`/messages/threads?customerId=${cid}`).then(setPosThreads).catch(() => setPosThreads([]))
  }, [customerSummary?.customer?.id])

  const stopScanning = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (simulateRef.current) {
      clearTimeout(simulateRef.current)
      simulateRef.current = null
    }
    setScanning(false)
  }, [])

  async function clearReaderCache() {
    try {
      await fetch(`${READER_HELPER_URL}/uid/clear`, { method: 'POST' })
    } catch (_) {}
  }

  function randomUid() {
    return Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase()
  }

  function startScanCard() {
    stopScanning()
    setError('')
    setCustomerSummary(null)
    setShowCustomerWindow(false)
    setScanning(true)
    setNfcUid('')
    seenEmptyAfterDrainRef.current = false
    const DRAIN_MS = 400
    const POLL_MS = 150
    const scanStartedAt = Date.now()
    simulateRef.current = setTimeout(() => {
      simulateRef.current = null
      setNfcUid((prev) => {
        if (prev) return prev
        const uid = randomUid()
        setToast(`Scanned: ${uid}`)
        return uid
      })
      stopScanning()
    }, 2200)
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
            return
          }
          if (!seenEmptyAfterDrainRef.current) return
          if (simulateRef.current) {
            clearTimeout(simulateRef.current)
            simulateRef.current = null
          }
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
      <CustomerWindow
        summary={customerSummary}
        onClose={closeCustomerWindow}
        onRefresh={() => refreshSummary(customerSummary.customer!.id)}
        bookings={posBookings}
        threads={posThreads}
      />
    )
  }

  return (
    <>
      <div className="max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Title area: big bold #2F7DFF, subtitle white with slight shadow */}
        <div className="text-center pt-4 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#2F7DFF', textShadow: '0 2px 12px rgba(47,125,255,0.35)' }}>
            Point of Sale
          </h1>
          <p className="text-white text-lg" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
            Identify customer by search, NFC tap, or QR code
          </p>
        </div>

        {/* 3 glass cards — gap ~28px, radial glow behind each */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 flex-1">
          {/* Card A: Search customer */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-[32px] bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(79,163,255,0.2),transparent_70%)] pointer-events-none" aria-hidden />
            <div className="glass-card-pos p-6 flex flex-col space-y-4 relative z-10 ring-1 ring-white/10">
              <h3 className="font-semibold text-[#2F7DFF] text-lg">Search customer</h3>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconSearch />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchCustomer()}
                  placeholder="Name, email, or phone"
                  className="input-pos w-full pl-10 pr-4 py-3 rounded-[16px]"
                />
              </div>
              <button
                onClick={searchCustomer}
                disabled={searching || !searchQuery.trim()}
                className="btn-pos-primary w-full py-3 text-sm rounded-[16px]"
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
              {searchResults.length > 0 && (
                <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                  {searchResults.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => selectCustomer(c.id)}
                        className="w-full text-left rounded-[16px] px-3 py-2 text-sm text-[#1e293b] hover:bg-white/30 transition"
                      >
                        {c.name} {c.user?.email ? `(${c.user.email})` : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Card B: Tap card (NFC UID) */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-[32px] bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(79,163,255,0.2),transparent_70%)] pointer-events-none" aria-hidden />
            <div className="glass-card-pos p-6 flex flex-col space-y-4 relative z-10 ring-1 ring-white/10">
              <h3 className="font-semibold text-[#2F7DFF] text-lg">Tap card (NFC UID)</h3>
              <input
                type="text"
                value={nfcUid}
                onChange={(e) => setNfcUid(e.target.value)}
                placeholder="Paste or enter NFC tag UID"
                className="input-pos w-full px-4 py-3 rounded-[16px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={identifyNfc}
                  disabled={loading || !nfcUid.trim()}
                  className="btn-pos-primary flex-1 py-3 text-sm rounded-[16px]"
                >
                  Identify by NFC
                </button>
                <button
                  type="button"
                  onClick={scanning ? stopScanning : startScanCard}
                  disabled={loading}
                  className="rounded-[16px] px-4 py-3 text-sm font-medium border border-white/60 text-white bg-white/15 hover:bg-white/25 transition disabled:opacity-50"
                >
                  {scanning ? 'Cancel' : 'Scan card'}
                </button>
              </div>
              <p className="text-xs text-white/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Click &quot;Scan card&quot; then tap the card on the reader.</p>
            </div>
          </div>

          {/* Card C: Scan QR token */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-[32px] bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(79,163,255,0.2),transparent_70%)] pointer-events-none" aria-hidden />
            <div className="glass-card-pos p-6 flex flex-col space-y-4 relative z-10 ring-1 ring-white/10">
              <h3 className="font-semibold text-[#2F7DFF] text-lg">Scan QR token</h3>
              <input
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Paste QR session token or scan code"
                className="input-pos w-full px-4 py-3 rounded-[16px]"
              />
              <button
                onClick={identifyQr}
                disabled={loading || !qrToken.trim()}
                className="btn-pos-primary w-full py-3 text-sm rounded-[16px]"
              >
                Identify by QR
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-center text-sm mt-4 font-medium">{error}</p>}

        {customerSummary && !showCustomerWindow && (
          <div className="relative mt-6">
            <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(79,163,255,0.15),transparent_70%)] pointer-events-none -z-10 scale-95" aria-hidden />
            <div className="glass-card-pos p-6 mt-6 ring-1 ring-white/10 relative z-10">
            <h3 className="font-semibold text-[#2F7DFF] mb-4 text-center">Customer</h3>
            {customerSummary.customer ? (
              <div className="space-y-2 text-[#1e293b] text-sm">
                <p><span className="text-[#64748b]">Name:</span> {customerSummary.customer.name}</p>
                <p><span className="text-[#64748b]">Tier:</span> {customerSummary.customer.tier}</p>
                <p><span className="text-[#64748b]">Wallet:</span> ${Number(customerSummary.balance).toFixed(2)}</p>
                <p><span className="text-[#64748b]">Points:</span> {customerSummary.points}</p>
                <div className="mt-4 flex flex-wrap gap-4 items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Wallet amount"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    className="input-pos w-32 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Points"
                    value={pointsUsed}
                    onChange={(e) => setPointsUsed(e.target.value)}
                    className="input-pos w-24 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={applyRedemption}
                    disabled={loading || ((!walletAmount || Number(walletAmount) <= 0) && (!pointsUsed || Number(pointsUsed) <= 0))}
                    className="btn-pos-primary px-4 py-2 text-sm"
                  >
                    Apply redemption
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-white/90 text-center">No customer found for this tap/QR.</p>
            )}
            </div>
          </div>
        )}

        {/* Bottom quick actions: 3 floating glass tiles */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 pb-4">
          <button
            type="button"
            onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="Name, email"]')?.focus()}
            className="glass-tile-pos flex flex-col items-center justify-center w-28 h-24 md:w-32 md:h-28 text-white transition"
          >
            <IconSearch />
            <span className="text-sm font-medium mt-2">Search</span>
          </button>
          <button
            type="button"
            onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="NFC tag"]')?.focus()}
            className="glass-tile-pos flex flex-col items-center justify-center w-28 h-24 md:w-32 md:h-28 text-white transition"
          >
            <IconNFC />
            <span className="text-sm font-medium mt-2">NFC Tap</span>
          </button>
          <button
            type="button"
            onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="QR session"]')?.focus()}
            className="glass-tile-pos flex flex-col items-center justify-center w-28 h-24 md:w-32 md:h-28 text-white transition"
          >
            <IconQR />
            <span className="text-sm font-medium mt-2">Scan QR</span>
          </button>
        </div>

        {/* Footer: Emollry Creative Group */}
        <footer className="mt-auto pt-6 pb-8 text-center text-white/80 text-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
          <p className="font-medium">A SUBSIDIARY OF THE EMOLLRY CREATIVE GROUP</p>
          <a href="https://www.emollry.com" target="_blank" rel="noopener noreferrer" className="text-[#2F7DFF] hover:underline mt-1 inline-block">
            www.emollry.com
          </a>
        </footer>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
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
  bookings?: Booking[]
  threads?: MessageThread[]
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
        <h2 className="text-2xl font-bold text-[#2F7DFF]">Customer</h2>
        <button type="button" onClick={onClose} className="btn-pos-primary px-4 py-2 text-sm rounded-[16px]">
          Close
        </button>
      </div>

      <div className="glass-card-pos p-6 space-y-2 ring-1 ring-white/10">
        <p className="text-[#1e293b] font-medium text-lg">{customer.name}</p>
        <p className="text-[#64748b] text-sm">Tier: {customer.tier}</p>
      </div>

      <div className="glass-card-pos p-6 ring-1 ring-white/10">
        <h3 className="text-[#64748b] text-sm font-medium mb-1">Wallet balance</h3>
        <p className="text-3xl font-bold text-[#2F7DFF]">${Number(summary.balance).toFixed(2)}</p>
        <p className="text-[#64748b] text-sm mt-1">Points: {summary.points}</p>
      </div>

      {error && <p className="text-red-300">{error}</p>}
      {message && <p className="text-emerald-200">{message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card-pos p-4 space-y-2 ring-1 ring-white/10">
          <h3 className="font-semibold text-[#2F7DFF]">Add cash</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={addCashAmount}
            onChange={(e) => setAddCashAmount(e.target.value)}
            className="input-pos w-full px-3 py-2"
          />
          <button onClick={handleAddCash} disabled={loading} className="btn-pos-primary w-full py-2 text-sm">
            Add cash
          </button>
        </div>
        <div className="glass-card-pos p-4 space-y-2 ring-1 ring-white/10">
          <h3 className="font-semibold text-[#2F7DFF]">Redeem cash</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={redeemCashAmount}
            onChange={(e) => setRedeemCashAmount(e.target.value)}
            className="input-pos w-full px-3 py-2"
          />
          <button onClick={handleRedeemCash} disabled={loading} className="btn-pos-primary w-full py-2 text-sm bg-amber-500/90 hover:bg-amber-500">
            Redeem cash
          </button>
        </div>
        <div className="glass-card-pos p-4 space-y-2 ring-1 ring-white/10">
          <h3 className="font-semibold text-[#2F7DFF]">Add purchase</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            className="input-pos w-full px-3 py-2"
          />
          <button onClick={handleAddPurchase} disabled={loading} className="btn-pos-primary w-full py-2 text-sm">
            Add purchase
          </button>
        </div>
        <div className="glass-card-pos p-4 space-y-2 ring-1 ring-white/10">
          <h3 className="font-semibold text-[#2F7DFF]">Redeem points</h3>
          <input
            type="number"
            min="0"
            placeholder="Points"
            value={redeemPointsAmount}
            onChange={(e) => setRedeemPointsAmount(e.target.value)}
            className="input-pos w-full px-3 py-2"
          />
          <button onClick={handleRedeemPoints} disabled={loading} className="btn-pos-primary w-full py-2 text-sm">
            Redeem points
          </button>
        </div>
      </div>
      <p className="text-xs text-[#64748b]">
        Add purchase deducts from wallet and awards points based on admin rewards (bonus_points offer).
      </p>

      {bookings.length > 0 && (
        <div className="glass-card-pos p-4 ring-1 ring-white/10 text-left">
          <h3 className="font-semibold text-[#2F7DFF] mb-2">Bookings ({bookings.length})</h3>
          <ul className="space-y-1 text-sm text-[#1e293b]">
            {bookings.map((b) => (
              <li key={b.id}>{b.title ?? b.bookingType} · {b.currency} {Number(b.totalAmount).toFixed(2)} · {b.status}</li>
            ))}
          </ul>
        </div>
      )}

      {threads.length > 0 && (
        <div className="glass-card-pos p-4 ring-1 ring-white/10 text-left">
          <h3 className="font-semibold text-[#2F7DFF] mb-2">Messages ({threads.length})</h3>
          <ul className="space-y-1 text-sm text-[#1e293b]">
            {threads.map((t) => (
              <li key={t.id}>{t.type}{t.subject ? ` · ${t.subject}` : ''} · {new Date(t.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
