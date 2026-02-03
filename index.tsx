
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🚀 Neural Protocol Entry Point reached.");

// Suppress known non-fatal Gun.js redirect warnings to prevent UI blocking
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('HTTPS needed')) {
    console.log("Handled: Gun.js HTTPS detection warning bypassed.");
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
    console.log("✅ React Root Rendered Successfully.");
  } catch (err) {
    console.error("Mounting Error:", err);
    rootElement.innerHTML = `<div style="padding: 40px; color: #6366f1; font-family: monospace; font-size: 10px; text-align: center;">BOOT_LOAD_FAILURE: ${err}</div>`;
  }
}
