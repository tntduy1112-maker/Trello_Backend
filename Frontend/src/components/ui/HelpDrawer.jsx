import React, { useEffect, useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { X, BookOpen } from 'lucide-react'
import { useLocation } from 'react-router-dom'

// Route pattern → section id mapping for auto-scroll on open
const ROUTE_SECTION_MAP = [
  { pattern: /^\/board\//, id: 'section-3' },
  { pattern: /^\/workspaces\/.+\/settings/, id: 'section-2' },
  { pattern: /^\/workspaces\//, id: 'section-3' },
  { pattern: /^\/profile/, id: 'section-12' },
  { pattern: /^\/home/, id: 'section-2' },
]

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')
}

const MD_COMPONENTS = {
  h1: ({ children, ...p }) => (
    <h1 className="text-lg font-bold text-white mt-6 mb-3 pb-2 border-b border-[#2C333A]" {...p}>
      {children}
    </h1>
  ),
  h2: ({ children, ...p }) => {
    const text = String(children)
    const m = text.match(/^(\d+)\.\s/)
    const id = m ? `section-${m[1]}` : slugify(text)
    return (
      <h2 id={id} className="text-base font-semibold text-white mt-6 mb-2" {...p}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...p }) => (
    <h3 className="text-sm font-semibold text-[#B6C2CF] mt-4 mb-1.5" {...p}>
      {children}
    </h3>
  ),
  p: ({ children, ...p }) => (
    <p className="text-sm text-[#B6C2CF] leading-relaxed mb-2" {...p}>
      {children}
    </p>
  ),
  ul: ({ children, ...p }) => (
    <ul className="list-disc list-inside space-y-1 mb-2" {...p}>
      {children}
    </ul>
  ),
  ol: ({ children, ...p }) => (
    <ol className="list-decimal list-inside space-y-1 mb-2" {...p}>
      {children}
    </ol>
  ),
  li: ({ children, ...p }) => (
    <li className="text-sm text-[#B6C2CF] leading-relaxed" {...p}>
      {children}
    </li>
  ),
  strong: ({ children, ...p }) => (
    <strong className="text-white font-semibold" {...p}>
      {children}
    </strong>
  ),
  code: ({ children, ...p }) => (
    <code className="bg-[#1D2125] text-[#F8C955] px-1.5 py-0.5 rounded text-xs font-mono" {...p}>
      {children}
    </code>
  ),
  blockquote: ({ children, ...p }) => (
    <blockquote className="border-l-2 border-[#0C66E4] pl-3 my-2 text-[#8C9BAB] text-sm italic" {...p}>
      {children}
    </blockquote>
  ),
  hr: ({ ...p }) => <hr className="border-[#2C333A] my-4" {...p} />,
  table: ({ children, ...p }) => (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-xs text-left border-collapse" {...p}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...p }) => (
    <thead className="bg-[#1D2125]" {...p}>
      {children}
    </thead>
  ),
  th: ({ children, ...p }) => (
    <th className="px-2 py-1.5 text-[#8C9BAB] font-medium border border-[#2C333A]" {...p}>
      {children}
    </th>
  ),
  td: ({ children, ...p }) => (
    <td className="px-2 py-1.5 text-[#B6C2CF] border border-[#2C333A]" {...p}>
      {children}
    </td>
  ),
  a: ({ children, href, ...p }) => (
    <a href={href} className="text-[#0C66E4] hover:underline" target="_blank" rel="noreferrer" {...p}>
      {children}
    </a>
  ),
}

export default function HelpDrawer({ isOpen, onClose, targetSection = null }) {
  const location = useLocation()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const contentRef = useRef(null)
  const hasFetched = useRef(false)

  const doFetch = useCallback(() => {
    setLoading(true)
    setError(false)
    fetch('/USER_GUIDE.md')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.text()
      })
      .then((text) => {
        setContent(text)
        hasFetched.current = true
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Fetch on first open
  useEffect(() => {
    if (isOpen && !hasFetched.current && !loading) doFetch()
  }, [isOpen, doFetch, loading])

  // Auto-scroll: targetSection prop takes priority, then route-based detection
  useEffect(() => {
    if (!isOpen || !content) return
    const sectionId = targetSection
      ?? ROUTE_SECTION_MAP.find((m) => m.pattern.test(location.pathname))?.id
    if (!sectionId) return
    const timer = setTimeout(() => {
      const el = contentRef.current?.querySelector(`#${sectionId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setActiveId(sectionId)
      }
    }, 120)
    return () => clearTimeout(timer)
  }, [isOpen, content, location.pathname, targetSection])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const tocItems = content
    ? [...content.matchAll(/^## (\d+)\. (.+)/gm)].map(([, num, title]) => ({
        id: `section-${num}`,
        num,
        label: title.replace(/\(.*?\)/g, '').trim(),
      }))
    : []

  const scrollTo = (id) => {
    const el = contentRef.current?.querySelector(`#${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-[#22272B] border-l border-[#2C333A] z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2C333A] flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={17} className="text-[#0C66E4]" />
            <span className="text-white font-semibold text-sm">Hướng dẫn sử dụng</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-[#8C9BAB] hover:text-white hover:bg-[#454F59] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* TOC pills */}
        {tocItems.length > 0 && (
          <div className="px-4 py-2 border-b border-[#2C333A] flex-shrink-0 overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 min-w-max">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    activeId === item.id
                      ? 'bg-[#0C66E4] text-white'
                      : 'bg-[#2C333A] text-[#8C9BAB] hover:text-white hover:bg-[#374048]'
                  }`}
                >
                  {item.num}. {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-[#0C66E4] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <p className="text-[#8C9BAB] text-sm">Không thể tải nội dung hướng dẫn.</p>
              <button
                onClick={() => { hasFetched.current = false; doFetch() }}
                className="px-3 py-1.5 bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs rounded-full transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && content === '' && (
            <div className="flex items-center justify-center h-40 text-[#596773] text-sm">
              Nội dung hướng dẫn sẽ sớm được cập nhật.
            </div>
          )}

          {/* Markdown content */}
          {!loading && !error && content && (
            <ReactMarkdown components={MD_COMPONENTS}>
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </>
  )
}
