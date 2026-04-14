import { format, formatDistance, isYesterday, isToday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { PRIORITY_COLOR } from '../data/constants'

export function formatDate(date) {
  if (!date) return ''
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatRelativeTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (isYesterday(d)) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  return format(d, 'dd/MM/yyyy')
}

export function getPriorityColor(priority) {
  return PRIORITY_COLOR[priority] || 'bg-gray-500'
}

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const AVATAR_COLORS = [
  '#0052CC', '#00875A', '#FF5630', '#6554C0', '#FF8B00',
  '#00B8D9', '#36B37E', '#FF7452', '#8777D9', '#2684FF',
]

export function generateAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function isOverdue(date) {
  if (!date) return false
  return new Date(date) < new Date()
}

export function isDueSoon(date) {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  const diffMs = d - now
  return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000
}

export function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password) {
  return password && password.length >= 8
}
