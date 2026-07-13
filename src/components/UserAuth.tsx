import React, { useState } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from '../lib/firebase';
import { Trophy, Lock, Mail, User as UserIcon, ShieldAlert, LogIn, ArrowRight, Sparkles } from 'lucide-react';

interface UserAuthProps {
  onAuthSuccess?: () => void;
}

export default function UserAuth({ onAuthSuccess }: UserAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (isSignUp && !displayName) {
      setError('Please provide a display name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess?.();
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = `Authentication failed: ${err.message || 'Please check your credentials.'}`;
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-credential') {
        friendlyMessage = 'No matching credentials found. If you are new, click "Request new coordinator credentials" below to register a new account.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'This authentication method is currently disabled in the Firebase console. Please use Offline Bypass below.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      onAuthSuccess?.();
    } catch (err: any) {
      console.error("Anonymous login failed, falling back to offline", err);
      // Automatically fall back to offline bypass mode to ensure user is never blocked
      handleOfflineBypass();
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineBypass = () => {
    const offlineUser = {
      uid: 'offline-operator',
      displayName: 'Offline Operator',
      email: 'offline@aegis.gov',
      isOffline: true
    };
    localStorage.setItem('aegis_offline_user', JSON.stringify(offlineUser));
    // Dispatch a storage event or force window reload / trigger onAuthSuccess
    onAuthSuccess?.();
    window.location.reload();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onAuthSuccess?.();
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      let friendlyMessage = `Google sign-in failed: ${err.message || 'Please try again.'}`;
      if (err.code === 'auth/popup-blocked') {
        friendlyMessage = 'Google Sign-In popup was blocked by your browser. Please allow popups or use Offline Bypass.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        friendlyMessage = 'Sign-In process was cancelled.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'Google Sign-In is not yet enabled in the Firebase Console. Please make sure Google provider is enabled under Authentication > Sign-in method, or use the Offline Bypass below.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10 relative">
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex w-14 h-14 rounded-full bg-gradient-to-b from-amber-400 via-amber-500 to-emerald-600 items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.25)] border border-amber-300/20 animate-bounce-slow">
            <Trophy className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block">
              FIFA 2026 STADIUM OPERATING SYSTEM
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-100 font-sans">
              Aegis Operations Portal
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Secure Multi-Agent Crisis Simulation & Operational Ingress Pipeline
            </p>
          </div>
        </div>

        {/* Auth Panel Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-7 rounded-3xl backdrop-blur-xl shadow-[0_10px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
          
          {/* Helpful First-Time Notice */}
          <div className="mb-5 bg-indigo-950/40 border border-indigo-500/20 p-3.5 rounded-2xl text-[11px] leading-relaxed text-indigo-200">
            <span className="font-bold text-amber-400">💡 First-Time Setup Tip:</span> Since this is a new Firebase instance, you must first register. Click <strong className="underline text-indigo-300 cursor-pointer" onClick={() => setIsSignUp(true)}>"Request credentials"</strong> below to create an account, or use <strong className="underline text-indigo-300 cursor-pointer" onClick={handleOfflineBypass}>"Offline Operator Bypass"</strong> to enter instantly!
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  Display Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Commander Sarah"
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.gov"
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Access Token / Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                />
              </div>
            </div>

            {error && (
              <div className="flex gap-2.5 items-center bg-rose-950/30 border border-rose-900/30 p-3 rounded-2xl text-[11px] text-rose-400 font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-slate-100 font-bold py-2.5 px-4 rounded-2xl border border-indigo-400/20 shadow-[0_4px_20px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2 transition duration-200 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isSignUp ? 'Activate Credentials' : 'Secure Authorization'}</span>
                </>
              )}
            </button>

          </form>

          {/* Toggle link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
            >
              {isSignUp ? 'Already registered? System login' : 'Request new coordinator credentials'}
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase">
              <span className="px-3 bg-[#0a0f24] text-slate-500 tracking-wider">OR SIGN IN WITH</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-2.5 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-2.5 text-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase">
              <span className="px-3 bg-[#0a0f24] text-slate-500 tracking-wider">OR ENTER GUEST SANDBOX</span>
            </div>
          </div>

          {/* Guest Mode Entry */}
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-slate-100 font-semibold py-2.5 px-4 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Launch Quick Sandbox Session</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
          </button>

        </div>

        {/* Footer info */}
        <div className="text-center font-mono text-[9px] text-slate-600">
          SECURE CONNECTION ENCRYPTED • AEGIS-CORE PROTOCOL v2.5
        </div>
      </div>
    </div>
  );
}
