
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

console.log("🚀 Neural Protocol Entry Point reached.");

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ Interface Synchronized.");
  } catch (err) {
    console.error("Mounting Error:", err);
    rootElement.innerHTML = `<div style="padding: 40px; color: #6366f1; font-family: monospace; font-size: 10px; text-align: center;">BOOT_LOAD_FAILURE: ${err.message}</div>`;
  }
}
