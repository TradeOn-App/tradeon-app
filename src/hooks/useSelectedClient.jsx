import { useState, createContext, useContext } from 'react';

const SelectedClientContext = createContext(null);

export function SelectedClientProvider({ children }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clients, setClients] = useState([]);

  return (
    <SelectedClientContext.Provider value={{ selectedClientId, setSelectedClientId, clients, setClients }}>
      {children}
    </SelectedClientContext.Provider>
  );
}

export function useSelectedClient() {
  const ctx = useContext(SelectedClientContext);
  if (!ctx) throw new Error('useSelectedClient must be used within SelectedClientProvider');
  return ctx;
}
