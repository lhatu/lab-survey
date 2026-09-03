import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for Cache-First PWA capabilities
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New VKU Field Survey update available. Reload now?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('VKU Field Survey is ready for offline operation!');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
