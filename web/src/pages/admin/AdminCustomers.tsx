import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

type Customer = { id: string; name: string; phone: string | null; status: string; tier: string; user?: { email: string } }

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', name: '', phone: '' })
  const [topUpId, setTopUpId] = useState('')
  const [topUpAmount, setTopUpAmount] = useState('')

  useEffect(() => {
    setLoading(true)
    setListError('')
    api<Customer[]>(`/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : [])
        setListError('')
      })
      .catch((err) => {
        setCustomers([])
        setListError(err instanceof Error ? err.message : 'Failed to load customers. Try logging in again (Agent/Admin).')
      })
      .finally(() => setLoading(false))
  }, [search])

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.email || !addForm.name) return
    setError('')
    try {
      await api('/admin/customers', {
        method: 'POST',
        body: JSON.stringify({ email: addForm.email, name: addForm.name, phone: addForm.phone || undefined }),
      })
      setAddForm({ email: '', name: '', phone: '' })
      setShowAdd(false)
      api<Customer[]>('/admin/customers').then(setCustomers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function doTopUp() {
    if (!topUpId || !topUpAmount || Number(topUpAmount) <= 0) return
    setError('')
    try {
      await api(`/wallet/${topUpId}/topup`, { method: 'POST', body: JSON.stringify({ amount: Number(topUpAmount), source: 'admin' }) })
      setTopUpId('')
      setTopUpAmount('')
      api<Customer[]>('/admin/customers').then(setCustomers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[var(--travel-deep)]">Customers</h1>
        <button type="button" onClick={() => setShowAdd(true)} className="rounded-xl bg-[var(--travel-warm)] text-white px-5 py-2.5 font-medium hover:bg-[var(--travel-warm-light)]">
          Add customer
        </button>
      </div>
      {showAdd && (
        <div className="rounded-2xl border border-[var(--travel-card-border)] p-6 mb-6 bg-white/90">
          <h2 className="font-semibold text-[var(--travel-text)] mb-4">New customer</h2>
          <p className="text-sm text-[var(--travel-muted)] mb-4">Login: email. Default password: first name in lowercase (e.g. &quot;John&quot; → john). Customer will be asked to change it on first login.</p>
          <form onSubmit={addCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-sm text-[var(--travel-muted)] mb-1">Email</label>
              <input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]" required />
            </div>
            <div>
              <label className="block text-sm text-[var(--travel-muted)] mb-1">Name (first name used as default password)</label>
              <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]" required />
            </div>
            <div>
              <label className="block text-sm text-[var(--travel-muted)] mb-1">Phone</label>
              <input value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="rounded-xl bg-[var(--travel-deep)] text-white px-4 py-2 hover:bg-[var(--travel-deep-hover)]">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border border-[var(--travel-card-border)] px-4 py-2 text-[var(--travel-muted)]">Cancel</button>
            </div>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}
      {listError && (
        <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {listError}
          <span className="ml-2">
            Go to <Link to="/login" className="underline font-medium">Login</Link> and sign in as Agent/Admin (e.g. admin@travel.local).
          </span>
        </div>
      )}
      <input
        type="text"
        placeholder="Search by name, email, phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-xl border border-[var(--travel-card-border)] px-4 py-2 mb-4 text-[var(--travel-text)]"
      />
      <div className="rounded-2xl border border-[var(--travel-card-border)] overflow-hidden bg-white/90">
        <table className="w-full text-left">
          <thead className="bg-[var(--travel-deep)]/10 border-b border-[var(--travel-card-border)]">
            <tr>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Name</th>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Email</th>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Phone</th>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Tier</th>
              <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-4 text-[var(--travel-muted)]">Loading…</td></tr>
            ) : !listError && customers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--travel-muted)]">No customers yet. Add one above or have customers register in the mobile app.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-[var(--travel-card-border)]">
                  <td className="px-4 py-3 text-[var(--travel-text)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--travel-muted)]">{c.user?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--travel-muted)]">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--travel-muted)]">{c.tier}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/customers/${c.id}`} className="text-[var(--travel-warm)] font-medium mr-2">Card & QR</Link>
                    <input type="number" step="0.01" min="0" placeholder="Top up" className="w-20 rounded-lg border border-[var(--travel-card-border)] px-2 py-1 text-sm mr-1 text-[var(--travel-text)]" value={topUpId === c.id ? topUpAmount : ''} onChange={(e) => { setTopUpId(c.id); setTopUpAmount(e.target.value) }} />
                    <button type="button" onClick={doTopUp} disabled={topUpId !== c.id || !topUpAmount} className="rounded-lg bg-[var(--travel-deep)] text-white px-2 py-1 text-sm disabled:opacity-50 hover:bg-[var(--travel-deep-hover)]">Top up</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
