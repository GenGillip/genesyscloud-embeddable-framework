/**
 * @file LogPanel.jsx — Filterable, expandable real-time message log viewer.
 *
 * Renders every postMessage exchanged between the parent app and the iframe
 * in reverse-chronological order.  Each row shows direction (SENT / RECV),
 * message type (colour-coded), and timestamp.  Clicking a row expands the
 * full JSON payload.
 */

import { useState } from 'react';

/**
 * Colour map for message types.  Provides visual differentiation in the log.
 * @type {Object.<string, string>}
 */
const TYPE_COLORS = {
  clickToDial: '#60a5fa',
  addAssociation: '#a78bfa',
  addAttribute: '#f472b6',
  addTransferContext: '#fb923c',
  sendContactSearch: '#34d399',
  updateUserStatus: '#fbbf24',
  updateInteractionState: '#f87171',
  setView: '#2dd4bf',
  updateAudioConfiguration: '#818cf8',
  sendCustomNotification: '#e879f9',
  screenPop: '#34d399',
  processCallLog: '#60a5fa',
  openCallLog: '#a78bfa',
  contactSearch: '#fbbf24',
  interactionSubscription: '#f472b6',
  userActionSubscription: '#fb923c',
  notificationSubscription: '#2dd4bf',
};

/**
 * Real-time, filterable log of all postMessage traffic.
 *
 * @param {Object} props
 * @param {import('../useLogStore').LogEntry[]} props.logs    — Full log array (newest first).
 * @param {Function}                            props.onClear — Callback to clear all log entries.
 * @returns {JSX.Element}
 */
export default function LogPanel({ logs, onClear }) {
  /** @type {[string, Function]} Case-insensitive type filter. */
  const [filter, setFilter] = useState('');

  /** @type {[Object.<number, boolean>, Function]} Map of log ID → expanded state. */
  const [expanded, setExpanded] = useState({});

  const filtered = filter
    ? logs.filter(l => l.type.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  /** Toggle the expanded state of a single log entry. */
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>📋 Message Log</span>
        <span style={styles.count}>{filtered.length} entries</span>
        <input
          style={styles.filter}
          placeholder="Filter by type..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <button onClick={onClear} style={styles.clearBtn}>Clear</button>
      </div>
      <div style={styles.list}>
        {filtered.length === 0 && (
          <div style={styles.empty}>No log entries yet. Interact with the framework to see messages here.</div>
        )}
        {filtered.map(log => (
          <div key={log.id} style={styles.entry} onClick={() => toggle(log.id)}>
            <div style={styles.entryHeader}>
              <span style={{
                ...styles.badge,
                background: log.direction === 'sent' ? '#6c63ff33' : '#34d39933',
                color: log.direction === 'sent' ? '#a5a0ff' : '#34d399',
              }}>
                {log.direction === 'sent' ? '↑ SENT' : '↓ RECV'}
              </span>
              <span style={{ ...styles.typeBadge, color: TYPE_COLORS[log.type] || '#8b90a5' }}>
                {log.type}
              </span>
              <span style={styles.time}>
                {log.time.toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 })}
              </span>
            </div>
            {expanded[log.id] && (
              <pre style={styles.json}>{JSON.stringify(log.data, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** @type {Object.<string, React.CSSProperties>} */
const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  title: { fontWeight: 600, fontSize: 14 },
  count: { fontSize: 12, color: 'var(--text-dim)' },
  filter: { marginLeft: 'auto', width: 180 },
  clearBtn: { fontSize: 12, padding: '4px 10px' },
  list: { flex: 1, overflow: 'auto', padding: 6 },
  empty: { padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 },
  entry: {
    background: 'var(--bg)',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: 4,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'border-color 0.15s',
  },
  entryHeader: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 },
  badge: {
    padding: '1px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  typeBadge: { fontWeight: 600, fontFamily: 'monospace', fontSize: 12 },
  time: { marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 11, fontFamily: 'monospace' },
  json: {
    marginTop: 8,
    padding: 10,
    background: 'var(--surface2)',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "'Cascadia Code', 'Fira Code', monospace",
    overflow: 'auto',
    maxHeight: 300,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    color: 'var(--text)',
  },
};
