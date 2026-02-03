
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🚀 Neural Protocol Entry Point reached.");

// Global error logger for mobile debugging
window.onerror = (msg, url, lineNo, columnNo, error) => {
  const errorMsg = `Error: ${msg}\nLine: ${lineNo}\nCol: ${columnNo}`;
  console.error(errorMsg, error);
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 40px; color: #ef4444; font-family: monospace; font-size: 12px; text-align: center;">LOAD_ERROR: ${msg}</div>`;
  }
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical Failure: Root element not found.");
} else {
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
    rootElement.innerHTML = `<div style="padding: 40px; color: #ef4444; font-family: monospace; font-size: 12px;">CRITICAL_MOUNT_FAILURE: ${err}</div>`;
  }
}
