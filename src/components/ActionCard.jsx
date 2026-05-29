/**
 * @file ActionCard.jsx — Reusable card wrapper for action controls.
 *
 * Provides a consistent visual container (title + description + body slot)
 * used by every action in the {@link ActionsPanel}.
 */

/**
 * A styled card with a title, description, and children slot.
 *
 * @param {Object} props
 * @param {string}          props.title       — Card heading (supports emoji prefixes).
 * @param {string}          props.description — Short explanation shown below the title.
 * @param {React.ReactNode} props.children    — Interactive controls rendered in the card body.
 * @returns {JSX.Element}
 */
export default function ActionCard({ title, description, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.title}>{title}</div>
      <div style={styles.desc}>{description}</div>
      <div style={styles.body}>{children}</div>
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
  desc: { fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.4 },
  body: { display: 'flex', flexDirection: 'column', gap: 8 },
};
