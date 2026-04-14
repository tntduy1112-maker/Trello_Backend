import React from 'react'
import { getInitials, generateAvatarColor } from '../../utils/helpers'

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

export default function Avatar({ src, name, size = 'md', className = '', onClick }) {
  const initials = getInitials(name)
  const bgColor = generateAvatarColor(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onClick={onClick}
        className={`
          ${sizes[size]} rounded-full object-cover flex-shrink-0
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      />
    )
  }

  return (
    <div
      onClick={onClick}
      className={`
        ${sizes[size]} rounded-full flex items-center justify-center
        font-semibold text-white flex-shrink-0 select-none
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {initials}
    </div>
  )
}
