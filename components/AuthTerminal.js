
import React, { useState } from 'react';

const LOBBIES = ['Class', 'Home', 'Chill'];

const AuthTerminal = ({ gun, onComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [alias, setAlias] = useState('');
  const [pass, setPass] = useState('');
  const [lobby, setLobby] = useState('Class');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!alias || !pass) return;
    setLoading(true); setError('');
    const user = gun.user();
    const done = (ack) => {
      setLoading(false);
      if (ack.err) setError(ack.err);
      else onComplete(user, lobby);
    };
    if (isLogin) user.auth(alias, pass, done);
    else user.create(alias, pass, (ack) => { if (ack.err) done(ack); else user.auth(alias, pass, done); });
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-2xl border border-indigo-500/30 w-full">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white tracking-widest mono uppercase">{isLogin ? 'Establish Link' : 'Register Node'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <input type="text" value={alias} onChange={e => setAlias(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white mono text-sm" placeholder="HANDLE" />
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white mono text-sm" placeholder="PASS-PHRASE" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LOBBIES.map(l => (
            <button key={l} type="button" onClick={() => setLobby(l)} className={`py-2 rounded-lg border mono text-[10px] ${lobby === l ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{l}</button>
          ))}
        </div>
        {error && <p className="text-red-500 text-[10px] mono text-center bg-red-500/10 py-2 rounded-lg">{error.toUpperCase()}</p>}
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl mono text-xs uppercase disabled:opacity-50">{loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Initialize'}</button>
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-[10px] text-slate-500 hover:text-indigo-400 mono uppercase">{isLogin ? 'New Node?' : 'Existing Node?'}</button>
      </form>
    </div>
  );
};

export default AuthTerminal;
