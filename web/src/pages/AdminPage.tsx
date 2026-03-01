import { useState, useEffect } from 'react'
import { api } from '../lib/api'

type Summary = { walletFloat: number; activeCustomers: number; redemptionsCount: number; pointsOutstanding: number }
type Customer = { id: string; name: string; phone: string | null; status: string; tier: string; user?: { email: string } }
type Offer = { id: string; name: string; description: string | null; type: string; status: string; startAt: string; endAt: string }

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'offers'>('overview')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [offerForm, setOfferForm] = useState({ name: '', description: '', type: 'bonus_points', startAt: '', endAt: '' })
  const [topUpCustomerId, setTopUpCustomerId] = useState('')
  const [topUpAmount, setTopUpAmount] = useState('')

  useEffect(() => {
    if (activeTab === 'overview') {
      setLoading(true)
      api<Summary>('/admin/dashboard/summary')
        .then(setSummary)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
        .finally(() => setLoading(false))
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'customers') {
      setLoading(true)
      api<Customer[]>(`/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`)
        .then(setCustomers)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
        .finally(() => setLoading(false))
    }
  }, [activeTab, search])

  useEffect(() => {
    if (activeTab === 'offers') {
      setLoading(true)
      api<Offer[]>('/admin/offers')
        .then(setOffers)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
        .finally(() => setLoading(false))
    }
  }, [activeTab])

  async function createOffer(e: React.FormEvent) {
    e.preventDefault()
    if (!offerForm.name || !offerForm.startAt || !offerForm.endAt) return
    setError('')
    try {
      await api('/admin/offers', {
        method: 'POST',
        body: JSON.stringify({
          name: offerForm.name,
          description: offerForm.description || undefined,
          type: offerForm.type,
          startAt: new Date(offerForm.startAt).toISOString(),
          endAt: new Date(offerForm.endAt).toISOString(),
        }),
      })
      setOfferForm({ name: '', description: '', type: 'bonus_points', startAt: '', endAt: '' })
      api<Offer[]>('/admin/offers').then(setOffers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function doTopUp() {
    if (!topUpCustomerId || !topUpAmount || Number(topUpAmount) <= 0) return
    setError('')
    try {
      await api(`/wallet/${topUpCustomerId}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(topUpAmount), source: 'admin' }),
      })
      setTopUpCustomerId('')
      setTopUpAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100">
      <h2 className="text-2xl font-bold text-[var(--gold)]">Admin Dashboard</h2>

      <div className="flex gap-2 border-b border-slate-700/50 pb-2">
        {(['overview', 'customers', 'offers'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize rounded-lg px-4 py-2 font-medium transition ${
              activeTab === tab ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400">{error}</p>}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <p className="text-slate-400">Loading…</p>
          ) : summary ? (
            <>
              <div className="rounded-xl bg-[var(--navy-light)] border border-slate-700/50 p-6">
                <p className="text-slate-400 text-sm">Wallet float</p>
                <p className="text-2xl font-bold text-[var(--gold)]">${Number(summary.walletFloat).toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-[var(--navy-light)] border border-slate-700/50 p-6">
                <p className="text-slate-400 text-sm">Active customers</p>
                <p className="text-2xl font-bold text-[var(--gold)]">{summary.activeCustomers}</p>
              </div>
              <div className="rounded-xl bg-[var(--navy-light)] border border-slate-700/50 p-6">
                <p className="text-slate-400 text-sm">Redemptions</p>
                <p className="text-2xl font-bold text-[var(--gold)]">{summary.redemptionsCount}</p>
              </div>
              <div className="rounded-xl bg-[var(--navy-light)] border border-slate-700/50 p-6">
                <p className="text-slate-400 text-sm">Points outstanding</p>
                <p className="text-2xl font-bold text-[var(--gold)]">{summary.pointsOutstanding}</p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="rounded-xl bg-[var(--navy-light)] border border-slate-700/50 p-6 space-y-4">
          <input
            type="text"
            placeholder="Search by name, phone, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white placeholder-slate-500"
          />
          {loading ? (
            <p className="text-slate-400">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-200">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">Tier</th>
                    <th className="pb-2">Top up</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-700">
                      <td className="py-2 pr-4">{c.name}</td>
                      <td className="py-2 pr-4">{c.user?.email ?? '—'}</td>
                      <td className="py-2 pr-4">{c.phone ?? '—'}</td>
                      <td className="py-2 pr-4">{c.tier}</td>
                      <td className="py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          className="w-24 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white text-sm mr-2"
                          value={topUpCustomerId === c.id ? topUpAmount : ''}
                          onChange={(e) => {
                            setTopUpCustomerId(c.id)
                            setTopUpAmount(e.target.value)
                          }}
                        />
                        <button
                          type="button"
                          onClick={doTopUp}
                          disabled={topUpCustomerId !== c.id || !topUpAmount}
                          className="rounded bg-[var(--gold)] text-[var(--navy)] px-2 py-1 text-sm font-medium disabled:opacity-50"
                        >
                          Top up
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.length === 0 && <p className="text-slate-400 py-4">No customers found.</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-[var(--navy-light)] border border-slate-700/50 p-6">
            <h3 className="font-semibold text-[var(--gold)] mb-4">Create offer</h3>
            <form onSubmit={createOffer} className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  value={offerForm.name}
                  onChange={(e) => setOfferForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white w-48"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Type</label>
                <select
                  value={offerForm.type}
                  onChange={(e) => setOfferForm((f) => ({ ...f, type: e.target.value }))}
                  className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
                >
                  <option value="bonus_points">Bonus points</option>
                  <option value="discount_amount">Discount amount</option>
                  <option value="discount_percent">Discount %</option>
                  <option value="perk">Perk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={offerForm.startAt}
                  onChange={(e) => setOfferForm((f) => ({ ...f, startAt: e.target.value }))}
                  className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">End</label>
                <input
                  type="datetime-local"
                  value={offerForm.endAt}
                  onChange={(e) => setOfferForm((f) => ({ ...f, endAt: e.target.value }))}
                  className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
                  required
                />
              </div>
              <button type="submit" className="rounded-lg bg-[var(--gold)] text-[var(--navy)] px-4 py-2 font-semibold">
                Create
              </button>
            </form>
          </div>
          <div className="rounded-xl bg-[var(--navy-light)] border border-slate-700/50 p-6">
            <h3 className="font-semibold text-[var(--gold)] mb-4">Offers</h3>
            {loading ? (
              <p className="text-slate-400">Loading…</p>
            ) : (
              <ul className="space-y-2 text-slate-200">
                {offers.map((o) => (
                  <li key={o.id} className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span>{o.name} — {o.type} ({o.status})</span>
                    <span className="text-slate-400 text-sm">{new Date(o.startAt).toLocaleDateString()} – {new Date(o.endAt).toLocaleDateString()}</span>
                  </li>
                ))}
                {offers.length === 0 && <p className="text-slate-400">No offers.</p>}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
