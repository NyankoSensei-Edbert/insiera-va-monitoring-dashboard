import React, { useState, useMemo, useRef, useEffect } from 'react'

/**
 * DataTable — fully featured table with:
 *   - Per-column header search (text input under each column)
 *   - Per-column sort (click header label)
 *   - Per-column dropdown filter for enum columns
 *   - Global search bar
 *   - Row click → onRowClick(row)
 *
 * Props:
 *   columns: [{ key, label, sortable?, filterable?, render?(val, row), width?, align? }]
 *   data: array of objects
 *   onRowClick: (row) => void
 *   loading: bool
 *   emptyMessage: string
 *   globalSearch: string          (controlled externally)
 *   onGlobalSearch: (val) => void
 *   persistKey: string            (localStorage key prefix for sort/filter state)
 */
export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  loading = false,
  emptyMessage = 'No data found',
  globalSearch = '',
  onGlobalSearch,
  persistKey = 'dt',
}) {
  // ── Sort state ──────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${persistKey}:sortKey`)) || null } catch { return null }
  })
  const [sortDir, setSortDir] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${persistKey}:sortDir`)) || 1 } catch { return 1 }
  })

  // ── Per-column search ───────────────────────────────────────────────────────
  const [colSearch, setColSearch] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${persistKey}:colSearch`)) || {} } catch { return {} }
  })

  // ── Per-column dropdown filter ──────────────────────────────────────────────
  const [colFilter, setColFilter] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${persistKey}:colFilter`)) || {} } catch { return {} }
  })

  // ── Dropdown open state ─────────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRef = useRef(null)

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(`${persistKey}:sortKey`, JSON.stringify(sortKey)) }, [sortKey, persistKey])
  useEffect(() => { localStorage.setItem(`${persistKey}:sortDir`, JSON.stringify(sortDir)) }, [sortDir, persistKey])
  useEffect(() => { localStorage.setItem(`${persistKey}:colSearch`, JSON.stringify(colSearch)) }, [colSearch, persistKey])
  useEffect(() => { localStorage.setItem(`${persistKey}:colFilter`, JSON.stringify(colFilter)) }, [colFilter, persistKey])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Unique values for filterable columns ────────────────────────────────────
  const colUniqueValues = useMemo(() => {
    const result = {}
    columns.forEach(col => {
      if (col.filterable) {
        const vals = [...new Set(data.map(r => r[col.key]).filter(v => v !== null && v !== undefined && v !== ''))]
        result[col.key] = vals.sort()
      }
    })
    return result
  }, [columns, data])

  // ── Sort + filter pipeline ──────────────────────────────────────────────────
  const processed = useMemo(() => {
    let rows = [...data]

    // Global search across all string columns
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase()
      rows = rows.filter(row =>
        columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q))
      )
    }

    // Per-column text search
    Object.entries(colSearch).forEach(([key, val]) => {
      if (val?.trim()) {
        const q = val.toLowerCase()
        rows = rows.filter(row => String(row[key] ?? '').toLowerCase().includes(q))
      }
    })

    // Per-column dropdown filter
    Object.entries(colFilter).forEach(([key, val]) => {
      if (val && val !== '__all__') {
        rows = rows.filter(row => String(row[key] ?? '') === val)
      }
    })

    // Sort
    if (sortKey) {
      rows.sort((a, b) => {
        let av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir
        return String(av).localeCompare(String(bv)) * sortDir
      })
    }

    return rows
  }, [data, globalSearch, colSearch, colFilter, sortKey, sortDir, columns])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1)
    else { setSortKey(key); setSortDir(1) }
  }

  const updateColSearch = (key, val) => setColSearch(prev => ({ ...prev, [key]: val }))
  const updateColFilter = (key, val) => setColFilter(prev => ({ ...prev, [key]: val }))

  const clearAll = () => {
    setColSearch({})
    setColFilter({})
    setSortKey(null)
    setSortDir(1)
    onGlobalSearch?.('')
  }

  const hasActiveFilters = globalSearch || Object.values(colSearch).some(v => v) || Object.values(colFilter).some(v => v && v !== '__all__')

  return (
    <div className="dt-wrapper">
      {/* Global search + clear */}
      <div className="dt-toolbar">
        <div className="dt-global-search">
          <span className="dt-search-icon">⌕</span>
          <input
            className="filter-input"
            value={globalSearch}
            onChange={e => onGlobalSearch?.(e.target.value)}
            placeholder="Search all columns..."
            style={{ minWidth: 240, paddingLeft: 28 }}
          />
        </div>
        <span className="dt-result-count">{processed.length} result{processed.length !== 1 ? 's' : ''}</span>
        {hasActiveFilters && (
          <button className="btn btn-ghost dt-clear-btn" onClick={clearAll}>
            ✕ Clear all filters
          </button>
        )}
      </div>

      <div className="table-scroll" ref={dropdownRef}>
        <table className="dt-table">
          {/* Column headers with sort */}
          <thead>
            <tr className="dt-head-row">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`dt-th ${col.sortable !== false ? 'dt-sortable' : ''} ${sortKey === col.key ? 'sorted' : ''}`}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                >
                  <span className="dt-th-label">
                    {col.label}
                    {col.sortable !== false && (
                      <span className="dt-sort-icon">
                        {sortKey === col.key ? (sortDir === 1 ? ' ↑' : ' ↓') : ' ↕'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>

            {/* Per-column filter row */}
            <tr className="dt-filter-row">
              {columns.map(col => (
                <td key={col.key} className="dt-filter-cell">
                  {col.filterable ? (
                    /* Dropdown filter for enum columns */
                    <div className="dt-dropdown-wrap">
                      <button
                        className={`dt-filter-dropdown-btn ${colFilter[col.key] && colFilter[col.key] !== '__all__' ? 'active' : ''}`}
                        onClick={() => setOpenDropdown(openDropdown === col.key ? null : col.key)}
                      >
                        {colFilter[col.key] && colFilter[col.key] !== '__all__'
                          ? colFilter[col.key]
                          : `All`}
                        <span className="dt-dd-arrow">▾</span>
                      </button>
                      {openDropdown === col.key && (
                        <div className="dt-dropdown-menu">
                          <div
                            className={`dt-dd-item ${!colFilter[col.key] || colFilter[col.key] === '__all__' ? 'selected' : ''}`}
                            onClick={() => { updateColFilter(col.key, '__all__'); setOpenDropdown(null) }}
                          >All</div>
                          {colUniqueValues[col.key]?.map(val => (
                            <div
                              key={val}
                              className={`dt-dd-item ${colFilter[col.key] === String(val) ? 'selected' : ''}`}
                              onClick={() => { updateColFilter(col.key, String(val)); setOpenDropdown(null) }}
                            >{val || '(empty)'}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : col.searchable !== false ? (
                    /* Text search for other columns */
                    <input
                      className="dt-col-search"
                      value={colSearch[col.key] || ''}
                      onChange={e => updateColSearch(col.key, e.target.value)}
                      placeholder="Search..."
                      onClick={e => e.stopPropagation()}
                    />
                  ) : null}
                </td>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length}>
                <div className="loading-state"><div className="spinner" />Loading...</div>
              </td></tr>
            ) : !processed.length ? (
              <tr><td colSpan={columns.length}>
                <div className="empty-state">
                  <div className="empty-icon">◎</div>
                  {hasActiveFilters ? 'No results match the current filters' : emptyMessage}
                </div>
              </td></tr>
            ) : processed.map((row, i) => (
              <tr
                key={row.id || row.group_id || row.target_id || row.activity_id || i}
                className="dt-row"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className="dt-td" style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
