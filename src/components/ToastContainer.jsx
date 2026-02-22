import React from 'react'

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✓' : '!'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
