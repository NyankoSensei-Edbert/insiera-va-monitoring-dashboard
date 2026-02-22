import React, { useEffect, useRef } from 'react'

function useCountUp(target) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const start = parseInt(ref.current.textContent) || 0
    const duration = 450
    const t0 = performance.now()
    const frame = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      ref.current.textContent = Math.round(start + (target - start) * p)
      if (p < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target])
  return ref
}

export default function StatCard({ icon, value, label, color, iconBg }) {
  const numRef = useCountUp(value)
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconBg}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value" style={{ color }} ref={numRef}>0</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
