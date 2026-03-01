import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

const PRIMARY = '#2F7DFF'

const BOOKING_TYPES = [
  { value: 'flight', label: 'Flight' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'trip_package', label: 'Trip package' },
  { value: 'other', label: 'Other' },
] as const

type Booking = {
  id: string
  customerId: string
  bookingType?: string
  title?: string | null
  hotelId?: string | null
  flightId?: string | null
  status: string
  denialReason?: string | null
  totalAmount: number
  currency: string
  walletApplied: number
  externalReference?: string
  createdAt: string
  customer?: { id: string; name: string }
  hotel?: { id: string; name: string }
  flight?: { id: string; origin: string; destination: string }
}

type Customer = { id: string; name: string }
type Hotel = { id: string; name: string; pricePerNight: number | null; currency: string }
type Flight = { id: string; origin: string; destination: string; price: number; currency: string }

function GlassSurface({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-white/35 shadow-[0_22px_70px_rgba(47,125,255,0.20)] ${className}`}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[28px]" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [statusModal, setStatusModal] = useState<{ booking: Booking; action: 'cancelled' | 'denied' } | null>(null)
  const [form, setForm] = useState({
    customerId: '',
    bookingType: 'flight' as string,
    hotelId: '',
    flightId: '',
    title: '',
    totalAmount: '',
    currency: 'USD',
    externalReference: '',
  })

  async function loadBookings() {
    const q = customerFilter.trim() ? `?customerId=${encodeURIComponent(customerFilter.trim())}` : ''
    try {
      const b = await api<Booking[]>(`/bookings${q}`)
      setBookings(b)
    } catch {
      setBookings([])
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api<Customer[]>('/admin/customers').then((c) => { if (!cancelled) setCustomers(c) }).catch(() => { if (!cancelled) setCustomers([]) }),
      api<Hotel[]>('/hotels').then((h) => { if (!cancelled) setHotels(h) }).catch(() => { if (!cancelled) setHotels([]) }),
      api<Flight[]>('/flights').then((f) => { if (!cancelled) setFlights(f) }).catch(() => { if (!cancelled) setFlights([]) }),
    ])
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setLoading(true)
    let cancelled = false
    const q = customerFilter.trim() ? `?customerId=${encodeURIComponent(customerFilter.trim())}` : ''
    api<Booking[]>(`/bookings${q}`)
      .then((b) => { if (!cancelled) setBookings(b) })
      .catch(() => { if (!cancelled) setBookings([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [customerFilter])

  async function createBooking(e: React.FormEvent) {
    e.preventDefault()
    const custId = form.customerId.trim()
    const amount = parseFloat(form.totalAmount)
    if (!custId || isNaN(amount) || amount <= 0) return
    setError('')
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          customerId: custId,
          totalAmount: amount,
          currency: form.currency,
          bookingType: form.bookingType || 'other',
          title: form.title.trim() || undefined,
          hotelId: form.hotelId || undefined,
          flightId: form.flightId || undefined,
          externalReference: form.externalReference.trim() || undefined,
        }),
      })
      setForm({ customerId: '', bookingType: 'flight', hotelId: '', flightId: '', title: '', totalAmount: '', currency: 'USD', externalReference: '' })
      await loadBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  async function updateBookingStatus(bookingId: string, status: string, denialReason?: string) {
    setUpdatingId(bookingId)
    setError('')
    try {
      await api(`/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, denialReason: denialReason || undefined }),
      })
      setStatusModal(null)
      setStatusReason('')
      await loadBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const canUpdateStatus = (b: Booking) =>
    b.status === 'pending_confirmation' || b.status === 'quote' || b.status === 'pending_payment'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-tight" style={{ color: PRIMARY }}>
          Bookings
        </h1>
        <p className="text-sm text-[rgba(11,27,58,0.65)]">Create and view bookings</p>
      </div>

      {error && (
        <div className="text-[12px] text-rose-600 bg-rose-50/80 border border-rose-200 rounded-[16px] px-3 py-2 max-w-md">
          {error}
        </div>
      )}

      <GlassSurface>
        <div className="p-5">
          <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)] mb-4">Create booking (trip / flight / hotel / package)</h2>
          <form onSubmit={createBooking} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Customer</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 min-w-[180px] text-[13px] text-[rgba(11,27,58,0.9)]"
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Type</label>
              <select
                value={form.bookingType}
                onChange={(e) => setForm((f) => ({ ...f, bookingType: e.target.value }))}
                className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 text-[13px] text-[rgba(11,27,58,0.9)]"
              >
                {BOOKING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {form.bookingType === 'hotel' && (
              <div>
                <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Select hotel</label>
                <select
                  value={form.hotelId}
                  onChange={(e) => {
                    const id = e.target.value
                    const h = hotels.find((x) => x.id === id)
                    setForm((f) => ({
                      ...f,
                      hotelId: id,
                      flightId: '',
                      title: h?.name ?? '',
                      totalAmount: h?.pricePerNight != null ? String(h.pricePerNight) : f.totalAmount,
                      currency: h?.currency ?? f.currency,
                    }))
                  }}
                  className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 min-w-[200px] text-[13px] text-[rgba(11,27,58,0.9)]"
                >
                  <option value="">— Select hotel —</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} {h.pricePerNight != null ? `(${h.currency} ${Number(h.pricePerNight).toFixed(2)}/night)` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            {form.bookingType === 'flight' && (
              <div>
                <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Select flight</label>
                <select
                  value={form.flightId}
                  onChange={(e) => {
                    const id = e.target.value
                    const fl = flights.find((x) => x.id === id)
                    setForm((f) => ({
                      ...f,
                      flightId: id,
                      hotelId: '',
                      title: fl ? `${fl.origin} → ${fl.destination}` : '',
                      totalAmount: fl ? String(fl.price) : f.totalAmount,
                      currency: fl?.currency ?? f.currency,
                    }))
                  }}
                  className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 min-w-[200px] text-[13px] text-[rgba(11,27,58,0.9)]"
                >
                  <option value="">— Select flight —</option>
                  {flights.map((f) => (
                    <option key={f.id} value={f.id}>{f.origin} → {f.destination} ({f.currency} {Number(f.price).toFixed(2)})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Title / description</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 min-w-[200px] text-[13px] text-[rgba(11,27,58,0.9)]"
                placeholder="e.g. Nairobi–Dubai return, Victoria Falls 3-day"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-28 text-[13px] text-[rgba(11,27,58,0.9)]"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 text-[13px] text-[rgba(11,27,58,0.9)]"
              >
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Reference (optional)</label>
              <input
                value={form.externalReference}
                onChange={(e) => setForm((f) => ({ ...f, externalReference: e.target.value }))}
                className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-40 text-[13px] text-[rgba(11,27,58,0.9)]"
                placeholder="Ref"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl px-4 py-2 font-medium text-white shadow-[0_8px_22px_rgba(47,125,255,0.4)]"
              style={{ background: `linear-gradient(180deg, #5BB6FF 0%, ${PRIMARY} 100%)` }}
            >
              Create
            </button>
          </form>
        </div>
      </GlassSurface>

      <GlassSurface>
        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)]">All bookings</h2>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[rgba(11,27,58,0.6)]">Customer ID</label>
              <input
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                placeholder="Filter by ID"
                className="rounded-lg border border-white/40 bg-white/50 px-2 py-1.5 w-40 text-[12px] text-[rgba(11,27,58,0.9)]"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] text-[rgba(11,27,58,0.85)]">
              <thead className="text-[11px] uppercase tracking-[0.12em] text-[rgba(11,27,58,0.5)]">
                <tr>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Trip / description</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2 pr-4">Wallet applied</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Actions</th>
                  <th className="pb-2">Ref</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="py-3 text-[rgba(11,27,58,0.6)]">Loading…</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={9} className="py-3 text-[rgba(11,27,58,0.6)]">No bookings.</td></tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="border-t border-white/40">
                      <td className="py-2 pr-4 whitespace-nowrap text-[rgba(11,27,58,0.75)]">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 capitalize text-[rgba(11,27,58,0.8)]">
                        {(b.bookingType || 'other').replace('_', ' ')}
                      </td>
                      <td className="py-2 pr-4 max-w-[200px] truncate text-[rgba(11,27,58,0.85)]" title={b.title ?? undefined}>
                        {b.hotel ? `🏨 ${b.hotel.name}` : b.flight ? `✈ ${b.flight.origin} → ${b.flight.destination}` : (b.title ?? '—')}
                      </td>
                      <td className="py-2 pr-4">{b.customer?.name ?? b.customerId}</td>
                      <td className="py-2 pr-4">{b.currency} {Number(b.totalAmount).toFixed(2)}</td>
                      <td className="py-2 pr-4">{b.currency} {Number(b.walletApplied).toFixed(2)}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.status === 'confirmed' ? 'bg-emerald-50/80 text-emerald-700' :
                          b.status === 'cancelled' || b.status === 'denied' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-50/80 text-amber-700'
                        }`}>
                          {b.status === 'pending_confirmation' ? 'Waiting confirmation' : b.status}
                        </span>
                        {b.denialReason && <span className="block text-[10px] text-slate-500 mt-0.5" title={b.denialReason}>{b.denialReason.slice(0, 30)}…</span>}
                      </td>
                      <td className="py-2 pr-4">
                        {canUpdateStatus(b) && (
                          <div className="flex flex-wrap gap-1">
                            <button type="button" onClick={() => updateBookingStatus(b.id, 'confirmed')} disabled={updatingId === b.id} className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 disabled:opacity-50">Confirm</button>
                            <button type="button" onClick={() => setStatusModal({ booking: b, action: 'cancelled' })} disabled={updatingId === b.id} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 disabled:opacity-50">Cancel</button>
                            <button type="button" onClick={() => setStatusModal({ booking: b, action: 'denied' })} disabled={updatingId === b.id} className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700 disabled:opacity-50">Deny</button>
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-[rgba(11,27,58,0.7)]">{b.externalReference ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassSurface>

      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-semibold text-[rgba(11,27,58,0.9)] mb-2">
              {statusModal.action === 'denied' ? 'Deny booking' : 'Cancel booking'}
            </h3>
            <p className="text-sm text-[rgba(11,27,58,0.7)] mb-4">{statusModal.booking.title ?? statusModal.booking.bookingType}</p>
            <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Reason (optional)</label>
            <input
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="e.g. Dates not available"
              className="w-full rounded-xl border border-white/40 bg-white/90 px-3 py-2 text-[13px] text-[rgba(11,27,58,0.9)] mb-4"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setStatusModal(null); setStatusReason(''); }} className="flex-1 rounded-xl px-4 py-2 border border-slate-300 text-slate-700 font-medium">Cancel</button>
              <button type="button" onClick={() => updateBookingStatus(statusModal.booking.id, statusModal.action, statusReason.trim() || undefined)} className="flex-1 rounded-xl px-4 py-2 bg-rose-500 text-white font-medium">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
