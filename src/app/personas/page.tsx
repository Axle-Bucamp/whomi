'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import {
  FaCopy,
  FaDownload,
  FaKey,
  FaPlus,
  FaUserCircle,
} from 'react-icons/fa';

import { updateProofVisibility } from '@/lib/blockchain/contractInteractions';
import {
  createPersona,
  decryptStorage,
  encryptStorage,
  loadEncryptedStorage,
  saveEncryptedStorage,
} from '@/lib/storage/localStore';
import { Persona } from '@/types';

export default function PersonasPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPersonaKey, setNewPersonaKey] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{id: string, status: 'updating' | 'success' | 'error'} | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

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
          setPersonas(storage.personas);
        }
      }
    } catch (err) {
      console.error('Failed to load personas:', err);
      setError('Failed to load personas. Please check your private key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      setError('Please provide both name and email');
      return;
    }
    
    setIsLoading(true);
    setIsCreating(true);
    setError('');
    
    try {
      const encryptedData = await loadEncryptedStorage();
      if (encryptedData && privateKey) {
        const storage = await decryptStorage(encryptedData, privateKey);
        
        const { updatedStorage, persona, privateKey: newKey } = await createPersona({
          name,
          email,
          isPublic
        });
        
        const newEncryptedStorage = await encryptStorage(updatedStorage, privateKey);
        await saveEncryptedStorage(newEncryptedStorage);
        
        setPersonas(updatedStorage.personas);
        setShowCreateForm(false);
        setName('');
        setEmail('');
        setIsPublic(false);
        setNewPersonaKey(newKey);
        setShowNewKey(true);
        setSuccess('Persona created successfully!');
      } else {
        setError('No storage or private key available');
      }
    } catch (err) {
      setError('Failed to create persona: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
      setIsCreating(false);
    }
  };

  const handleManagePersona = async (personaId: string) => {
    setUpdateStatus({ id: personaId, status: 'updating' });
    try {
      const encryptedData = await loadEncryptedStorage();
      if (!encryptedData || !privateKey) {
        throw new Error('Missing encrypted data or private key');
      }
  
      const storage = await decryptStorage(encryptedData, privateKey);
      const persona = storage.personas.find((p) => p.id === personaId);
  
      if (!persona) {
        throw new Error('Persona not found');
      }
  
      // Example: Toggle the visibility status on blockchain
      const newVisibility = !persona.isPublic;
      await updateProofVisibility(persona.id, newVisibility);
  
      // Update local storage to reflect change
      persona.isPublic = newVisibility;
  
      const newEncryptedStorage = await encryptStorage(storage, privateKey);
      await saveEncryptedStorage(newEncryptedStorage);
  
      setPersonas([...storage.personas]);
      setUpdateStatus({ id: personaId, status: 'success' });
      setSuccess(`Persona ${newVisibility ? 'made public' : 'made private'} successfully.`);
    } catch (err) {
      console.error('Error managing persona:', err);
      setUpdateStatus({ id: personaId, status: 'error' });
      setError('Failed to update persona: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
    
  const togglePersonaVisibility = async (personaId: string, currentVisibility: boolean) => {
    setUpdateStatus({id: personaId, status: 'updating'});
    try {
      // Update on blockchain
      await updateProofVisibility(personaId, !currentVisibility);
      
      // Update in local storage
      const encryptedData = await loadEncryptedStorage();
      if (encryptedData && privateKey) {
        const storage = await decryptStorage(encryptedData, privateKey);
        
        const updatedPersonas = storage.personas.map(persona => {
          if (persona.id === personaId) {
            return {
              ...persona,
              isPublic: !currentVisibility
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
        setUpdateStatus({id: personaId, status: 'success'});
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setUpdateStatus(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to update persona visibility:', err);
      setUpdateStatus({id: personaId, status: 'error'});
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setUpdateStatus(null);
      }, 2000);
    }
  };

  const handleDeletePersona = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const encryptedData = await loadEncryptedStorage();
      if (encryptedData && privateKey) {
        const storage = await decryptStorage(encryptedData, privateKey);
        
        const updatedPersonas = storage.personas.filter(persona => persona.id !== personaId);
        
        const updatedStorage = {
          ...storage,
          personas: updatedPersonas
        };
        
        const newEncryptedStorage = await encryptStorage(updatedStorage, privateKey);
        await saveEncryptedStorage(newEncryptedStorage);
        
        setPersonas(updatedPersonas);
        setSuccess('Persona deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to delete persona:', err);
      setError('Failed to delete persona: ' + (err instanceof Error ? err.message : String(err)));
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  if (isLoading && !isCreating) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading personas...</p>
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
              <Link href="/personas" className="text-white hover:text-indigo-300 transition-colors font-semibold">
                Personas
              </Link>
              <Link href="/connect" className="text-white hover:text-indigo-300 transition-colors">
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Personas</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <FaPlus className="mr-2" /> Create New Persona
          </button>
        </div>

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

        {showNewKey && (
          <div className="mb-6 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2 flex items-center">
              <FaKey className="mr-2" /> New Persona Private Key
            </h2>
            <p className="text-yellow-200 mb-4 text-sm">
              This is the private key for your new persona. Save it somewhere safe. It will only be shown once!
            </p>
            <div className="relative">
              <textarea 
                className="w-full h-40 bg-gray-900 text-gray-300 p-3 rounded font-mono text-xs"
                value={newPersonaKey}
                readOnly
              />
              {copySuccess && (
                <div className="absolute top-2 right-2 bg-green-800 text-green-200 px-2 py-1 rounded text-xs">
                  {copySuccess}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => copyToClipboard(newPersonaKey)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
              >
                <FaCopy className="mr-2" /> Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([newPersonaKey], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `whoim_persona_key_${Date.now()}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center"
              >
                <FaDownload className="mr-2" /> Download Key
              </button>
            </div>
            <button
              onClick={() => setShowNewKey(false)}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              I've Saved My Key
            </button>
          </div>
        )}

        {showCreateForm && (
          <div className="mb-6 bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Persona</h2>
            <form onSubmit={handleCreatePersona}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Persona name"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="persona.email@example.com"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-2 text-gray-300">Make this persona publicly visible</span>
                </label>
                <p className="mt-1 text-xs text-gray-400 ml-7">
                  Public personas can be verified by others. Private personas are only visible to you.
                </p>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors flex items-center"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Persona'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {personas.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <FaUserCircle className="text-5xl text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Personas Yet</h2>
            <p className="text-gray-400 mb-6">
              Create your first persona to start building your decentralized identity.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create Your First Persona
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <div key={persona.id} className="bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <FaUserCircle className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{persona.name || persona.id.substring(0, 8)}</h3>
                    <p className="text-gray-400 text-sm">
                      {persona.privateData.accounts.length} connected accounts
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                <h4 className="text-gray-400 text-xs uppercase mb-2">Persona ID</h4>
                <p className="text-gray-300 font-mono text-sm break-words">{persona.id}</p>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleManagePersona(persona.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Manage
                </button>
                <button
                  onClick={() => handleDeletePersona(persona.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  </div>
  )}
