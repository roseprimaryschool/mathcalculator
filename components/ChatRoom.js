
import React, { useState, useEffect, useRef } from 'react';

const REACTION_OPTIONS = ['👍', '❤️', '🔥', '😂', '😮', '🚀'];
const LOBBIES = ['Class', 'Home', 'Chill'];

const ChatRoom = ({ gun, currentUser, initialLobby, onLogout }) => {
  const [activeTab, setActiveTab] = useState('lobbies');
  const [lobby, setLobby] = useState(initialLobby);
  const [activeDm, setActiveDm] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [friends, setFriends] = useState({});
  const [presenceMap, setPresenceMap] = useState({});
  const [recentDms, setRecentDms] = useState({});
  
  const scrollRef = useRef(null);
  const currentAlias = currentUser.is.alias;
  const currentPub = currentUser.is.pub;

  useEffect(() => {
    if (!gun || !currentPub) return;
    const interval = setInterval(() => {
      gun.get('v4-presence').get(currentPub).put({ lastSeen: Date.now(), lobby: activeDm ? `DM with ${activeDm.alias}` : lobby, alias: currentAlias });
    }, 10000);
    gun.get('v4-presence').get(currentPub).put({ lastSeen: Date.now(), lobby: lobby, alias: currentAlias });
    gun.get('v4-presence').map().on((data, pub) => { if (data) setPresenceMap(prev => ({ ...prev, [pub]: data })); });
    return () => clearInterval(interval);
  }, [gun, currentPub, lobby, activeDm]);

  useEffect(() => {
    if (!gun || !currentPub) return;
    gun.get('v4-friends').get(currentPub).map().on((isFriend, pub) => {
      if (isFriend) { gun.get('v4-presence').get(pub).once((data) => setFriends(prev => ({ ...prev, [pub]: { pub, alias: data?.alias || 'Unknown' } }))); }
      else setFriends(prev => { const n = { ...prev }; delete n[pub]; return n; });
    });
    currentUser.get('recentDms').map().on((pub) => {
      if (pub) gun.get('v4-presence').get(pub).once((data) => setRecentDms(prev => ({ ...prev, [pub]: { pub, alias: data?.alias || 'Unknown' } })));
    });
  }, [gun, currentPub]);

  useEffect(() => {
    if (!gun) return;
    setMessages([]);
    let key = activeDm ? `v4-dm-${[currentPub, activeDm.pub].sort().join('-')}` : `math-pro-ultra-v4-${lobby.toLowerCase()}`;
    const listener = gun.get(key).map().on((data, id) => {
      if (data && data.text) {
        setMessages(prev => {
          if (prev.find(m => m.id === id)) return prev.map(m => m.id === id ? { ...m, reactions: data.reactions ? JSON.parse(data.reactions) : {} } : m);
          return [...prev, { id, sender: data.sender, pub: data.pub, text: data.text, timestamp: new Date(data.timestamp), reactions: data.reactions ? JSON.parse(data.reactions) : {} }].sort((a, b) => a.timestamp - b.timestamp);
        });
      }
    });
  }, [lobby, activeDm, gun]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !gun) return;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    let key = activeDm ? `v4-dm-${[currentPub, activeDm.pub].sort().join('-')}` : `math-pro-ultra-v4-${lobby.toLowerCase()}`;
    if (activeDm) {
      currentUser.get('recentDms').get(activeDm.pub).put(activeDm.pub);
      gun.user(activeDm.pub).get('recentDms').get(currentPub).put(currentPub);
    }
    gun.get(key).get(id).put({ sender: currentAlias, pub: currentPub, text: input, timestamp: new Date().toISOString(), reactions: JSON.stringify({}) });
    setInput('');
  };

  const toggleReaction = (msgId, emoji) => {
    let key = activeDm ? `v4-dm-${[currentPub, activeDm.pub].sort().join('-')}` : `math-pro-ultra-v4-${lobby.toLowerCase()}`;
    const node = gun.get(key).get(msgId);
    node.once(d => {
      const rx = d.reactions ? JSON.parse(d.reactions) : {};
      const u = rx[emoji] || [];
      rx[emoji] = u.includes(currentAlias) ? u.filter(x => x !== currentAlias) : [...u, currentAlias];
      if (rx[emoji].length === 0) delete rx[emoji];
      node.get('reactions').put(JSON.stringify(rx));
    });
  };

  const getUserColor = (n) => {
    if (n === currentAlias) return 'bg-indigo-600';
    const c = ['bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500'];
    let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
    return c[Math.abs(h) % c.length];
  };

  return (
    <div className="flex h-full glass rounded-3xl overflow-hidden shadow-2xl border border-indigo-500/20 relative">
      <div className="w-20 md:w-64 bg-slate-900/90 border-r border-indigo-500/10 flex flex-col shrink-0">
        <div className="flex p-2 gap-1 border-b border-white/5">
          <button onClick={() => setActiveTab('lobbies')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold mono uppercase ${activeTab === 'lobbies' ? 'text-indigo-400 bg-indigo-600/10' : 'text-slate-500'}`}>Lobbies</button>
          <button onClick={() => setActiveTab('dms')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold mono uppercase ${activeTab === 'dms' ? 'text-indigo-400 bg-indigo-600/10' : 'text-slate-500'}`}>Direct</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4">
          {activeTab === 'lobbies' ? LOBBIES.map(l => (
            <button key={l} onClick={() => { setLobby(l); setActiveDm(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${!activeDm && lobby === l ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:bg-white/5'}`}>
              <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold mono border ${!activeDm && lobby === l ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700'}`}>{l[0]}</div>
              <span className="hidden md:block font-bold mono text-xs">{l}</span>
            </button>
          )) : Object.values(recentDms).map(dm => (
            <button key={dm.pub} onClick={() => setActiveDm(dm)} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${activeDm?.pub === dm.pub ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:bg-white/5'}`}>
              <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold mono ${getUserColor(dm.alias)} text-white`}>{dm.alias[0]}</div>
              <span className="hidden md:block font-bold mono text-xs truncate">{dm.alias}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full py-2 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-bold mono uppercase border border-red-500/20">Sever Link</button>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-w-0 bg-slate-950/40">
        <div className="bg-slate-900/50 p-6 flex items-center justify-between border-b border-white/5">
          <h1 className="text-xl font-bold text-white mono">#{activeDm ? activeDm.alias.toUpperCase() : lobby.toUpperCase()}</h1>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === currentAlias ? 'flex-row-reverse' : ''}`} onMouseEnter={() => setHoveredMessageId(msg.id)}>
              <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg ${getUserColor(msg.sender)} text-white border border-white/10`}>{msg.sender[0]}</div>
              <div className={`flex flex-col max-w-[85%] ${msg.sender === currentAlias ? 'items-end' : ''}`}>
                <span className="text-[10px] font-bold mono text-slate-400 mb-1">{msg.sender.toUpperCase()}</span>
                <div className={`px-4 py-2 rounded-2xl text-sm mono border border-indigo-500/10 shadow-lg ${msg.sender === currentAlias ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{msg.text}</div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="p-6 bg-slate-900/80 border-t border-indigo-500/10">
          <div className="relative">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="TRANSMIT..." className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-4 px-6 text-white mono text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <button type="submit" disabled={!input.trim()} className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl disabled:opacity-50">→</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
