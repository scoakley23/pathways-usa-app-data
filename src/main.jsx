import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
// Lexend 400-800, self-hosted (latin, latin-ext and Vietnamese).
import '@fontsource/lexend/400.css'
import '@fontsource/lexend/500.css'
import '@fontsource/lexend/600.css'
import '@fontsource/lexend/700.css'
import '@fontsource/lexend/800.css'
import '@/index.css'
import { loadScriptFont } from '@/design/scriptFonts'
import { getSavedLanguage } from '@/hooks/useAppLanguage'

// The saved language's script font, before the first screen draws.
loadScriptFont(getSavedLanguage())

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}