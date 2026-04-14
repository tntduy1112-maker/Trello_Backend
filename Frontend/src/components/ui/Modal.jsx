import React, { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`
          relative w-full bg-[#282E33] rounded-lg shadow-2xl
          max-h-[90vh] overflow-y-auto
          ${sizes[size]} ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-[#454F59]">
            <h2 className="text-lg font-semibold text-[#B6C2CF]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#454F59] text-[#8C9BAB] hover:text-[#B6C2CF] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
