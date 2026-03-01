import React from 'react'

export default function QuickTile({
  iconSrc,
  label,
  onClick,
}: {
  iconSrc: string
  label: string
  onClick?: () => void
}) {
  const style: React.CSSProperties = {
    width: 260,
    height: 92,
    borderRadius: 26,
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.30)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  }
  return (
    <>
      {onClick ? (
        <button type="button" onClick={onClick} style={{ ...style, cursor: 'pointer', padding: 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'linear-gradient(180deg, #4FA3FF 0%, #2F7DFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={iconSrc} alt="" style={{ width: 24, height: 24 }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#0B1B3A', opacity: 0.75 }}>
            {label}
          </span>
        </button>
      ) : (
        <div style={style}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'linear-gradient(180deg, #4FA3FF 0%, #2F7DFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={iconSrc} alt="" style={{ width: 24, height: 24 }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#0B1B3A', opacity: 0.75 }}>
            {label}
          </span>
        </div>
      )}
    </>
  )
}
