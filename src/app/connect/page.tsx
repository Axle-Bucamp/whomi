'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import {
  FaDiscord,
  FaGithub,
  FaGlobe,
  FaHashtag,
  FaLink,
  FaReddit,
  FaTwitter,
} from 'react-icons/fa';

import {
  createProofRecord,
  generateProofHash,
} from '@/lib/blockchain/solana';
import {
  decryptStorage,
  encryptStorage,
  loadEncryptedStorage,
  saveEncryptedStorage,
} from '@/lib/storage/localStore';
import { Persona } from '@/types';

export default function ConnectPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [platform, setPlatform] = useState<string>('twitter');
  const [username, setUsername] = useState<string>('');
  const [proofMessage, setProofMessage] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedPersonaDetails, setSelectedPersonaDetails] = useState<Persona | null>(null);
  const [isCreatingProof, setIsCreatingProof] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    if (selectedPersona && personas.length > 0) {
      const persona = personas.find(p => p.id === selectedPersona);
      if (persona) {
        setSelectedPersonaDetails(persona);
        // Initialize isPublic based on the selected persona's current visibility
        setIsPublic(persona.isPublic || false);
      }
    }
  }, [selectedPersona, personas]);

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
          setPersonas(storage.personas);
          if (storage.personas.length > 0) {
            setSelectedPersona(storage.personas[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load personas:', err);
      setError('Failed to load personas. Please check your private key.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateProofMessage = async () => {
    if (!selectedPersona || !platform || !username) {
      setError('Please select a persona and enter your username');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const persona = personas.find(p => p.id === selectedPersona);
      if (!persona) {
        throw new Error('Selected persona not found');
      }

      const timestamp = new Date().toISOString();
      const message = `I hereby claim that the ${platform} account @${username} belongs to the owner of the PGP key with fingerprint ${persona.id}. This claim was made on ${timestamp}.`;
      
      setProofMessage(message);
      setStep(2);
    } catch (err) {
      setError('Failed to generate proof message: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndSaveProof = async () => {
    if (!proofUrl || !proofMessage || !selectedPersona) {
      setError('Please provide the URL where you posted the proof message');
      return;
    }

    setIsLoading(true);
    setIsCreatingProof(true);
    setError('');
    setSuccess('');
    
    try {
      // In a real implementation, we would fetch the content from the URL
      // and verify that it contains the proof message
      // For demo purposes, we'll simulate this verification

      // Create a proof record on the blockchain
      const proofHash = generateProofHash(proofMessage);
      await createProofRecord(selectedPersona, proofHash, [proofUrl], isPublic);

      // Update the persona's connected accounts
      const encryptedData = await loadEncryptedStorage();
      if (encryptedData && privateKey) {
        const storage = await decryptStorage(encryptedData, privateKey);
        
        const updatedPersonas = storage.personas.map(persona => {
          if (persona.id === selectedPersona) {
            return {
              ...persona,
              isPublic: isPublic,
              privateData: {
                ...persona.privateData,
                accounts: [...persona.privateData.accounts, `${platform}:@${username}`],
                signedProofs: [...persona.privateData.signedProofs, proofHash]
              }
            };
          }
          return persona;
        });
        
        const updatedStorage = {
          ...storage,
          personas: updatedPersonas
        };
        
        const newEncryptedStorage = await encryptStorage(updatedStorage, privateKey);
        await saveEncryptedStorage(newEncryptedStorage);
        
        setPersonas(updatedPersonas);
        setSuccess('Account successfully connected and proof recorded on blockchain!');
        setStep(3);
      }
    } catch (err) {
      setError('Failed to verify and save proof: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
      setIsCreatingProof(false);
    }
  };

  const resetForm = () => {
    setPlatform('twitter');
    setUsername('');
    setProofMessage('');
    setProofUrl('');
    setError('');
    setSuccess('');
    setIsPublic(true);
    setStep(1);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <FaTwitter className="text-blue-400" />;
      case 'github':
        return <FaGithub className="text-gray-300" />;
      case 'reddit':
        return <FaReddit className="text-orange-500" />;
      case 'discord':
        return <FaDiscord className="text-indigo-400" />;
      case 'mastodon':
        return <FaHashtag className="text-purple-400" />;
      default:
        return <FaGlobe className="text-green-400" />;
    }
  };

  if (isLoading && !isCreatingProof) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
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
              <Link href="/connect" className="text-white hover:text-indigo-300 transition-colors font-semibold">
                Connect
              </Link>
              <Link href="/verify" className="text-white hover:text-indigo-300 transition-colors">
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
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <FaLink className="mr-2" /> Connect Account
        </h1>

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

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex mb-6">
            <div className="flex-1 text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                1
              </div>
              <p className={`text-sm ${step >= 1 ? 'text-white' : 'text-gray-400'}`}>Select Account</p>
            </div>
            <div className="w-full max-w-[100px] flex items-center justify-center">
              <div className="h-1 w-full bg-gray-700">
                <div className={`h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-700'}`}></div>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                2
              </div>
              <p className={`text-sm ${step >= 2 ? 'text-white' : 'text-gray-400'}`}>Create Proof</p>
            </div>
            <div className="w-full max-w-[100px] flex items-center justify-center">
              <div className="h-1 w-full bg-gray-700">
                <div className={`h-1 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-700'}`}></div>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                3
              </div>
              <p className={`text-sm ${step >= 3 ? 'text-white' : 'text-gray-400'}`}>Verify</p>
            </div>
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Step 1: Select Account to Connect</h2>
              
              {personas.length === 0 ? (
                <div className="bg-gray-700 p-6 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You need to create a persona first.</p>
                  <Link 
                    href="/personas" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Create Persona
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="persona" className="block text-gray-300 mb-2">Select Persona</label>
                    <select
                      id="persona"
                      value={selectedPersona}
                      onChange={(e) => setSelectedPersona(e.target.value)}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {personas.map(persona => (
                        <option key={persona.id} value={persona.id}>
                          {persona.name || persona.id.substring(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="platform" className="block text-gray-300 mb-2">Platform</label>
                    <select
                      id="platform"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    <label htmlFor="username" className="block text-gray-300 mb-2">Username</label>
                    <div className="flex">
                      <div className="bg-gray-600 flex items-center px-3 rounded-l">
                        {getPlatformIcon(platform)}
                      </div>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-r focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Your ${platform} username`}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-600 bg-gray-700"
                      />
                      <span className="ml-2 text-gray-300">Make this proof publicly visible</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-400 ml-7">
                      Public proofs can be verified by others. Private proofs are only visible to you.
                    </p>
                  </div>
                  
                  <button
                    onClick={generateProofMessage}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-colors"
                    disabled={!selectedPersona || !platform || !username}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Step 2: Create and Post Proof</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2">Proof Message</label>
                  <div className="bg-gray-700 p-4 rounded font-mono text-sm break-words">
                    {proofMessage}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(proofMessage);
                      setSuccess('Proof message copied to clipboard!');
                      setTimeout(() => setSuccess(''), 2000);
                    }}
                    className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    Copy to clipboard
                  </button>
                </div>
                
                <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-300 mb-2">Instructions:</h3>

                  <ol className="list-decimal list-inside text-sm text-indigo-200">
                    <li>Click the "Generate Proof Message" button below.</li>
                    <li>Copy the proof message from the generated text area.</li>
                    <li>Go to your social platform and post the proof message with your account details.</li>
                    <li>Paste the URL of your proof post in the field provided.</li>
                    <li>Click the "Verify and Save Proof" button to confirm your account connection.</li>
                    <li>If everything is correct, your proof will be recorded on the blockchain.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
  

        {/* Proof Message and URL Display */}
        {step === 2 && proofMessage && (
          <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-indigo-300 mb-2">Proof Message:</h3>
            <textarea
              className="w-full bg-transparent text-indigo-200 border border-indigo-700 rounded-md p-2 resize-none"
              rows={6}
              value={proofMessage}
              readOnly
            />
            <button
              onClick={() => navigator.clipboard.writeText(proofMessage)}
              className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Copy to clipboard
            </button>
          </div>
        )}

        {/* URL Input */}
        {step === 2 && (
          <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-indigo-300 mb-2">Proof URL:</h3>
            <input
              type="url"
              className="w-full bg-transparent text-indigo-200 border border-indigo-700 rounded-md p-2"
              placeholder="Enter the URL where you posted the proof message"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
          </div>
        )}

        {/* Verify and Save Proof */}
        {step === 2 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={verifyAndSaveProof}
              disabled={isLoading || isCreatingProof}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading || isCreatingProof ? 'Verifying...' : 'Verify and Save Proof'}
            </button>
          </div>
        )}

        {/* Reset Form */}
        {step === 3 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={resetForm}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-500"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </main>
  </div>
  )}
