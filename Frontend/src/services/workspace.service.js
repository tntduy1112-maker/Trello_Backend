import api from '../api/axiosInstance'

export const getWorkspaces = () => api.get('/organizations')
export const getWorkspace = (id) => api.get(`/organizations/${id}`)
export const createWorkspace = (data) => api.post('/organizations', data)
export const updateWorkspace = (id, data) => api.put(`/organizations/${id}`, data)
export const deleteWorkspace = (id) => api.delete(`/organizations/${id}`)
export const getWorkspaceMembers = (id) => api.get(`/organizations/${id}/members`)
export const inviteMember = (id, data) => api.post(`/organizations/${id}/members`, data)
export const updateMemberRole = (workspaceId, memberId, role) =>
  api.put(`/organizations/${workspaceId}/members/${memberId}`, { role })
export const removeMember = (workspaceId, memberId) =>
  api.delete(`/organizations/${workspaceId}/members/${memberId}`)
