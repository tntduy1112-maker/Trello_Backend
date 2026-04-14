import api from '../api/axiosInstance'

export const getBoards = (orgId) => api.get(`/organizations/${orgId}/boards`)
export const getBoard = (boardId) => api.get(`/boards/${boardId}`)
export const createBoard = (orgId, data) => api.post(`/organizations/${orgId}/boards`, data)
export const updateBoard = (boardId, data) => api.put(`/boards/${boardId}`, data)
export const deleteBoard = (boardId) => api.delete(`/boards/${boardId}`)
export const getBoardMembers = (boardId) => api.get(`/boards/${boardId}/members`)
export const inviteBoardMember = (boardId, data) => api.post(`/boards/${boardId}/members`, data)
export const updateBoardMemberRole = (boardId, memberId, role) =>
  api.put(`/boards/${boardId}/members/${memberId}`, { role })
export const removeBoardMember = (boardId, memberId) =>
  api.delete(`/boards/${boardId}/members/${memberId}`)
