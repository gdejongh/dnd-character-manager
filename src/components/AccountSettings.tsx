import { useState } from 'react';
import type { FormEvent } from 'react';
import { Shield, ArrowLeft, Save, KeyRound, Trash2 } from 'lucide-react';

interface AccountSettingsProps {
  email: string;
  username: string;
  onBack: () => void;
  onUpdateUsername: (username: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export function AccountSettings({
  email,
  username,
  onBack,
  onUpdateUsername,
  onUpdatePassword,
  onDeleteAccount,
}: AccountSettingsProps) {
  const [usernameInput, setUsernameInput] = useState(username);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inputStyle = {
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
  };

  async function handleUsernameSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUsernameSaving(true);
    try {
      await onUpdateUsername(usernameInput.trim());
      setSuccess('Username updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update username.');
    }
    setUsernameSaving(false);
  }

  async function handlePasswordSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPasswordSaving(true);
    try {
      await onUpdatePassword(passwordInput);
      setPasswordInput('');
      setSuccess('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.');
    }
    setPasswordSaving(false);
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') {
      setError('Type DELETE to confirm account deletion.');
      return;
    }
    setError('');
    setSuccess('');
    setDeleting(true);
    try {
      await onDeleteAccount();
      setSuccess('Account deleted. Signing out…');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account.');
      setDeleting(false);
      return;
    }
    setDeleting(false);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex items-center justify-between p-4"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg) 100%)',
        }}
      >
        <button
          onClick={onBack}
          className="p-2.5 rounded-lg bg-transparent cursor-pointer flex items-center gap-1"
          style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <Shield size={18} style={{ color: 'var(--accent)' }} />
          <h1
            className="m-0"
            style={{ fontSize: '1rem', letterSpacing: '1px', fontFamily: 'var(--heading)' }}
          >
            Account Settings
          </h1>
        </div>
        <div className="w-16" />
      </header>

      <div className="p-4 flex flex-col gap-4">
        <section
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <p className="text-xs uppercase m-0 mb-1" style={{ color: 'var(--text)', letterSpacing: '0.8px' }}>
            Email
          </p>
          <p className="text-sm m-0" style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}>
            {email}
          </p>
        </section>

        <section
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h2 className="text-sm mb-3" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '0.7px' }}>
            Username
          </h2>
          <form onSubmit={handleUsernameSave} className="flex flex-col gap-3">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={usernameSaving || !usernameInput.trim()}
              className="w-full py-3 rounded-lg font-semibold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                color: '#0f0e13',
                border: 'none',
                fontFamily: 'var(--heading)',
                letterSpacing: '0.5px',
              }}
            >
              <Save size={14} />
              {usernameSaving ? 'Saving…' : 'Save Username'}
            </button>
          </form>
        </section>

        <section
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h2 className="text-sm mb-3" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '0.7px' }}>
            Password
          </h2>
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              minLength={6}
              required
              placeholder="New password (min 6 characters)"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={passwordSaving || passwordInput.length < 6}
              className="w-full py-3 rounded-lg font-semibold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
                fontFamily: 'var(--heading)',
                letterSpacing: '0.5px',
              }}
            >
              <KeyRound size={14} />
              {passwordSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </section>

        <section
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(185,28,28,0.12) 0%, rgba(127,29,29,0.08) 100%)',
            border: '1px solid rgba(239,68,68,0.35)',
          }}
        >
          <h2 className="text-sm mb-2" style={{ color: '#f87171', fontFamily: 'var(--heading)', letterSpacing: '0.7px' }}>
            Danger Zone
          </h2>
          <p className="text-xs mb-3" style={{ color: 'var(--text)' }}>
            Deleting your account permanently removes your auth user and all related data.
          </p>
          {showDeleteConfirm ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput('');
                    setError('');
                  }}
                  className="flex-1 py-3 rounded-lg text-sm cursor-pointer"
                  style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-lg text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'rgba(185,28,28,0.3)', color: '#ef4444', border: '1px solid rgba(185,28,28,0.5)', fontFamily: 'var(--heading)' }}
                >
                  <Trash2 size={14} />
                  {deleting ? 'Deleting…' : 'Delete Account'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'rgba(185,28,28,0.3)', color: '#ef4444', border: '1px solid rgba(185,28,28,0.5)', fontFamily: 'var(--heading)' }}
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          )}
        </section>

        {(error || success) && (
          <p
            className="text-sm text-center m-0"
            style={{ color: error ? 'var(--danger-bright)' : 'var(--accent)' }}
          >
            {error || success}
          </p>
        )}
      </div>
    </div>
  );
}
