
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("MathPro Ultra: Initializing Neural Protocol...");

// Global error logger for mobile debugging
window.onerror = (msg, url, lineNo, columnNo, error) => {
  console.error('Runtime Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  console.error("React Mounting Error:", err);
  rootElement.innerHTML = `<div style="padding: 20px; color: #ef4444; font-family: monospace; font-size: 12px;">CRITICAL_MOUNT_FAILURE: ${err}</div>`;
}
