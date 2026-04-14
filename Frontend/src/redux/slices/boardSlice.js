import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getBoard } from '../../services/board.service'
import { getLists, createList } from '../../services/list.service'
import { getCards, createCard, updateCard as updateCardApi, deleteCard as deleteCardApi } from '../../services/card.service'

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

const initialState = {
  boards: [],
  currentBoard: null,
  lists: [],
  cards: {},
  loadingBoard: false,
  loadingLists: false,
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
      state.loadingBoard = false
      state.loadingLists = false
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
  },
})

export const {
  setBoards, setCurrentBoard, setLists, setCards, clearBoard,
  moveCard, moveList, addCard, updateCard, deleteCard,
  addList, updateList, deleteList,
} = boardSlice.actions
export default boardSlice.reducer
