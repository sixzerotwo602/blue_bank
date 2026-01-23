
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './services/socketContext';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Dashboard } from './pages/Dashboard';
import { ReconnectOverlay } from './components/ReconnectOverlay';
import { useSocket } from './hooks/useSocket';

// Inner component to access socket context (T059)
const AppContent = () => {
  const { reconnecting, reconnectAttempt, reconnectFailed } = useSocket();

  return (
    <>
      {(reconnecting || reconnectFailed) && (
        <ReconnectOverlay
          attempts={reconnectAttempt}
          maxAttempts={5}
          failed={reconnectFailed}
          onRefresh={() => window.location.reload()}
        />
      )}
      <Toaster position="top-center" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:roomId" element={<Lobby />} />
          <Route path="/game/:roomId" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App;

