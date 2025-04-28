'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import {
  FaCheck,
  FaFingerprint,
  FaTimes,
  FaUserCheck,
} from 'react-icons/fa';

import { verifyProof } from '@/lib/blockchain/contractInteractions';
import { verifyPersonaAcrossPlatforms } from '@/lib/blockchain/solana';
import {
  decryptStorage,
  loadEncryptedStorage,
} from '@/lib/storage/localStore';
import { Persona } from '@/types';

export default function VerifyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Direct verification
  const [proofId, setProofId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [verificationResult, setVerificationResult] = useState<'success' | 'failure' | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Cross-platform verification
  const [personaId, setPersonaId] = useState('');
  const [platform1, setPlatform1] = useState('twitter');
  const [platform2, setPlatform2] = useState('github');
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');
  const [crossVerificationResult, setCrossVerificationResult] = useState<'success' | 'failure' | null>(null);
  const [isCrossVerifying, setIsCrossVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationCode, setShowVerificationCode] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setIsLoading(true);
    try {
      const encryptedData = await loadEncryptedStorage();
      if (encryptedData) {
        // In a real app, we would prompt for the master key
        // For demo purposes, we'll use a simulated key retrieval
        const simulatedPrivateKey = localStorage.getItem('whoim_demo_private_key') || '';
        setPrivateKey(simulatedPrivateKey);
        
        if (simulatedPrivateKey) {
          const storage = await decryptStorage(encryptedData, simulatedPrivateKey);
          // Filter to only include public personas
          const publicPersonas = storage.personas.filter(p => p.isPublic);
          setPersonas(publicPersonas);
        }
      }
    } catch (err) {
      console.error('Failed to load personas:', err);
      setError('Failed to load public personas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proofId || !publicKey || !platformId) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    setSuccess('');
    setVerificationResult(null);
    
    try {
      // Call the verification function
      const result = await verifyProof(proofId, publicKey, platformId);
      
      if (result) {
        setVerificationResult('success');
        setSuccess('Verification successful! The proof is valid.');
      } else {
        setVerificationResult('failure');
        setError('Verification failed. The proof could not be verified.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationResult('failure');
      setError('Verification error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCrossVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personaId || !platform1 || !platform2 || !username1 || !username2) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsCrossVerifying(true);
    setError('');
    setSuccess('');
    setCrossVerificationResult(null);
    
    try {
      // Call the cross-platform verification function
      const result = await verifyPersonaAcrossPlatforms(personaId, platform1, username1, platform2, username2);
      
      if (result) {
        setCrossVerificationResult('success');
        setSuccess('Cross-platform verification successful! The accounts belong to the same persona.');
        
        // Generate a verification code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setVerificationCode(code);
        setShowVerificationCode(true);
      } else {
        setCrossVerificationResult('failure');
        setError('Cross-platform verification failed. The accounts could not be verified as belonging to the same persona.');
      }
    } catch (err) {
      console.error('Cross-verification error:', err);
      setCrossVerificationResult('failure');
      setError('Cross-verification error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCrossVerifying(false);
    }
  };

  const copyVerificationCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setSuccess('Verification code copied to clipboard!');
    setTimeout(() => {
      if (success === 'Verification code copied to clipboard!') {
        setSuccess('');
      }
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading verification tools...</p>
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
              <Link href="/connect" className="text-white hover:text-indigo-300 transition-colors">
                Connect
              </Link>
              <Link href="/verify" className="text-white hover:text-indigo-300 transition-colors font-semibold">
                Verify
              </Link>
              <Link href="/settings" className="text-white hover:text-indigo-300 transition-colors">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Verify Identity Proofs</h1>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-900/30 border border-green-700 text-green-200 p-4 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Direct Verification */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <FaUserCheck className="text-2xl text-indigo-400 mr-3" />
              <h2 className="text-xl font-semibold">Direct Verification</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Verify a specific proof by entering the proof ID, public key, and platform ID.
            </p>
            
            <form onSubmit={handleDirectVerification}>
              <div className="mb-4">
                <label htmlFor="proofId" className="block text-gray-300 mb-2">Proof ID</label>
                <input
                  type="text"
                  id="proofId"
                  value={proofId}
                  onChange={(e) => setProofId(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter the proof ID"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="publicKey" className="block text-gray-300 mb-2">Public Key</label>
                <input
                  type="text"
                  id="publicKey"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter the public key"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="platformId" className="block text-gray-300 mb-2">Platform ID</label>
                <input
                  type="text"
                  id="platformId"
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter the platform ID (e.g., twitter:username)"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify Proof'
                )}
              </button>
            </form>
            
            {verificationResult && (
              <div className={`mt-6 p-4 rounded-lg ${
                verificationResult === 'success' 
                  ? 'bg-green-900/30 border border-green-700' 
                  : 'bg-red-900/30 border border-red-700'
              }`}>
                <div className="flex items-center">
                  {verificationResult === 'success' ? (
                    <>
                      <div className="bg-green-600 w-10 h-10 rounded-full flex items-center justify-center mr-4">
                        <FaCheck className="text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-300">Verification Successful</h3>
                        <p className="text-green-200 text-sm">The proof is valid and verified.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-600 w-10 h-10 rounded-full flex items-center justify-center mr-4">
                        <FaTimes className="text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-300">Verification Failed</h3>
                        <p className="text-red-200 text-sm">The proof could not be verified.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cross-Platform Verification */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <FaFingerprint className="text-2xl text-indigo-400 mr-3" />
              <h2 className="text-xl font-semibold">Cross-Platform Verification</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Verify if two accounts on different platforms belong to the same persona.
            </p>
            
            <form onSubmit={handleCrossVerification}>
              <div className="mb-4">
                <label htmlFor="personaId" className="block text-gray-300 mb-2">Persona ID</label>
                <select
                  id="personaId"
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a persona</option>
                  {personas.map(persona => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name || persona.id.substring(0, 8)} {persona.isPublic ? '(Public)' : '(Private)'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="platform1" className="block text-gray-300 mb-2">Platform 1</label>
                  <select
                    id="platform1"
                    value={platform1}
                    onChange={(e) => setPlatform1(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="twitter">Twitter</option>
                    <option value="github">GitHub</option>
                    <option value="reddit">Reddit</option>
                    <option value="discord">Discord</option>
                    <option value="mastodon">Mastodon</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="username1" className="block text-gray-300 mb-2">Username 1</label>
                  <input
                    type="text"
                    id="username1"
                    value={username1}
                    onChange={(e) => setUsername1(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Username on platform 1"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="platform2" className="block text-gray-300 mb-2">Platform 2</label>
                  <select
                    id="platform2"
                    value={platform2}
                    onChange={(e) => setPlatform2(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="twitter">Twitter</option>
                    <option value="github">GitHub</option>
                    <option value="reddit">Reddit</option>
                    <option value="discord">Discord</option>
                    <option value="mastodon">Mastodon</option>
                    <option value="other">Other</option>
                  </select>
                </div>
        
                <div>
                  <label htmlFor="username2" className="block text-gray-300 mb-2">Username 2</label>
                  <input
                    type="text"
                    id="username2"
                    value={username2}
                    onChange={(e) => setUsername2(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Username on platform 2"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center"
                disabled={isCrossVerifying}
              >
                {isCrossVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify Connection'
                )}
              </button>
            </form>

            {crossVerificationResult && (
              <div className={`mt-6 p-4 rounded-lg ${
                crossVerificationResult === 'success'
                  ? 'bg-green-900/30 border border-green-700'
                  : 'bg-red-900/30 border border-red-700'
              }`}>
                <div className="flex items-center">
                  {crossVerificationResult === 'success' ? (
                    <>
                      <div className="bg-green-600 w-10 h-10 rounded-full flex items-center justify-center mr-4">
                        <FaCheck className="text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-300">Connection Verified</h3>
                        <p className="text-green-200 text-sm">
                          The accounts are verified to belong to the same persona.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-600 w-10 h-10 rounded-full flex items-center justify-center mr-4">
                        <FaTimes className="text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-300">Verification Failed</h3>
                        <p className="text-red-200 text-sm">
                          Could not verify that these accounts belong to the same persona.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div> 
        
      </main>
      
    </div>
  )}
