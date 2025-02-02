'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bars3Icon, 
  XMarkIcon, 
  Cog6ToothIcon, 
  UserCircleIcon, 
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../lib/contexts/AuthContext';

export const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-sm">
        <div className="w-6 h-6 animate-pulse bg-gray-200 rounded" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) return null;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 p-2 text-gray-600 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-lg bg-white shadow-sm"
        aria-label="Menu"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Compact Dropdown Menu */}
      <div
        className={`fixed top-16 right-4 bg-white shadow-lg rounded-xl transform transition-all duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'
        }`}
      >
        <nav className="p-2 min-w-[160px]">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
          >
            <ClipboardDocumentListIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="font-medium">Workouts</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
          >
            <UserCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="font-medium">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
          >
            <Cog6ToothIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            <span className="font-medium">Settings</span>
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400 group-hover:text-red-500" />
            <span className="font-medium">Sign Out</span>
          </button>
        </nav>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}; 