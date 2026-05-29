/**
 * @file EventsPanel.jsx — Read-only display of the most recent event per type.
 *
 * Each card shows the last payload received from the iframe for a given
 * event type (screenPop, processCallLog, subscriptions, etc.).
 * The JSON is pretty-printed inside a scrollable `<pre>` block.
 */

/**
 * @typedef {Object} EventSection
 * @property {string} key   — Event type key matching the postMessage `type` field.
 * @property {string} label — Human-readable heading with emoji prefix.
 * @property {string} desc  — Short description of when this event fires.
 */

/** @type {EventSection[]} Ordered list of event cards to render. */
const SECTIONS = [
  { key: 'screenPop',                label: '📱 Screen Pop',                desc: 'Raised for inbound alerting interactions.' },
  { key: 'processCallLog',           label: '📝 Process Call Log',          desc: 'Raised when interaction state is updated with pending changes.' },
  { key: 'openCallLog',              label: '📂 Open Call Log',             desc: 'Raised when user clicks the arrow on the Interaction Log view.' },
  { key: 'interactionSubscription',  label: '🔄 Interaction Subscription',  desc: 'Interaction lifecycle events.' },
  { key: 'userActionSubscription',   label: '👆 UserAction Subscription',   desc: 'Agent interface alignment events.' },
  { key: 'notificationSubscription', label: '🔔 Notification Subscription', desc: 'Contextual notification events.' },
];

/**
 * Displays the most recent payload for each known event type.
 *
 * @param {Object} props
 * @param {Object.<string, Object>} props.events — Map of event type → latest payload.
 * @returns {JSX.Element}
 */
export default function EventsPanel({ events }) {
  return (
    <div style={{ overflow: 'auto', flex: 1, padding: '0 16px 16px' }}>
      {SECTIONS.map(s => (
        <div key={s.key} style={styles.card}>
          <div style={styles.title}>{s.label}</div>
          <div style={styles.desc}>{s.desc}</div>
          <pre style={styles.pre}>
            {events[s.key] ? JSON.stringify(events[s.key], null, 2) : 'Waiting for events...'}
          </pre>
        </div>
      ))}
    </div>
  );
}

/** @type {Object.<string, React.CSSProperties>} */
const styles = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: 16,
    marginBottom: 10,
  },
  title: { fontWeight: 600, fontSize: 14, marginBottom: 4 },
  desc: { fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 },
  pre: {
    background: 'var(--bg)',
    borderRadius: 6,
    padding: 12,
    fontSize: 12,
    fontFamily: "'Cascadia Code', 'Fira Code', monospace",
    overflow: 'auto',
    maxHeight: 200,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    color: 'var(--text-dim)',
  },
};
