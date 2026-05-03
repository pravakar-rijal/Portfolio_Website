import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const LinuxDesktop = lazy(() => import('./components/desktop/LinuxDesktop'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

function BootScreen() {
  return (
    <div style={{ background: '#0a0a0a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ color: '#00ff41', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>
        pravakar@portfolio:~$ booting...
      </div>
      <div style={{ color: '#00ff41', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', opacity: 0.6 }}>
        Loading PortfolioOS v1.0
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<BootScreen />}>
      <Routes>
        <Route path="/" element={<LinuxDesktop />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
