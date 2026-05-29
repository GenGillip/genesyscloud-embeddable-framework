/**
 * @file useLogStore.js — Zustand-style log store implemented as a React hook.
 *
 * Maintains a capped, reverse-chronological list of postMessage log entries.
 * A mutable ref (`logsRef`) is used alongside React state to avoid stale
 * closures in the high-frequency `addLog` callback.
 */

import { useState, useCallback, useRef } from 'react';

/** Auto-incrementing ID counter shared across all hook instances. */
let globalId = 0;

/**
 * @typedef {Object} LogEntry
 * @property {number}  id        — Unique auto-incrementing identifier.
 * @property {Date}    time      — Timestamp when the entry was recorded.
 * @property {string}  direction — `"sent"` (parent → iframe) or `"received"` (iframe → parent).
 * @property {string}  type      — The message type (e.g. `"clickToDial"`, `"screenPop"`).
 * @property {*}       data      — The raw message payload.
 */

/**
 * Custom hook that provides a capped (500-entry) message log with add / clear
 * operations.  Designed to be instantiated once in the root `<App>` and passed
 * down via props.
 *
 * @returns {{ logs: LogEntry[], addLog: Function, clearLogs: Function }}
 */
export function useLogStore() {
  /** @type {[LogEntry[], Function]} Reactive log array for rendering. */
  const [logs, setLogs] = useState([]);

  /** @type {React.MutableRefObject<LogEntry[]>} Mutable ref to avoid stale closures. */
  const logsRef = useRef([]);

  /**
   * Append a new log entry (newest-first) and cap the list at 500 entries.
   *
   * @param {string} direction — `"sent"` or `"received"`.
   * @param {string} type      — Message type identifier.
   * @param {*}      data      — Arbitrary payload.
   * @returns {void}
   */
  const addLog = useCallback((direction, type, data) => {
    const entry = {
      id: ++globalId,
      time: new Date(),
      direction,
      type,
      data,
    };
    logsRef.current = [entry, ...logsRef.current].slice(0, 500);
    setLogs([...logsRef.current]);
  }, []);

  /**
   * Remove all log entries.
   * @returns {void}
   */
  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}
