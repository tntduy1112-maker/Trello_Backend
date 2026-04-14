export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

export const PRIORITY_COLOR = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

export const PRIORITY_TEXT_COLOR = {
  low: 'text-blue-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

export const BOARD_VISIBILITY = {
  PRIVATE: 'private',
  WORKSPACE: 'workspace',
  PUBLIC: 'public',
}

export const WORKSPACE_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
}

export const BOARD_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
}

export const NOTIFICATION_TYPE = {
  CARD_ASSIGNED: 'card_assigned',
  DUE_DATE_REMINDER: 'due_date_reminder',
  MENTIONED: 'mentioned',
  COMMENT_ADDED: 'comment_added',
}

export const BOARD_BACKGROUNDS = [
  { type: 'color', value: '#0052CC', label: 'Blue' },
  { type: 'color', value: '#00875A', label: 'Green' },
  { type: 'color', value: '#DE350B', label: 'Red' },
  { type: 'color', value: '#6554C0', label: 'Purple' },
  { type: 'color', value: '#FF8B00', label: 'Orange' },
  { type: 'color', value: '#172B4D', label: 'Dark Blue' },
]
