import React from 'react'

export default function PosInput({
  value,
  onChange,
  placeholder,
  iconSrc,
  type = 'text',
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  iconSrc?: string
  type?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'placeholder'>) {
  return (
    <div
      className="flex items-center h-11 gap-3 rounded-2xl px-4"
      style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.6)' }}
    >
      {iconSrc ? (
        <img src={iconSrc} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
      ) : null}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pos-input-spec"
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 14,
          fontWeight: 500,
          color: '#0B1B3A',
        }}
        {...rest}
      />
    </div>
  )
}
