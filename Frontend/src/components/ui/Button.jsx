import React from 'react'
import Spinner from './Spinner'

const variants = {
  primary: 'bg-[#0C66E4] hover:bg-[#0055CC] text-white border-transparent',
  secondary: 'bg-[#2C333A] hover:bg-[#38424B] text-[#B6C2CF] border-[#454F59]',
  danger: 'bg-[#C9372C] hover:bg-[#AE2E24] text-white border-transparent',
  ghost: 'bg-transparent hover:bg-[#2C333A] text-[#B6C2CF] border-transparent',
  success: 'bg-[#1F845A] hover:bg-[#216E4E] text-white border-transparent',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  icon,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded font-medium
        border transition-colors duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  )
}
