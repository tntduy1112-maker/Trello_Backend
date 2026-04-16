import api from '../api/axiosInstance'

export const previewInvitation = (token) => api.get(`/invitations/${token}`)
export const acceptInvitation  = (token) => api.post(`/invitations/${token}/accept`)
