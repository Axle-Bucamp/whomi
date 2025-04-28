'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { updateProofVisibility } from '@/lib/blockchain/contractInteractions';
import { Persona } from '@/types';

interface PersonaCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;
  onTogglePublic: (isPublic: boolean) => void;
}

export default function PersonaCard({ persona, isActive, onSelect, onTogglePublic }: PersonaCardProps) {
  const [isPublic, setIsPublic] = useState(persona.isPublic || false);
  const router = useRouter();

  const handleTogglePublic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newPublicState = e.target.checked;
    setIsPublic(newPublicState);
    
    try {
      if (persona.proofId) {
        await updateProofVisibility(persona.proofId, newPublicState);
      }
      onTogglePublic(newPublicState);
    } catch (error) {
      console.error('Error updating persona visibility:', error);
      // Revert UI state if operation failed
      setIsPublic(!newPublicState);
    }
  };

  return (
    <div 
      className={`p-4 mb-3 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-indigo-700 border-2 border-indigo-400' : 'bg-gray-800 hover:bg-gray-700'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center mr-3">
            <span className="text-white font-bold">{persona.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">{persona.name}</h3>
            <p className="text-sm text-gray-300">{persona.email}</p>
          </div>
        </div>
        
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={isPublic}
              onChange={handleTogglePublic}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            <span className="ml-2 text-sm font-medium text-gray-300">
              {isPublic ? 'Public' : 'Private'}
            </span>
          </label>
        </div>
      </div>
      
      {persona.proofId && (
        <div className="mt-2 text-xs text-gray-400 truncate">
          <span className="font-semibold">Proof ID:</span> {persona.proofId}
        </div>
      )}
    </div>
  );
}
