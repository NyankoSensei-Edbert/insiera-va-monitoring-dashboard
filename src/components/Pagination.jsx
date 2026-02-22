import React from 'react'

export default function Pagination({ pagination, onPage }) {
  const { current = 0, pages = 1, records = 0, limit = 100 } = pagination || {}
  if (!records) return null

  const start = current * limit + 1
  const end   = Math.min((current + 1) * limit, records)

  // Show at most 7 page buttons, with ellipsis logic
  const pageNums = []
  if (pages <= 7) {
    for (let i = 0; i < pages; i++) pageNums.push(i)
  } else {
    pageNums.push(0)
    if (current > 2) pageNums.push('…')
    for (let i = Math.max(1, current - 1); i <= Math.min(pages - 2, current + 1); i++) pageNums.push(i)
    if (current < pages - 3) pageNums.push('…')
    pageNums.push(pages - 1)
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {start}–{end} of {records}
      </span>
      <div className="page-btns">
        <button
          className="page-btn"
          onClick={() => onPage(current - 1)}
          disabled={current === 0}
        >‹</button>
        {pageNums.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="page-btn" style={{ cursor: 'default', opacity: 0.4 }}>…</span>
            : <button
                key={p}
                className={`page-btn ${p === current ? 'current' : ''}`}
                onClick={() => onPage(p)}
              >{p + 1}</button>
        )}
        <button
          className="page-btn"
          onClick={() => onPage(current + 1)}
          disabled={current >= pages - 1}
        >›</button>
      </div>
    </div>
  )
}
