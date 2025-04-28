'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="mb-8 text-gray-300">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
