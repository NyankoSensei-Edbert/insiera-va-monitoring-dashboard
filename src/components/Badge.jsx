import React from 'react'

const MAP = {
  OPEN:           'badge-open',
  CLOSED:         'badge-closed',
  created:        'badge-created',
  up:             'badge-up',
  down:           'badge-down',
  queued:         'badge-queued',
}

export default function Badge({ value }) {
  if (!value) return <span className="badge badge-empty">—</span>
  const cls = MAP[value] || MAP[value?.toLowerCase()] || 'badge-created'
  return <span className={`badge ${cls}`}>{value}</span>
}
