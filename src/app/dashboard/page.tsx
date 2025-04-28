'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import {
  FaEye,
  FaEyeSlash,
  FaFingerprint,
  FaKey,
  FaShieldAlt,
  FaUserCircle,
} from 'react-icons/fa';

import {
  initializeStorage,
  loadEncryptedStorage,
} from '@/lib/storage/localStore';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasStorage, setHasStorage] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has existing storage
    const encryptedStorage = loadEncryptedStorage();
    setHasStorage(!!encryptedStorage);
    setIsLoading(false);
  }, []);

  const handleInitializeStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      setError('Please provide both name and email');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { privateKey: newPrivateKey } = await initializeStorage(name, email);
      setPrivateKey(newPrivateKey);
      setShowSetup(false);
      setHasStorage(true);
    } catch (err) {
      setError('Failed to initialize storage: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasStorage || showSetup) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-md mx-auto bg-gray-800 rounded-xl p-6 shadow-lg mt-12">
          <h1 className="text-2xl font-bold mb-6 text-center">Welcome to WHOIM V2</h1>
          
          {privateKey ? (
            <div className="mb-6">
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4">
                <h2 className="text-xl font-semibold text-yellow-400 mb-2 flex items-center">
                  <FaKey className="mr-2" /> Your Private Key
                </h2>
                <p className="text-yellow-200 mb-4 text-sm">
                  This is your master private key. Save it somewhere safe. It will only be shown once!
                </p>
                <div className="relative">
                  <textarea 
                    className="w-full h-40 bg-gray-900 text-gray-300 p-3 rounded font-mono text-xs"
                    value={privateKey}
                    readOnly
                  />
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    aria-label={showPrivateKey ? "Hide private key" : "Show private key"}
                  >
                    {showPrivateKey ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(privateKey);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([privateKey], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'whoim_private_key.txt';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                  >
                    Download Key
                  </button>
                </div>
              </div>
              
              <Link 
                href="/dashboard" 
                className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg transition-colors"
              >
                Continue to Dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handleInitializeStorage}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your name"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              
              {error && (
                <div className="mb-4 bg-red-900/30 border border-red-700 text-red-200 p-3 rounded">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create New Identity'}
              </button>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowSetup(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-indigo-400">WHOIM</span> V2
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-white hover:text-indigo-300 transition-colors">
                Dashboard
              </Link>
              <Link href="/personas" className="text-white hover:text-indigo-300 transition-colors">
                Personas
              </Link>
              <Link href="/graph" className="text-white hover:text-indigo-300 transition-colors">
                Privacy Graph
              </Link>
              <Link href="/settings" className="text-white hover:text-indigo-300 transition-colors">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <FaUserCircle className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Your Personas</h2>
                  <p className="text-gray-400 text-sm">Manage your identities</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-left px-4 py-3 rounded flex items-center">
                  <FaUserCircle className="mr-2" /> Default Persona
                </button>
              </div>
              
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center">
                <span className="mr-2">+</span> Create New Persona
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/connect" className="block bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded transition-colors">
                  Connect Account
                </Link>
                <Link href="/verify" className="block bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded transition-colors">
                  Verify Proof
                </Link>
                <Link href="/settings" className="block bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded transition-colors">
                  Export Backup
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
              <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
              <p className="text-gray-300 mb-6">
                Welcome to your WHOIM V2 dashboard. Here you can manage your personas, create proofs, and monitor your privacy.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Personas</h3>
                    <span className="bg-indigo-600 text-xs px-2 py-1 rounded-full">1</span>
                  </div>
                  <p className="text-gray-400 text-sm">Active identities you manage</p>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Connected Accounts</h3>
                    <span className="bg-indigo-600 text-xs px-2 py-1 rounded-full">0</span>
                  </div>
                  <p className="text-gray-400 text-sm">Accounts linked to your personas</p>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Verified Proofs</h3>
                    <span className="bg-indigo-600 text-xs px-2 py-1 rounded-full">0</span>
                  </div>
                  <p className="text-gray-400 text-sm">Blockchain-verified identity proofs</p>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Privacy Score</h3>
                    <span className="bg-green-600 text-xs px-2 py-1 rounded-full">A+</span>
                  </div>
                  <p className="text-gray-400 text-sm">Your current privacy rating</p>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2 flex items-center">
                  <FaShieldAlt className="mr-2 text-green-400" /> Privacy Status
                </h3>
                <p className="text-gray-300 mb-2">No privacy concerns detected between your personas.</p>
                <Link href="/graph" className="text-indigo-400 hover:text-indigo-300 text-sm">
                  View detailed privacy graph →
                </Link>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <FaFingerprint className="mr-2 text-indigo-400" /> Recent Activity
                </h3>
                <div className="text-gray-400 text-sm">
                  <p>No recent activity to display.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Get Started</h2>
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg flex">
                  <div className="bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Create a Persona</h3>
                    <p className="text-gray-400 text-sm">Create additional personas to separate your online identities.</p>
                    <Link href="/personas" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
                      Create persona →
                    </Link>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg flex">
                  <div className="bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Connect Accounts</h3>
                    <p className="text-gray-400 text-sm">Link your social media and other online accounts to your personas.</p>
                    <Link href="/connect" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
                      Connect account →
                    </Link>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg flex">
                  <div className="bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Create Proofs</h3>
                    <p className="text-gray-400 text-sm">Generate and post cryptographic proofs of your account ownership.</p>
                    <Link href="/verify" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
                      Create proof →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
