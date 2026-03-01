import React, { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { api } from '../../lib/api'

type SidebarItem = {
  label: string
  icon: React.ReactNode
  to: string
  end?: boolean
  badgeKey?: 'messages' | 'reservations'
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
      className={`
        relative overflow-hidden rounded-[28px]
        border border-white/35
        shadow-[0_22px_70px_rgba(47,125,255,0.20)]
        shadow-[0_0_45px_rgba(79,163,255,0.18)]
        ${className}
      `}
    >
      <div
        className="absolute inset-0 bg-cover bg-[position:center_top] opacity-[0.35]"
        style={{ backgroundImage: "url('/assets/bg-everest.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[28px]" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/8 to-white/10" aria-hidden />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}

function SidebarItemRow({ label, icon, to, end, badgeKey, badgeCount }: SidebarItem & { badgeCount?: number }) {
  const count = badgeCount ?? 0
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-[18px] text-sm font-medium no-underline transition
         ${isActive
           ? 'bg-gradient-to-r from-white/80 to-white/55 text-[rgba(11,27,58,0.9)] shadow-[0_14px_40px_rgba(47,125,255,0.35)]'
           : 'text-white/90 hover:bg-white/15 hover:text-white'
         }`
      }
    >
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/25 text-xs">
        {icon}
      </span>
      <span className="truncate flex-1">{label}</span>
      {badgeKey && count > 0 && (
        <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  )
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: '⌂', to: '/admin', end: true },
  { label: 'Campaigns', icon: '📢', to: '/admin/campaigns' },
  { label: 'Trip campaigns', icon: '🏔️', to: '/admin/trip-campaigns' },
  { label: 'Messages', icon: '💬', to: '/admin/messages', badgeKey: 'messages' },
  { label: 'Customers', icon: '👥', to: '/admin/customers' },
  { label: 'Bookings', icon: '📅', to: '/admin/bookings' },
  { label: 'Reservations', icon: '📋', to: '/admin/reservations', badgeKey: 'reservations' },
  { label: 'Hotels', icon: '🏨', to: '/admin/hotels' },
  { label: 'Flights', icon: '✈️', to: '/admin/flights' },
  { label: 'Vouchers', icon: '🎫', to: '/admin/vouchers' },
  { label: 'Rewards', icon: '🏆', to: '/admin/rewards' },
  { label: 'Gift Cards', icon: '💳', to: '/admin/gift-cards' },
  { label: 'Reports', icon: '📊', to: '/admin/reports' },
  { label: 'Settings', icon: '⚙️', to: '/admin/settings' },
]

export default function AdminLayout() {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingReservations, setPendingReservations] = useState(0)

  useEffect(() => {
    function fetchBadges() {
      api<{ id: string; readBySupportAt: string | null }[]>('/messages/threads?read=false')
        .then((list) => setUnreadMessages(Array.isArray(list) ? list.length : 0))
        .catch(() => setUnreadMessages(0))
      api<{ status: string }[]>('/bookings')
        .then((list) => setPendingReservations(Array.isArray(list) ? list.filter((b) => b.status === 'pending_confirmation').length : 0))
        .catch(() => setPendingReservations(0))
    }
    fetchBadges()
    const interval = setInterval(fetchBadges, 15000)
    return () => clearInterval(interval)
  }, [])

  const badgeCount = (key: 'messages' | 'reservations') => key === 'messages' ? unreadMessages : pendingReservations

  return (
    <div className="relative h-screen overflow-hidden text-[13px]">
      {/* Global Everest background */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url(/assets/bg-everest.jpg)" }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[rgba(234,246,255,0.45)] via-[rgba(79,163,255,0.10)] to-[rgba(47,125,255,0.06)]" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Body: sidebar + routed content */}
        <div className="flex flex-1 min-h-0 px-8 pt-6 pb-6 gap-6">
          {/* Sidebar */}
          <aside className="w-[270px] flex-shrink-0">
            <GlassSurface className="h-full rounded-[28px]">
              <div className="flex flex-col h-full pt-5 pb-4 px-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[rgba(11,27,58,0.6)]">
                    Navigation
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#FF7A45] to-[#FFB347] text-[10px] font-semibold text-white shadow-[0_8px_22px_rgba(255,144,85,0.5)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    Quick
                  </span>
                </div>
                <nav className="flex flex-col gap-1 text-white">
                  {sidebarItems.map((item) => (
                    <SidebarItemRow
                      key={item.to}
                      {...item}
                      badgeCount={item.badgeKey ? badgeCount(item.badgeKey) : undefined}
                    />
                  ))}
                </nav>
              </div>
            </GlassSurface>
          </aside>

          {/* Main content from nested routes */}
          <main className="flex-1 min-w-0 overflow-auto pr-1">
            <div className="max-w-5xl mx-auto flex flex-col gap-6 py-2">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

