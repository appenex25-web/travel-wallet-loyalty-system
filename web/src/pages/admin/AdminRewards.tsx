import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

type Offer = { id: string; name: string; description: string | null; type: string; status: string; startAt: string; endAt: string }

export default function AdminRewards() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Offer[]>('/admin/offers')
      .then((list) => setOffers(list.filter((o) => o.type === 'bonus_points' || o.type === 'perk')))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--travel-deep)] mb-2 text-center">Rewards</h1>
      <p className="text-[var(--travel-muted)] mb-6 text-center">Points and perk offers. Create campaigns with type &quot;Bonus points&quot; or &quot;Perk&quot; to appear here.</p>
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
            {loading ? <tr><td colSpan={4} className="px-4 py-4 text-[var(--travel-muted)]">Loading…</td></tr> : offers.length === 0 ? <tr><td colSpan={4} className="px-4 py-4 text-[var(--travel-muted)]">No rewards yet.</td></tr> : offers.map((o) => (
              <tr key={o.id} className="border-b border-[var(--travel-card-border)]">
                <td className="px-4 py-3 text-[var(--travel-text)]">{o.name}</td>
                <td className="px-4 py-3 text-[var(--travel-muted)]">{o.type}</td>
                <td className="px-4 py-3 text-[var(--travel-muted)]">{o.status}</td>
                <td className="px-4 py-3 text-[var(--travel-muted)]">{new Date(o.startAt).toLocaleDateString()} – {new Date(o.endAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
