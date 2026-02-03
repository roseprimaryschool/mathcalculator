
import React, { useState, useEffect, useRef } from 'react';
import { Message, LobbyType, UserProfile, Presence } from '../types';

interface ChatRoomProps {
  gun: any;
  currentUser: any;
  initialLobby: LobbyType;
  onLogout: () => void;
}

const REACTION_OPTIONS = ['👍', '❤️', '🔥', '😂', '😮', '🚀'];
const LOBBIES: LobbyType[] = ['Class', 'Home', 'Chill'];

const ChatRoom: React.FC<ChatRoomProps> = ({ gun, currentUser, initialLobby, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'lobbies' | 'dms'>('lobbies');
  const [lobby, setLobby] = useState<LobbyType>(initialLobby);
  const [activeDm, setActiveDm] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Record<string, UserProfile>>({});
  const [presenceMap, setPresenceMap] = useState<Record<string, Presence>>({});
  const [recentDms, setRecentDms] = useState<Record<string, UserProfile>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentAlias = currentUser.is.alias;
  const currentPub = currentUser.is.pub;

  // Heartbeat Presence
  useEffect(() => {
    if (!gun || !currentPub) return;
    const interval = setInterval(() => {
      gun.get('v4-presence').get(currentPub).put({
        lastSeen: Date.now(),
        lobby: activeDm ? `DM with ${activeDm.alias}` : lobby,
        alias: currentAlias
      });
    }, 10000);
    
    // Initial presence
    gun.get('v4-presence').get(currentPub).put({
      lastSeen: Date.now(),
      lobby: lobby,
      alias: currentAlias
    });

    // Listen to all presence
    gun.get('v4-presence').map().on((data: Presence, pub: string) => {
      if (data) {
        setPresenceMap(prev => ({ ...prev, [pub]: data }));
      }
    });

    return () => clearInterval(interval);
  }, [gun, currentPub, lobby, activeDm]);

  // Listen for Friends
  useEffect(() => {
    if (!gun || !currentPub) return;
    gun.get('v4-friends').get(currentPub).map().on((isFriend: boolean, pub: string) => {
      if (isFriend) {
        gun.get('v4-presence').get(pub).once((data: Presence) => {
          setFriends(prev => ({
            ...prev,
            [pub]: { pub, alias: data?.alias || 'Unknown Node' }
          }));
        });
      } else {
        setFriends(prev => {
          const next = { ...prev };
          delete next[pub];
          return next;
        });
      }
    });

    // Listen for Recent DMs list stored on user node
    currentUser.get('recentDms').map().on((pub: string, id: string) => {
      if (pub) {
        gun.get('v4-presence').get(pub).once((data: Presence) => {
          setRecentDms(prev => ({
            ...prev,
            [pub]: { pub, alias: data?.alias || 'Unknown Node' }
          }));
        });
      }
    });
  }, [gun, currentPub, currentUser]);

  // Listen for messages (Lobby or DM)
  useEffect(() => {
    if (!gun) return;
    setMessages([]);

    let chatKey = '';
    if (activeDm) {
      // Deterministic DM key based on two public keys
      const sortedPubs = [currentPub, activeDm.pub].sort();
      chatKey = `v4-dm-${sortedPubs[0]}-${sortedPubs[1]}`;
    } else {
      chatKey = `math-pro-ultra-v4-${lobby.toLowerCase()}`;
    }

    const room = gun.get(chatKey);
    const handleData = (data: any, id: string) => {
      if (data && data.text) {
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === id);
          const incomingReactions = data.reactions ? JSON.parse(data.reactions) : {};
          if (existing) {
            return prev.map(m => m.id === id ? { ...m, reactions: incomingReactions } : m);
          }
          const newMessage: Message = {
            id,
            sender: data.sender,
            pub: data.pub,
            text: data.text,
            timestamp: new Date(data.timestamp),
            reactions: incomingReactions
          };
          return [...prev, newMessage].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });
      }
    };

    const listener = room.map().on(handleData);
    return () => {};
  }, [lobby, activeDm, gun, currentPub]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !gun) return;

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    let chatKey = '';
    if (activeDm) {
      const sortedPubs = [currentPub, activeDm.pub].sort();
      chatKey = `v4-dm-${sortedPubs[0]}-${sortedPubs[1]}`;
      // Add to recent DMs for both
      currentUser.get('recentDms').get(activeDm.pub).put(activeDm.pub);
      gun.user(activeDm.pub).get('recentDms').get(currentPub).put(currentPub);
    } else {
      chatKey = `math-pro-ultra-v4-${lobby.toLowerCase()}`;
    }

    gun.get(chatKey).get(id).put({
      sender: currentAlias,
      pub: currentPub,
      text: input,
      timestamp: new Date().toISOString(),
      reactions: JSON.stringify({})
    });

    setInput('');
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!gun) return;
    let chatKey = activeDm 
      ? `v4-dm-${[currentPub, activeDm.pub].sort().join('-')}`
      : `math-pro-ultra-v4-${lobby.toLowerCase()}`;

    const msgNode = gun.get(chatKey).get(messageId);
    msgNode.once((data: any) => {
      const reactions = data.reactions ? JSON.parse(data.reactions) : {};
      const currentUsers = reactions[emoji] || [];
      const nextUsers = currentUsers.includes(currentAlias)
        ? currentUsers.filter((u: string) => u !== currentAlias)
        : [...currentUsers, currentAlias];

      const updated = { ...reactions };
      if (nextUsers.length > 0) updated[emoji] = nextUsers;
      else delete updated[emoji];
      msgNode.get('reactions').put(JSON.stringify(updated));
    });
    setHoveredMessageId(null);
  };

  const addFriend = (profile: UserProfile) => {
    gun.get('v4-friends').get(currentPub).get(profile.pub).put(true);
    gun.get('v4-friends').get(profile.pub).get(currentPub).put(true);
  };

  const removeFriend = (profile: UserProfile) => {
    gun.get('v4-friends').get(currentPub).get(profile.pub).put(false);
  };

  const startDm = (profile: UserProfile) => {
    setActiveDm(profile);
    setSelectedProfile(null);
    setActiveTab('dms');
  };

  const getStatus = (pub: string) => {
    const presence = presenceMap[pub];
    if (!presence) return { online: false, text: 'Offline' };
    const isOnline = Date.now() - presence.lastSeen < 30000;
    if (isOnline) return { online: true, text: `Online - In ${presence.lobby}` };
    
    const diff = Date.now() - presence.lastSeen;
    const mins = Math.floor(diff / 60000);
    const text = mins < 1 ? 'Just now' : `${mins}m ago`;
    return { online: false, text: `Last seen: ${text}` };
  };

  const getUserColor = (name: string) => {
    if (name === currentAlias) return 'bg-indigo-600';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500'];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex h-full glass rounded-3xl overflow-hidden shadow-2xl border border-indigo-500/20 relative">
      {/* Sidebar */}
      <div className="w-20 md:w-64 bg-slate-900/90 border-r border-indigo-500/10 flex flex-col shrink-0">
        <div className="flex p-2 gap-1 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('lobbies')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold mono uppercase tracking-widest transition-all ${activeTab === 'lobbies' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Lobbies
          </button>
          <button 
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold mono uppercase tracking-widest transition-all ${activeTab === 'dms' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Direct
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4">
          {activeTab === 'lobbies' ? (
            <div className="space-y-2">
              <h2 className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 mono">Global Channels</h2>
              {LOBBIES.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLobby(l); setActiveDm(null); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!activeDm && lobby === l ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400' : 'text-slate-500 hover:bg-white/5 border border-transparent'}`}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold mono border ${!activeDm && lobby === l ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700'}`}>
                    {l[0]}
                  </div>
                  <span className="hidden md:block font-bold mono text-xs tracking-tight">{l}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 mono">Contacts</h2>
                {Object.values(recentDms).length === 0 && (
                   <p className="px-3 text-[10px] text-slate-700 mono italic">No active nodes.</p>
                )}
                {/* Fix: Explicitly type 'dm' as UserProfile to avoid 'unknown' type inference error */}
                {Object.values(recentDms).map((dm: UserProfile) => (
                  <button
                    key={dm.pub}
                    onClick={() => setActiveDm(dm)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group ${activeDm?.pub === dm.pub ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400' : 'text-slate-500 hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className="relative">
                      <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold mono border ${getUserColor(dm.alias)} text-white`}>
                        {dm.alias[0].toUpperCase()}
                      </div>
                      {getStatus(dm.pub).online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                      )}
                    </div>
                    <span className="hidden md:block font-bold mono text-xs tracking-tight truncate">{dm.alias}</span>
                  </button>
                ))}
              </div>
              <div>
                <h2 className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 mono">Sync Friends</h2>
                {/* Fix: Explicitly type 'f' as UserProfile to avoid 'unknown' type inference error */}
                {Object.values(friends).map((f: UserProfile) => (
                  <button
                    key={f.pub}
                    onClick={() => setSelectedProfile(f)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl text-slate-500 hover:bg-white/5 transition-all"
                  >
                    <div className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center font-bold mono text-[10px] ${getUserColor(f.alias)} text-white`}>
                      {f.alias[0].toUpperCase()}
                    </div>
                    <span className="hidden md:block font-bold mono text-[10px] tracking-tight truncate">{f.alias}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-white/5">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-3 p-2 bg-slate-950/50 rounded-xl border border-white/5 overflow-hidden">
                <div className={`w-8 h-8 rounded-lg ${getUserColor(currentAlias)} flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer`} onClick={() => setSelectedProfile({ pub: currentPub, alias: currentAlias })}>
                  {currentAlias[0].toUpperCase()}
                </div>
                <div className="overflow-hidden hidden md:block">
                  <p className="text-xs font-bold truncate mono">{currentAlias}</p>
                  <p className="text-[9px] text-green-500 mono">SECURE_LINK</p>
                </div>
              </div>
              <button onClick={onLogout} className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[9px] font-bold mono transition-colors uppercase border border-red-500/20">Sever Link</button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 bg-slate-950/40">
        <div className="bg-slate-900/50 p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight mono flex items-center gap-2">
                <span className="text-indigo-500 opacity-50">#</span>
                {activeDm ? activeDm.alias.toUpperCase() : lobby.toUpperCase()}
              </h1>
              <p className="text-slate-500 text-[10px] mono mt-1">
                {activeDm ? 'Direct Secure Channel' : 'Global Matrix Ledger'}
              </p>
            </div>
          </div>
          {activeDm && (
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                  <p className={`text-[10px] font-bold mono ${getStatus(activeDm.pub).online ? 'text-green-500' : 'text-slate-500'}`}>{getStatus(activeDm.pub).text.toUpperCase()}</p>
               </div>
               <button onClick={() => setSelectedProfile(activeDm)} className="p-2 hover:bg-white/5 rounded-lg border border-white/10">
                 <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" onMouseLeave={() => setHoveredMessageId(null)}>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 pointer-events-none">
              <div className="w-12 h-12 border border-indigo-500/30 rounded-full animate-ping mb-6"></div>
              <p className="mono text-[10px] uppercase tracking-widest text-indigo-400">Listening to Peer stream...</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 animate-fade-in relative ${msg.sender === currentAlias ? 'flex-row-reverse' : ''}`} onMouseEnter={() => setHoveredMessageId(msg.id)}>
              <div 
                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg ${getUserColor(msg.sender)} text-white border border-white/10 cursor-pointer transition-transform hover:scale-110`}
                onClick={() => setSelectedProfile({ pub: msg.pub || '', alias: msg.sender })}
              >
                {msg.sender[0].toUpperCase()}
              </div>
              
              <div className={`flex flex-col max-w-[85%] relative ${msg.sender === currentAlias ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className={`text-[10px] font-bold mono ${msg.sender === currentAlias ? 'text-indigo-400' : 'text-slate-400'}`}>{msg.sender.toUpperCase()}</span>
                  <span className="text-[9px] text-slate-600 mono">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="relative group">
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all mono border border-indigo-500/10 shadow-lg ${msg.sender === currentAlias ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20' : 'bg-slate-800 text-slate-200 rounded-tl-none shadow-black/40'}`}>
                    {msg.text}
                  </div>
                  {hoveredMessageId === msg.id && (
                    <div className={`absolute -top-11 z-50 flex items-center gap-1.5 p-1.5 rounded-2xl glass border border-indigo-500/30 shadow-2xl animate-fade-in ${msg.sender === currentAlias ? 'right-0' : 'left-0'}`}>
                      {REACTION_OPTIONS.map(emoji => (
                        <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all transform hover:scale-125 hover:-translate-y-1">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1.5 ${msg.sender === currentAlias ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(msg.reactions).map(([emoji, users]) => {
                      const isActive = Array.isArray(users) && users.includes(currentAlias);
                      const count = Array.isArray(users) ? users.length : 0;
                      if (count === 0) return null;
                      return (
                        <div key={emoji} className={`rounded-lg px-2 py-0.5 text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors border shadow-sm ${isActive ? 'bg-indigo-600/40 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'}`} onClick={() => toggleReaction(msg.id, emoji)}>
                          <span>{emoji}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-6 bg-slate-900/80 border-t border-indigo-500/10">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeDm ? `MESSAGE_${activeDm.alias.toUpperCase()}...` : `TRANSMIT_TO_${lobby.toUpperCase()}...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-4 px-6 pr-14 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner mono text-sm"
            />
            <button type="submit" disabled={!input.trim()} className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass w-full max-w-sm rounded-3xl p-8 border border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            <div className="flex justify-between items-start mb-6">
               <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold ${getUserColor(selectedProfile.alias)} text-white shadow-xl`}>
                 {selectedProfile.alias[0].toUpperCase()}
               </div>
               <button onClick={() => setSelectedProfile(null)} className="text-slate-500 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1 mono">{selectedProfile.alias}</h2>
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-2 h-2 rounded-full ${getStatus(selectedProfile.pub).online ? 'bg-green-500' : 'bg-slate-600'}`}></span>
              <p className="text-[10px] text-slate-400 font-bold mono uppercase tracking-wider">
                {getStatus(selectedProfile.pub).text}
              </p>
            </div>

            <div className="space-y-3">
              {selectedProfile.pub !== currentPub && (
                <>
                  <button 
                    onClick={() => startDm(selectedProfile)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 mono text-xs uppercase"
                  >
                    Direct Message
                  </button>
                  {friends[selectedProfile.pub] ? (
                    <button 
                      onClick={() => removeFriend(selectedProfile)}
                      className="w-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 border border-slate-700 hover:border-red-500/50 font-bold py-3 rounded-xl transition-all mono text-xs uppercase"
                    >
                      Unfriend Node
                    </button>
                  ) : (
                    <button 
                      onClick={() => addFriend(selectedProfile)}
                      className="w-full bg-slate-800 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold py-3 rounded-xl transition-all active:scale-95 mono text-xs uppercase"
                    >
                      Add Friend
                    </button>
                  )}
                </>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
               <p className="text-[9px] text-slate-600 mono uppercase mb-2">Public Key Registry</p>
               <p className="text-[8px] text-slate-700 break-all mono leading-tight">{selectedProfile.pub}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
