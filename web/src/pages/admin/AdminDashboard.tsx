import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const PRIMARY = '#2F7DFF'
const ACCENT = '#4FA3FF'

type Summary = {
  walletFloat: number
  activeCustomers: number
  redemptionsCount: number
  pointsOutstanding: number
  weeklyActivity?: { day: string; walletOps: number; redemptions: number }[]
}

type Customer = {
  id: string
  name: string
  tier: string
  points?: number
  last_activity_at?: string
  user?: { email: string }
}

type Offer = {
  id: string
  name: string
  type: string
  status: string
  startAt: string
  endAt: string
}

type TransactionRow = {
  date: string
  customer: string
  type: string
  amount: string
  status: 'Completed' | 'Pending' | 'Failed'
}

type TopCustomer = {
  name: string
  points: number
  lastActivity: string
}

function GlassSurface({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/35 shadow-[0_22px_70px_rgba(47,125,255,0.20)] shadow-[0_0_45px_rgba(79,163,255,0.18)] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-[position:center_top] opacity-[0.35]"
        style={{ backgroundImage: "url('/assets/bg-everest.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[28px]" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/8 to-white/10" aria-hidden />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassSurface className="rounded-[22px]">
      <div className="px-5 py-4 flex flex-col gap-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[rgba(11,27,58,0.55)]">
          {label}
        </p>
        <p className="text-2xl font-semibold" style={{ color: PRIMARY }}>
          {value}
        </p>
      </div>
    </GlassSurface>
  )
}

function StatusPill({ status }: { status: TransactionRow['status'] }) {
  const base =
    status === 'Completed'
      ? 'bg-emerald-50/80 text-emerald-700'
      : status === 'Pending'
      ? 'bg-amber-50/80 text-amber-700'
      : 'bg-rose-50/80 text-rose-700'
  const dot =
    status === 'Completed'
      ? 'bg-emerald-500'
      : status === 'Pending'
      ? 'bg-amber-500'
      : 'bg-rose-500'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${base}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}

const BAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [, setOffers] = useState<Offer[]>([])
  const [recentTransactions, setRecentTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError('')
        const [s, c, o, tx] = await Promise.all([
          api<Summary>('/admin/dashboard/summary'),
          api<Customer[]>('/admin/customers'),
          api<Offer[]>('/admin/offers'),
          api<TransactionRow[]>('/admin/dashboard/recent-transactions?limit=20'),
        ])
        if (cancelled) return
        setSummary(s)
        setCustomers(c)
        setOffers(o)
        setRecentTransactions(tx)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const kpis = [
    { label: 'Wallet float', value: summary ? `$${Number(summary.walletFloat).toFixed(2)}` : '—' },
    { label: 'Active customers', value: summary ? String(summary.activeCustomers) : '—' },
    { label: 'Redemptions', value: summary ? String(summary.redemptionsCount) : '—' },
    { label: 'Points outstanding', value: summary ? String(summary.pointsOutstanding) : '—' },
  ]

  const topCustomers: TopCustomer[] = customers.slice(0, 4).map((c) => ({
    name: c.name,
    points: c.points ?? 0,
    lastActivity: c.last_activity_at
      ? new Date(c.last_activity_at).toLocaleDateString()
      : 'Recently',
  }))

  const weekly = summary?.weeklyActivity ?? []
  const maxVal = Math.max(1, ...weekly.map((w) => (w?.walletOps ?? 0) + (w?.redemptions ?? 0)))
  const barHeights = BAR_DAYS.map((day) => {
    const w = weekly.find((x) => x.day === day) ?? { day, walletOps: 0, redemptions: 0 }
    const conv = maxVal ? Math.round(((w.walletOps ?? 0) / maxVal) * 70) + 20 : 30
    const clicks = maxVal ? Math.round(((w.redemptions ?? 0) / maxVal) * 70) + 15 : 20
    return { conv, clicks }
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 mt-1">
        <h1 className="text-[32px] font-extrabold tracking-tight" style={{ color: PRIMARY }}>
          Dashboard
        </h1>
        <p className="text-sm text-[rgba(11,27,58,0.65)]">
          Travel agent overview
        </p>
      </div>

      {error && (
        <div className="text-[12px] text-rose-600 bg-rose-50/80 border border-rose-200 rounded-[16px] px-3 py-2 max-w-md">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} />
        ))}
      </div>

      {/* 2-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Recent Transactions */}
        <GlassSurface className="lg:col-span-2 rounded-[24px]">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)]">
                Recent Transactions
              </h2>
              <span className="text-[11px] text-[rgba(11,27,58,0.55)]">
                Last {recentTransactions.length} operations
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] text-[rgba(11,27,58,0.85)]">
                <thead className="text-[11px] uppercase tracking-[0.12em] text-[rgba(11,27,58,0.5)]">
                  <tr>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Customer</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4 text-right">Amount</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx, idx) => (
                    <tr key={`${tx.date}-${tx.customer}-${tx.amount}-${idx}`} className="border-t border-white/40">
                      <td className="py-2 pr-4 whitespace-nowrap text-[rgba(11,27,58,0.75)]">
                        {tx.date}
                      </td>
                      <td className="py-2 pr-4">{tx.customer}</td>
                      <td className="py-2 pr-4 text-[rgba(11,27,58,0.7)]">
                        {tx.type}
                      </td>
                      <td className="py-2 pr-4 text-right font-medium">
                        {tx.amount}
                      </td>
                      <td className="py-2 text-right">
                        <StatusPill status={tx.status} />
                      </td>
                    </tr>
                  ))}
                  {!loading && recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-[12px] text-[rgba(11,27,58,0.6)] text-center">
                        No transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </GlassSurface>

        {/* Top customers */}
        <GlassSurface className="rounded-[24px]">
          <div className="p-5 flex flex-col gap-3">
            <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)]">
              Top Customers
            </h2>
            {loading && topCustomers.length === 0 ? (
              <p className="text-[12px] text-[rgba(11,27,58,0.6)]">Loading…</p>
            ) : (
              <ul className="space-y-2">
                {topCustomers.map((c) => {
                  const initials = c.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                  return (
                    <li
                      key={c.name}
                      className="flex items-center justify-between px-2 py-2 rounded-[18px] bg-white/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#DCEFFF] to-[#A6CDFF] flex items-center justify-center text-[11px] font-semibold text-[rgba(11,27,58,0.9)]">
                          {initials}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[rgba(11,27,58,0.9)]">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-[rgba(11,27,58,0.6)]">
                            {c.points.toLocaleString()} pts · {c.lastActivity}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
                {!loading && topCustomers.length === 0 && (
                  <p className="text-[12px] text-[rgba(11,27,58,0.6)]">No customers yet.</p>
                )}
              </ul>
            )}
          </div>
        </GlassSurface>
      </div>

      {/* Campaign performance */}
      <GlassSurface className="rounded-[24px]">
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)]">
                Campaign performance
              </h2>
              <p className="text-[11px] text-[rgba(11,27,58,0.55)]">
                Last 7 days wallet activity and redemptions
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[rgba(11,27,58,0.7)]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: PRIMARY }} /> Active
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} /> Scheduled
              </span>
            </div>
          </div>
          <div className="mt-1 flex items-end gap-3 h-32">
            {BAR_DAYS.map((day, i) => {
              const { conv, clicks } = barHeights[i]
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex flex-col justify-end gap-1 h-24 w-full">
                    <div
                      className="w-full rounded-[10px] bg-gradient-to-t from-[rgba(47,125,255,0.9)] to-[rgba(91,182,255,0.8)] shadow-[0_10px_24px_rgba(47,125,255,0.45)]"
                      style={{ height: `${conv}%` }}
                    />
                    <div
                      className="w-full rounded-[10px] bg-gradient-to-t from-[rgba(91,182,255,0.75)] to-[rgba(222,240,255,0.9)]"
                      style={{ height: `${clicks}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[rgba(11,27,58,0.65)]">
                    {day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </GlassSurface>

      {loading && (
        <p className="text-[12px] text-[rgba(11,27,58,0.6)] mt-2">
          Loading live data…
        </p>
      )}
    </div>
  )
}
