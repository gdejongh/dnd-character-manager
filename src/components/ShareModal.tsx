import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CharacterShare } from '../types/database';
import { X, Send, Trash2, Mail } from 'lucide-react';

interface ShareModalProps {
  characterName: string;
  shares: CharacterShare[];
  onShare: (email: string) => Promise<void>;
  onRevoke: (shareId: string) => Promise<void>;
  onClose: () => void;
}

export function ShareModal({ characterName, shares, onShare, onRevoke, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await onShare(email.trim().toLowerCase());
      setSuccess(`Shared with ${email.trim()}`);
      setEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to share');
    }
    setSending(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 animate-fade-in"
        style={{
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--accent-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm m-0"
            style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
          >
            SHARE {characterName.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-transparent cursor-pointer"
            style={{ color: 'var(--text)', border: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Share form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Recipient's email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            type="submit"
            disabled={!email.trim() || sending}
            className="px-3 py-2.5 rounded-lg cursor-pointer disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
              color: '#0f0e13',
              border: 'none',
            }}
          >
            <Send size={14} />
          </button>
        </form>

        {error && (
          <p className="text-xs mb-3" style={{ color: 'var(--danger-bright)' }}>{error}</p>
        )}
        {success && (
          <p className="text-xs mb-3" style={{ color: 'var(--accent)' }}>{success}</p>
        )}

        {/* Existing shares */}
        {shares.length > 0 && (
          <div className="flex flex-col gap-2">
            <p
              className="text-xs mb-1"
              style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
            >
              SHARED WITH
            </p>
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
              >
                <Mail size={12} style={{ color: 'var(--text)' }} />
                <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-h)' }}>
                  {share.recipient_email}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: share.status === 'accepted' ? 'var(--accent)' : 'var(--text)',
                    background: share.status === 'accepted' ? 'var(--accent-bg)' : 'transparent',
                    border: `1px solid ${share.status === 'accepted' ? 'var(--accent-border)' : 'var(--border)'}`,
                  }}
                >
                  {share.status}
                </span>
                <button
                  onClick={() => onRevoke(share.id)}
                  className="p-1 rounded bg-transparent cursor-pointer"
                  style={{ color: 'var(--text)', border: 'none' }}
                  aria-label="Revoke share"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
