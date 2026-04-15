import api from '../api/axiosInstance'

export const getCardActivity = (cardId, params) =>
  api.get(`/cards/${cardId}/activity`, { params })

export const getBoardActivity = (boardId, params) =>
  api.get(`/boards/${boardId}/activity`, { params })
