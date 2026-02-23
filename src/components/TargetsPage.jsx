import React, { useState, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { apiFetch } from '../lib/api'
import { formatTime } from '../lib/utils'
import DataTable from './DataTable'
import DetailDrawer from './DetailDrawer'
import Pagination from './Pagination'
import Badge from './Badge'
import CopyCell from './CopyCell'

export default function TargetsPage({ token, toast }) {
  const [search,       setSearch]       = useLocalStorage('targets:search', '')
  const [limit,        setLimit]        = useLocalStorage('targets:limit',  '100')
  const [page,         setPage]         = useLocalStorage('targets:page',   0)
  const [globalSearch, setGlobalSearch] = useLocalStorage('targets:globalSearch', '')

  const [targets,    setTargets]    = useState([])
  const [pagination, setPagination] = useState({})
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [hasFetched, setHasFetched] = useState(false)
  const [selected,   setSelected]   = useState(null)

  const fetchTargets = useCallback(async (p = 0) => {
    setLoading(true); setError('')
    const params = new URLSearchParams({ page: p, limit })
    if (search.trim()) params.set('search', search.trim())
    const res = await apiFetch(`/insiera-va/monitoring/targets?${params}`, {}, token)
    setLoading(false); setHasFetched(true)
    if (!res.ok || !res.data) { setError(res.data?.message || res.error || `HTTP ${res.status}`); return }
    setTargets(res.data.targets || [])
    setPagination(res.data.pagination || {})
    setPage(p)
  }, [search, limit, token])

  const columns = [
    {
      key: 'target_id', label: 'Target ID',
      render: (v) => <CopyCell value={v} style={{ color: 'var(--text3)', fontSize: 11 }} />,
    },
    {
      key: 'target_name', label: 'Target Name',
      render: (v) => <span className="group-id">{v}</span>,
    },
    {
      key: 'scan_type', label: 'Scan Type',
      filterable: true, searchable: false,
      render: (v) => <span className={`scan-type scan-${v}`}>{v}</span>,
    },
    {
      key: 'status', label: 'Status',
      filterable: true, searchable: false,
      render: (v) => v ? <Badge value={v} /> : <span style={{ color: 'var(--text3)' }}>—</span>,
    },
    {
      key: 'group_id', label: 'Group ID',
      render: (v) => <CopyCell value={v} style={{ fontSize: 11}} className={'group-id'}/>,
    },
    {
      key: 'group_status', label: 'Group Status',
      filterable: true, searchable: false,
      render: (v) => <Badge value={v} />,
    },
    {
      key: 'group_create_time', label: 'Group Created',
      render: (v) => <span style={{ color: 'var(--text3)', whiteSpace: 'nowrap' }}>{formatTime(v)}</span>,
    },
  ]

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      <div className="filter-bar">
        <div className="filter-group">
          <label>Search Target</label>
          <input className="filter-input" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchTargets(0)}
            placeholder="IP, URL, domain, repo..."
            style={{ minWidth: 280 }} />
        </div>
        <div className="filter-group">
          <label>Per Page</label>
          <select className="filter-input" value={limit}
            onChange={e => setLimit(e.target.value)} style={{ minWidth: 80 }}>
            {['10','25','50','100'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => fetchTargets(0)}>⟳ Fetch</button>
        <button className="btn btn-ghost" onClick={() => { setSearch(''); }}>✕ Clear</button>
      </div>

      {error && <div className="error-state">{error}</div>}

      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">Scan Targets</span>
          <span className="table-meta">
            {hasFetched
              ? `${pagination.records || 0} records · click a row to view details`
              : 'Enter a search term and click Fetch'}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={targets}
          loading={loading}
          onRowClick={setSelected}
          globalSearch={globalSearch}
          onGlobalSearch={setGlobalSearch}
          emptyMessage={hasFetched ? 'No targets found' : 'Enter a search term and click Fetch'}
          persistKey="targets-dt"
        />
        <Pagination pagination={pagination} onPage={p => fetchTargets(p)} />
      </div>

      {selected && (
        <DetailDrawer
          item={selected}
          type="target"
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
