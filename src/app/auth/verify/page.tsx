'use client';

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/app/components/Logo'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    async function verifyToken() {
      try {
        const token = searchParams.get('token')
        if (!token) {
          throw new Error('No token provided')
        }

        console.log('Attempting to verify token');
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Verification failed')
        }

        setStatus('success')
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 2000)
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setError(error instanceof Error ? error.message : 'Verification failed')
      }
    }

    verifyToken()
  }, [router, searchParams])

  const containerClasses = "min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
  const cardClasses = "max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6"

  if (status === 'verifying') {
    return (
      <div className={containerClasses}>
        <div className={cardClasses}>
          <Logo />
          <div className="space-y-4">
            <div className="animate-spin mx-auto w-12 h-12">
              <svg className="text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Verifying your magic link</h2>
            <p className="text-gray-600">Please wait while we verify your magic link.</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={containerClasses}>
        <div className={cardClasses}>
          <Logo />
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-red-600">Verification Failed</h2>
            <p className="text-gray-600">{error}</p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-orange-500 via-orange-600 to-orange-500 rounded-lg hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Try signing in again
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        <Logo />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-green-600">Success!</h2>
          <p className="text-gray-600">
            You're now signed in. Redirecting to dashboard...
          </p>
        </div>
      </div>
    </div>
  )
} 