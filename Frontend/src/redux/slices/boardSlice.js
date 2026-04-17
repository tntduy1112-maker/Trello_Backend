import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getBoard } from '../../services/board.service'
import { getLists, createList, updateList as updateListApi } from '../../services/list.service'
import { getCards, createCard, updateCard as updateCardApi, deleteCard as deleteCardApi, getComments as getCommentsApi, addComment as addCommentApi, updateComment as updateCommentApi, deleteComment as deleteCommentApi, getAttachments as getAttachmentsApi, addAttachment as addAttachmentApi, deleteAttachment as deleteAttachmentApi, toggleAttachmentCover as toggleAttachmentCoverApi } from '../../services/card.service'
import {
  getBoardLabels,
  createLabel as createLabelApi,
  updateLabel as updateLabelApi,
  deleteLabel as deleteLabelApi,
  addCardLabel as addCardLabelApi,
  removeCardLabel as removeCardLabelApi,
} from '../../services/label.service'
import { getCardActivity as getCardActivityApi } from '../../services/activityLog.service'

export const fetchBoard = createAsyncThunk(
  'board/fetchBoard',
  async (boardId, { rejectWithValue }) => {
    try {
      const res = await getBoard(boardId)
      return res.data.data.board
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load board')
    }
  }
)

export const fetchBoardLists = createAsyncThunk(
  'board/fetchBoardLists',
  async (boardId, { rejectWithValue }) => {
    try {
      const listsRes = await getLists(boardId)
      const lists = listsRes.data.data.lists

      const cardsResults = await Promise.all(
        lists.map((list) =>
          getCards(list.id)
            .then((r) => ({ listId: list.id, cards: r.data.data.cards }))
            .catch(() => ({ listId: list.id, cards: [] }))
        )
      )

      const cards = {}
      cardsResults.forEach(({ listId, cards: listCards }) => {
        cards[listId] = listCards
      })

      return { lists, cards }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load lists')
    }
  }
)

export const createListThunk = createAsyncThunk(
  'board/createList',
  async ({ boardId, name }, { rejectWithValue }) => {
    try {
      const res = await createList(boardId, { name })
      return res.data.data.list
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create list')
    }
  }
)

export const createCardThunk = createAsyncThunk(
  'board/createCard',
  async ({ listId, title }, { rejectWithValue }) => {
    try {
      const res = await createCard(listId, { title })
      return { listId, card: res.data.data.card }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create card')
    }
  }
)

export const saveCardThunk = createAsyncThunk(
  'board/saveCard',
  async ({ cardId, listId, data }, { rejectWithValue }) => {
    try {
      const res = await updateCardApi(cardId, data)
      return { listId, card: res.data.data.card }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save card')
    }
  }
)

export const deleteCardThunk = createAsyncThunk(
  'board/deleteCardApi',
  async ({ cardId, listId }, { rejectWithValue }) => {
    try {
      await deleteCardApi(cardId)
      return { cardId, listId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete card')
    }
  }
)

// ── Labels ────────────────────────────────────────────────────────────────────

export const fetchBoardLabels = createAsyncThunk(
  'board/fetchBoardLabels',
  async (boardId, { rejectWithValue }) => {
    try {
      const res = await getBoardLabels(boardId)
      return res.data.data.labels
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load labels')
    }
  }
)

export const createLabelThunk = createAsyncThunk(
  'board/createLabel',
  async ({ boardId, name, color }, { rejectWithValue }) => {
    try {
      const res = await createLabelApi(boardId, { name, color })
      return res.data.data.label
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create label')
    }
  }
)

export const updateLabelThunk = createAsyncThunk(
  'board/updateLabel',
  async ({ labelId, name, color }, { rejectWithValue }) => {
    try {
      const res = await updateLabelApi(labelId, { name, color })
      return res.data.data.label
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update label')
    }
  }
)

export const deleteLabelThunk = createAsyncThunk(
  'board/deleteLabel',
  async (labelId, { rejectWithValue }) => {
    try {
      await deleteLabelApi(labelId)
      return labelId
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete label')
    }
  }
)

export const addCardLabelThunk = createAsyncThunk(
  'board/addCardLabel',
  async ({ cardId, labelId, listId }, { rejectWithValue }) => {
    try {
      const res = await addCardLabelApi(cardId, labelId)
      return { cardId, listId, labels: res.data.data.labels }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add label')
    }
  }
)

export const removeCardLabelThunk = createAsyncThunk(
  'board/removeCardLabel',
  async ({ cardId, labelId, listId }, { rejectWithValue }) => {
    try {
      const res = await removeCardLabelApi(cardId, labelId)
      return { cardId, listId, labels: res.data.data.labels }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove label')
    }
  }
)

// ── Comments ──────────────────────────────────────────────────────────────────

export const fetchCardComments = createAsyncThunk(
  'board/fetchCardComments',
  async (cardId, { rejectWithValue }) => {
    try {
      const res = await getCommentsApi(cardId)
      return res.data.data.comments
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load comments')
    }
  }
)

export const addCommentThunk = createAsyncThunk(
  'board/addComment',
  async ({ cardId, content, parentId = null }, { rejectWithValue }) => {
    try {
      const res = await addCommentApi(cardId, { content, parentId })
      return { comment: res.data.data.comment, parentId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add comment')
    }
  }
)

export const editCommentThunk = createAsyncThunk(
  'board/editComment',
  async ({ commentId, content, parentId = null }, { rejectWithValue }) => {
    try {
      const res = await updateCommentApi(commentId, { content })
      return { comment: res.data.data.comment, parentId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to edit comment')
    }
  }
)

export const deleteCommentThunk = createAsyncThunk(
  'board/deleteComment',
  async ({ commentId, parentId = null }, { rejectWithValue }) => {
    try {
      await deleteCommentApi(commentId)
      return { commentId, parentId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete comment')
    }
  }
)

// ── Attachments ───────────────────────────────────────────────────────────────

export const fetchCardAttachments = createAsyncThunk(
  'board/fetchCardAttachments',
  async (cardId, { rejectWithValue }) => {
    try {
      const res = await getAttachmentsApi(cardId)
      return res.data.data.attachments
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load attachments')
    }
  }
)

export const addAttachmentThunk = createAsyncThunk(
  'board/addAttachment',
  async ({ cardId, listId, formData }, { rejectWithValue }) => {
    try {
      const res = await addAttachmentApi(cardId, formData)
      return { listId, cardId, attachment: res.data.data.attachment }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to upload attachment')
    }
  }
)

export const deleteAttachmentThunk = createAsyncThunk(
  'board/deleteAttachment',
  async ({ cardId, listId, attachmentId }, { rejectWithValue }) => {
    try {
      await deleteAttachmentApi(cardId, attachmentId)
      return { cardId, listId, attachmentId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete attachment')
    }
  }
)

export const toggleAttachmentCoverThunk = createAsyncThunk(
  'board/toggleAttachmentCover',
  async ({ cardId, listId, attachmentId }, { rejectWithValue }) => {
    try {
      const res = await toggleAttachmentCoverApi(cardId, attachmentId)
      const { isCover, coverImageUrl } = res.data.data
      return { cardId, listId, attachmentId, isCover, coverImageUrl }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update cover')
    }
  }
)

export const fetchCardActivity = createAsyncThunk(
  'board/fetchCardActivity',
  async (cardId, { rejectWithValue }) => {
    try {
      const res = await getCardActivityApi(cardId)
      return res.data.data.logs
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load activity')
    }
  }
)

/**
 * Persist card position/list change to backend after DnD.
 * Fire-and-forget style: state is already updated optimistically by the DnD handlers.
 */
export const persistCardMoveThunk = createAsyncThunk(
  'board/persistCardMove',
  async ({ cardId, listId, position }, { rejectWithValue }) => {
    try {
      await updateCardApi(cardId, { listId, position })
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to persist card move')
    }
  }
)

/**
 * Persist list position change to backend after DnD.
 */
export const persistListPositionThunk = createAsyncThunk(
  'board/persistListPosition',
  async ({ listId, position }, { rejectWithValue }) => {
    try {
      await updateListApi(listId, { position })
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to persist list position')
    }
  }
)

/**
 * Move a card to a different list from the Card Detail modal.
 * Optimistically updates Redux state then persists to backend.
 */
export const moveCardFromModalThunk = createAsyncThunk(
  'board/moveCardFromModal',
  async ({ cardId, fromListId, toListId }, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState()
      const targetCards = state.board.cards[toListId] || []
      const lastPosition = targetCards.length > 0
        ? Math.max(...targetCards.map((c) => c.position || 0))
        : 0
      const position = lastPosition + 1024

      dispatch(moveCardBetweenLists({ cardId, fromListId, toListId }))
      await updateCardApi(cardId, { listId: toListId, position })
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to move card')
    }
  }
)

// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  boards: [],
  currentBoard: null,
  lists: [],
  cards: {},
  boardLabels: [],
  cardComments: [],
  cardAttachments: [],
  cardActivity: [],
  openCardId: null,
  loadingBoard: false,
  loadingLists: false,
  loadingComments: false,
  loadingAttachments: false,
  loadingActivity: false,
}

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setBoards: (state, action) => {
      state.boards = action.payload
    },
    setCurrentBoard: (state, action) => {
      state.currentBoard = action.payload
    },
    setLists: (state, action) => {
      state.lists = action.payload
    },
    setCards: (state, action) => {
      state.cards = action.payload
    },
    clearBoard: (state) => {
      state.currentBoard = null
      state.lists = []
      state.cards = {}
      state.boardLabels = []
      state.cardAttachments = []
      state.loadingBoard = false
      state.loadingLists = false
      state.loadingAttachments = false
    },
    moveCard: (state, action) => {
      const { cardId, fromListId, toListId, toIndex } = action.payload
      const fromCards = state.cards[fromListId] || []
      const cardIndex = fromCards.findIndex((c) => c.id === cardId)
      if (cardIndex === -1) return
      const [card] = fromCards.splice(cardIndex, 1)
      if (!state.cards[toListId]) state.cards[toListId] = []
      state.cards[toListId].splice(toIndex, 0, card)
    },
    moveCardBetweenLists: (state, action) => {
      const { cardId, fromListId, toListId } = action.payload
      const fromCards = state.cards[fromListId] || []
      const cardIndex = fromCards.findIndex((c) => c.id === cardId)
      if (cardIndex === -1) return
      const [card] = fromCards.splice(cardIndex, 1)
      card.list_id = toListId
      if (!state.cards[toListId]) state.cards[toListId] = []
      state.cards[toListId].push(card)
    },
    moveList: (state, action) => {
      const { fromIndex, toIndex } = action.payload
      const [list] = state.lists.splice(fromIndex, 1)
      state.lists.splice(toIndex, 0, list)
    },
    addCard: (state, action) => {
      const { listId, card } = action.payload
      if (!state.cards[listId]) state.cards[listId] = []
      state.cards[listId].push(card)
    },
    updateCard: (state, action) => {
      const { listId, cardId, updates } = action.payload
      if (state.cards[listId]) {
        const idx = state.cards[listId].findIndex((c) => c.id === cardId)
        if (idx !== -1) {
          state.cards[listId][idx] = { ...state.cards[listId][idx], ...updates }
        }
      }
    },
    deleteCard: (state, action) => {
      const { listId, cardId } = action.payload
      if (state.cards[listId]) {
        state.cards[listId] = state.cards[listId].filter((c) => c.id !== cardId)
      }
    },
    addList: (state, action) => {
      state.lists.push(action.payload)
      state.cards[action.payload.id] = []
    },
    updateList: (state, action) => {
      const { listId, updates } = action.payload
      const idx = state.lists.findIndex((l) => l.id === listId)
      if (idx !== -1) {
        state.lists[idx] = { ...state.lists[idx], ...updates }
      }
    },
    deleteList: (state, action) => {
      const listId = action.payload
      state.lists = state.lists.filter((l) => l.id !== listId)
      delete state.cards[listId]
    },
    setOpenCardId: (state, action) => {
      state.openCardId = action.payload
    },
    injectCardActivity: (state, action) => {
      const event = action.payload
      // Only inject if this card's modal is currently open
      if (state.openCardId !== event.entity_id) return
      // De-duplicate: discard if we already have this event id
      if (state.cardActivity.some((a) => a.id === event.id)) return
      // Prepend — activity list is sorted newest-first
      state.cardActivity.unshift(event)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoard.pending, (state) => {
        state.loadingBoard = true
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.loadingBoard = false
        state.currentBoard = action.payload
      })
      .addCase(fetchBoard.rejected, (state) => {
        state.loadingBoard = false
      })
      .addCase(fetchBoardLists.pending, (state) => {
        state.loadingLists = true
      })
      .addCase(fetchBoardLists.fulfilled, (state, action) => {
        state.loadingLists = false
        state.lists = action.payload.lists
        state.cards = action.payload.cards
      })
      .addCase(fetchBoardLists.rejected, (state) => {
        state.loadingLists = false
      })
      .addCase(createListThunk.fulfilled, (state, action) => {
        state.lists.push(action.payload)
        state.cards[action.payload.id] = []
      })
      .addCase(createCardThunk.fulfilled, (state, action) => {
        const { listId, card } = action.payload
        if (!state.cards[listId]) state.cards[listId] = []
        state.cards[listId].push(card)
      })
      .addCase(saveCardThunk.fulfilled, (state, action) => {
        const { listId, card } = action.payload
        if (state.cards[listId]) {
          const idx = state.cards[listId].findIndex((c) => c.id === card.id)
          if (idx !== -1) state.cards[listId][idx] = card
        }
      })
      .addCase(deleteCardThunk.fulfilled, (state, action) => {
        const { cardId, listId } = action.payload
        if (state.cards[listId]) {
          state.cards[listId] = state.cards[listId].filter((c) => c.id !== cardId)
        }
      })
      // Labels
      .addCase(fetchBoardLabels.fulfilled, (state, action) => {
        state.boardLabels = action.payload
      })
      .addCase(createLabelThunk.fulfilled, (state, action) => {
        state.boardLabels.push(action.payload)
      })
      .addCase(updateLabelThunk.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.boardLabels.findIndex((l) => l.id === updated.id)
        if (idx !== -1) state.boardLabels[idx] = updated
        // Sync updated label into all cards
        Object.values(state.cards).forEach((cardList) => {
          cardList.forEach((card) => {
            if (card.labels) {
              const li = card.labels.findIndex((l) => l.id === updated.id)
              if (li !== -1) card.labels[li] = { id: updated.id, name: updated.name, color: updated.color }
            }
          })
        })
      })
      .addCase(deleteLabelThunk.fulfilled, (state, action) => {
        const labelId = action.payload
        state.boardLabels = state.boardLabels.filter((l) => l.id !== labelId)
        // Remove deleted label from all cards
        Object.values(state.cards).forEach((cardList) => {
          cardList.forEach((card) => {
            if (card.labels) {
              card.labels = card.labels.filter((l) => l.id !== labelId)
            }
          })
        })
      })
      .addCase(addCardLabelThunk.fulfilled, (state, action) => {
        const { listId, cardId, labels } = action.payload
        if (state.cards[listId]) {
          const card = state.cards[listId].find((c) => c.id === cardId)
          if (card) card.labels = labels
        }
      })
      .addCase(removeCardLabelThunk.fulfilled, (state, action) => {
        const { listId, cardId, labels } = action.payload
        if (state.cards[listId]) {
          const card = state.cards[listId].find((c) => c.id === cardId)
          if (card) card.labels = labels
        }
      })
      // Comments
      .addCase(fetchCardComments.pending, (state) => {
        state.loadingComments = true
      })
      .addCase(fetchCardComments.fulfilled, (state, action) => {
        state.loadingComments = false
        state.cardComments = action.payload
      })
      .addCase(fetchCardComments.rejected, (state) => {
        state.loadingComments = false
        state.cardComments = []
      })
      .addCase(addCommentThunk.fulfilled, (state, action) => {
        const { comment, parentId } = action.payload
        if (parentId) {
          const parent = state.cardComments.find((c) => c.id === parentId)
          if (parent) {
            if (!Array.isArray(parent.replies)) parent.replies = []
            parent.replies.push(comment)
          }
        } else {
          state.cardComments.push({ ...comment, replies: [] })
        }
      })
      .addCase(editCommentThunk.fulfilled, (state, action) => {
        const { comment, parentId } = action.payload
        if (parentId) {
          const parent = state.cardComments.find((c) => c.id === parentId)
          if (parent) {
            const idx = (parent.replies || []).findIndex((r) => r.id === comment.id)
            if (idx !== -1) parent.replies[idx] = { ...parent.replies[idx], ...comment }
          }
        } else {
          const idx = state.cardComments.findIndex((c) => c.id === comment.id)
          if (idx !== -1) state.cardComments[idx] = { ...state.cardComments[idx], ...comment }
        }
      })
      .addCase(deleteCommentThunk.fulfilled, (state, action) => {
        const { commentId, parentId } = action.payload
        if (parentId) {
          const parent = state.cardComments.find((c) => c.id === parentId)
          if (parent) parent.replies = (parent.replies || []).filter((r) => r.id !== commentId)
        } else {
          state.cardComments = state.cardComments.filter((c) => c.id !== commentId)
        }
      })
      // Attachments
      .addCase(fetchCardAttachments.pending, (state) => {
        state.loadingAttachments = true
      })
      .addCase(fetchCardAttachments.fulfilled, (state, action) => {
        state.loadingAttachments = false
        state.cardAttachments = action.payload
      })
      .addCase(fetchCardAttachments.rejected, (state) => {
        state.loadingAttachments = false
        state.cardAttachments = []
      })
      .addCase(addAttachmentThunk.fulfilled, (state, action) => {
        const { listId, cardId, attachment } = action.payload
        state.cardAttachments.unshift(attachment)
        // Increment attachment_count on the card
        if (state.cards[listId]) {
          const card = state.cards[listId].find((c) => c.id === cardId)
          if (card) card.attachment_count = (card.attachment_count || 0) + 1
        }
      })
      .addCase(deleteAttachmentThunk.fulfilled, (state, action) => {
        const { listId, cardId, attachmentId } = action.payload
        const removed = state.cardAttachments.find((a) => a.id === attachmentId)
        state.cardAttachments = state.cardAttachments.filter((a) => a.id !== attachmentId)
        // Decrement attachment_count and clear cover_image_url if needed
        if (state.cards[listId]) {
          const card = state.cards[listId].find((c) => c.id === cardId)
          if (card) {
            card.attachment_count = Math.max(0, (card.attachment_count || 1) - 1)
            if (removed?.is_cover) card.cover_image_url = null
          }
        }
      })
      .addCase(toggleAttachmentCoverThunk.fulfilled, (state, action) => {
        const { listId, cardId, attachmentId, isCover, coverImageUrl } = action.payload
        // Update is_cover flag on all attachments
        state.cardAttachments = state.cardAttachments.map((a) => ({
          ...a,
          is_cover: a.id === attachmentId ? isCover : false,
        }))
        // Sync cover_image_url onto the card in the board state
        if (state.cards[listId]) {
          const card = state.cards[listId].find((c) => c.id === cardId)
          if (card) card.cover_image_url = coverImageUrl
        }
      })
      // Activity
      .addCase(fetchCardActivity.pending, (state) => {
        state.loadingActivity = true
      })
      .addCase(fetchCardActivity.fulfilled, (state, action) => {
        state.loadingActivity = false
        state.cardActivity = action.payload
      })
      .addCase(fetchCardActivity.rejected, (state) => {
        state.loadingActivity = false
        state.cardActivity = []
      })
  },
})

export const {
  setBoards, setCurrentBoard, setLists, setCards, clearBoard,
  moveCard, moveCardBetweenLists, moveList, addCard, updateCard, deleteCard,
  addList, updateList, deleteList,
  setOpenCardId, injectCardActivity,
} = boardSlice.actions
export default boardSlice.reducer
