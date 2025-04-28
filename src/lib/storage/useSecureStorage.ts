import {
  useEffect,
  useState,
} from 'react';

import {
  LocalStorage,
  Persona,
} from '@/types';

import { KeyManager } from './keyManager';
import {
  decryptStorage,
  encryptStorage,
  loadEncryptedStorage,
  saveEncryptedStorage,
} from './localStore';

/**
 * Custom hook for accessing and managing the encrypted local storage
 */
export function useSecureStorage() {
  const [isLoading, setIsLoading] = useState(true);
  const [storage, setStorage] = useState<LocalStorage | null>(null);
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load storage on component mount
  useEffect(() => {
    loadStorage();
  }, []);

  /**
   * Load the encrypted storage using the master key
   */
  const loadStorage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const encryptedData = loadEncryptedStorage();
      if (!encryptedData) {
        setStorage(null);
        setIsLoading(false);
        return;
      }
      
      // In a real app, we would prompt for the master key
      // For demo purposes, we'll use a simulated key retrieval
      const demoKey = localStorage.getItem('whoim_demo_private_key');
      if (!demoKey) {
        setError('Master key not found');
        setIsLoading(false);
        return;
      }
      
      setMasterKey(demoKey);
      const decryptedStorage = await decryptStorage(encryptedData, demoKey);
      setStorage(decryptedStorage);
    } catch (err) {
      console.error('Failed to load storage:', err);
      setError('Failed to decrypt storage. Please check your master key.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update the storage with new data
   */
  const updateStorage = async (newStorage: LocalStorage) => {
    if (!masterKey) {
      setError('Master key not available');
      return false;
    }
    
    try {
      setIsLoading(true);
      const encryptedData = await encryptStorage(newStorage, masterKey);
      saveEncryptedStorage(encryptedData);
      setStorage(newStorage);
      return true;
    } catch (err) {
      console.error('Failed to update storage:', err);
      setError('Failed to encrypt and save storage');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a new persona to storage
   */
  const addPersona = async (persona: Persona, privateKey: string) => {
    if (!storage || !masterKey) {
      setError('Storage or master key not available');
      return false;
    }
    
    try {
      // Store the persona's private key
      KeyManager.storePersonaKey(persona.id, privateKey);
      
      // Update storage with new persona
      const updatedStorage = {
        ...storage,
        personas: [...storage.personas, persona]
      };
      
      return await updateStorage(updatedStorage);
    } catch (err) {
      console.error('Failed to add persona:', err);
      setError('Failed to add persona to storage');
      return false;
    }
  };

  /**
   * Update an existing persona
   */
  const updatePersona = async (personaId: string, updates: Partial<Persona>) => {
    if (!storage || !masterKey) {
      setError('Storage or master key not available');
      return false;
    }
    
    try {
      const updatedPersonas = storage.personas.map(persona => {
        if (persona.id === personaId) {
          return { ...persona, ...updates };
        }
        return persona;
      });
      
      const updatedStorage = {
        ...storage,
        personas: updatedPersonas
      };
      
      return await updateStorage(updatedStorage);
    } catch (err) {
      console.error('Failed to update persona:', err);
      setError('Failed to update persona');
      return false;
    }
  };

  /**
   * Remove a persona from storage
   */
  const removePersona = async (personaId: string) => {
    if (!storage || !masterKey) {
      setError('Storage or master key not available');
      return false;
    }
    
    try {
      // Remove the persona's private key
      KeyManager.removePersonaKey(personaId);
      
      // Update storage without the removed persona
      const updatedStorage = {
        ...storage,
        personas: storage.personas.filter(persona => persona.id !== personaId)
      };
      
      return await updateStorage(updatedStorage);
    } catch (err) {
      console.error('Failed to remove persona:', err);
      setError('Failed to remove persona from storage');
      return false;
    }
  };

  /**
   * Update application settings
   */
  const updateSettings = async (newSettings: Partial<LocalStorage['settings']>) => {
    if (!storage || !masterKey) {
      setError('Storage or master key not available');
      return false;
    }
    
    try {
      const updatedStorage = {
        ...storage,
        settings: {
          ...storage.settings,
          ...newSettings
        }
      };
      
      return await updateStorage(updatedStorage);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('Failed to update settings');
      return false;
    }
  };

  /**
   * Reset all storage data
   */
  const resetStorage = () => {
    localStorage.removeItem('whoim_encrypted_storage');
    localStorage.removeItem('whoim_demo_private_key');
    
    // Remove all persona keys
    const personaKeys = KeyManager.getAllPersonaKeys();
    Object.keys(personaKeys).forEach(personaId => {
      KeyManager.removePersonaKey(personaId);
    });
    
    setStorage(null);
    setMasterKey(null);
    return true;
  };

  return {
    isLoading,
    storage,
    error,
    loadStorage,
    updateStorage,
    addPersona,
    updatePersona,
    removePersona,
    updateSettings,
    resetStorage,
    hasStorage: !!storage,
    hasMasterKey: !!masterKey
  };
}
