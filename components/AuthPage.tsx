
import React, { useState } from 'react';

interface AuthPageProps {
    onLogin: (username: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const body = isLogin 
            ? { username, password }
            : { username, password, email };

        try {
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Authentication failed');
            }

            if (isLogin) {
                onLogin(username);
            } else {
                // Auto login after register or ask to login
                setIsLogin(true);
                setError('Registration successful! Please sign in.');
                setPassword('');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#0f172a] overflow-hidden relative">
             {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl border border-white/10 z-10 animate-fade-in relative mx-4">
                 <div className="text-center mb-8">
                     <div className="flex justify-center mb-4">
                        <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                        </div>
                     </div>
                     <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        Wildfire<span className="text-orange-500">Intel</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Predictive Risk Assessment Agent</p>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-all"
                                placeholder="name@example.com"
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-all"
                            placeholder="username"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className={`text-sm p-3 rounded border ${error.includes('successful') ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-lg shadow-lg shadow-orange-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                 </form>

                 <div className="mt-6 text-center">
                     <p className="text-sm text-slate-400">
                         {isLogin ? "Don't have an account? " : "Already have an account? "}
                         <button 
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                         >
                             {isLogin ? 'Sign Up' : 'Sign In'}
                         </button>
                     </p>
                 </div>
            </div>
        </div>
    );
};

export default AuthPage;
