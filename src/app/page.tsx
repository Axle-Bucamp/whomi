'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import {
  FaFingerprint,
  FaLock,
  FaShieldAlt,
  FaUserSecret,
} from 'react-icons/fa';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="text-indigo-400">WHOIM</span> V2
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl">
          Self-Sovereign Identity System with Blockchain-Backed Proofs
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link 
            href="/dashboard" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/about" 
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Learn More
          </Link>
        </div>
        <div className="relative w-full max-w-4xl h-64 md:h-96 bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-lg text-gray-400">Interactive Demo Visualization</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-gray-800/50 p-6 rounded-xl">
            <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <FaShieldAlt className="text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Multiple Personas</h3>
            <p className="text-gray-400">Create and manage multiple isolated identities with no cross-linking.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl">
            <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <FaFingerprint className="text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Blockchain Proofs</h3>
            <p className="text-gray-400">Cryptographically verify your identity across platforms with blockchain records.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl">
            <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <FaLock className="text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Local-First Storage</h3>
            <p className="text-gray-400">Your private keys and data never leave your device, encrypted with PGP.</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl">
            <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <FaUserSecret className="text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Privacy Analysis</h3>
            <p className="text-gray-400">Detect potential privacy leaks between your personas with advanced visualization.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-800/30 rounded-xl my-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold">1</div>
            <h3 className="text-xl font-semibold mb-3">Create Personas</h3>
            <p className="text-gray-400">Generate PGP keys for each persona you want to maintain, all stored locally.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold">2</div>
            <h3 className="text-xl font-semibold mb-3">Sign Proofs</h3>
            <p className="text-gray-400">Sign messages proving ownership of your accounts and post them publicly.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold">3</div>
            <h3 className="text-xl font-semibold mb-3">Verify On-Chain</h3>
            <p className="text-gray-400">Record proof hashes on the blockchain for permanent, decentralized verification.</p>
          </div>
        </div>
      </section>

      {/* Web3 OAuth Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-8 rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Web3 OAuth Integration</h2>
              <p className="text-gray-300 max-w-2xl">
                Integrate WHOIM authentication into your own websites with our simple JavaScript snippet or no-JS fallback.
              </p>
            </div>
            <Link 
              href="/developers" 
              className="bg-white text-indigo-900 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition-colors whitespace-nowrap"
            >
              Developer Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">WHOIM <span className="text-indigo-400">V2</span></h3>
            <p className="text-gray-400">Self-Sovereign Identity System</p>
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
        <div className="mt-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} WHOIM. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
