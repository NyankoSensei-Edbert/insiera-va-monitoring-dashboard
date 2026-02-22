import React, { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useToast } from './hooks/useToast'
import GroupsPage   from './components/GroupsPage'
import TargetsPage  from './components/TargetsPage'
import ResendPage   from './components/ResendPage'
import ToastContainer from './components/ToastContainer'
import './App.css'

const TABS = ['Groups', 'Targets', 'Resend']

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage('app:tab', 'Groups')
  const [token,     setToken]     = useLocalStorage('app:token', 'SIERA_TEST_X_TOKEN')
  const { toasts, toast } = useToast()

  // For prefilling the Resend tab from an activity card
  const [prefillId, setPrefillId] = useState('')

  const handleResend = (activityId) => {
    setPrefillId(activityId)
    setActiveTab('Resend')
  }

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo">INSIERA<span>-VA</span></div>
        <div className="header-divider" />
        <nav className="nav-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <div className="token-input">
            <label>X-SECLABID</label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="auth token..."
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {activeTab === 'Groups' && (
          <GroupsPage token={token} toast={toast} onResend={handleResend} />
        )}
        {activeTab === 'Targets' && (
          <TargetsPage token={token} toast={toast} />
        )}
        {activeTab === 'Resend' && (
          <ResendPage
            token={token}
            toast={toast}
            prefillId={prefillId}
            onClearPrefill={() => setPrefillId('')}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </>
  )
}
