import React from 'react'
import { Check } from 'lucide-react'

const DEFAULT_COLORS = [
  '#0052CC', '#00875A', '#FF5630', '#6554C0', '#FF8B00',
  '#172B4D', '#00B8D9', '#36B37E', '#DE350B', '#403294',
  '#00C7E6', '#57D9A3', '#FF7452', '#8777D9', '#2684FF',
  '#1D7AFC', '#22272B', '#454F59', '#738496', '#B6C2CF',
]

export default function ColorPicker({ value, onChange, colors = DEFAULT_COLORS }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-9 h-9 rounded-md flex items-center justify-center transition-transform hover:scale-110 border-2"
          style={{
            backgroundColor: color,
            borderColor: value === color ? '#ffffff' : 'transparent',
          }}
        >
          {value === color && <Check size={14} className="text-white" />}
        </button>
      ))}
    </div>
  )
}
