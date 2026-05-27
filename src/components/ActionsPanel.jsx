/**
 * @file ActionsPanel.jsx — Interactive controls for every Embeddable Framework action.
 *
 * Each {@link ActionCard} maps to a single Framework action.  Clicking a
 * button serialises the payload to JSON and posts it into the softphone
 * iframe via `postMessage`.  The iframe's `framework.js` message handler
 * then calls the corresponding `window.PureCloud.*` SDK method.
 *
 * @see https://developer.genesys.cloud/devapps/embeddable-framework/actions
 */

import { useState } from 'react';
import ActionCard from './ActionCard';

/**
 * Panel containing all Embeddable Framework action cards.
 *
 * @param {Object} props
 * @param {React.RefObject<HTMLIFrameElement>} props.iframeRef — Ref to the softphone iframe.
 * @param {Function} props.addLog — Logger callback from {@link useLogStore}.
 * @returns {JSX.Element}
 */
export default function ActionsPanel({ iframeRef, addLog }) {
  const [association, setAssociation] = useState('{"type":"contact","id":"1234","text":"Weather Line","select":true}');
  const [attribute, setAttribute] = useState('{"interactionId":"1234-1234-1234-1234","attributes":{"exampleWorkspaceKey":"https://exampleworkspaceurl.com"}}');
  const [transferCtx, setTransferCtx] = useState('{"name":"Case: 1234 - Broken Phone","attributes":{"PT_TransferContext":"1234"}}');
  const [contactSearch, setContactSearch] = useState('[{"type":"external","name":"Weather Line","phone":[{"number":"(317) 222-2222","label":"Cell"}]}]');
  const [status, setStatus] = useState('AVAILABLE');
  const [notifMsg, setNotifMsg] = useState('This is a message!');
  const [notifType, setNotifType] = useState('ERROR');
  const [notifTimeout, setNotifTimeout] = useState('0');
  const [audio, setAudio] = useState({ call: true, email: true, callback: true, chat: true, message: true, voicemail: true });

  /**
   * Serialise a typed payload and post it into the softphone iframe.
   * Also records the message in the log store.
   *
   * @param {string} type — Message type identifier (e.g. `"clickToDial"`).
   * @param {*}      data — Payload object.
   * @returns {void}
   */
  const send = (type, data) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type, data }), '*');
    addLog('sent', type, data);
  };

  const row = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' };

  return (
    <div style={{ overflow: 'auto', flex: 1, padding: '0 16px 16px' }}>
      {/* ── Click-to-Dial ──────────────────────────────────────── */}
      <ActionCard title="📞 Click-to-Dial" description="Raise events to automatically place a call using the embedded client.">
        <button onClick={() => send('clickToDial', { number: '3172222222', autoPlace: true })}>
          Call 3172222222
        </button>
      </ActionCard>

      {/* ── Add Association ────────────────────────────────────── */}
      <ActionCard title="🔗 Add Association" description="Update options for Name or Related To fields in the Interaction Log view.">
        <textarea rows={3} value={association} onChange={e => setAssociation(e.target.value)} style={{ width: '100%' }} />
        <button onClick={() => send('addAssociation', JSON.parse(association))}>Send</button>
      </ActionCard>

      {/* ── Custom Attributes ──────────────────────────────────── */}
      <ActionCard title="🏷️ Custom Attributes" description="Add additional information to interactions and sync attributes to call logs.">
        <textarea rows={3} value={attribute} onChange={e => setAttribute(e.target.value)} style={{ width: '100%' }} />
        <button onClick={() => send('addAttribute', JSON.parse(attribute))}>Send</button>
      </ActionCard>

      {/* ── Transfer Context ───────────────────────────────────── */}
      <ActionCard title="🔀 Transfer Context" description="Provide additional information when transferring interactions.">
        <textarea rows={3} value={transferCtx} onChange={e => setTransferCtx(e.target.value)} style={{ width: '100%' }} />
        <button onClick={() => send('addTransferContext', JSON.parse(transferCtx))}>Send</button>
      </ActionCard>

      {/* ── Contact Search ─────────────────────────────────────── */}
      <ActionCard title="🔍 Contact Search" description="Define which contacts the integration returns from an external CRM.">
        <textarea rows={3} value={contactSearch} onChange={e => setContactSearch(e.target.value)} style={{ width: '100%' }} />
        <button onClick={() => send('sendContactSearch', JSON.parse(contactSearch))}>Send</button>
      </ActionCard>

      {/* ── User Status ────────────────────────────────────────── */}
      <ActionCard title="👤 User Status" description="Manage status between Genesys Cloud and third-party systems.">
        <div style={row}>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="AVAILABLE">Available</option>
            <option value="AWAY">Away</option>
            <option value="ON_QUEUE">On Queue</option>
          </select>
          <button onClick={() => send('updateUserStatus', { id: status })}>Update</button>
        </div>
      </ActionCard>

      {/* ── Set View ───────────────────────────────────────────── */}
      <ActionCard title="🖥️ Set View" description="Set the embedded client to a specific view.">
        <div style={row}>
          {['interactionList', 'callLog', 'newInteraction', 'callback', 'settings'].map(v => (
            <button key={v} onClick={() => send('setView', { type: 'main', view: { name: v } })}>{v}</button>
          ))}
        </div>
      </ActionCard>

      {/* ── Audio Configuration ────────────────────────────────── */}
      <ActionCard title="🔊 Audio Configuration" description="Control which interaction types play an audible alert.">
        <div style={row}>
          {Object.keys(audio).map(k => (
            <label key={k} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={audio[k]} onChange={() => setAudio(p => ({ ...p, [k]: !p[k] }))} />
              {k}
            </label>
          ))}
        </div>
        <button onClick={() => send('updateAudioConfiguration', audio)}>Save</button>
      </ActionCard>

      {/* ── Interaction State ──────────────────────────────────── */}
      <ActionCard title="🎮 Interaction State" description="Update the state of an interaction (pickup, disconnect, hold, mute, securePause).">
        <div style={row}>
          {['pickup', 'disconnect', 'hold', 'mute', 'securePause'].map(a => (
            <button key={a} onClick={() => {
              const id = prompt('Enter interaction ID:');
              if (id) send('updateInteractionState', { action: a, id });
            }}>{a}</button>
          ))}
        </div>
      </ActionCard>

      {/* ── Custom Notification ────────────────────────────────── */}
      <ActionCard title="🔔 Custom Notification" description="Show custom messages to the user in the embedded client.">
        <div style={row}>
          <input value={notifMsg} onChange={e => setNotifMsg(e.target.value)} style={{ flex: 1 }} />
          <select value={notifType} onChange={e => setNotifType(e.target.value)}>
            {['INFO', 'SUCCESS', 'WARNING', 'ERROR'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={notifTimeout} onChange={e => setNotifTimeout(e.target.value)}>
            <option value="0">No Timeout</option>
            <option value="5000">5s</option>
            <option value="10000">10s</option>
            <option value="15000">15s</option>
            <option value="20000">20s</option>
          </select>
        </div>
        <button onClick={() => send('sendCustomNotification', { message: notifMsg, type: notifType, timeout: notifTimeout })}>Send</button>
      </ActionCard>
    </div>
  );
}
