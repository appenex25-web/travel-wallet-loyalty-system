import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

type Offer = { id: string; name: string; description: string | null; type: string; status: string; startAt: string; endAt: string }

export default function AdminVouchers() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Offer[]>('/admin/offers')
      .then((list) => setOffers(list.filter((o) => o.type === 'discount_amount' || o.type === 'discount_percent')))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--travel-deep)] mb-2 text-center">Vouchers</h1>
      <p className="text-[var(--travel-muted)] mb-6 text-center">Voucher-style offers (discounts). Create campaigns with type &quot;Discount amount&quot; or &quot;Discount %&quot; to appear here.</p>
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
            {loading ? <tr><td colSpan={4} className="px-4 py-4 text-[var(--travel-muted)]">Loading…</td></tr> : offers.length === 0 ? <tr><td colSpan={4} className="px-4 py-4 text-[var(--travel-muted)]">No vouchers yet.</td></tr> : offers.map((o) => (
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
