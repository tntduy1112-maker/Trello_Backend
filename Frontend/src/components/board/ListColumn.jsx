import React, { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, X, Check } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import CardItem from './CardItem'
import { updateList, deleteList, createCardThunk } from '../../redux/slices/boardSlice'
import Dropdown from '../ui/Dropdown'

function AddCardForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(title.trim())
      setTitle('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nhập tiêu đề card..."
        autoFocus
        rows={3}
        className="w-full px-3 py-2 bg-[#22272B] border border-[#454F59] rounded-xl text-sm text-[#B6C2CF] placeholder-[#596773] resize-none focus:outline-none focus:ring-2 focus:ring-[#0C66E4]"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
          if (e.key === 'Escape') onCancel()
        }}
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="flex-1 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded-lg text-xs font-medium transition-colors"
        >
          Thêm card
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 text-[#8C9BAB] hover:text-[#B6C2CF] hover:bg-[#2C333A] rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </form>
  )
}

export default function ListColumn({ list, cards = [], onCardClick }) {
  const dispatch = useDispatch()
  const { boardId } = useParams()
  const [addingCard, setAddingCard] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [listName, setListName] = useState(list.name)

  const { setNodeRef: setDropRef } = useDroppable({
    id: list.id,
    data: { type: 'list', listId: list.id },
  })

  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `list-${list.id}`, data: { type: 'list', list } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleAddCard = (title) => {
    dispatch(createCardThunk({ listId: list.id, title }))
    setAddingCard(false)
  }

  const handleRenameList = () => {
    if (listName.trim() && listName !== list.name) {
      dispatch(updateList({ listId: list.id, updates: { name: listName.trim() } }))
    }
    setEditingName(false)
  }

  const menuItems = [
    { label: 'Thêm card', onClick: () => setAddingCard(true) },
    { separator: true },
    { label: 'Xóa list', onClick: () => dispatch(deleteList(list.id)), danger: true },
  ]

  const cardIds = cards.map((c) => c.id)

  return (
    <div
      ref={setSortRef}
      style={style}
      className="flex-shrink-0 w-72 flex flex-col max-h-full"
    >
      <div className="bg-[#101204] rounded-2xl flex flex-col max-h-full border border-[#2C333A]/50">
        {/* List Header */}
        <div {...attributes} {...listeners} className="flex items-center gap-2 px-3 pt-3 pb-2">
          {editingName ? (
            <input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onBlur={handleRenameList}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameList()
                if (e.key === 'Escape') { setListName(list.name); setEditingName(false) }
              }}
              autoFocus
              className="flex-1 bg-[#22272B] border border-[#454F59] rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0C66E4]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              onClick={(e) => { e.stopPropagation(); setEditingName(true) }}
              className="flex-1 font-semibold text-sm text-white px-1 py-0.5 rounded hover:bg-[#22272B] cursor-text truncate"
            >
              {list.name}
            </h3>
          )}
          <span className="text-xs text-[#8C9BAB] min-w-[20px] text-center">{cards.length}</span>
          <Dropdown
            trigger={
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-[#22272B] text-[#8C9BAB] hover:text-[#B6C2CF] transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
            }
            items={menuItems}
            align="right"
          />
        </div>

        {/* Cards */}
        <div
          ref={setDropRef}
          className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[40px] max-h-[calc(100vh-240px)]"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#454F59 transparent' }}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                listId={list.id}
                onClick={() => onCardClick(card, list.id)}
              />
            ))}
          </SortableContext>
        </div>

        {/* Add card section */}
        <div className="px-2 pb-2">
          {addingCard ? (
            <AddCardForm onAdd={handleAddCard} onCancel={() => setAddingCard(false)} />
          ) : (
            <button
              onClick={() => setAddingCard(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[#8C9BAB] hover:text-[#B6C2CF] hover:bg-[#22272B] rounded-xl text-sm transition-colors"
            >
              <Plus size={15} />
              Thêm card
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
