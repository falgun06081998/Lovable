import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { HoodApp } from './components/hood/HoodApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HoodApp />
  </StrictMode>,
)
