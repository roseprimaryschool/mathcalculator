
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
  const [gunInstance] = useState(() => Gun({ peers: GUN_PEERS }));

  useEffect(() => {
    const gunUser = gunInstance.user();
    // Check if user is already logged in
    if (gunUser.is) {
      setUser(gunUser);
    }
  }, [gunInstance]);

  const handleUnlock = () => {
    setView('auth');
  };

  const handleAuthComplete = (gunUser: any, selectedLobby: LobbyType) => {
    setUser(gunUser);
    setLobby(selectedLobby);
    setView('chat');
  };

  const handleLogout = () => {
    const gunUser = gunInstance.user();
    gunUser.leave();
    setUser(null);
    setView('calculator');
  };

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
