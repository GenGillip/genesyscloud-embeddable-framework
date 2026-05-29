/**
 * @file main.jsx — Application entry point.
 *
 * Mounts the root `<App>` component into the `#root` DOM node defined in
 * `index.html`.  Wrapped in `<StrictMode>` to surface potential issues
 * during development.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
