
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🚀 Neural Protocol Entry Point reached via Babel.");

// Suppress known non-fatal Gun.js warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('HTTPS needed') || args[0].includes('tailwindcss'))) {
    return;
  }
  originalWarn.apply(console, args);
};

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ Main Interface Loaded Successfully.");
  } catch (err) {
    console.error("Mounting Error:", err);
    rootElement.innerHTML = `
      <div style="padding: 40px; color: #6366f1; font-family: monospace; font-size: 10px; text-align: center;">
        <p>CRITICAL_BOOT_ERROR</p>
        <p style="opacity: 0.5; margin-top: 10px;">${err.message}</p>
        <button onclick="location.reload()" style="margin-top: 20px; background: #6366f1; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">RETRY_SYNC</button>
      </div>
    `;
  }
}
