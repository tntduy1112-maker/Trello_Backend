import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlignLeft, Calendar, AlertCircle, CheckSquare, Paperclip, Check } from 'lucide-react'
import { formatDate, isOverdue, isDueSoon } from '../../utils/helpers'
import { PRIORITY_COLOR } from '../../data/constants'
import Avatar from '../ui/Avatar'
import AvatarStack from '../ui/AvatarStack'

export default function CardItem({ card, listId, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', card, listId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const overdue = isOverdue(card.due_date)
  const dueSoon = isDueSoon(card.due_date)
  const priorityColor = PRIORITY_COLOR[card.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group bg-[#22272B] rounded-xl border cursor-pointer transition-all hover:shadow-lg active:opacity-80 overflow-hidden ${
        card.is_completed
          ? 'border-green-800/60 hover:border-green-700'
          : 'border-[#2C333A] hover:border-[#454F59]'
      }`}
    >
      {/* Cover — color or image attachment */}
      {(card.cover_image_url || card.cover_color) && (
        <div
          className="h-8 w-full bg-cover bg-center"
          style={card.cover_image_url
            ? { backgroundImage: `url(${card.cover_image_url})` }
            : { backgroundColor: card.cover_color }
          }
        />
      )}

      <div className="p-3">
        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((label, i) => (
              <span
                key={i}
                className="h-1.5 w-8 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <p className={`text-sm leading-snug mb-2 transition-colors ${
          card.is_completed
            ? 'line-through text-[#596773]'
            : 'text-[#B6C2CF] group-hover:text-white'
        }`}>
          {card.title}
        </p>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Completed badge */}
          {card.is_completed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/50 text-green-400">
              <Check size={9} />
              Xong
            </span>
          )}

          {/* Priority */}
          {card.priority && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${priorityColor}`}>
              {card.priority}
            </span>
          )}

          {/* Due date */}
          {card.due_date && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              overdue
                ? 'bg-red-900/60 text-red-300'
                : dueSoon
                ? 'bg-yellow-900/60 text-yellow-300'
                : 'bg-[#2C333A] text-[#8C9BAB]'
            }`}>
              <Calendar size={10} />
              {formatDate(card.due_date)}
            </span>
          )}

          {/* Has description */}
          {card.description && (
            <span className="text-[#596773]">
              <AlignLeft size={13} />
            </span>
          )}

          {/* Checklist progress */}
          {card.checklist_progress?.total > 0 && (
            <span className={`flex items-center gap-1 text-[10px] ${
              card.checklist_progress.completed === card.checklist_progress.total
                ? 'text-green-400'
                : 'text-[#8C9BAB]'
            }`}>
              <CheckSquare size={11} />
              {card.checklist_progress.completed}/{card.checklist_progress.total}
            </span>
          )}

          {/* Attachment count */}
          {card.attachment_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#8C9BAB]">
              <Paperclip size={11} />
              {card.attachment_count}
            </span>
          )}

          {/* Assignees */}
          {card.assignees && card.assignees.length > 0 && (
            <div className="ml-auto">
              <AvatarStack users={card.assignees} max={3} size="xs" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
