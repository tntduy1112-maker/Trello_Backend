import api from '../api/axiosInstance'

export const getBoardLabels = (boardId) => api.get(`/boards/${boardId}/labels`)
export const createLabel = (boardId, data) => api.post(`/boards/${boardId}/labels`, data)
export const updateLabel = (labelId, data) => api.put(`/labels/${labelId}`, data)
export const deleteLabel = (labelId) => api.delete(`/labels/${labelId}`)
export const getCardLabels = (cardId) => api.get(`/cards/${cardId}/labels`)
export const addCardLabel = (cardId, labelId) => api.post(`/cards/${cardId}/labels/${labelId}`)
export const removeCardLabel = (cardId, labelId) => api.delete(`/cards/${cardId}/labels/${labelId}`)
