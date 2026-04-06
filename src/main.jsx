import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SelectedClientProvider } from './hooks/useSelectedClient';
import App from './App';
import OfflineIndicator from './components/OfflineIndicator';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SelectedClientProvider>
          <OfflineIndicator />
          <App />
        </SelectedClientProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
