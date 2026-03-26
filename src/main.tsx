import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const MAINTENANCE = ['civica.se', 'www.civica.se'].includes(window.location.hostname)

function Maintenance() {
  return (
    <div style={{
      background: '#0a0f1c', color: '#fff',
      fontFamily: 'Inter, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', textAlign: 'center', margin: 0,
    }}>
      <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 600, opacity: 0.9 }}>
        Benim jobbar just nu med sidan! :)
      </h1>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {MAINTENANCE ? <Maintenance /> : <App />}
  </React.StrictMode>
)
