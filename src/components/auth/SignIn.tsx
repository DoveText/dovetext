'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

export function SignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSigningIn(true);
    setError('');

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signin error:', error);
      setError(error.message);
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsSigningInWithGoogle(true);
    setError('');

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google signin error:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsSigningInWithGoogle(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Sign in</h2>
        <p className="text-gray-600">
          Enter your email and password to sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={isSigningIn || isSigningInWithGoogle}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={isSigningIn || isSigningInWithGoogle}
            required
          />
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 flex items-center justify-center"
            disabled={isSigningIn || isSigningInWithGoogle}
          >
            {isSigningIn && <Spinner />}
            {isSigningIn ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 border border-gray-300 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 flex items-center justify-center"
            disabled={isSigningIn || isSigningInWithGoogle}
          >
            {isSigningInWithGoogle && <Spinner className="text-gray-700" />}
            {isSigningInWithGoogle ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <div className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-500 hover:text-blue-700">
              Sign up
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
