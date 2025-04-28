'use client';

import { useState } from 'react';

import { createIdentityProof } from '@/lib/blockchain/contractInteractions';
import { Persona } from '@/types';

interface CreatePersonaFormProps {
  onPersonaCreated: (persona: Persona) => void;
  onCancel: () => void;
}

export default function CreatePersonaForm({ onPersonaCreated, onCancel }: CreatePersonaFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Generate a unique platform ID for this persona
      const platformId = `whoim_${Date.now()}`;
      
      // Create a proof hash (in a real app, this would be more sophisticated)
      const proofHash = btoa(`${name}:${email}:${Date.now()}`);
      
      // Create the identity proof on the blockchain
      const proofId = await createIdentityProof(
        'dummy-public-key', // In a real app, this would be a real PGP public key
        proofHash,
        isPublic,
        platformId
      );
      
      // Create the new persona object
      const newPersona: Persona = {
        id: `persona_${Date.now()}`,
        name,
        email,
        isPublic,
        proofId,
        platformId,
        createdAt: new Date().toISOString()
      };
      
      onPersonaCreated(newPersona);
    } catch (err) {
      console.error('Error creating persona:', err);
      setError('Failed to create persona. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Create New Persona</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-300 mb-2">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Persona name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-300 mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="email@example.com"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            <span className="ml-2 text-sm font-medium text-gray-300">
              Make this persona publicly visible
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-400">
            Public personas can be verified by others across platforms
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : 'Create Persona'}
          </button>
        </div>
      </form>
    </div>
  );
}
