import React from 'react'

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
}

export default function Spinner({ size = 'md', color = 'border-white', className = '' }) {
  return (
    <div
      className={`
        rounded-full border-t-transparent animate-spin
        ${sizes[size]} ${color}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  )
}
