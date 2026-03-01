import { useState, useEffect } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'

type TabKey = 'hotel' | 'flight' | 'transport' | 'trip_package'
import { api } from '../../lib/api'

const PRIMARY = '#2F7DFF'

const TABS = [
  { key: 'hotel', label: 'Hotels', icon: '🏨' },
  { key: 'flight', label: 'Flights', icon: '✈️' },
  { key: 'transport', label: 'Transport', icon: '🚌' },
  { key: 'trip_package', label: 'Campaigns', icon: '🏔️' },
] as const

type Booking = {
  id: string
  customerId: string
  bookingType: string
  title: string | null
  status: string
  denialReason: string | null
  totalAmount: number
  currency: string
  walletApplied: number
  paymentMethod?: string | null
  paidInOffice?: boolean
  checkInAt: string | null
  checkOutAt: string | null
  roomType: string | null
  createdAt: string
  customer?: { id: string; name: string }
  hotel?: { id: string; name: string; location: string | null }
  flight?: { id: string; origin: string; destination: string }
  campaign?: { id: string; title: string }
}

function GlassSurface({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden rounded-[24px] border border-white/35 shadow-[0_22px_70px_rgba(47,125,255,0.20)] ${className}`}>
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[28px]" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default function AdminReservations() {
  const [searchParams] = useSearchParams()
  const tab = (searchParams.get('tab') || 'hotel') as TabKey
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [denyReason, setDenyReason] = useState('')

  const bookingTypeForTab = tab === 'transport' ? 'other' : tab

  async function load() {
    setLoading(true)
    setError('')
    try {
      const list = await api<Booking[]>('/bookings')
      setAllBookings(list || [])
    } catch {
      setAllBookings([])
      setError('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (tab === 'transport') {
      setBookings(allBookings.filter((b) => b.bookingType === 'other' || b.bookingType === 'transport'))
    } else {
      setBookings(allBookings.filter((b) => b.bookingType === bookingTypeForTab))
    }
  }, [tab, allBookings, bookingTypeForTab])

  const pendingCount = allBookings.filter((b) => b.status === 'pending_confirmation' || b.status === 'pending_payment').length
  const tabPendingCount = bookings.filter((b) => b.status === 'pending_confirmation' || b.status === 'pending_payment').length

  const selected = selectedId ? bookings.find((b) => b.id === selectedId) : null

  function isPaid(b: Booking) {
    const total = Number(b.totalAmount)
    const applied = Number(b.walletApplied)
    return applied >= total || !!b.paidInOffice
  }

  async function markPaidInOffice(bookingId: string) {
    setUpdatingId(bookingId)
    setError('')
    try {
      await api(`/bookings/${bookingId}/paid-in-office`, { method: 'POST' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setUpdatingId(null)
    }
  }

  async function updateStatus(bookingId: string, status: string, reason?: string) {
    setUpdatingId(bookingId)
    setError('')
    try {
      await api(`/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, denialReason: reason }),
      })
      setSelectedId(null)
      setDenyReason('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const displayName = (b: Booking) => {
    if (b.hotel) return b.hotel.name
    if (b.flight) return `${b.flight.origin} → ${b.flight.destination}`
    if (b.campaign) return b.campaign.title
    return b.title || '—'
  }

  const displayDates = (b: Booking) => {
    if (b.checkInAt && b.checkOutAt) {
      return `${new Date(b.checkInAt).toLocaleDateString()} – ${new Date(b.checkOutAt).toLocaleDateString()}`
    }
    return new Date(b.createdAt).toLocaleDateString()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-tight" style={{ color: PRIMARY }}>
          Reservations
        </h1>
        <p className="text-sm text-[rgba(11,27,58,0.65)]">
          New unacted: <span className="font-semibold text-amber-600">{pendingCount}</span>
        </p>
      </div>

      {error && (
        <div className="text-[12px] text-rose-600 bg-rose-50/80 border border-rose-200 rounded-[16px] px-3 py-2 max-w-md">
          {error}
        </div>
      )}

      <GlassSurface>
        <div className="p-4">
          <div className="flex flex-wrap gap-2 border-b border-white/30 pb-3 mb-3">
            {TABS.map((t) => (
              <NavLink
                key={t.key}
                to={`/admin/reservations?tab=${t.key}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium no-underline transition ${
                    isActive
                      ? 'bg-[rgba(47,125,255,0.2)] text-[#0f172a]'
                      : 'text-[rgba(11,27,58,0.7)] hover:bg-white/10'
                  }`
                }
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.key === tab && tabPendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tabPendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {loading ? (
            <p className="text-[rgba(11,27,58,0.6)] py-4">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] text-[rgba(11,27,58,0.85)]">
                <thead className="text-[11px] uppercase tracking-[0.12em] text-[rgba(11,27,58,0.5)]">
                  <tr>
                    <th className="pb-2 pr-4">Name / Route</th>
                    <th className="pb-2 pr-4">Client</th>
                    <th className="pb-2 pr-4">Dates</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2 pr-4">Payment</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-[rgba(11,27,58,0.6)]">
                        No reservations in this tab.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const paid = isPaid(b)
                      const paymentStatus =
                        paid && b.paidInOffice
                          ? 'Paid in office'
                          : Number(b.walletApplied) >= Number(b.totalAmount)
                            ? 'Wallet'
                            : b.paymentMethod === 'pay_later'
                              ? 'Pay later'
                              : 'Pending'
                      const canConfirm = (b.status === 'pending_confirmation' || b.status === 'pending_payment') && paid
                      return (
                        <tr
                          key={b.id}
                          className={`border-t border-white/40 cursor-pointer ${selectedId === b.id ? 'bg-[rgba(47,125,255,0.08)]' : 'hover:bg-white/5'}`}
                          onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}
                        >
                          <td className="py-2 pr-4 font-medium">{displayName(b)}</td>
                          <td className="py-2 pr-4">{b.customer?.name ?? b.customerId}</td>
                          <td className="py-2 pr-4">{displayDates(b)}</td>
                          <td className="py-2 pr-4">
                            {b.currency} {Number(b.totalAmount).toFixed(2)}
                          </td>
                          <td className="py-2 pr-4 text-[11px]">{paymentStatus}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-50/80 text-emerald-700'
                                  : b.status === 'cancelled' || b.status === 'denied'
                                    ? 'bg-slate-100 text-slate-600'
                                    : b.status === 'pending_payment'
                                      ? 'bg-amber-50/80 text-amber-700'
                                      : 'bg-amber-50/80 text-amber-700'
                              }`}
                            >
                              {b.status === 'pending_confirmation' ? 'Awaiting confirmation' : b.status === 'pending_payment' ? 'Pending payment' : b.status}
                            </span>
                          </td>
                          <td className="py-2">
                            {(b.status === 'pending_confirmation' || b.status === 'pending_payment') && (
                              <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                                {!paid && b.paymentMethod === 'pay_later' && (
                                  <button
                                    type="button"
                                    onClick={() => markPaidInOffice(b.id)}
                                    disabled={updatingId === b.id}
                                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-800 disabled:opacity-50"
                                  >
                                    Paid in office
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => updateStatus(b.id, 'confirmed')}
                                  disabled={updatingId === b.id || !canConfirm}
                                  title={!canConfirm ? 'Mark payment first (wallet or Paid in office)' : ''}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(b.id)}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                                >
                                  Deny / Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassSurface>

      {selected && (
        <GlassSurface>
          <div className="p-5">
            <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)] mb-3">Reservation details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <dt className="text-[rgba(11,27,58,0.5)]">Name / Route</dt>
              <dd className="font-medium">{displayName(selected)}</dd>
              <dt className="text-[rgba(11,27,58,0.5)]">Client</dt>
              <dd>{selected.customer?.name ?? selected.customerId}</dd>
              <dt className="text-[rgba(11,27,58,0.5)]">Dates</dt>
              <dd>{displayDates(selected)}</dd>
              <dt className="text-[rgba(11,27,58,0.5)]">Total</dt>
              <dd>
                {selected.currency} {Number(selected.totalAmount).toFixed(2)}
              </dd>
              <dt className="text-[rgba(11,27,58,0.5)]">Payment</dt>
              <dd>
                {selected.paidInOffice ? 'Paid in office' : Number(selected.walletApplied) >= Number(selected.totalAmount) ? 'Wallet' : selected.paymentMethod === 'pay_later' ? 'Pay later' : 'Pending'}
              </dd>
              <dt className="text-[rgba(11,27,58,0.5)]">Status</dt>
              <dd>{selected.status}</dd>
              {selected.hotel && (
                <>
                  <dt className="text-[rgba(11,27,58,0.5)]">Hotel</dt>
                  <dd>{selected.hotel.name} {selected.hotel.location ? ` · ${selected.hotel.location}` : ''}</dd>
                </>
              )}
              {selected.flight && (
                <>
                  <dt className="text-[rgba(11,27,58,0.5)]">Flight</dt>
                  <dd>{selected.flight.origin} → {selected.flight.destination}</dd>
                </>
              )}
            </dl>
            {(selected.status === 'pending_confirmation' || selected.status === 'pending_payment') && (
              <div className="mt-4 pt-4 border-t border-white/30">
                {!isPaid(selected) && selected.paymentMethod === 'pay_later' && (
                  <button
                    type="button"
                    onClick={() => markPaidInOffice(selected.id)}
                    disabled={updatingId === selected.id}
                    className="rounded-xl px-4 py-2 font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 mr-2 mb-2"
                  >
                    Paid in office
                  </button>
                )}
                <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Reason (for Deny/Cancel)</label>
                <input
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  placeholder="Optional"
                  className="w-full max-w-md rounded-xl border border-white/40 bg-white/50 px-3 py-2 text-[13px] text-[rgba(11,27,58,0.9)] mb-3"
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => updateStatus(selected.id, 'confirmed')}
                    disabled={updatingId === selected.id || !isPaid(selected)}
                    title={!isPaid(selected) ? 'Mark payment first (wallet or Paid in office)' : ''}
                    className="rounded-xl px-4 py-2 font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selected.id, 'cancelled', denyReason)}
                    disabled={updatingId === selected.id}
                    className="rounded-xl px-4 py-2 font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selected.id, 'denied', denyReason)}
                    disabled={updatingId === selected.id}
                    className="rounded-xl px-4 py-2 font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              </div>
            )}
          </div>
        </GlassSurface>
      )}
    </div>
  )
}
