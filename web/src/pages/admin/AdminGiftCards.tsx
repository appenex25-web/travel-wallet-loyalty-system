import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

type Summary = { walletFloat: number; activeCustomers: number; redemptionsCount: number; pointsOutstanding: number }

export default function AdminGiftCards() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Summary>('/admin/dashboard/summary')
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-[var(--travel-deep)] mb-2">Gift Cards</h1>
      <p className="text-[var(--travel-muted)] mb-6">Stored value (wallet) loaded by customers. Top up from the Customers page.</p>
      {loading ? <p className="text-[var(--travel-muted)]">Loading…</p> : (
        <div className="rounded-2xl border border-[var(--travel-card-border)] p-6 bg-white/90 max-w-sm mx-auto">
          <p className="text-[var(--travel-muted)] text-sm">Total wallet float</p>
          <p className="text-2xl font-bold text-[var(--travel-deep)]">${summary ? Number(summary.walletFloat).toFixed(2) : '0.00'}</p>
        </div>
      )}
    </div>
  )
}
