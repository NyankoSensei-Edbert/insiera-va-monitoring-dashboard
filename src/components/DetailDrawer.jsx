import React, { useEffect } from 'react'
import { formatTime } from '../lib/utils'

/**
 * DetailDrawer — slides in from the right when a group or target is selected.
 * Closes on Escape, backdrop click, or close button.
 */
export default function DetailDrawer({ item, type, onClose, onResend }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!item) return null

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Drawer panel */}
      <div className="drawer">
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div className="drawer-title">
              {type === 'group' ? item.group_id : item.target_name}
            </div>
            <div className="drawer-subtitle">
              {type === 'group' ? 'Group Detail' : 'Target Detail'}
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {type === 'group' && <GroupDetail group={item} onResend={onResend} />}
          {type === 'target' && <TargetDetail target={item} />}
        </div>
      </div>
    </>
  )
}

/* ── Group Detail ─────────────────────────────────────────────────────────── */
function GroupDetail({ group: g, onResend }) {
  return (
    <>
      {/* Key info grid */}
      <div className="drawer-section">
        <div className="drawer-section-title">Overview</div>
        <div className="detail-grid">
          <DetailField label="Group ID"    value={g.group_id} mono />
          <DetailField label="Status"      value={<StatusBadge val={g.status} type="group" />} />
          <DetailField label="Created By"  value={g.created_by} />
          <DetailField label="Created At"  value={formatTime(g.create_time)} />
          <DetailField label="Total Activities" value={g.total_activities} />
        </div>
      </div>

      {/* Project breakdown */}
      <div className="drawer-section">
        <div className="drawer-section-title">Projects</div>
        <div className="detail-grid">
          <DetailField
            label="Infrastructure"
            value={<ProjectRow count={g.infra_projects} status={g.infra_status} color="accent" />}
          />
          <DetailField
            label="Web"
            value={<ProjectRow count={g.web_projects} status={g.web_status} color="orange" />}
          />
          <DetailField
            label="Source Code"
            value={<ProjectRow count={g.sourcecode_projects} status={g.sourcecode_status} color="green" />}
          />
        </div>
      </div>

      {/* Activities list */}
      <div className="drawer-section">
        <div className="drawer-section-title">
          Activities
          <span className="drawer-badge">{(g.activities || []).length}</span>
        </div>

        {(!g.activities || g.activities.length === 0) ? (
          <div className="drawer-empty">No activities for this group</div>
        ) : (
          <div className="activity-list">
            {g.activities.map(a => (
              <div key={a.activity_id} className="activity-item">
                <div className="activity-item-header">
                  <div className="activity-item-id">{a.activity_id}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`scanner-badge scanner-${a.scanner?.toLowerCase()}`}>
                      {a.scanner}
                    </span>
                    <button
                      className="btn btn-success"
                      style={{ fontSize: 10, padding: '3px 8px' }}
                      onClick={() => onResend?.(a.activity_id)}
                    >↺ Resend</button>
                  </div>
                </div>

                <div className="activity-item-grid">
                  <ActivityField label="Project"  value={a.project_id} />
                  <ActivityField label="Scan ID"  value={a.scan_id} />
                  <ActivityField label="Callback" value={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className={`dot ${a.callback_received ? 'dot-green' : 'dot-red'}`} />
                      <span style={{ color: a.callback_received ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>
                        {a.callback_received ? 'Received' : 'Pending'}
                      </span>
                    </span>
                  } />
                  <ActivityField label="CB Status" value={a.callback_status} />
                </div>

                <div className="activity-item-targets">
                  <span className="activity-item-targets-label">Targets</span>
                  <div className="targets-list">
                    {(a.targets || []).map(t => (
                      <span key={t} className="target-chip">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ── Target Detail ────────────────────────────────────────────────────────── */
function TargetDetail({ target: t }) {
  const scanTypeColor = {
    infrastructure: 'var(--accent)',
    web: 'var(--orange)',
    sourcecode: 'var(--green)',
  }[t.scan_type] || 'var(--text3)'

  return (
    <>
      <div className="drawer-section">
        <div className="drawer-section-title">Target Info</div>
        <div className="detail-grid">
          <DetailField label="Target ID"    value={t.target_id} mono />
          <DetailField label="Target Name"  value={t.target_name} mono />
          <DetailField label="Scan Type"    value={
            <span className={`scan-type scan-${t.scan_type}`}>{t.scan_type}</span>
          } />
          <DetailField label="Status"       value={<StatusBadge val={t.status} type="target" />} />
        </div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-title">Associated Group</div>
        <div className="detail-grid">
          <DetailField label="Group ID"     value={t.group_id} mono />
          <DetailField label="Group Status" value={<StatusBadge val={t.group_status} type="group" />} />
          <DetailField label="Group Created" value={formatTime(t.group_create_time)} />
        </div>
      </div>
    </>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────────── */
function DetailField({ label, value, mono = false }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className={`detail-field-value ${mono ? 'mono' : ''}`}>{value ?? '—'}</div>
    </div>
  )
}

function ActivityField({ label, value }) {
  return (
    <div className="activity-field">
      <span className="activity-field-label">{label}</span>
      <span className="activity-field-value">{value ?? '—'}</span>
    </div>
  )
}

function ProjectRow({ count, status, color }) {
  const colorMap = { accent: 'var(--accent)', orange: 'var(--orange)', green: 'var(--green)' }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: colorMap[color], fontWeight: 600 }}>{count}</span>
      {status ? <StatusBadge val={status} type="scan" /> : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>}
    </span>
  )
}

function StatusBadge({ val, type }) {
  if (!val) return <span style={{ color: 'var(--text3)' }}>—</span>

  const map = {
    OPEN:    'badge-open',
    CLOSED:  'badge-closed',
    created: 'badge-created',
    up:      'badge-up',
    down:    'badge-down',
  }
  return <span className={`badge ${map[val] || 'badge-created'}`}>{val}</span>
}
