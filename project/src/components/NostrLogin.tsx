import React, { useState } from 'react';
import { NostrService } from '../lib/nostr';
import { KeyRound, AlertCircle } from 'lucide-react';

interface NostrLoginProps {
  onLogin: (user: any) => void;
}

export function NostrLogin({ onLogin }: NostrLoginProps) {
  const [nostr] = useState(() => new NostrService());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.nostr) {
        throw new Error('Please install the Alby extension to login with Nostr');
      }
      const user = await nostr.loginWithExtension();
      if (user) {
        onLogin(user);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        <KeyRound className="w-5 h-5" />
        {loading ? 'Connecting...' : 'Connect with Nostr'}
      </button>
      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {!window.nostr && (
        <a
          href="https://getalby.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-700 text-sm underline"
        >
          Don't have Alby? Install it here
        </a>
      )}
    </div>
  );
}