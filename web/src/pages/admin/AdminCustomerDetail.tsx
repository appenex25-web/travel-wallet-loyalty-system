import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../lib/api'

const READER_URL = 'http://localhost:31337'

type Customer = { id: string; name: string; phone: string | null; status: string; tier: string; user?: { email: string }; nfcIdentifiers?: { id: string; tagUid: string; label: string | null }[] }
type Booking = { id: string; title: string | null; bookingType: string; totalAmount: number; currency: string; status: string; createdAt: string }
type MessageThread = { id: string; type: string; subject: string | null; createdAt: string; messages?: { id: string; sender: string; body: string; createdAt: string }[] }

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [nfcUid, setNfcUid] = useState('')
  const [nfcLabel, setNfcLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linking, setLinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [readerStatus, setReaderStatus] = useState<'idle' | 'listening' | 'no_card' | 'detected' | 'unavailable'>('idle')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastDisplayedUidRef = useRef<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [resettingPin, setResettingPin] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setNfcUid('')
    setNfcLabel('')
    setError('')
    setReaderStatus('idle')
    setListening(false)
    setSelectedThread(null)
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    fetch(`${READER_URL}/uid/clear`, { method: 'POST' }).catch(() => {})
    api<Customer>(`/customers/${id}`)
      .then((c) => {
        setCustomer(c)
        return api<{ payload: string }>(`/customers/${id}/qr-payload`)
      })
      .then((r) => setQrPayload(r.payload))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !customer) return
    api<Booking[]>(`/bookings?customerId=${id}`).then(setBookings).catch(() => setBookings([]))
    api<MessageThread[]>(`/messages/threads?customerId=${id}`).then(setThreads).catch(() => setThreads([]))
  }, [id, customer])

  async function loadThread(threadId: string) {
    try {
      const t = await api<MessageThread>(`/messages/threads/${threadId}/messages`)
      setSelectedThread(t)
      setReplyBody('')
    } catch {
      setSelectedThread(null)
    }
  }

  async function sendReply() {
    if (!selectedThread || !replyBody.trim()) return
    setSendingReply(true)
    try {
      await api(`/messages/threads/${selectedThread.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: replyBody.trim() }),
      })
      setReplyBody('')
      await loadThread(selectedThread.id)
    } finally {
      setSendingReply(false)
    }
  }

  async function resetPin() {
    if (!id || !confirm('Reset this customer’s security PIN? They will need to set a new one on next use.')) return
    setResettingPin(true)
    try {
      await api(`/admin/customers/${id}/reset-pin`, { method: 'POST' })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset PIN failed')
    } finally {
      setResettingPin(false)
    }
  }

  const stopScanning = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setListening(false)
    setNfcUid('')
    setReaderStatus('idle')
  }, [])

  function startScanCard() {
    stopScanning()
    setError('')
    setNfcUid('')
    setReaderStatus('listening')
    setListening(true)
    lastDisplayedUidRef.current = null
    const DRAIN_MS = 400
    const POLL_MS = 150
    const scanStartedAt = Date.now()
    ;(async () => {
      try {
        await fetch(`${READER_URL}/uid/clear`, { method: 'POST' })
      } catch (_) {}
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${READER_URL}/uid`)
          const data = await res.json()
          const rawUid = data?.uid
          const uid = rawUid && typeof rawUid === 'string' ? rawUid.trim() : ''
          const inDrain = Date.now() - scanStartedAt < DRAIN_MS
          if (inDrain) {
            setNfcUid('')
            setReaderStatus('no_card')
            return
          }
          if (uid) {
            if (lastDisplayedUidRef.current !== uid) {
              lastDisplayedUidRef.current = uid
              setNfcUid(uid)
              setReaderStatus('detected')
            }
          } else if (lastDisplayedUidRef.current === null) {
            setNfcUid('')
            setReaderStatus('no_card')
          }
        } catch (_) {
          setReaderStatus('unavailable')
        }
      }, POLL_MS)
    })()
  }

  async function linkNfc() {
    if (!id || !nfcUid.trim()) return
    setError('')
    setLinking(true)
    try {
      await api(`/customers/${id}/nfc-identifiers`, {
        method: 'POST',
        body: JSON.stringify({ tagUid: nfcUid.trim(), label: nfcLabel.trim() || undefined }),
      })
      setNfcUid('')
      setNfcLabel('')
      const c = await api<Customer>(`/customers/${id}`)
      setCustomer(c)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link card')
    } finally {
      setLinking(false)
    }
  }

  if (loading || !customer) return <p className="text-[var(--travel-muted)]">Loading…</p>
  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/customers" className="text-[var(--travel-muted)] hover:text-[var(--travel-deep)] text-sm">← Customers</Link>
      </div>
      <h1 className="text-3xl font-bold text-[var(--travel-deep)] mb-6 text-center">{customer.name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--travel-card-border)] p-6 bg-white/90">
          <h2 className="font-semibold text-[var(--travel-text)] mb-4">Attach NFC card</h2>
          <p className="text-sm text-[var(--travel-muted)] mb-3">Scan the card with your ACR122U reader to link it to this customer. Ensure the card reader helper is running (see below).</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              onClick={listening ? stopScanning : startScanCard}
              className={`rounded-xl px-4 py-2 font-medium ${listening ? 'bg-amber-500 text-white' : 'bg-[var(--travel-deep)] text-white hover:bg-[var(--travel-deep-hover)]'}`}
            >
              {listening ? 'Cancel' : 'Scan card'}
            </button>
            {readerStatus === 'detected' && <span className="text-emerald-600 font-medium self-center">Card on reader — click Link card below</span>}
            {readerStatus === 'no_card' && <span className="text-[var(--travel-muted)] font-medium self-center">No card on reader</span>}
            {readerStatus === 'unavailable' && (
              <span className="text-amber-600 text-sm self-center">
                Reader helper not reachable. If you installed <strong>Travel Wallet NFC Reader</strong>, make sure it is <strong>running</strong> (check the system tray). Otherwise start it (see below).
              </span>
            )}
          </div>
          <input
            type="text"
            value={nfcUid}
            onChange={(e) => setNfcUid(e.target.value)}
            placeholder="UID will appear after scan, or paste manually"
            className="w-full rounded-xl border border-[var(--travel-card-border)] px-3 py-2 mb-2 bg-white text-[var(--travel-text)] placeholder-[var(--travel-muted)]"
          />
          <input
            type="text"
            value={nfcLabel}
            onChange={(e) => setNfcLabel(e.target.value)}
            placeholder="Optional label"
            className="w-full rounded-xl border border-[var(--travel-card-border)] px-3 py-2 mb-3 bg-white text-[var(--travel-text)] placeholder-[var(--travel-muted)]"
          />
          <button type="button" onClick={linkNfc} disabled={linking || !nfcUid.trim()} className="rounded-xl bg-[var(--travel-warm)] text-white px-4 py-2 hover:bg-[var(--travel-warm-light)] disabled:opacity-50">
            {linking ? 'Linking…' : 'Link card'}
          </button>
          <p className="text-xs text-[var(--travel-muted)] mt-3">
            <strong>Installed the tray app?</strong> Launch <strong>Travel Wallet NFC Reader</strong> from the Start Menu (or check the system tray). It must be running on this PC. <a href="http://localhost:31337/uid" target="_blank" rel="noopener noreferrer" className="text-[var(--travel-deep)] underline">Test reader</a> (opens in new tab; you should see <code className="bg-[var(--travel-cream)] px-1 rounded">{`{"uid":null}`}</code>).<br />
            <strong>Using Node.js?</strong> In the <code className="bg-[var(--travel-cream)] px-1 rounded">pos-reader</code> folder run <code className="bg-[var(--travel-cream)] px-1 rounded">npm run start:reader</code> (or <code className="bg-[var(--travel-cream)] px-1 rounded">npm start</code>).
          </p>
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-2">Reader still not reachable? Link the card by pasting the UID:</p>
            <ol className="text-xs text-amber-900 list-decimal list-inside space-y-1">
              <li>Make sure <strong>Travel Wallet NFC Reader</strong> (tray app) is running on this PC.</li>
              <li>Open <a href="http://localhost:31337/uid" target="_blank" rel="noopener noreferrer" className="text-[var(--travel-deep)] underline font-medium">http://localhost:31337/uid</a> in a <strong>new tab</strong>. You should see something like <code className="bg-white/80 px-1 rounded">{`{"uid":null}`}</code>.</li>
              <li>Tap the NFC card. You need the <strong>VB bridge</strong> or reader app running so the UID is sent to the helper; then refresh the /uid tab and the UID will appear, e.g. <code className="bg-white/80 px-1 rounded">{`{"uid":"04a1b2c3d4e5f6"}`}</code>. Or run <code className="bg-white/80 px-1 rounded">npm run set-uid</code> in the pos-reader folder and paste the UID from your reader app.</li>
              <li>Copy the UID value (e.g. <code className="bg-white/80 px-1 rounded">04a1b2c3d4e5f6</code>), paste it into the &quot;UID will appear after scan, or paste manually&quot; box above, then click <strong>Link card</strong>.</li>
            </ol>
            <p className="text-xs text-amber-800 mt-2">Or run the app locally: in the project run <code className="bg-white/80 px-1 rounded">cd web &amp;&amp; npm run dev</code>, open <strong>http://localhost:5173</strong>, log in and use Attach NFC card here — Scan card will work from that page.</p>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {customer.nfcIdentifiers && customer.nfcIdentifiers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-[var(--travel-text)]">Linked cards</p>
              <ul className="mt-1 text-sm text-[var(--travel-muted)]">
                {customer.nfcIdentifiers.map((n) => (
                  <li key={n.id}>{n.tagUid} {n.label ? `(${n.label})` : ''}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-[var(--travel-card-border)] p-6 bg-white/90 text-center">
          <h2 className="font-semibold text-[var(--travel-text)] mb-4">Customer QR code</h2>
          <p className="text-sm text-[var(--travel-muted)] mb-3">Scan this QR at POS to identify this customer. You can print or save this for the client.</p>
          {qrPayload && (
            <div className="inline-flex flex-col items-center p-4 bg-white rounded-xl border border-[var(--travel-card-border)]">
              <QRCodeSVG value={qrPayload} size={200} level="M" />
              <p className="text-xs text-[var(--travel-muted)] mt-2 font-mono">{qrPayload}</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-[var(--travel-card-border)] p-4 bg-white/90 text-center flex flex-wrap items-center justify-center gap-4">
        <p className="text-sm text-[var(--travel-muted)]"><strong>Email:</strong> {customer.user?.email ?? '—'} · <strong>Phone:</strong> {customer.phone ?? '—'} · <strong>Tier:</strong> {customer.tier}</p>
        <button
          type="button"
          onClick={resetPin}
          disabled={resettingPin}
          className="rounded-xl px-4 py-2 text-sm font-medium bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 disabled:opacity-50"
        >
          {resettingPin ? 'Resetting…' : 'Reset PIN'}
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--travel-card-border)] p-6 bg-white/90">
        <h2 className="font-semibold text-[var(--travel-text)] mb-4">Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-[var(--travel-muted)]">No bookings.</p>
        ) : (
          <ul className="space-y-2">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[var(--travel-text)]">{b.title ?? b.bookingType}</span>
                <span className="text-[var(--travel-muted)]">{b.currency} {Number(b.totalAmount).toFixed(2)}</span>
                <span className="text-[var(--travel-muted)]">{b.status}</span>
                <span className="text-[var(--travel-muted)]">{new Date(b.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--travel-card-border)] p-6 bg-white/90">
        <h2 className="font-semibold text-[var(--travel-text)] mb-4">Messages</h2>
        {!selectedThread ? (
          <>
            {threads.length === 0 ? (
              <p className="text-sm text-[var(--travel-muted)]">No message threads.</p>
            ) : (
              <ul className="space-y-2">
                {threads.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => loadThread(t.id)}
                      className="text-left w-full rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-sm hover:bg-white/50"
                    >
                      <span className="font-medium text-[var(--travel-text)]">{t.type}</span>
                      {t.subject && <span className="text-[var(--travel-muted)]"> · {t.subject}</span>}
                      <span className="text-[var(--travel-muted)] block mt-1">{new Date(t.createdAt).toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div>
            <button type="button" onClick={() => setSelectedThread(null)} className="text-sm text-[var(--travel-warm)] mb-2">← Back to list</button>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {selectedThread.messages?.map((m) => (
                <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.sender === 'support' ? 'bg-blue-50 ml-4' : 'bg-slate-100 mr-4'}`}>
                  <span className="font-medium text-[var(--travel-muted)]">{m.sender}</span>: {m.body}
                  <span className="block text-xs text-[var(--travel-muted)]">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Reply as support…"
                className="flex-1 rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]"
              />
              <button type="button" onClick={sendReply} disabled={sendingReply || !replyBody.trim()} className="rounded-xl bg-[var(--travel-warm)] text-white px-4 py-2 disabled:opacity-50">
                {sendingReply ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
