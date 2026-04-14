import React from 'react'

export default function ProgressBar({ completed = 0, total = 0, className = '' }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = percent === 100

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-[#8C9BAB] min-w-[35px]">{percent}%</span>
      <div className="flex-1 h-1.5 bg-[#454F59] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-[#0C66E4]'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
