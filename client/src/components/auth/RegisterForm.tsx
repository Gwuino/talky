'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register(username, displayName || username, password);
      router.push('/servers');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-bg-primary rounded-lg p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-center text-text-primary mb-6">Create an account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 border border-danger rounded p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
          placeholder="letters, numbers, underscores"
        />

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How others see you"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Continue'}
        </Button>

        <p className="text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
