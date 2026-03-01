import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

const PRIMARY = '#2F7DFF'

type Flight = {
  id: string
  origin: string
  destination: string
  flightNumber: string | null
  departureAt: string | null
  price: number
  currency: string
}

function GlassSurface({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden rounded-[24px] border border-white/35 shadow-[0_22px_70px_rgba(47,125,255,0.20)] ${className}`}>
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[28px]" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default function AdminFlights() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ origin: '', destination: '', flightNumber: '', price: '', currency: 'USD' })

  function load() {
    api<Flight[]>('/flights').then(setFlights).catch(() => setFlights([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function createFlight(e: React.FormEvent) {
    e.preventDefault()
    if (!form.origin.trim() || !form.destination.trim()) return
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) return
    setError('')
    try {
      await api('/flights', {
        method: 'POST',
        body: JSON.stringify({
          origin: form.origin.trim(),
          destination: form.destination.trim(),
          flightNumber: form.flightNumber.trim() || undefined,
          price,
          currency: form.currency,
        }),
      })
      setForm({ origin: '', destination: '', flightNumber: '', price: '', currency: 'USD' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  async function handleDeleteFlight(id: string) {
    if (!confirm('Delete this flight? Bookings linked to it will keep the reference.')) return
    setError('')
    try {
      await api(`/flights/${id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-tight" style={{ color: PRIMARY }}>Flights</h1>
        <p className="text-sm text-[rgba(11,27,58,0.65)]">Catalog of flights for client bookings</p>
      </div>
      {error && (
        <div className="text-[12px] text-rose-600 bg-rose-50/80 border border-rose-200 rounded-[16px] px-3 py-2 max-w-md">{error}</div>
      )}
      <GlassSurface>
        <div className="p-5">
          <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)] mb-4">Add flight</h2>
          <form onSubmit={createFlight} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Origin</label>
              <input value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-32 text-[13px] text-[rgba(11,27,58,0.9)]" placeholder="e.g. NBO" required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Destination</label>
              <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-32 text-[13px] text-[rgba(11,27,58,0.9)]" placeholder="e.g. DXB" required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Flight no.</label>
              <input value={form.flightNumber} onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))} className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-28 text-[13px] text-[rgba(11,27,58,0.9)]" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Price (USD)</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-28 text-[13px] text-[rgba(11,27,58,0.9)]" placeholder="0" required />
            </div>
            <button type="submit" className="rounded-xl px-4 py-2 font-medium text-white shadow-[0_8px_22px_rgba(47,125,255,0.4)]" style={{ background: `linear-gradient(180deg, #5BB6FF 0%, ${PRIMARY} 100%)` }}>Add</button>
          </form>
        </div>
      </GlassSurface>
      <GlassSurface>
        <div className="p-5">
          <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)] mb-3">Flight catalog</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] text-[rgba(11,27,58,0.85)]">
              <thead className="text-[11px] uppercase tracking-[0.12em] text-[rgba(11,27,58,0.5)]">
                <tr>
                  <th className="pb-2 pr-4">Route</th>
                  <th className="pb-2 pr-4">Flight no.</th>
                  <th className="pb-2 pr-4">Price</th>
                  <th className="pb-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="py-3 text-[rgba(11,27,58,0.6)]">Loading…</td></tr> : flights.length === 0 ? <tr><td colSpan={4} className="py-3 text-[rgba(11,27,58,0.6)]">No flights. Add one above.</td></tr> : flights.map((f) => (
                  <tr key={f.id} className="border-t border-white/40">
                    <td className="py-2 pr-4 font-medium">{f.origin} → {f.destination}</td>
                    <td className="py-2 pr-4 text-[rgba(11,27,58,0.75)]">{f.flightNumber ?? '—'}</td>
                    <td className="py-2 pr-4">{f.currency} {Number(f.price).toFixed(2)}</td>
                    <td className="py-2">
                      <button type="button" onClick={() => handleDeleteFlight(f.id)} className="text-rose-600 hover:text-rose-700 text-[11px] font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlassSurface>
    </div>
  )
}
