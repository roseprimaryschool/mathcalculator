
import React, { useState, useEffect } from 'react';
import Calculator from './components/Calculator.js';
import ChatRoom from './components/ChatRoom.js';
import AuthTerminal from './components/AuthTerminal.js';
import Gun from 'gun';
import 'gun/sea';

const GUN_PEERS = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://relay.peer.ooo/gun'
];

const App = () => {
  const [view, setView] = useState('calculator');
  const [user, setUser] = useState(null);
  const [lobby, setLobby] = useState('Class');
  const [gunInstance, setGunInstance] = useState(null);
  const [gunStatus, setGunStatus] = useState('connecting');

  useEffect(() => {
    try {
      console.log("System: Linking to Mesh...");
      const gun = Gun({ peers: GUN_PEERS, localStorage: true, radisk: false });
      setGunInstance(gun);
      const gunUser = gun.user();
      if (gunUser && gunUser.is) setUser(gunUser);
      setGunStatus('online');
    } catch (e) {
      console.error("Gun Error:", e);
      setGunStatus('error');
    }
  }, []);

  const handleUnlock = () => {
    if (gunStatus === 'error') {
      alert("CRITICAL: Mesh unavailable.");
      return;
    }
    setView('auth');
  };

  const handleAuthComplete = (gunUser, selectedLobby) => {
    setUser(gunUser);
    setLobby(selectedLobby);
    setView('chat');
  };

  const handleLogout = () => {
    if (gunInstance) {
      const gunUser = gunInstance.user();
      if (gunUser?.leave) gunUser.leave();
    }
    setUser(null);
    setView('calculator');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-200">
      <div className="fixed top-4 right-4 flex items-center gap-2 opacity-20 pointer-events-none">
        <div className={`w-1.5 h-1.5 rounded-full ${gunStatus === 'online' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
        <span className="mono text-[8px] uppercase tracking-tighter">{gunStatus}</span>
      </div>

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
