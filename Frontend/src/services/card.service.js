import api from '../api/axiosInstance'

export const getCards = (listId) => api.get(`/lists/${listId}/cards`)
export const getCard = (cardId) => api.get(`/cards/${cardId}`)
export const createCard = (listId, data) => api.post(`/lists/${listId}/cards`, data)
export const updateCard = (cardId, data) => api.put(`/cards/${cardId}`, data)
export const deleteCard = (cardId) => api.delete(`/cards/${cardId}`)
export const archiveCard = (cardId) => api.post(`/cards/${cardId}/archive`)
export const moveCard = (cardId, data) => api.post(`/cards/${cardId}/move`, data)
export const assignMember = (cardId, memberId) => api.post(`/cards/${cardId}/members/${memberId}`)
export const unassignMember = (cardId, memberId) => api.delete(`/cards/${cardId}/members/${memberId}`)
export const getComments = (cardId) => api.get(`/cards/${cardId}/comments`)
export const addComment = (cardId, data) => api.post(`/cards/${cardId}/comments`, data)
export const updateComment = (commentId, data) => api.put(`/comments/${commentId}`, data)
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`)
export const getAttachments = (cardId) => api.get(`/cards/${cardId}/attachments`)
export const addAttachment = (cardId, formData) =>
  api.post(`/cards/${cardId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const deleteAttachment = (cardId, attachmentId) =>
  api.delete(`/cards/${cardId}/attachments/${attachmentId}`)
export const toggleAttachmentCover = (cardId, attachmentId) =>
  api.patch(`/cards/${cardId}/attachments/${attachmentId}/cover`)
