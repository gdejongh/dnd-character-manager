import { useState } from 'react';
import type { FormEvent } from 'react';
import { Shield, Mail } from 'lucide-react';

interface AuthProps {
  onAuth: (email: string, password: string, isSignUp: boolean, username?: string) => Promise<{ needsEmailVerification?: boolean }>;
  onForgotPassword: (email: string) => Promise<void>;
}

export function Auth({ onAuth, onForgotPassword }: AuthProps) {
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
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(201,168,76,0.05)',
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <Shield size={40} style={{ color: 'var(--accent)', marginBottom: '12px' }} />
          <h1
            className="text-2xl font-bold mb-1 text-center animate-shimmer"
            style={{ fontSize: '1.5rem', letterSpacing: '1px', margin: 0 }}
          >
            D&D Manager
          </h1>
          <p className="text-sm text-center mt-2" style={{ color: 'var(--text)' }}>
            {isSignUp ? 'Create your adventurer account' : 'Enter the realm'}
          </p>
        </div>

        {emailSent ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <Mail size={36} style={{ color: 'var(--accent)' }} />
            <h2
              className="text-lg font-bold text-center"
              style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', margin: 0 }}
            >
              Check your email
            </h2>
            <p className="text-sm text-center" style={{ color: 'var(--text)', lineHeight: 1.5 }}>
              We sent a verification link to{' '}
              <strong style={{ color: 'var(--text-h)' }}>{email}</strong>.
              <br />
              Click the link to verify your account, then come back and sign in.
            </p>
            <button
              onClick={() => {
                setEmailSent(false);
                setIsSignUp(false);
                setPassword('');
              }}
              className="w-full py-3 rounded-lg font-semibold text-base cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
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
            <input
              type="text"
              placeholder="Username"
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
          )}
          <input
            type="email"
            placeholder="Email"
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
          <div className="flex items-center justify-between -mb-2">
            <span className="text-xs" style={{ color: 'var(--text)', letterSpacing: '0.5px' }}>
              Password
            </span>
            {!isSignUp && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                className="text-xs bg-transparent border-none cursor-pointer disabled:opacity-50"
                style={{ color: 'var(--accent)' }}
              >
                {resetting ? 'Sending reset email…' : 'Forgot password?'}
              </button>
            )}
          </div>
          <input
            type="password"
            placeholder="Password"
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

          {error && <p className="text-sm text-center" style={{ color: 'var(--danger-bright)' }}>{error}</p>}
          {info && <p className="text-sm text-center" style={{ color: 'var(--accent)' }}>{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-base transition-opacity disabled:opacity-50 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
              color: '#0f0e13',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.5px',
            }}
          >
            {loading ? '...' : isSignUp ? 'Create Account' : 'Enter'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setUsername('');
          }}
          className="w-full mt-4 text-sm text-center bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--accent)' }}
        >
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </button>
        </>
        )}
      </div>
    </div>
  );
}
