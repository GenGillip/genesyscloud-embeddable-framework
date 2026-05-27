/**
 * @file App.jsx — Root application component.
 *
 * Renders a two-column layout:
 *   • Left  — tabbed panel (Actions / Events / Logs) for controlling and
 *              observing the Embeddable Framework.
 *   • Right — 320 px sidebar containing the Genesys Cloud softphone iframe.
 *
 * All communication with the iframe happens through `window.postMessage`.
 * Inbound messages are parsed, logged, and stored as "events" for display.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useLogStore } from './useLogStore';
import ActionsPanel from './components/ActionsPanel';
import EventsPanel from './components/EventsPanel';
import LogPanel from './components/LogPanel';

/**
 * Available Genesys Cloud regions mapped to their iframe base URLs.
 * @constant {Object.<string, string>}
 */
const REGIONS = {
  'usw2.pure.cloud': 'https://apps.usw2.pure.cloud',
  'mypurecloud.com': 'https://apps.mypurecloud.com',
  'mypurecloud.com.au': 'https://apps.mypurecloud.com.au',
  'mypurecloud.de': 'https://apps.mypurecloud.de',
  'mypurecloud.jp': 'https://apps.mypurecloud.jp',
  'cac1.pure.cloud': 'https://apps.cac1.pure.cloud',
  'euw2.pure.cloud': 'https://apps.euw2.pure.cloud',
};

/** @constant {string} CRM path appended to the region base URL. */
const CRM_PATH = '/crm/index.html?crm=framework-local-secure';

/** @constant {string} Default region key. */
const DEFAULT_REGION = 'usw2.pure.cloud';

/** @constant {string[]} Available tab names. */
const TABS = ['Actions', 'Events', 'Logs'];

/**
 * Root application component.
 *
 * @returns {JSX.Element}
 */
export default function App() {
  /** @type {React.RefObject<HTMLIFrameElement>} Reference to the softphone iframe. */
  const iframeRef = useRef(null);

  const { logs, addLog, clearLogs } = useLogStore();

  /** @type {[string, Function]} Currently active tab name. */
  const [tab, setTab] = useState('Actions');

  /**
   * Map of event type → most recent payload.
   * @type {[Object.<string, Object>, Function]}
   */
  const [events, setEvents] = useState({});

  /** @type {[string, Function]} Currently selected region key. */
  const [region, setRegion] = useState(DEFAULT_REGION);

  /** @type {[boolean, Function]} Whether the settings bar is visible. */
  const [showSettings, setShowSettings] = useState(false);

  /** Computed iframe URL based on selected region. */
  const iframeUrl = REGIONS[region] + CRM_PATH;

  /**
   * Handles incoming `message` events from the iframe.
   *
   * @param {MessageEvent} event — The raw browser MessageEvent.
   * @returns {void}
   */
  const handleMessage = useCallback((event) => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (!message?.type) return;

    addLog('received', message.type, message.data || message);
    setEvents(prev => ({ ...prev, [message.type]: message.data || message }));
  }, [addLog]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <div style={styles.layout}>
      {/* Left: Main content */}
      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.logo}>
            <span style={{ fontSize: 20 }}>☁️</span>
            <span style={styles.logoText}>Genesys Cloud Embeddable Framework</span>
          </div>
          <div style={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  ...styles.tab,
                  ...(tab === t ? styles.tabActive : {}),
                }}
              >
                {t}
                {t === 'Logs' && logs.length > 0 && (
                  <span style={styles.logBadge}>{logs.length}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSettings(s => !s)} style={styles.settingsBtn}>⚙️</button>
        </div>

        {showSettings && (
          <div style={styles.settingsBar}>
            <label style={{ fontSize: 13 }}>Region:</label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              style={{ fontSize: 12 }}
            >
              {Object.keys(REGIONS).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
              {iframeUrl}
            </span>
          </div>
        )}

        <div style={styles.content}>
          {tab === 'Actions' && <ActionsPanel iframeRef={iframeRef} addLog={addLog} />}
          {tab === 'Events' && <EventsPanel events={events} />}
          {tab === 'Logs' && <LogPanel logs={logs} onClear={clearLogs} />}
        </div>
      </div>

      {/* Right: Softphone iframe */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Softphone</div>
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          allow="camera *; microphone *"
          style={styles.iframe}
          title="Genesys Cloud Softphone"
        />
      </div>
    </div>
  );
}

/** @type {Object.<string, React.CSSProperties>} Inline style map. */
const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    flexShrink: 0,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8 },
  logoText: { fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' },
  tabs: { display: 'flex', gap: 4, marginLeft: 24 },
  tab: {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-dim)',
    padding: '6px 16px',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    background: 'var(--accent)',
    color: '#fff',
    borderColor: 'var(--accent)',
  },
  logBadge: {
    background: 'var(--red)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 10,
  },
  settingsBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
  },
  settingsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    background: 'var(--surface2)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 0 0',
  },
  sidebar: {
    width: 320,
    borderLeft: '1px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '10px 16px',
    fontWeight: 600,
    fontSize: 14,
    borderBottom: '1px solid var(--border)',
    textAlign: 'center',
  },
  iframe: {
    flex: 1,
    border: 'none',
    width: '100%',
  },
};
