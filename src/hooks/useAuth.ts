import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

function getDefaultUsernameFromEmail(email: string | null | undefined) {
  const localPart = email?.split('@')[0]?.trim();
  return localPart || 'adventurer';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    async function ensureUserHasUsername(currentUser: User) {
      const existingUsername = currentUser.user_metadata?.username;
      if (typeof existingUsername === 'string' && existingUsername.trim()) return;

      const fallbackUsername = getDefaultUsernameFromEmail(currentUser.email);
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          username: fallbackUsername,
        },
      });

      if (error) {
        console.error('Failed to set default username:', error);
        return;
      }

      if (data.user) setUser(data.user);
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) void ensureUserHasUsername(currentUser);
      })
      .catch((err: unknown) => {
        console.error('Failed to get session:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) void ensureUserHasUsername(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, username: string) {
    const chosenUsername = username.trim() || getDefaultUsernameFromEmail(email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: chosenUsername,
        },
      },
    });
    if (error) throw error;
    // If no session is returned, email confirmation is required
    const needsEmailVerification = !data.session;
    return { needsEmailVerification };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function sendPasswordReset(email: string) {
    const trimmed = email.trim();
    if (!trimmed) throw new Error('Enter your email first.');
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed);
    if (error) throw error;
  }

  async function updateUsername(username: string) {
    const nextUsername = username.trim();
    if (!nextUsername) throw new Error('Username is required.');
    if (!user) throw new Error('No authenticated user.');
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...(user?.user_metadata ?? {}),
        username: nextUsername,
      },
    });
    if (error) throw error;
    if (data.user) setUser(data.user);
  }

  async function updatePassword(password: string) {
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }

  async function deleteAccount() {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    setUser(null);
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) console.error('Failed to clear local session after account deletion:', signOutError);
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updateUsername,
    updatePassword,
    deleteAccount,
  };
}
