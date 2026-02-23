import React, { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { apiFetch } from '../lib/api'
import { formatTime } from '../lib/utils'
import DataTable from './DataTable'
import DetailDrawer from './DetailDrawer'
import Pagination from './Pagination'
import Badge from './Badge'
import CopyCell from './CopyCell'

export default function GroupsPage({ token, toast, onResend }) {
  const [filters, setFilters] = useLocalStorage('groups:filters', {
    search: '', user: '', from: '', to: '', limit: '100',
  })
  const [page,         setPage]         = useLocalStorage('groups:page', 0)
  const [globalSearch, setGlobalSearch] = useLocalStorage('groups:globalSearch', '')

  const [groups,     setGroups]     = useState([])
  const [pagination, setPagination] = useState({})
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [selected,   setSelected]   = useState(null)

  const fetchGroups = useCallback(async (p = 0) => {
    setLoading(true); setError('')
    const params = new URLSearchParams({ page: p, limit: filters.limit })
    if (filters.search) params.set('search', filters.search)
    if (filters.user)   params.set('user',   filters.user)
    if (filters.from)   params.set('from',   filters.from + 'T00:00:00Z')
    if (filters.to)     params.set('to',     filters.to   + 'T23:59:59Z')
    const res = await apiFetch(`/insiera-va/monitoring?${params}`, {}, token)
    setLoading(false)
    if (!res.ok || !res.data) { setError(res.data?.message || res.error || `HTTP ${res.status}`); return }
    setGroups(res.data.groups || [])
    setPagination(res.data.pagination || {})
  }, [filters, token])

  useEffect(() => { fetchGroups(page) }, [page]) // eslint-disable-line

  const stats = {
    total:   pagination.records || groups.length,
    acts:    groups.reduce((s, g) => s + (g.total_activities || 0), 0),
    open:    groups.filter(g => [g.infra_status, g.web_status, g.sourcecode_status].includes('OPEN')).length,
    pending: groups.reduce((s, g) => s + (g.activities || []).filter(a => !a.callback_received).length, 0),
  }

  const updateFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const columns = [
    {
      key: 'group_id', label: 'Group ID',
      render: (v) => <CopyCell className="group-id" value={v} />,
    },
    {
      key: 'status', label: 'Status',
      filterable: true, searchable: false,
      render: (v) => <Badge value={v} />,
    },
    {
      key: 'created_by', label: 'Created By',
      render: (v) => <span style={{ color: 'var(--text2)' }}>{v}</span>,
    },
    {
      key: 'create_time', label: 'Created At',
      render: (v) => <span style={{ color: 'var(--text3)', whiteSpace: 'nowrap' }}>{formatTime(v)}</span>,
    },
    {
      key: 'infra_projects', label: 'Infra',
      render: (v) => <span className="proj-pill proj-infra">{v}</span>,
    },
    {
      key: 'web_projects', label: 'Web',
      render: (v) => <span className="proj-pill proj-web">{v}</span>,
    },
    {
      key: 'sourcecode_projects', label: 'Source',
      render: (v) => <span className="proj-pill proj-code">{v}</span>,
    },
    {
      key: 'total_activities', label: 'Activities',
      render: (v) => <strong style={{ color: 'var(--text)' }}>{v}</strong>,
    },
    {
      key: 'infra_status', label: 'Infra Status',
      filterable: true, searchable: false,
      render: (v) => <ScanBadge val={v} />,
    },
    {
      key: 'web_status', label: 'Web Status',
      filterable: true, searchable: false,
      render: (v) => <ScanBadge val={v} />,
    },
    {
      key: 'sourcecode_status', label: 'Code Status',
      filterable: true, searchable: false,
      render: (v) => <ScanBadge val={v} />,
    },
  ]

  const handleResendFromDrawer = (activityId) => {
    setSelected(null)
    onResend(activityId)
  }

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* Stats */}
      <div className="stats-bar">
        {[
          { icon: '⬡', value: stats.total,   label: 'Total Groups',      color: 'var(--accent)', bg: 'blue' },
          { icon: '◈', value: stats.acts,     label: 'Activities',        color: 'var(--green)',  bg: 'green' },
          { icon: '◎', value: stats.open,     label: 'Open Scans',        color: 'var(--orange)', bg: 'orange' },
          { icon: '⚑', value: stats.pending,  label: 'Pending Callbacks', color: 'var(--red)',    bg: 'red' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.bg}`}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Server-side filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Group ID</label>
          <input className="filter-input" value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchGroups(0)}
            placeholder="partial match..." style={{ minWidth: 180 }} />
        </div>
        <div className="filter-group">
          <label>Created By</label>
          <input className="filter-input" value={filters.user}
            onChange={e => updateFilter('user', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchGroups(0)}
            placeholder="username..." />
        </div>
        <div className="filter-group">
          <label>From</label>
          <input className="filter-input" type="date" value={filters.from}
            onChange={e => updateFilter('from', e.target.value)} style={{ minWidth: 140 }} />
        </div>
        <div className="filter-group">
          <label>To</label>
          <input className="filter-input" type="date" value={filters.to}
            onChange={e => updateFilter('to', e.target.value)} style={{ minWidth: 140 }} />
        </div>
        <div className="filter-group">
          <label>Per Page</label>
          <select className="filter-input" value={filters.limit}
            onChange={e => updateFilter('limit', e.target.value)} style={{ minWidth: 80 }}>
            {['10','25','50','100'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setPage(0); fetchGroups(0) }}>⟳ Fetch</button>
        <button className="btn btn-ghost" onClick={() => setFilters({ search: '', user: '', from: '', to: '', limit: '100' })}>✕ Clear</button>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => fetchGroups(page)}>↺ Refresh</button>
      </div>

      {error && <div className="error-state">{error}</div>}

      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">Monitoring Groups</span>
          <span className="table-meta">{pagination.records || 0} records · click a row to view details</span>
        </div>
        <DataTable
          columns={columns}
          data={groups}
          loading={loading}
          onRowClick={setSelected}
          globalSearch={globalSearch}
          onGlobalSearch={setGlobalSearch}
          emptyMessage="No groups found — set filters above and click Fetch"
          persistKey="groups-dt"
        />
        <Pagination pagination={pagination} onPage={p => { setPage(p); fetchGroups(p) }} />
      </div>

      {selected && (
        <DetailDrawer
          item={selected}
          type="group"
          onClose={() => setSelected(null)}
          onResend={handleResendFromDrawer}
        />
      )}
    </div>
  )
}

function ScanBadge({ val }) {
  if (!val) return <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>
  const cls = val === 'OPEN' ? 'badge-open' : val === 'CLOSED' ? 'badge-closed' : 'badge-empty'
  return <span className={`badge ${cls}`}>{val}</span>
}
