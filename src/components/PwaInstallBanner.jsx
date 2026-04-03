import { useState } from 'react';
import { LuDownload, LuX, LuShare, LuEllipsisVertical, LuSquarePlus } from 'react-icons/lu';
import usePwaInstall from '../hooks/usePwaInstall';

function getDeviceInfo() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function ManualSteps({ device, onClose }) {
  const steps = {
    ios: [
      { icon: <LuShare size={18} />, text: 'Toque no botão de compartilhar na barra do Safari' },
      { icon: <LuSquarePlus size={18} />, text: 'Role e toque em "Adicionar à Tela de Início"' },
      { icon: <LuDownload size={18} />, text: 'Confirme tocando em "Adicionar"' },
    ],
    android: [
      { icon: <LuEllipsisVertical size={18} />, text: 'Toque no menu (3 pontos) do navegador' },
      { icon: <LuSquarePlus size={18} />, text: 'Toque em "Adicionar à tela inicial" ou "Instalar app"' },
      { icon: <LuDownload size={18} />, text: 'Confirme tocando em "Instalar"' },
    ],
    desktop: [
      { icon: <LuEllipsisVertical size={18} />, text: 'Clique no menu do navegador (3 pontos)' },
      { icon: <LuDownload size={18} />, text: 'Clique em "Instalar TradeOn..." ou "Instalar aplicativo"' },
      { icon: <LuSquarePlus size={18} />, text: 'Confirme clicando em "Instalar"' },
    ],
  };

  const currentSteps = steps[device] || steps.desktop;

  return (
    <div className="pwa-manual-overlay" onClick={onClose}>
      <div className="pwa-manual-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pwa-manual-header">
          <h3>Instalar TradeOn</h3>
          <button className="pwa-close-btn" onClick={onClose}><LuX size={18} /></button>
        </div>
        <p className="pwa-manual-subtitle">
          Siga os passos abaixo para adicionar o app à sua tela inicial:
        </p>
        <ol className="pwa-steps">
          {currentSteps.map((step, i) => (
            <li key={i} className="pwa-step">
              <div className="pwa-step-icon">{step.icon}</div>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function PwaInstallBanner() {
  const { canInstallNatively, isInstalled, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-banner-dismissed') === '1');
  const [showManual, setShowManual] = useState(false);

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (canInstallNatively) {
      const accepted = await install();
      if (accepted) handleDismiss();
    } else {
      setShowManual(true);
    }
  };

  return (
    <>
      <div className="pwa-install-banner">
        <div className="pwa-install-content">
          <LuDownload size={20} className="pwa-install-icon" />
          <span className="pwa-install-text">Use o TradeOn como aplicativo</span>
        </div>
        <div className="pwa-install-actions">
          <button className="btn btn-gold btn-sm" onClick={handleInstall}>
            Usar Aplicativo
          </button>
          <button className="pwa-close-btn" onClick={handleDismiss}>
            <LuX size={16} />
          </button>
        </div>
      </div>
      {showManual && (
        <ManualSteps device={getDeviceInfo()} onClose={() => setShowManual(false)} />
      )}
    </>
  );
}
