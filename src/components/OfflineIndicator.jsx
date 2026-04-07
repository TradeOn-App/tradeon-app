import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Mostra "reconectado" por 3s antes de sumir
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '0.5rem 1rem',
      textAlign: 'center',
      fontSize: '0.8rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      transition: 'all 0.3s ease',
      background: isOnline
        ? 'linear-gradient(135deg, #004d4d, #00807f)'
        : 'linear-gradient(135deg, #8b2020, #c0392b)',
      color: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    }}>
      {isOnline
        ? 'Conexão restabelecida'
        : 'Sem conexão — os dados exibidos podem estar desatualizados'}
    </div>
  );
}
