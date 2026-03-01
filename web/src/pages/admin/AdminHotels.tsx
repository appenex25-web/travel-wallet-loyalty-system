import { useState, useEffect, useRef } from 'react'
import { api, uploadCampaignImages } from '../../lib/api'

const PRIMARY = '#2F7DFF'

type RoomTypeForm = {
  name: string
  description: string
  size: string
  amenities: string
  pricePerNight: string
  imageUrls: string
  imageFiles: File[]
}

type Hotel = {
  id: string
  name: string
  description: string | null
  location: string | null
  imageUrl: string | null
  imageUrls: string[] | null
  roomTypes: {
    name: string
    description?: string
    size?: string
    amenities?: string[]
    pricePerNight?: number
    priceDelta?: number
    imageUrls?: string[]
  }[] | null
  pricePerNight: number | null
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

const emptyRoomType = (): RoomTypeForm => ({
  name: '',
  description: '',
  size: '',
  amenities: '',
  pricePerNight: '',
  imageUrls: '',
  imageFiles: [],
})

export default function AdminHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formExpanded, setFormExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const roomFileInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    imageUrls: '',
    imageFiles: [] as File[],
    roomTypes: [emptyRoomType()] as RoomTypeForm[],
    currency: 'USD',
  })

  function load() {
    api<Hotel[]>('/hotels')
      .then(setHotels)
      .catch(() => setHotels([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setForm({
      name: '',
      description: '',
      location: '',
      imageUrls: '',
      imageFiles: [],
      roomTypes: [emptyRoomType()],
      currency: 'USD',
    })
    setEditingId(null)
    setFormExpanded(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    roomFileInputRefs.current.forEach((el) => { if (el) el.value = '' })
  }

  function loadHotelIntoForm(h: Hotel) {
    const imageUrls = (h.imageUrls && h.imageUrls.length > 0) ? h.imageUrls.join(', ') : (h.imageUrl || '')
    const roomTypes: RoomTypeForm[] =
      h.roomTypes && h.roomTypes.length > 0
        ? h.roomTypes.map((r) => ({
            name: r.name || '',
            description: r.description || '',
            size: r.size || '',
            amenities: Array.isArray(r.amenities) ? r.amenities.join('\n') : '',
            pricePerNight: r.pricePerNight != null ? String(r.pricePerNight) : (r.priceDelta != null ? String(r.priceDelta) : ''),
            imageUrls: (r.imageUrls && r.imageUrls.length) ? r.imageUrls.join(', ') : '',
            imageFiles: [],
          }))
        : [emptyRoomType()]
    setForm({
      name: h.name,
      description: h.description || '',
      location: h.location || '',
      imageUrls,
      imageFiles: [],
      roomTypes,
      currency: h.currency || 'USD',
    })
    setEditingId(h.id)
    setFormExpanded(true)
  }

  function addRoomType() {
    setForm((f) => ({ ...f, roomTypes: [...f.roomTypes, emptyRoomType()] }))
  }

  function removeRoomType(index: number) {
    setForm((f) => ({
      ...f,
      roomTypes: f.roomTypes.filter((_, i) => i !== index),
    }))
  }

  function updateRoomType(index: number, field: keyof RoomTypeForm, value: string | File[]) {
    setForm((f) => ({
      ...f,
      roomTypes: f.roomTypes.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }))
  }

  async function submitHotel(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setError('')
    try {
      let imageUrls: string[] = form.imageUrls
        ? form.imageUrls.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      if (form.imageFiles.length > 0) {
        setUploading(true)
        const { urls } = await uploadCampaignImages(form.imageFiles.slice(0, 10))
        imageUrls = [...imageUrls, ...urls].slice(0, 10)
        setUploading(false)
      }
      const roomTypesWithUrls: { name: string; description?: string; size?: string; amenities?: string[]; pricePerNight?: number; imageUrls?: string[] }[] = []
      for (const r of form.roomTypes.filter((rt) => rt.name.trim())) {
        let roomImageUrls = r.imageUrls
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        if (r.imageFiles.length > 0) {
          setUploading(true)
          const { urls } = await uploadCampaignImages(r.imageFiles.slice(0, 3))
          roomImageUrls = [...roomImageUrls, ...urls].slice(0, 5)
          setUploading(false)
        }
        roomTypesWithUrls.push({
          name: r.name.trim(),
          description: r.description.trim() || undefined,
          size: r.size.trim() || undefined,
          amenities: r.amenities
            .split(/[\n,]/)
            .map((a) => a.trim())
            .filter(Boolean),
          pricePerNight: r.pricePerNight ? parseFloat(r.pricePerNight) : undefined,
          imageUrls: roomImageUrls.length ? roomImageUrls : undefined,
        })
      }
      const roomTypes = roomTypesWithUrls
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        roomTypes: roomTypes.length ? roomTypes : undefined,
        currency: form.currency,
      }
      if (editingId) {
        await api(`/hotels/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        await api('/hotels', { method: 'POST', body: JSON.stringify(body) })
      }
      resetForm()
      load()
    } catch (err) {
      setUploading(false)
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function handleDeleteHotel(id: string) {
    if (!confirm('Delete this hotel? Bookings linked to it will keep the reference.')) return
    setError('')
    try {
      await api(`/hotels/${id}`, { method: 'DELETE' })
      resetForm()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-tight" style={{ color: PRIMARY }}>
          Hotels
        </h1>
        <p className="text-sm text-[rgba(11,27,58,0.65)]">
          In-depth hotel catalog: name, location, main pictures, and room types (description, size, amenities, pricing).
        </p>
      </div>
      {error && (
        <div className="text-[12px] text-rose-600 bg-rose-50/80 border border-rose-200 rounded-[16px] px-3 py-2 max-w-md">
          {error}
        </div>
      )}

      <GlassSurface>
        <button
          type="button"
          onClick={() => setFormExpanded((e) => !e)}
          className="w-full flex items-center justify-between p-5 text-left font-semibold text-[rgba(11,27,58,0.9)]"
        >
          <span>{editingId ? 'Edit hotel' : 'Add hotel'}</span>
          <span className="text-[20px]">{formExpanded ? '−' : '+'}</span>
        </button>
        {formExpanded && (
          <form onSubmit={submitHotel} className="px-5 pb-5 space-y-5 border-t border-white/30 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Hotel name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-full text-[13px] text-[rgba(11,27,58,0.9)]"
                  placeholder="e.g. Victoria Falls Lodge"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-full text-[13px] text-[rgba(11,27,58,0.9)]"
                  placeholder="City / area"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Hotel description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-full text-[13px] text-[rgba(11,27,58,0.9)] min-h-[80px]"
                placeholder="Brief description of the hotel"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgba(11,27,58,0.6)] mb-1">Main pictures (URLs comma-separated or upload)</label>
              <input
                type="text"
                value={form.imageUrls}
                onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
                className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 w-full text-[13px] text-[rgba(11,27,58,0.9)] mb-2"
                placeholder="https://… or upload below"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setForm((f) => ({ ...f, imageFiles: Array.from(e.target.files || []) }))}
                className="text-[12px] text-[rgba(11,27,58,0.8)]"
              />
              {form.imageFiles.length > 0 && (
                <p className="text-[11px] text-[rgba(11,27,58,0.6)] mt-1">
                  {form.imageFiles.length} file(s) selected. Will upload on save.
                </p>
              )}
              {uploading && <p className="text-amber-600 text-[12px] mt-1">Uploading…</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-medium text-[rgba(11,27,58,0.6)]">Room types</label>
                <button
                  type="button"
                  onClick={addRoomType}
                  className="text-[12px] font-medium rounded-lg px-3 py-1 border border-white/40 bg-white/30 hover:bg-white/50"
                >
                  + Add room type
                </button>
              </div>
              <div className="space-y-4">
                {form.roomTypes.map((r, index) => (
                  <div key={index} className="rounded-xl border border-white/40 bg-white/20 p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[12px] font-semibold text-[rgba(11,27,58,0.8)]">Room type {index + 1}</span>
                      {form.roomTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoomType(index)}
                          className="text-rose-600 text-[11px] hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[rgba(11,27,58,0.5)] mb-0.5">Name *</label>
                        <input
                          value={r.name}
                          onChange={(e) => updateRoomType(index, 'name', e.target.value)}
                          className="rounded-lg border border-white/40 bg-white/50 px-2 py-1.5 w-full text-[12px]"
                          placeholder="e.g. Standard Double"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[rgba(11,27,58,0.5)] mb-0.5">Price per night (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={r.pricePerNight}
                          onChange={(e) => updateRoomType(index, 'pricePerNight', e.target.value)}
                          className="rounded-lg border border-white/40 bg-white/50 px-2 py-1.5 w-full text-[12px]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[rgba(11,27,58,0.5)] mb-0.5">Description</label>
                      <textarea
                        value={r.description}
                        onChange={(e) => updateRoomType(index, 'description', e.target.value)}
                        className="rounded-lg border border-white/40 bg-white/50 px-2 py-1.5 w-full text-[12px] min-h-[60px]"
                        placeholder="Room description"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[rgba(11,27,58,0.5)] mb-0.5">Size (e.g. 25 sq m)</label>
                        <input
                          value={r.size}
                          onChange={(e) => updateRoomType(index, 'size', e.target.value)}
                          className="rounded-lg border border-white/40 bg-white/50 px-2 py-1.5 w-full text-[12px]"
                          placeholder="25 sq m"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[rgba(11,27,58,0.5)] mb-0.5">Amenities (one per line or comma-separated)</label>
                        <textarea
                          value={r.amenities}
                          onChange={(e) => updateRoomType(index, 'amenities', e.target.value)}
                          className="rounded-lg border border-white/40 bg-white/50 px-2 py-1.5 w-full text-[12px] min-h-[60px]"
                          placeholder="WiFi, AC, Safe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[rgba(11,27,58,0.5)] mb-0.5">Room images (upload or URLs)</label>
                      <input
                        type="text"
                        value={r.imageUrls}
                        onChange={(e) => updateRoomType(index, 'imageUrls', e.target.value)}
                        className="rounded-lg border border-white/40 bg-white/50 px-2 py-1.5 w-full text-[12px] mb-1"
                        placeholder="URLs comma-separated (optional)"
                      />
                      <input
                        ref={(el) => { roomFileInputRefs.current[index] = el }}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => updateRoomType(index, 'imageFiles', Array.from(e.target.files || []))}
                        className="text-[12px] text-[rgba(11,27,58,0.8)]"
                      />
                      {r.imageFiles.length > 0 && (
                        <p className="text-[11px] text-[rgba(11,27,58,0.6)] mt-0.5">
                          {r.imageFiles.length} file(s) selected. Will upload on save.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="rounded-xl px-4 py-2 font-medium text-white shadow-[0_8px_22px_rgba(47,125,255,0.4)] disabled:opacity-50"
                style={{ background: `linear-gradient(180deg, #5BB6FF 0%, ${PRIMARY} 100%)` }}
              >
                {editingId ? 'Update hotel' : 'Add hotel'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-xl px-4 py-2 border border-white/40 text-[rgba(11,27,58,0.8)] font-medium">
                Cancel
              </button>
            </div>
          </form>
        )}
      </GlassSurface>

      <GlassSurface>
        <div className="p-5">
          <h2 className="text-[15px] font-semibold text-[rgba(11,27,58,0.9)] mb-3">Hotel catalog</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] text-[rgba(11,27,58,0.85)]">
              <thead className="text-[11px] uppercase tracking-[0.12em] text-[rgba(11,27,58,0.5)]">
                <tr>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Location</th>
                  <th className="pb-2 pr-4">Room types</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-3 text-[rgba(11,27,58,0.6)]">
                      Loading…
                    </td>
                  </tr>
                ) : hotels.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-3 text-[rgba(11,27,58,0.6)]">
                      No hotels. Add one above.
                    </td>
                  </tr>
                ) : (
                  hotels.map((h) => (
                    <tr key={h.id} className="border-t border-white/40">
                      <td className="py-2 pr-4 font-medium">{h.name}</td>
                      <td className="py-2 pr-4 text-[rgba(11,27,58,0.75)]">{h.location ?? '—'}</td>
                      <td className="py-2 pr-4">
                        {h.roomTypes && h.roomTypes.length > 0
                          ? h.roomTypes.map((r) => r.name).join(', ')
                          : '—'}
                      </td>
                      <td className="py-2 max-w-[200px] truncate text-[rgba(11,27,58,0.7)]">{h.description ?? '—'}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => loadHotelIntoForm(h)}
                          className="text-[#2F7DFF] hover:underline text-[11px] font-medium mr-2"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHotel(h.id)}
                          className="text-rose-600 hover:text-rose-700 text-[11px] font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassSurface>
    </div>
  )
}
