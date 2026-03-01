import { useState, useEffect, useRef } from 'react'
import { api, uploadCampaignImages } from '../../lib/api'

type AddOn = { id: string; name: string; priceDelta: number; currency: string }
type TripCampaign = {
  id: string
  title: string
  shortDescription: string | null
  description: string | null
  imageUrls: string[] | null
  basePrice: number
  currency: string
  status: string
  startAt: string | null
  endAt: string | null
  addOns?: AddOn[]
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminTripCampaigns() {
  const [campaigns, setCampaigns] = useState<TripCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    description: '',
    imageUrls: '' as string,
    imageFiles: [] as File[],
    basePrice: '',
    currency: 'USD',
    status: 'active',
    startAt: '',
    endAt: '',
    addOns: [] as { name: string; priceDelta: string }[],
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formExpanded, setFormExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function load() {
    api<TripCampaign[]>('/admin/campaigns')
      .then((list) => setCampaigns(list))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setForm({
      title: '',
      shortDescription: '',
      description: '',
      imageUrls: '',
      imageFiles: [],
      basePrice: '',
      currency: 'USD',
      status: 'active',
      startAt: '',
      endAt: '',
      addOns: [],
    })
    setEditingId(null)
    setFormExpanded(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.basePrice) return
    setError('')
    try {
      let imageUrls: string[] = form.imageUrls
        ? form.imageUrls.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      if (form.imageFiles.length > 0) {
        setUploading(true)
        const { urls } = await uploadCampaignImages(form.imageFiles)
        imageUrls = [...imageUrls, ...urls].slice(0, 3)
        setUploading(false)
      }
      if (imageUrls.length > 3) {
        setError('Maximum 3 images allowed')
        return
      }
      const body = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        description: form.description.trim() || undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        basePrice: Number(form.basePrice),
        currency: form.currency,
        status: form.status,
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
        addOns: form.addOns
          .filter((a) => a.name.trim())
          .map((a) => ({ name: a.name.trim(), priceDelta: Number(a.priceDelta) || 0 })),
      }
      if (editingId) {
        await api(`/campaigns/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        await api('/campaigns', { method: 'POST', body: JSON.stringify(body) })
      }
      resetForm()
      load()
    } catch (err) {
      setUploading(false)
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  function startEdit(c: TripCampaign) {
    setEditingId(c.id)
    setFormExpanded(true)
    setForm({
      title: c.title,
      shortDescription: c.shortDescription ?? '',
      description: c.description ?? '',
      imageUrls: Array.isArray(c.imageUrls) ? c.imageUrls.join(', ') : '',
      imageFiles: [],
      basePrice: String(c.basePrice),
      currency: c.currency ?? 'USD',
      status: c.status ?? 'active',
      startAt: toDatetimeLocal(c.startAt),
      endAt: toDatetimeLocal(c.endAt),
      addOns: (c.addOns ?? []).map((a) => ({ name: a.name, priceDelta: String(a.priceDelta) })),
    })
  }

  async function remove(id: string) {
    if (!confirm('Delete this trip campaign?')) return
    try {
      await api(`/campaigns/${id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--travel-deep)] mb-6 text-center">Trip campaigns</h1>
      <div className="rounded-2xl border border-[var(--travel-card-border)] mb-6 bg-white/90 overflow-hidden">
        <button
          type="button"
          onClick={() => setFormExpanded((e) => !e)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--travel-deep)]/5 transition-colors"
        >
          <h2 className="font-semibold text-[var(--travel-text)]">
            {editingId ? 'Edit trip campaign' : 'Create trip campaign'}
          </h2>
          <span className="text-2xl text-[var(--travel-muted)]" aria-hidden>
            {formExpanded ? '−' : '+'}
          </span>
        </button>
        {formExpanded && (
        <form onSubmit={create} className="flex flex-col gap-4 p-6 pt-0">
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 w-full text-[var(--travel-text)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">Short description (e.g. 3 days classic trip to Victoria Falls)</label>
            <input
              value={form.shortDescription}
              onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
              className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 w-full text-[var(--travel-text)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 w-full text-[var(--travel-text)]"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">Images (upload files, max 3)</label>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length > 3) {
                    setError('Maximum 3 images')
                    return
                  }
                  setForm((f) => ({ ...f, imageFiles: files }))
                }}
                className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)] text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--travel-warm)] file:px-3 file:py-1.5 file:text-white file:text-sm"
              />
              <p className="text-xs text-[var(--travel-muted)]">Or paste URLs (comma-separated):</p>
              <input
                value={form.imageUrls}
                onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
                placeholder="https://..."
                className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 w-full text-[var(--travel-text)]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-[var(--travel-muted)] mb-1">Start date/time</label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--travel-muted)] mb-1">End date/time</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-[var(--travel-muted)] mb-1">Base price</label>
              <input
                type="number"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 w-32 text-[var(--travel-text)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--travel-muted)] mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--travel-muted)] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--travel-muted)] mb-1">Add-ons (name, price delta)</label>
            {form.addOns.map((a, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={a.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      addOns: f.addOns.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                    }))
                  }
                  placeholder="e.g. Transport to/from"
                  className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 flex-1 text-[var(--travel-text)]"
                />
                <input
                  type="number"
                  step="0.01"
                  value={a.priceDelta}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      addOns: f.addOns.map((x, j) => (j === i ? { ...x, priceDelta: e.target.value } : x)),
                    }))
                  }
                  placeholder="+/- amount"
                  className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 w-28 text-[var(--travel-text)]"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, addOns: f.addOns.filter((_, j) => j !== i) }))}
                  className="rounded-xl px-3 py-2 text-red-600 border border-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, addOns: [...f.addOns, { name: '', priceDelta: '' }] }))}
              className="rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-sm text-[var(--travel-text)]"
            >
              + Add-on
            </button>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={uploading} className="rounded-xl bg-[var(--travel-warm)] text-white px-4 py-2 font-medium hover:bg-[var(--travel-warm-light)] disabled:opacity-50">
              {uploading ? 'Uploading…' : editingId ? 'Update campaign' : 'Create campaign'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--travel-card-border)] px-4 py-2 text-[var(--travel-text)]">
                Cancel
              </button>
            )}
          </div>
        </form>
        )}
        {formExpanded && error && <p className="px-6 pb-4 text-red-500 text-sm">{error}</p>}
      </div>
      <div className="rounded-2xl border border-[var(--travel-card-border)] overflow-hidden bg-white/90">
        <h2 className="font-semibold text-[var(--travel-text)] p-4 border-b border-[var(--travel-card-border)]">Trip campaigns</h2>
        {loading ? (
          <p className="p-4 text-[var(--travel-muted)]">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="p-4 text-[var(--travel-muted)]">No trip campaigns yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[var(--travel-deep)]/10 border-b border-[var(--travel-card-border)]">
              <tr>
                <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Title</th>
                <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Base price</th>
                <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Duration</th>
                <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Status</th>
                <th className="px-4 py-3 text-[var(--travel-muted)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-[var(--travel-card-border)]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--travel-text)]">{c.title}</div>
                    {c.shortDescription && <div className="text-sm text-[var(--travel-muted)]">{c.shortDescription}</div>}
                  </td>
                  <td className="px-4 py-3 text-[var(--travel-text)]">{c.currency} {Number(c.basePrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-[var(--travel-text)] text-sm">
                    {c.startAt || c.endAt
                      ? [c.startAt && new Date(c.startAt).toLocaleDateString(), c.endAt && new Date(c.endAt).toLocaleDateString()].filter(Boolean).join(' → ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--travel-text)]">{c.status}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button type="button" onClick={() => startEdit(c)} className="rounded-lg px-2 py-1 text-[var(--travel-warm)] text-sm border border-[var(--travel-warm)] hover:bg-[var(--travel-warm)]/10">
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(c.id)} className="rounded-lg px-2 py-1 text-red-600 text-sm border border-red-200 hover:bg-red-50">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
