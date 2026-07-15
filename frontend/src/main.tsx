import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './shared/i18n';
import App from './app/App';
import { AppProviders } from './app/providers/AppProviders';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);