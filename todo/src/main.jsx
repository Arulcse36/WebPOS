// src/main.jsx or src/main.js
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // if you have CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)