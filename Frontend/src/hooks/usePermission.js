import { useSelector } from 'react-redux'

const PERMISSION_MAP = {
  workspace: {
    create: ['owner', 'admin'],
    edit: ['owner', 'admin'],
    delete: ['owner'],
    invite: ['owner', 'admin'],
    removeMember: ['owner', 'admin'],
  },
  board: {
    create: ['owner', 'admin', 'member'],
    edit: ['owner', 'admin'],
    delete: ['owner', 'admin'],
    invite: ['owner', 'admin'],
    archive: ['owner', 'admin'],
  },
  card: {
    create: ['owner', 'admin', 'member'],
    edit: ['owner', 'admin', 'member'],
    delete: ['owner', 'admin'],
    assign: ['owner', 'admin', 'member'],
    comment: ['owner', 'admin', 'member', 'viewer'],
  },
}

export function usePermission(resource, action, userRole = 'member') {
  const { user } = useSelector((state) => state.auth)

  if (!user) return false

  const allowedRoles = PERMISSION_MAP[resource]?.[action] || []
  return allowedRoles.includes(userRole)
}
