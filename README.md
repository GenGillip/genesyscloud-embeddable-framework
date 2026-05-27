# Genesys Cloud Embeddable Framework — Modern UI

A modern **React 19 / Vite 8** replacement for the legacy PureCloud Embeddable Framework example page. Same functionality, better developer experience, with a real-time message log viewer for debugging.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Genesys Cloud OAuth Setup](#genesys-cloud-oauth-setup)
- [HTTPS / SSL Certificates](#https--ssl-certificates)
- [Configuration Reference](#configuration-reference)
  - [framework.js — OAuth & Client Settings](#frameworkjs--oauth--client-settings)
  - [framework.js — Settings Reference](#frameworkjs--settings-reference)
  - [Changing Regions](#changing-regions)
  - [Vite Dev Server](#vite-dev-server)
- [How It Works](#how-it-works)
  - [Message Flow](#message-flow)
  - [Actions (Parent → Iframe)](#actions-parent--iframe)
  - [Events (Iframe → Parent)](#events-iframe--parent)
- [UI Panels](#ui-panels)
  - [Actions Panel](#actions-panel)
  - [Events Panel](#events-panel)
  - [Log Panel](#log-panel)
- [Project Structure](#project-structure)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

---

## Features

| Feature | Description |
|---------|-------------|
| **Actions Panel** | Click-to-dial, associations, custom attributes, transfer context, contact search, user status, view navigation, audio config, interaction state control, custom notifications |
| **Events Panel** | Live display of screenPop, processCallLog, openCallLog, and all subscription events |
| **Log Panel** | Filterable, expandable, real-time log of all `postMessage` traffic (sent & received) with timestamps and full JSON detail |
| **Configurable iframe URL** | Switch Genesys Cloud regions on the fly via the ⚙️ settings gear |
| **Dark theme** | Modern dark UI with CSS custom properties |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (https://localhost:443)                                │
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │  React App (parent window)   │  │  Genesys Cloud iframe    │ │
│  │                              │  │                          │ │
│  │  App.jsx                     │  │  apps.mypurecloud.com    │ │
│  │  ├─ ActionsPanel.jsx         │  │  /crm/index.html         │ │
│  │  ├─ EventsPanel.jsx         │  │                          │ │
│  │  ├─ LogPanel.jsx            │  │  Loads framework.js from │ │
│  │  └─ useLogStore.js          │  │  https://localhost:443   │ │
│  │                              │  │                          │ │
│  │  postMessage ──────────────────► PureCloud SDK methods     │ │
│  │  (clickToDial, etc.)         │  │                          │ │
│  │                              │  │                          │ │
│  │  ◄────────────────────────────── postMessage               │ │
│  │  (screenPop, subscriptions)  │  │  (from framework.js      │ │
│  │                              │  │   callbacks)             │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

The Genesys Cloud CRM client runs inside an `<iframe>`. On load, it fetches `framework.js` from your local dev server (the `?crm=framework-local-secure` query parameter tells it to look at `https://localhost:443/framework.js`). That file defines the `window.Framework` object which configures OAuth, UI settings, event callbacks, and a bidirectional `postMessage` bridge.

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- A **Genesys Cloud** organization with admin access
- An **OAuth client** (Token Implicit Grant) — see [OAuth Setup](#genesys-cloud-oauth-setup)
- **SSL certificates** for `https://localhost` — see [HTTPS](#https--ssl-certificates)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (runs on https://localhost:443)
npm run dev

# 3. Open in your browser
#    https://localhost:443
```

> **Note:** The browser will warn about the self-signed certificate. Accept the warning to proceed. You must also visit `https://localhost:443/framework.js` directly and accept the certificate there, otherwise the iframe will silently fail to load it.

---

## Genesys Cloud OAuth Setup

The Embeddable Framework authenticates via **OAuth 2.0 Implicit Grant**. You must create an OAuth client in Genesys Cloud:

1. Log in to **Genesys Cloud** as an admin.
2. Navigate to **Admin → Integrations → OAuth**.
3. Click **Add Client**.
4. Configure:

   | Field | Value |
   |-------|-------|
   | **App Name** | `Embeddable Framework Dev` (or any name) |
   | **Grant Type** | **Token Implicit Grant (Browser)** |
   | **Authorized redirect URI** | `https://apps.mypurecloud.com/crm/authWindow.html` |

5. Click **Save**.
6. Copy the **Client ID** (a UUID like `25a05327-89f8-452a-9925-0095c08d8f46`).
7. Paste it into `public/framework.js` under `config.clientIds`:

   ```js
   clientIds: {
     "mypurecloud.com": "<your-client-id-here>"
   }
   ```

### Common OAuth Mistakes

| Symptom | Cause |
|---------|-------|
| "The OAuth client ID or redirect URI is invalid" | Wrong grant type (must be **Token Implicit Grant**), wrong redirect URI, or wrong Client ID in `framework.js` |
| Login popup opens then immediately closes | Redirect URI mismatch — must be exactly `https://apps.mypurecloud.com/crm/authWindow.html` |
| Login popup never appears | `dedicatedLoginWindow` is not set to `true` in settings |
| Works in one browser but not another | Certificate not accepted — visit `https://localhost:443/framework.js` directly and accept |

### Multi-Region OAuth

If your org is **not** on `mypurecloud.com`, you need a separate OAuth client in that region and a matching entry:

```js
clientIds: {
  "mypurecloud.com": "<client-id-for-us-east>",
  "mypurecloud.com.au": "<client-id-for-apac>",
  "mypurecloud.de": "<client-id-for-emea>",
  "mypurecloud.jp": "<client-id-for-japan>",
  "usw2.pure.cloud": "<client-id-for-us-west>",
  "cac1.pure.cloud": "<client-id-for-canada>",
  "euw2.pure.cloud": "<client-id-for-eu-west>"
}
```

You must also change the iframe URL to match (see [Changing Regions](#changing-regions)).

---

## HTTPS / SSL Certificates

The Embeddable Framework **requires HTTPS**. The Vite dev server auto-detects SSL certs from the original PureCloud example project:

```
../purecloud-embeddable-framework-example-master/https-requirements/
  ├── localhost.key   (private key)
  ├── localhost.crt   (certificate)
  └── ca.crt          (CA certificate)
```

### Generating Your Own Certificates

If you don't have the original project's certs, generate self-signed ones:

```bash
# Create a directory for certs
mkdir -p ../purecloud-embeddable-framework-example-master/https-requirements
cd ../purecloud-embeddable-framework-example-master/https-requirements

# Generate CA key and cert
openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.crt \
  -subj "/CN=Localhost CA"

# Generate server key and CSR
openssl genrsa -out localhost.key 2048
openssl req -new -key localhost.key -out localhost.csr \
  -subj "/CN=localhost"

# Sign the server cert with the CA
openssl x509 -req -in localhost.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out localhost.crt -days 365 -sha256
```

> **Tip:** Import `ca.crt` into your OS/browser trust store to avoid certificate warnings.

### Alternative: Inline Certs in vite.config.js

You can also place certs anywhere and update the path in `vite.config.js`:

```js
const certDir = path.resolve(__dirname, './certs')  // your custom path
```

---

## Configuration Reference

### framework.js — OAuth & Client Settings

`public/framework.js` is the **only file the Genesys Cloud iframe reads**. It must define `window.Framework` with at minimum:

```js
window.Framework = {
  config: {
    name: "MyIntegration",          // Unique integration name
    clientIds: {
      "mypurecloud.com": "<uuid>"   // Region → OAuth Client ID
    },
    settings: { ... }               // See settings reference below
  },
  initialSetup: function () { ... },
  screenPop: function (searchString, interaction) { ... },
  processCallLog: function (callLog, interaction, eventName, onSuccess, onFailure) { ... },
  openCallLog: function (callLog, interaction) { ... },
  contactSearch: function (searchString, onSuccess, onFailure) { ... }
};
```

### framework.js — Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `embedWebRTCByDefault` | `boolean` | `true` | Embed the WebRTC softphone directly in the client |
| `hideWebRTCPopUpOption` | `boolean` | `false` | Hide the option to pop softphone into a separate window |
| `enableCallLogs` | `boolean` | `true` | Enable the Interaction Log view |
| `enableTransferContext` | `boolean` | `true` | Allow transfer-context data on transfers |
| `hideCallLogSubject` | `boolean` | `true` | Hide Subject field in Interaction Log |
| `hideCallLogContact` | `boolean` | `false` | Hide Contact field in Interaction Log |
| `hideCallLogRelation` | `boolean` | `false` | Hide Related To field in Interaction Log |
| `dedicatedLoginWindow` | `boolean` | `true` | Open OAuth login in a popup window (**required**) |
| `embeddedInteractionWindow` | `boolean` | `false` | Embed the interaction window inside the client |
| `enableConfigurableCallerID` | `boolean` | `false` | Allow agents to select outbound caller ID |
| `enableServerSideLogging` | `boolean` | `true` | Send client logs to Genesys Cloud server |
| `enableCallHistory` | `boolean` | `false` | Show call history in the client |
| `defaultOutboundSMSCountryCode` | `string` | `"+1"` | Default country code for outbound SMS |
| `searchTargets` | `string[]` | `["people","queues","frameworkcontacts","externalContact"]` | Entity types in transfer/search dialog |
| `callControls` | `string[]` | See source | Ordered list of call-control buttons |
| `theme` | `object` | See source | Colour overrides (`primary`, `text`, `notification`) |
| `display` | `object` | See source | Fields shown in interaction detail views |

### Changing Regions

1. Click the **⚙️** gear icon in the top bar.
2. Change the iframe URL to your region:

   | Region | iframe URL |
   |--------|-----------|
   | US East (default) | `https://apps.mypurecloud.com/crm/index.html?crm=framework-local-secure` |
   | US West | `https://apps.usw2.pure.cloud/crm/index.html?crm=framework-local-secure` |
   | Canada | `https://apps.cac1.pure.cloud/crm/index.html?crm=framework-local-secure` |
   | EMEA (Frankfurt) | `https://apps.mypurecloud.de/crm/index.html?crm=framework-local-secure` |
   | EMEA (London) | `https://apps.euw2.pure.cloud/crm/index.html?crm=framework-local-secure` |
   | APAC (Sydney) | `https://apps.mypurecloud.com.au/crm/index.html?crm=framework-local-secure` |
   | APAC (Tokyo) | `https://apps.mypurecloud.jp/crm/index.html?crm=framework-local-secure` |

3. Make sure `public/framework.js` has a matching `clientIds` entry for that region hostname.

### Vite Dev Server

`vite.config.js` configures:

- **Port 443** — Required because the iframe fetches `framework.js` from `https://localhost:443`.
- **HTTPS** — Auto-enabled when SSL certs are found at the expected path.
- **React plugin** — Fast Refresh for development.

---

## How It Works

### Message Flow

All communication between the React app and the Genesys Cloud iframe uses the browser `postMessage` API with JSON-serialised payloads:

```
┌──────────────┐   postMessage(JSON)   ┌──────────────────┐
│  React App   │ ────────────────────► │  Iframe           │
│  (parent)    │                       │  (framework.js)   │
│              │ ◄──────────────────── │                   │
│              │   postMessage(JSON)   │  PureCloud SDK    │
└──────────────┘                       └──────────────────┘
```

Every message has a `type` field and an optional `data` field:

```json
{ "type": "clickToDial", "data": { "number": "3172222222", "autoPlace": true } }
```

### Actions (Parent → Iframe)

These are messages sent **from** the React app **to** the iframe when the user clicks a button in the Actions panel:

| Message Type | PureCloud SDK Method | Description |
|-------------|---------------------|-------------|
| `clickToDial` | `PureCloud.clickToDial()` | Initiate an outbound call |
| `addAssociation` | `PureCloud.addAssociation()` | Add a Name/Related To entry to the call log |
| `addAttribute` | `PureCloud.addCustomAttributes()` | Attach custom key-value pairs to an interaction |
| `addTransferContext` | `PureCloud.addTransferContext()` | Attach context data for transfers |
| `sendContactSearch` | *(callback)* | Return contact search results to the iframe |
| `updateUserStatus` | `PureCloud.User.updateStatus()` | Change the agent's presence status |
| `updateInteractionState` | `PureCloud.Interaction.updateState()` | Pickup, hold, mute, disconnect, or secure-pause |
| `setView` | `PureCloud.User.setView()` | Navigate to a specific view in the client |
| `updateAudioConfiguration` | `PureCloud.User.Notification.setAudioConfiguration()` | Toggle audio alerts per interaction type |
| `sendCustomNotification` | `PureCloud.User.Notification.notifyUser()` | Display a toast notification in the client |

### Events (Iframe → Parent)

These are messages sent **from** `framework.js` callbacks **to** the React app:

| Message Type | Trigger |
|-------------|---------|
| `screenPop` | Inbound interaction alerting — carries the ANI/search string |
| `processCallLog` | Interaction state change with pending log data |
| `openCallLog` | User clicked the detail arrow on an Interaction Log entry |
| `contactSearch` | User searched for a contact in the transfer dialog |
| `interactionSubscription` | Any interaction lifecycle change (alerting → connected → disconnected) |
| `userActionSubscription` | Agent UI actions (button clicks, view changes) |
| `notificationSubscription` | Contextual notifications from the embedded client |

---

## UI Panels

### Actions Panel

A scrollable list of action cards, each with:
- An **emoji icon** and **title**
- A **description** of what the action does
- **Input fields** (JSON textareas, dropdowns, checkboxes) pre-populated with example payloads
- A **Send/Execute button** that posts the message to the iframe

### Events Panel

Six cards showing the **most recent payload** for each event type. The JSON is pretty-printed in a scrollable `<pre>` block. Cards show "Waiting for events..." until the first event of that type arrives.

### Log Panel

A real-time, reverse-chronological log of **every** `postMessage` exchanged:
- **Direction badge** — `↑ SENT` (purple) or `↓ RECV` (green)
- **Type** — Colour-coded by message type
- **Timestamp** — High-precision (`HH:MM:SS.mmm`)
- **Click to expand** — Shows the full JSON payload
- **Filter** — Type in the search box to filter by message type
- **Clear** — Remove all log entries
- Capped at **500 entries** to prevent memory issues

---

## Project Structure

```
gc-embeddable-framework/
├── index.html                          # HTML shell with #root mount point
├── package.json                        # Dependencies and scripts
├── vite.config.js                      # Vite dev server (HTTPS, port 443)
├── public/
│   ├── framework.js                    # ⭐ Embeddable Framework bridge (OAuth + callbacks)
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.jsx                        # Entry point — mounts <App>
    ├── index.css                       # Global styles and CSS custom properties
    ├── App.jsx                         # Root component — layout, tabs, iframe, message handler
    ├── useLogStore.js                  # Custom hook — capped message log store
    └── components/
        ├── ActionCard.jsx              # Reusable card wrapper for action controls
        ├── ActionsPanel.jsx            # All action controls (click-to-dial, status, etc.)
        ├── EventsPanel.jsx             # Read-only event display cards
        └── LogPanel.jsx                # Filterable, expandable message log viewer
```

### Key Files

| File | Purpose |
|------|---------|
| `public/framework.js` | **The bridge.** Loaded by the Genesys Cloud iframe. Defines OAuth config, UI settings, event subscriptions, and the `postMessage` handler. **This is the file you edit for OAuth and settings changes.** |
| `src/App.jsx` | Root component. Manages the iframe ref, listens for incoming messages, and routes them to the log store and events map. |
| `src/useLogStore.js` | Custom React hook providing a capped (500-entry) log array with `addLog` and `clearLogs` operations. Uses a mutable ref to avoid stale closures. |
| `src/components/ActionsPanel.jsx` | Renders one `ActionCard` per Framework action. Each card serialises its payload and posts it to the iframe. |
| `src/components/EventsPanel.jsx` | Displays the latest payload for each event type in read-only JSON cards. |
| `src/components/LogPanel.jsx` | Full message log with direction badges, colour-coded types, timestamps, filtering, and expandable JSON detail. |

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static HTTPS server. Note that `framework.js` is in `public/` and will be copied to `dist/` as-is by Vite.

> **Important:** If you previously edited `dist/framework.js` directly, those changes will be **overwritten** on the next build. Always edit `public/framework.js`.

---

## Troubleshooting

### "The OAuth client ID or redirect URI is invalid"

1. Verify the OAuth client in Genesys Cloud Admin → OAuth:
   - **Grant Type** must be **Token Implicit Grant (Browser)**
   - **Redirect URI** must be exactly `https://apps.mypurecloud.com/crm/authWindow.html`
2. Verify the **Client ID** in `public/framework.js` matches (not `dist/framework.js`).
3. Verify the region key in `clientIds` matches your iframe URL hostname.

### Iframe shows a blank white page

- Open DevTools → Console and check for errors.
- Visit `https://localhost:443/framework.js` directly — if the browser blocks it, accept the certificate.
- Ensure `npm run dev` is running and the Vite server is on port 443.

### Login popup opens and closes immediately

- The redirect URI in your OAuth client doesn't match `https://apps.mypurecloud.com/crm/authWindow.html`.
- Or `dedicatedLoginWindow` is not `true` in `public/framework.js`.

### Changes to framework.js aren't taking effect

- Make sure you're editing `public/framework.js`, **not** `dist/framework.js`.
- Hard-refresh the browser (`Ctrl+Shift+R`) — the iframe may cache the old file.
- Check the Vite terminal to confirm it's serving the updated file.

### Port 443 is already in use

- Another process (IIS, Apache, nginx) may be using port 443.
- On Windows: `netstat -ano | findstr :443` to find the PID, then `taskkill /PID <pid> /F`.
- Or change the port in `vite.config.js` (but note the iframe expects `framework.js` on port 443).

### WebRTC / microphone not working

- Ensure the iframe has `allow="camera *; microphone *"` (already set in `App.jsx`).
- Chrome requires HTTPS for `getUserMedia` — make sure SSL is configured.
- Check browser permissions for microphone access.

---

## Resources

- [Genesys Cloud Embeddable Framework Documentation](https://developer.genesys.cloud/devapps/embeddable-framework/)
- [Embeddable Framework Actions Reference](https://developer.genesys.cloud/devapps/embeddable-framework/actions)
- [Embeddable Framework Events Reference](https://developer.genesys.cloud/devapps/embeddable-framework/events)
- [Genesys Cloud OAuth Overview](https://developer.genesys.cloud/authorization/platform-auth/)
- [Genesys Cloud Region Hostnames](https://developer.genesys.cloud/platform/api/)
- [Vite Documentation](https://vite.dev/)
- [React 19 Documentation](https://react.dev/)
