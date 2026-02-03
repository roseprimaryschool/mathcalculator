
import React, { useState } from 'react';
import { LobbyType } from '../types';

interface AuthTerminalProps {
  gun: any;
  onComplete: (user: any, lobby: LobbyType) => void;
}

const LOBBIES: LobbyType[] = ['Class', 'Home', 'Chill'];

const AuthTerminal: React.FC<AuthTerminalProps> = ({ gun, onComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [alias, setAlias] = useState('');
  const [pass, setPass] = useState('');
  const [lobby, setLobby] = useState<LobbyType>('Class');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias || !pass) return;
    
    setLoading(true);
    setError('');
    const user = gun.user();

    if (isLogin) {
      user.auth(alias, pass, (ack: any) => {
        setLoading(false);
        if (ack.err) {
          setError(ack.err);
        } else {
          onComplete(user, lobby);
        }
      });
    } else {
      user.create(alias, pass, (ack: any) => {
        if (ack.err) {
          setLoading(false);
          setError(ack.err);
        } else {
          // Auto-auth after create
          user.auth(alias, pass, (authAck: any) => {
            setLoading(false);
            onComplete(user, lobby);
          });
        }
      });
    }
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-2xl border border-indigo-500/30 w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/40 rotate-3">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v1m0 16v1m0-1a9.96 9.96 0 01-3.185-1.122m12.483-2.126a9.98 9.98 0 001.302-4.752 1 1 0 00-1-1h-1a1 1 0 01-1-1V7a2 2 0 00-2-2h-1a2 2 0 00-2 2v1a2 2 0 002 2h1a1 1 0 011 1v1a1 1 0 01-1 1H11a1 1 0 00-1 1v1a2 2 0 002 2h1" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white tracking-widest mono uppercase">
          {isLogin ? 'Establish Link' : 'Register Node'}
        </h2>
        <p className="text-slate-500 text-[10px] mono mt-1">SECURE_PROTOCOL_V4.0</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-indigo-400 mono uppercase mb-1 block">Alias</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 mono text-sm"
              placeholder="HANDLE"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-indigo-400 mono uppercase mb-1 block">Pass-Phrase</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 mono text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-indigo-400 mono uppercase mb-1 block">Destination</label>
          <div className="grid grid-cols-3 gap-2">
            {LOBBIES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLobby(l)}
                className={`py-2 rounded-lg border transition-all mono text-[10px] ${
                  lobby === l
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-[10px] mono text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error.toUpperCase()}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mono text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Initialize'}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] text-slate-500 hover:text-indigo-400 mono uppercase transition-colors"
          >
            {isLogin ? 'New Node? Create Identity' : 'Existing Node? Establish Link'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthTerminal;
