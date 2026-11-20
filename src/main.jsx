import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Falha ao registrar o aplicativo OS-PRO:', error)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
