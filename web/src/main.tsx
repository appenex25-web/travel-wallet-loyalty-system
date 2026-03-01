import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { loadRuntimeConfig } from './lib/api'
import './index.css'
import App from './App.tsx'

loadRuntimeConfig().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
