import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

type Summary = { walletFloat: number; activeCustomers: number; redemptionsCount: number; pointsOutstanding: number }

export default function AdminReports() {
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
      <h1 className="text-3xl font-bold text-[var(--travel-deep)] mb-2">Reports</h1>
      <p className="text-[var(--travel-muted)] mb-8">Summary metrics</p>
      {loading ? <p className="text-[var(--travel-muted)]">Loading…</p> : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[var(--travel-card-border)] bg-white/80 p-6 shadow-sm">
            <p className="text-[var(--travel-muted)] text-sm">Wallet float</p>
            <p className="text-xl font-bold text-[var(--travel-deep)]">${Number(summary.walletFloat).toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--travel-card-border)] bg-white/80 p-6 shadow-sm">
            <p className="text-[var(--travel-muted)] text-sm">Active customers</p>
            <p className="text-xl font-bold text-[var(--travel-deep)]">{summary.activeCustomers}</p>
          </div>
          <div className="rounded-2xl border border-[var(--travel-card-border)] bg-white/80 p-6 shadow-sm">
            <p className="text-[var(--travel-muted)] text-sm">Redemptions</p>
            <p className="text-xl font-bold text-[var(--travel-deep)]">{summary.redemptionsCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--travel-card-border)] bg-white/80 p-6 shadow-sm">
            <p className="text-[var(--travel-muted)] text-sm">Points outstanding</p>
            <p className="text-xl font-bold text-[var(--travel-deep)]">{summary.pointsOutstanding}</p>
          </div>
        </div>
      )}
    </div>
  )
}
