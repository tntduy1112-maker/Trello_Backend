import React from 'react'

const variants = {
  blue: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
  green: 'bg-green-900/60 text-green-300 border border-green-700/50',
  yellow: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
  red: 'bg-red-900/60 text-red-300 border border-red-700/50',
  gray: 'bg-[#2C333A] text-[#8C9BAB] border border-[#454F59]',
  orange: 'bg-orange-900/60 text-orange-300 border border-orange-700/50',
  purple: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
}

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
