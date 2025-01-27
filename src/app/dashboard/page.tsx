'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/app/components/Logo';

interface User {
  id: string;
  email: string;
  name?: string;
  weightUnit: string;
  barbellWeight: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load user data');
        }

        setUser(data.user);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin w-12 h-12">
          <svg className="text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Session Expired</h1>
          <p className="mt-2 text-gray-600">Please log in again to continue.</p>
          <a
            href="/login"
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-orange-500 via-orange-600 to-orange-500 rounded-lg hover:from-orange-600 hover:via-orange-700 hover:to-orange-600"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.name || user.email}
              </span>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Weight Unit</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.weightUnit}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Barbell Weight</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.barbellWeight} {user.weightUnit}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
} 