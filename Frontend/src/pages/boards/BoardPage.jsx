import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import {
  Plus, Globe, Lock, Users, UserPlus, Filter,
  ArrowLeft, MoreHorizontal, Star
} from 'lucide-react'
import { setLists, setCards, clearBoard, fetchBoard, fetchBoardLists, createListThunk } from '../../redux/slices/boardSlice'
import { getBoardMembers } from '../../services/board.service'
import Navbar from '../../components/layout/Navbar'
import ListColumn from '../../components/board/ListColumn'
import CardItem from '../../components/board/CardItem'
import CardDetailModal from '../../components/board/CardDetailModal'
import InviteMemberModal from '../../components/board/InviteMemberModal'
import AvatarStack from '../../components/ui/AvatarStack'

function AddListForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) { onAdd(name.trim()); setName('') }
  }
  return (
    <div className="flex-shrink-0 w-72">
      <div className="bg-[#101204] rounded-2xl p-3 border border-[#2C333A]/50">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên list..."
            autoFocus
            className="w-full px-3 py-2 bg-[#22272B] border border-[#454F59] rounded-xl text-sm text-[#B6C2CF] placeholder-[#596773] focus:outline-none focus:ring-2 focus:ring-[#0C66E4] mb-2"
            onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-lg text-xs font-medium transition-colors"
            >
              Thêm list
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-2 py-1.5 text-[#8C9BAB] hover:text-[#B6C2CF] hover:bg-[#22272B] rounded-lg text-xs transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const visibilityIcon = {
  private: <Lock size={13} />,
  workspace: <Users size={13} />,
  public: <Globe size={13} />,
}

export default function BoardPage() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentBoard, lists, cards, loadingBoard } = useSelector((state) => state.board)
  const { user } = useSelector((state) => state.auth)

  const [activeCard, setActiveCard] = useState(null)
  const [activeCardListId, setActiveCardListId] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedCardListId, setSelectedCardListId] = useState(null)
  const [addingList, setAddingList] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isStarred, setIsStarred] = useState(false)
  const [boardMembers, setBoardMembers] = useState([])

  // Load board + lists + members from API on mount
  useEffect(() => {
    dispatch(clearBoard())
    dispatch(fetchBoard(boardId))
    dispatch(fetchBoardLists(boardId))
    getBoardMembers(boardId)
      .then((res) => setBoardMembers(res.data.data.members || []))
      .catch(() => {})
    return () => { dispatch(clearBoard()) }
  }, [boardId, dispatch])

  useEffect(() => {
    if (currentBoard) {
      setIsStarred(currentBoard.is_starred || false)
    }
  }, [currentBoard])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const board = currentBoard || {
    id: boardId,
    name: loadingBoard ? 'Đang tải...' : 'Board',
    cover_color: '#0052CC',
    visibility: 'workspace',
  }

  const listIds = lists.map((l) => `list-${l.id}`)
  const members = user ? [user] : []

  const handleDragStart = (event) => {
    const { active } = event
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card)
      setActiveCardListId(active.data.current.listId)
    }
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return
    const activeType = active.data.current?.type
    const overType = over.data.current?.type
    if (activeType !== 'card') return
    const activeListId = active.data.current?.listId
    const overListId = overType === 'card' ? over.data.current?.listId : over.id
    if (activeListId === overListId) return
    const newCards = { ...cards }
    const activeCards = [...(newCards[activeListId] || [])]
    const overCards = [...(newCards[overListId] || [])]
    const activeIdx = activeCards.findIndex((c) => c.id === active.id)
    if (activeIdx === -1) return
    const [movedCard] = activeCards.splice(activeIdx, 1)
    const overIdx = overType === 'card'
      ? overCards.findIndex((c) => c.id === over.id)
      : overCards.length
    overCards.splice(overIdx, 0, movedCard)
    dispatch(setCards({ ...newCards, [activeListId]: activeCards, [overListId]: overCards }))
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveCard(null)
    setActiveCardListId(null)
    if (!over) return
    const activeType = active.data.current?.type
    const overType = over.data.current?.type
    if (activeType === 'list') {
      const fromIdx = lists.findIndex((l) => `list-${l.id}` === active.id)
      const toIdx = lists.findIndex((l) => `list-${l.id}` === over.id)
      if (fromIdx !== toIdx && fromIdx !== -1 && toIdx !== -1) {
        dispatch(setLists(arrayMove(lists, fromIdx, toIdx)))
      }
      return
    }
    if (activeType === 'card') {
      const listId = active.data.current?.listId
      if (overType === 'card' && over.data.current?.listId === listId) {
        const listCards = [...(cards[listId] || [])]
        const fromIdx = listCards.findIndex((c) => c.id === active.id)
        const toIdx = listCards.findIndex((c) => c.id === over.id)
        if (fromIdx !== toIdx) {
          dispatch(setCards({ ...cards, [listId]: arrayMove(listCards, fromIdx, toIdx) }))
        }
      }
    }
  }

  const handleAddList = (name) => {
    dispatch(createListThunk({ boardId, name }))
    setAddingList(false)
  }

  const handleCardClick = (card, listId) => {
    setSelectedCard(card)
    setSelectedCardListId(listId)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: board.cover_color }}>
      <Navbar />

      {/* Board Header */}
      <div className="pt-12 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>

          <h1 className="text-lg font-bold text-white">{board.name}</h1>

          <button
            onClick={() => setIsStarred((s) => !s)}
            className="w-7 h-7 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Star size={15} className={isStarred ? 'fill-yellow-400 text-yellow-400' : ''} />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors">
            {visibilityIcon[board.visibility] || <Lock size={13} />}
            <span className="text-xs text-white/90 capitalize">{board.visibility}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <AvatarStack users={members} max={4} size="sm" />
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <UserPlus size={13} />
              Mời
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-colors">
              <Filter size={13} />
              Lọc
            </button>
            <button className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 h-full items-start" style={{ minHeight: 'calc(100vh - 112px)' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  cards={cards[list.id] || []}
                  onCardClick={handleCardClick}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeCard && (
                <div className="rotate-3 scale-105 opacity-90">
                  <CardItem card={activeCard} listId={activeCardListId} onClick={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {addingList ? (
            <AddListForm onAdd={handleAddList} onCancel={() => setAddingList(false)} />
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="flex-shrink-0 w-72 flex items-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-sm font-medium transition-colors"
            >
              <Plus size={18} />
              Thêm list mới
            </button>
          )}
        </div>
      </div>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          listId={selectedCardListId}
          isOpen={!!selectedCard}
          onClose={() => { setSelectedCard(null); setSelectedCardListId(null) }}
          boardMembers={boardMembers}
        />
      )}

      <InviteMemberModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
