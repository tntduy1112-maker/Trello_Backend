import api from '../api/axiosInstance'

export const getLists = (boardId) => api.get(`/boards/${boardId}/lists`)
export const createList = (boardId, data) => api.post(`/boards/${boardId}/lists`, data)
export const updateList = (listId, data) => api.put(`/lists/${listId}`, data)
export const deleteList = (listId) => api.delete(`/lists/${listId}`)
export const archiveList = (listId) => api.post(`/lists/${listId}/archive`)
export const moveList = (listId, data) => api.post(`/lists/${listId}/move`, data)
