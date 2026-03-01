import { NavLink } from 'react-router-dom'

const EVEREST_BG = '/assets/mount-everest.png'

export default function POSNavBar() {
  return (
    <header className="relative h-[72px] flex-shrink-0 flex items-center justify-between px-12 border-b border-white/30 overflow-hidden">
      {/* Background window + glass (mountains visible through bar) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.35]"
        style={{ backgroundImage: `url(${EVEREST_BG})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-white/12 backdrop-blur-[28px]" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-white/10 pointer-events-none" aria-hidden />

      <div className="relative z-10 flex items-center gap-3">
        <img src="/assets/icons/logo.svg" alt="" className="w-7 h-7 flex-shrink-0" style={{ width: 28, height: 28 }} />
        <span className="text-[26px] font-bold text-[#2F7DFF]">Travel Wallet</span>
      </div>

      <nav className="relative z-10 flex items-center">
        {/* Segmented pill: glass with background window */}
        <div className="relative w-[280px] h-12 rounded-[24px] border border-white/30 overflow-hidden flex items-center p-1">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.35]"
            style={{ backgroundImage: `url(${EVEREST_BG})` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" aria-hidden />
          <span className="relative flex-1 flex items-center justify-center h-10 rounded-[20px] text-sm font-semibold text-white z-10">
            <span
              className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-[#4FA3FF] to-[#2F7DFF] shadow-[0_14px_40px_rgba(47,125,255,0.35)]"
              aria-hidden
            />
            <span className="relative z-10">POS</span>
          </span>
          <div
            className="relative z-10 mx-1 w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #94b8e0, #c5daf5)' }}
          >
            <span className="text-xs font-semibold text-[#0B1B3A]/70">?</span>
          </div>
          <NavLink
            to="/admin"
            end={false}
            className={({ isActive }) =>
              `relative flex-1 flex items-center justify-center h-10 rounded-[20px] text-sm font-semibold no-underline z-10 ${
                isActive ? 'text-white' : 'text-[#0B1B3A]/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-[#4FA3FF] to-[#2F7DFF] shadow-[0_14px_40px_rgba(47,125,255,0.35)]"
                    aria-hidden
                  />
                )}
                <span className="relative z-10">Admin</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </header>
  )
}
