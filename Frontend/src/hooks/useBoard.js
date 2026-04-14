import { useSelector, useDispatch } from 'react-redux'
import { setBoards, setCurrentBoard, setLists, setCards, moveCard, moveList } from '../redux/slices/boardSlice'

export function useBoard() {
  const dispatch = useDispatch()
  const { boards, currentBoard, lists, cards } = useSelector((state) => state.board)

  const loadBoard = (boardId) => {
    // In real app, fetch from API
    const board = boards.find((b) => b.id === boardId)
    if (board) dispatch(setCurrentBoard(board))
  }

  const handleMoveCard = (cardId, fromListId, toListId, toIndex) => {
    dispatch(moveCard({ cardId, fromListId, toListId, toIndex }))
  }

  const handleMoveList = (fromIndex, toIndex) => {
    dispatch(moveList({ fromIndex, toIndex }))
  }

  return {
    boards,
    currentBoard,
    lists,
    cards,
    loadBoard,
    handleMoveCard,
    handleMoveList,
    setBoards: (b) => dispatch(setBoards(b)),
    setCurrentBoard: (b) => dispatch(setCurrentBoard(b)),
    setLists: (l) => dispatch(setLists(l)),
    setCards: (c) => dispatch(setCards(c)),
  }
}
