import React, { useState, useRef, useEffect } from 'react'

export default function Dropdown({
  trigger,
  items = [],
  align = 'left',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const alignClass = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={`
            absolute top-full mt-1 z-50 min-w-[180px] py-1
            bg-[#282E33] border border-[#454F59] rounded-lg shadow-2xl
            ${alignClass}
          `}
        >
          {items.map((item, i) => {
            if (item.separator) {
              return <div key={i} className="my-1 border-t border-[#454F59]" />
            }
            return (
              <button
                key={i}
                onClick={() => {
                  setOpen(false)
                  item.onClick?.()
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm text-left
                  transition-colors
                  ${item.danger
                    ? 'text-red-400 hover:bg-red-900/20'
                    : 'text-[#B6C2CF] hover:bg-[#2C333A]'
                  }
                `}
              >
                {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
