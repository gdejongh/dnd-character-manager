import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail } from 'lucide-react';

interface AuthProps {
  onAuth: (email: string, password: string, isSignUp: boolean, username?: string) => Promise<{ needsEmailVerification?: boolean }>;
  onForgotPassword: (email: string) => Promise<void>;
  onGuestMode?: () => void;
}

export function Auth({ onAuth, onForgotPassword, onGuestMode }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const result = await onAuth(email, password, isSignUp, username);
      if (result?.needsEmailVerification) {
        setEmailSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    setError('');
    setInfo('');
    setResetting(true);
    try {
      await onForgotPassword(email);
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.');
    }
    setResetting(false);
  }

  const inputCls =
    'w-full px-4 py-3 rounded-lg text-base outline-none transition-colors';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div
        className="w-full max-w-sm p-8 rounded-2xl animate-fade-in"
        style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div className="mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={{
              fontFamily: 'var(--heading)',
              fontSize: '1.4rem',
              letterSpacing: '0.5px',
              color: 'var(--accent)',
              margin: 0,
            }}
          >
            D&D Character Manager
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
            {isSignUp ? 'Create an account to get started.' : 'Sign in to your account.'}
          </p>
        </div>

        {emailSent ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-3">
              <Mail size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <h2
                className="text-base font-bold"
                style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', margin: 0 }}
              >
                Check your email
              </h2>
            </div>
            <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.5 }}>
              We sent a verification link to{' '}
              <strong style={{ color: 'var(--text-h)' }}>{email}</strong>.
              Click the link to verify, then come back and sign in.
            </p>
            <button
              onClick={() => {
                setEmailSent(false);
                setIsSignUp(false);
                setPassword('');
              }}
              className="w-full py-3 rounded-lg font-semibold text-base cursor-pointer"
              style={{
                background: 'var(--accent)',
                color: '#0f0e13',
                border: 'none',
                fontFamily: 'var(--heading)',
                letterSpacing: '0.5px',
              }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
        <>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text)', letterSpacing: '0.3px' }}>
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. dungeon_delver"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={inputCls}
                style={{
                  background: 'var(--code-bg)',
                  color: 'var(--text-h)',
                  border: '1px solid var(--border)',
                }}
              />
            </div>
          )}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text)', letterSpacing: '0.3px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
              style={{
                background: 'var(--code-bg)',
                color: 'var(--text-h)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs" style={{ color: 'var(--text)', letterSpacing: '0.3px' }}>
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetting}
                  className="text-xs bg-transparent border-none cursor-pointer disabled:opacity-50"
                  style={{ color: 'var(--accent)' }}
                >
                  {resetting ? 'Sending…' : 'Forgot?'}
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputCls}
              style={{
                background: 'var(--code-bg)',
                color: 'var(--text-h)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--danger-bright)' }}>{error}</p>}
          {info && <p className="text-sm" style={{ color: 'var(--accent)' }}>{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-base transition-opacity disabled:opacity-50 cursor-pointer"
            style={{
              background: 'var(--accent)',
              color: '#0f0e13',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.5px',
            }}
          >
            {loading ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div
          className="mt-6 pt-4 text-center"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setUsername('');
            }}
            className="text-sm bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--text)' }}
          >
            {isSignUp
              ? <>Have an account? <span style={{ color: 'var(--accent)' }}>Sign in</span></>
              : <>No account? <span style={{ color: 'var(--accent)' }}>Create one</span></>}
          </button>
        </div>
        {onGuestMode && (
          <div className="mt-3 text-center">
            <button
              onClick={onGuestMode}
              className="text-xs bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              Just exploring? <span style={{ color: 'var(--accent)' }}>Build a character without an account</span>
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
