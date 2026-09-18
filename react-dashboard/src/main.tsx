import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NotificationContainer } from './components/notification-container'
import { NotificationProvider } from './context/notification-provider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <App />
      <NotificationContainer />
    </NotificationProvider>
  </StrictMode>,
)
