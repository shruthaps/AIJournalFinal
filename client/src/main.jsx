import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { JournalProvider } from './context/JournalContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <JournalProvider>
        <App />
      </JournalProvider>
    </AuthProvider>
  </React.StrictMode>
);
