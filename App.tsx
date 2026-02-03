
import React, { useState, useEffect } from 'react';
import Calculator from './components/Calculator';
import ChatRoom from './components/ChatRoom';
import AuthTerminal from './components/AuthTerminal';
import { ViewState, LobbyType } from './types';
import Gun from 'gun';
import 'gun/sea';

const GUN_PEERS = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://relay.peer.ooo/gun'
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('calculator');
  const [user, setUser] = useState<any>(null);
  const [lobby, setLobby] = useState<LobbyType>('Class');
  const [gunInstance, setGunInstance] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let gun: any;
    try {
      console.log("Initializing Gun Secure Protocol...");
      
      // Initialize Gun with explicit peer set
      gun = Gun({ 
        peers: GUN_PEERS,
        localStorage: true,
        radisk: false // Disable radisk on mobile to improve stability
      });
      
      setGunInstance(gun);
      
      // Safe user check
      const gunUser = gun.user();
      if (gunUser && gunUser.is) {
        setUser(gunUser);
      }
      
      console.log("Gun Protocol Online.");
    } catch (e) {
      console.error("Failed to initialize Gun:", e);
      setInitError(String(e));
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleUnlock = () => {
    setView('auth');
  };

  const handleAuthComplete = (gunUser: any, selectedLobby: LobbyType) => {
    setUser(gunUser);
    setLobby(selectedLobby);
    setView('chat');
  };

  const handleLogout = () => {
    if (gunInstance) {
      const gunUser = gunInstance.user();
      if (gunUser && gunUser.leave) gunUser.leave();
    }
    setUser(null);
    setView('calculator');
  };

  if (initError) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-500">
        <div className="mono text-[10px] uppercase mb-2">Protocol_Initialization_Error</div>
        <div className="mono text-[8px] opacity-50 break-all max-w-xs text-center">{initError}</div>
      </div>
    );
  }

  if (!gunInstance) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-200">
        <div className="mono text-[10px] animate-pulse">CONNECTING_TO_NODES...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-200">
      {view === 'calculator' && (
        <div className="w-full max-w-md animate-fade-in">
          <Calculator onTrigger={handleUnlock} />
        </div>
      )}

      {view === 'auth' && (
        <div className="w-full max-w-md animate-fade-in">
          <AuthTerminal gun={gunInstance} onComplete={handleAuthComplete} />
        </div>
      )}

      {view === 'chat' && user && (
        <div className="w-full max-w-6xl h-[90vh] animate-fade-in">
          <ChatRoom 
            gun={gunInstance} 
            currentUser={user} 
            initialLobby={lobby} 
            onLogout={handleLogout}
          />
        </div>
      )}
    </div>
  );
};

export default App;
