import React from 'react'
import Avatar from './Avatar'
import Tooltip from './Tooltip'

export default function AvatarStack({ users = [], max = 3, size = 'sm' }) {
  const visible = users.slice(0, max)
  const remaining = users.length - max

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <Tooltip key={user.id} content={user.full_name}>
          <div style={{ zIndex: visible.length - i, marginLeft: i === 0 ? 0 : '-8px' }}>
            <Avatar
              src={user.avatar_url}
              name={user.full_name}
              size={size}
              className="ring-2 ring-[#22272B]"
            />
          </div>
        </Tooltip>
      ))}
      {remaining > 0 && (
        <div
          className="w-8 h-8 rounded-full bg-[#454F59] flex items-center justify-center text-xs text-[#B6C2CF] ring-2 ring-[#22272B] font-medium"
          style={{ marginLeft: '-8px' }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
