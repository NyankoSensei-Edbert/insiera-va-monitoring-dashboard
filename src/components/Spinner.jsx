import React from 'react'

export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      {label}
    </div>
  )
}
