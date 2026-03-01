import React from 'react'

export default function GlassCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        width: 360,
        height: 430,
        borderRadius: 28,
        background: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.30)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 22px 70px rgba(47,125,255,0.20)',
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#0B1B3A',
          opacity: 0.88,
          marginBottom: 16,
        }}
      >
        {title}
      </h3>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}
