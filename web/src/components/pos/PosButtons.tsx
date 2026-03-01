import React from 'react'

export function PrimaryButton({
  className = '',
  disabled,
  children,
  style,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="h-[46px] rounded-[16px] bg-gradient-to-b from-[#4FA3FF] to-[#2F7DFF] shadow-[0_14px_40px_rgba(47,125,255,0.35)] text-white text-sm font-semibold border-none flex items-center justify-center px-5 hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:brightness-100"
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  className = '',
  children,
  style,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      style={{
        height: 46,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.25)',
        border: '1px solid rgba(255,255,255,0.45)',
        color: '#0B1B3A',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
