import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

type Offer = { id: string; name: string; description: string | null; type: string; status: string; startAt: string; endAt: string }

export default function AdminCampaigns() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '', type: 'bonus_points', startAt: '', endAt: '' })

  useEffect(() => {
    api<Offer[]>('/admin/offers')
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.startAt || !form.endAt) return
    setError('')
    try {
      await api('/admin/offers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          type: form.type,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
        }),
      })
      setForm({ name: '', description: '', type: 'bonus_points', startAt: '', endAt: '' })
      api<Offer[]>('/admin/offers').then(setOffers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--travel-deep)] mb-6 text-center">Campaigns</h1>
      <div className="rounded-2xl border border-[var(--travel-card-border)] p-6 mb-6 bg-white/90">
        <h2 className="font-semibold text-[var(--travel-text)] mb-4">Create campaign</h2>
        <form onSubmit={create} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 w-48 text-[var(--travel-text)]" required />
          </div>
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]">
              <option value="bonus_points">Bonus points</option>
              <option value="discount_amount">Discount amount</option>
              <option value="discount_percent">Discount %</option>
              <option value="perk">Perk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">Start</label>
            <input type="datetime-local" value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]" required />
          </div>
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">End</label>
            <input type="datetime-local" value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]" required />
          </div>
          <button type="submit" className="rounded-xl bg-[var(--travel-warm)] text-white px-4 py-2 font-medium hover:bg-[var(--travel-warm-light)]">Create</button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      <div className="rounded-2xl border border-[var(--travel-card-border)] overflow-hidden bg-white/90">
        <table className="w-full text-left">
          <thead className="bg-[var(--travel-deep)]/10 border-b border-[var(--travel-card-border)]">
            <tr>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Name</th>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Type</th>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Status</th>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Period</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-4 text-[var(--travel-muted)]">Loading…</td></tr>
            ) : (
              offers.map((o) => (
                <tr key={o.id} className="border-b border-[var(--travel-card-border)]">
                  <td className="px-4 py-3 text-[var(--travel-text)]">{o.name}</td>
                  <td className="px-4 py-3 text-[var(--travel-muted)]">{o.type}</td>
                  <td className="px-4 py-3 text-[var(--travel-muted)]">{o.status}</td>
                  <td className="px-4 py-3 text-[var(--travel-muted)]">{new Date(o.startAt).toLocaleDateString()} – {new Date(o.endAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
