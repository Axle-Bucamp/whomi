import { Persona } from '@/types';

import {
  decryptStorage,
  getStorageKey,
  loadEncryptedStorage,
  SecureStorage,
} from './localStore';

/**
 * Hook to manage persona keys and storage
 */
export class KeyManager {
  /**
   * Stores a persona's private key in a secure way
   * In a real application, this would use a more secure method than localStorage
   */
  static storePersonaKey(personaId: string, privateKey: string): void {
    if (typeof window !== 'undefined') {
      // In a real app, we would use a more secure storage method
      // For demo purposes, we're using localStorage with a prefix
      localStorage.setItem(`whoim_persona_key_${personaId}`, privateKey);
    }
  }

  /**
   * Retrieves a persona's private key
   */
  static getPersonaKey(personaId: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`whoim_persona_key_${personaId}`);
    }
    return null;
  }

  /**
   * Removes a persona's private key
   */
  static removePersonaKey(personaId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`whoim_persona_key_${personaId}`);
    }
  }

  /**
   * Gets all stored persona keys
   */
  static getAllPersonaKeys(): Record<string, string> {
    if (typeof window === 'undefined') {
      return {};
    }

    const keys: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('whoim_persona_key_')) {
        const personaId = key.replace('whoim_persona_key_', '');
        const privateKey = localStorage.getItem(key);
        if (privateKey) {
          keys[personaId] = privateKey;
        }
      }
    }
    return keys;
  }

  /**
   * Checks if a persona has a stored private key
   */
  static hasPersonaKey(personaId: string): boolean {
    return !!this.getPersonaKey(personaId);
  }

  /**
   * Loads all personas from storage
   */
  static async loadAllPersonas(): Promise<Persona[]> {
    try {
      const encryptedData = loadEncryptedStorage();
      if (!encryptedData) {
        return [];
      }

      const masterKey = getStorageKey();
      if (!masterKey) {
        throw new Error('Master key not found');
      }

      const storage = await decryptStorage(encryptedData, masterKey);
      return storage.personas;
    } catch (error) {
      console.error('Error loading personas:', error);
      return [];
    }
  }

  /**
   * Finds a persona by ID
   */
  static async findPersonaById(personaId: string): Promise<Persona | null> {
    const personas = await this.loadAllPersonas();
    return personas.find(p => p.id === personaId) || null;
  }

  /**
   * Exports all keys as a backup file
   */
  static exportAllKeys(): void {
    const keys = this.getAllPersonaKeys();
    const masterKey = getStorageKey();
    
    if (masterKey) {
      keys['master'] = masterKey;
    }
    
    const blob = new Blob([JSON.stringify(keys, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoim_all_keys_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Imports keys from a backup file
   */
  static async importKeysFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            const keys = JSON.parse(event.target.result as string) as Record<string, string>;
            
            // Store master key if present
            if (keys.master) {
              SecureStorage.saveDemoPrivateKey(keys.master);
              delete keys.master;
            }
            
            // Store persona keys
            Object.entries(keys).forEach(([personaId, privateKey]) => {
              this.storePersonaKey(personaId, privateKey);
            });
            
            resolve();
          } else {
            reject(new Error('Failed to read file'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
