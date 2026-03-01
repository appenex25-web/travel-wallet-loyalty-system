import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

type Message = { id: string; sender: string; body: string; createdAt: string }
type Thread = {
  id: string
  type: string
  subject: string | null
  readBySupportAt: string | null
  createdAt: string
  customer?: { id: string; name: string; tier: string }
  messages?: Message[]
}

export default function AdminMessages() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [selected, setSelected] = useState<Thread | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    const q = filter === 'read' ? '?read=true' : filter === 'unread' ? '?read=false' : ''
    api<Thread[]>(`/messages/threads${q}`)
      .then((list) => setThreads(Array.isArray(list) ? list : []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [filter])

  // Poll thread list so new messages/threads appear without reload (every 4s)
  useEffect(() => {
    const interval = setInterval(() => {
      const q = filter === 'read' ? '?read=true' : filter === 'unread' ? '?read=false' : ''
      api<Thread[]>(`/messages/threads${q}`)
        .then((list) => setThreads(Array.isArray(list) ? list : []))
        .catch(() => {})
    }, 4000)
    return () => clearInterval(interval)
  }, [filter])

  // Poll open thread messages so new replies appear in real time (every 3s)
  useEffect(() => {
    if (!selected?.id) return
    const interval = setInterval(() => {
      api<Thread>(`/messages/threads/${selected.id}/messages`)
        .then((t) => setSelected(t))
        .catch(() => {})
    }, 3000)
    return () => clearInterval(interval)
  }, [selected?.id])

  async function openThread(thread: Thread) {
    try {
      const t = await api<Thread>(`/messages/threads/${thread.id}/messages`)
      setSelected(t)
      setReplyBody('')
    } catch {
      setSelected(null)
    }
  }

  async function sendReply() {
    if (!selected || !replyBody.trim()) return
    setSending(true)
    try {
      await api(`/messages/threads/${selected.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: replyBody.trim() }),
      })
      setReplyBody('')
      const t = await api<Thread>(`/messages/threads/${selected.id}/messages`)
      setSelected(t)
      load()
    } finally {
      setSending(false)
    }
  }

  const lastMessage = (t: Thread) => {
    const ms = t.messages
    if (!ms?.length) return '—'
    const last = ms[ms.length - 1]
    const body = last.body || ''
    return body.length > 60 ? body.slice(0, 60) + '…' : body
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--travel-deep)] mb-6 text-center">Messages</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <span className="text-sm text-[var(--travel-muted)]">Filter:</span>
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${filter === f ? 'bg-[var(--travel-warm)] text-white' : 'bg-white/90 border border-[var(--travel-card-border)] text-[var(--travel-text)]'}`}
          >
            {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Read'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-[var(--travel-card-border)] overflow-hidden bg-white/90">
          <div className="p-4 border-b border-[var(--travel-card-border)] font-semibold text-[var(--travel-text)]">Inbox</div>
          {loading ? (
            <p className="p-4 text-[var(--travel-muted)]">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="p-4 text-[var(--travel-muted)]">No messages.</p>
          ) : (
            <ul className="divide-y divide-[var(--travel-card-border)] max-h-[60vh] overflow-y-auto">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t)}
                    className={`w-full text-left py-2 px-3 hover:bg-slate-50 ${selected?.id === t.id ? 'bg-blue-50 border-l-4 border-[var(--travel-warm)]' : ''}`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-[var(--travel-text)] text-sm truncate">{t.customer?.name ?? 'Customer'}</span>
                      {!t.readBySupportAt && <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500" title="Unread" />}
                    </div>
                    <div className="text-[11px] text-[var(--travel-muted)]">Tier: {t.customer?.tier ?? '—'}</div>
                    <div className="text-xs text-[var(--travel-muted)] mt-0.5 line-clamp-3 break-words">{lastMessage(t)}</div>
                    <div className="text-[10px] text-[var(--travel-muted)] mt-0.5">{new Date(t.createdAt).toLocaleString()}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-[var(--travel-card-border)] overflow-hidden bg-white/90 flex flex-col">
          {!selected ? (
            <div className="p-8 text-center text-[var(--travel-muted)]">Select a conversation</div>
          ) : (
            <>
              <div className="p-4 border-b border-[var(--travel-card-border)] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[var(--travel-text)]">{selected.customer?.name ?? 'Customer'}</span>
                  <span className="text-sm text-[var(--travel-muted)] ml-2">({selected.type})</span>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="text-sm text-[var(--travel-warm)]">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[40vh]">
                {(selected.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-3 py-2 text-sm ${m.sender === 'support' ? 'bg-blue-50 ml-4' : 'bg-slate-100 mr-4'}`}
                  >
                    <span className="font-medium text-[var(--travel-muted)]">{m.sender}</span>: {m.body}
                    <span className="block text-xs text-[var(--travel-muted)]">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[var(--travel-card-border)] flex gap-2">
                <input
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Reply…"
                  className="flex-1 rounded-xl border border-[var(--travel-card-border)] px-3 py-2 text-[var(--travel-text)]"
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={sending || !replyBody.trim()}
                  className="rounded-xl bg-[var(--travel-warm)] text-white px-4 py-2 disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
