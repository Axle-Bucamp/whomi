import * as openpgp from 'openpgp';

import {
  CreatePersonaInput,
  Persona,
} from '@/types';

// Storage keys
const PERSONAS_KEY = 'whoim_personas';
const KEYS_KEY = 'whoim_keys';
const SETTINGS_KEY = 'whoim_settings';
const STORAGE_KEY = 'whoim_storage';

// Default password for encryption (in a real app, this would be user-provided)
const DEFAULT_PASSWORD = 'whoim_default_password';

export function getStorageKey():string{
  return STORAGE_KEY;
}

/**
 * Generates a PGP key pair
 * @returns Public and private keys
 */
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: 'rsa',         // You can also use 'ecc'
    rsaBits: 2048,       // RSA key size (2048 is a good default)
    userIDs: [{ name: 'Persona', email: 'persona@example.com' }], // placeholder user ID
    format: 'armored',   // output as ASCII armored string
  });

  return {
    publicKey,
    privateKey,
  };
}

/**
 * Encrypts data using PGP
 * @param data Data to encrypt
 * @param password Password for encryption
 * @returns Encrypted data as string
 */
export async function encryptData(data: any, password: string = DEFAULT_PASSWORD): Promise<string> {
  try {
    const message = await openpgp.createMessage({ text: JSON.stringify(data) });
    const encrypted = await openpgp.encrypt({
      message,
      passwords: [password],
      format: 'armored'
    });
    return encrypted as string;
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw error;
  }
}

/**
 * Decrypts data using PGP
 * @param encryptedData Encrypted data as string
 * @param password Password for decryption
 * @returns Decrypted data
 */
export async function decryptData(encryptedData: string, password: string = DEFAULT_PASSWORD): Promise<any> {
  try {
    const message = await openpgp.readMessage({
      armoredMessage: encryptedData
    });
    const { data: decrypted } = await openpgp.decrypt({
      message,
      passwords: [password],
      format: 'utf8'
    });
    return JSON.parse(decrypted as string);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw error;
  }
}

/**
 * Saves data to local storage with encryption
 * @param key Storage key
 * @param data Data to store
 * @param password Password for encryption
 */
export async function saveToStorage(key: string, data: any, password: string = DEFAULT_PASSWORD): Promise<void> {
  try {
    const encrypted = await encryptData(data, password);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
    throw error;
  }
}

/**
 * Loads data from local storage with decryption
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @param password Password for decryption
 * @returns Decrypted data or default value
 */
export async function loadFromStorage<T>(key: string, defaultValue: T, password: string = DEFAULT_PASSWORD): Promise<T> {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) {
      return defaultValue;
    }
    return await decryptData(encrypted, password);
  } catch (error) {
    console.error(`Error loading from storage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Saves personas to local storage
 * @param personas Array of personas
 */
export async function savePersonas(personas: Persona[]): Promise<void> {
  await saveToStorage(PERSONAS_KEY, personas);
}

/**
 * Loads personas from local storage
 * @returns Array of personas
 */
export async function loadPersonas(): Promise<Persona[]> {
  return await loadFromStorage<Persona[]>(PERSONAS_KEY, []);
}

/**
 * Saves keys to local storage
 * @param keys Key-value pairs of keys
 */
export async function saveKeys(keys: Record<string, string>): Promise<void> {
  await saveToStorage(KEYS_KEY, keys);
}

/**
 * Loads keys from local storage
 * @returns Key-value pairs of keys
 */
export async function loadKeys(): Promise<Record<string, string>> {
  return await loadFromStorage<Record<string, string>>(KEYS_KEY, {});
}

/**
 * Saves settings to local storage
 * @param settings Settings object
 */
export async function saveSettings(settings: Record<string, any>): Promise<void> {
  await saveToStorage(SETTINGS_KEY, settings);
}

/**
 * Loads settings from local storage
 * @returns Settings object
 */
export async function loadSettings(): Promise<Record<string, any>> {
  return await loadFromStorage<Record<string, any>>(SETTINGS_KEY, {});
}

/**
 * Exports all storage data to a file
 * @returns JSON string of all data
 */
export async function exportStorage(): Promise<string> {
  try {
    const personas = await loadPersonas();
    const keys = await loadKeys();
    const settings = await loadSettings();
    
    const exportData = {
      personas,
      keys,
      settings,
      exportDate: new Date().toISOString(),
      version: '2.0.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting storage:', error);
    throw error;
  }
}

/**
 * Imports data from a file to storage
 * @param jsonData JSON string of data to import
 * @returns Success status
 */
export async function importStorage(jsonData: string): Promise<boolean> {
  try {
    const importData = JSON.parse(jsonData);
    
    if (!importData.personas || !importData.keys || !importData.version) {
      throw new Error('Invalid import data format');
    }
    
    // Verify version compatibility
    const versionParts = importData.version.split('.');
    const majorVersion = parseInt(versionParts[0], 10);
    
    if (majorVersion < 2) {
      throw new Error('Incompatible version. Only version 2.x or higher is supported.');
    }
    
    // Import data
    await savePersonas(importData.personas);
    await saveKeys(importData.keys);
    
    if (importData.settings) {
      await saveSettings(importData.settings);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing storage:', error);
    throw error;
  }
}

/**
 * Clears all storage data
 */
export async function clearStorage(): Promise<void> {
  localStorage.removeItem(PERSONAS_KEY);
  localStorage.removeItem(KEYS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Encrypts the entire storage
 * @param data Storage data
 * @param password Password for encryption
 * @returns Encrypted storage data
 */
export async function encryptStorage(data: any, password: string = DEFAULT_PASSWORD): Promise<string> {
  return await encryptData(data, password);
}

/**
 * Decrypts the entire storage
 * @param encryptedData Encrypted storage data
 * @param password Password for decryption
 * @returns Decrypted storage data
 */
export async function decryptStorage(encryptedData: string, password: string = DEFAULT_PASSWORD): Promise<any> {
  return await decryptData(encryptedData, password);
}

/**
 * Saves encrypted storage data
 * @param encryptedData Encrypted storage data
 */
export async function saveEncryptedStorage(encryptedData: string): Promise<void> {
  localStorage.setItem(STORAGE_KEY, encryptedData);
}

/**
 * Loads encrypted storage data
 * @returns Encrypted storage data or null if not found
 */
export async function loadEncryptedStorage(): Promise<string | null> {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Initializes storage with default values if not already initialized
 */
export async function initializeStorage(): Promise<void> {
  const encryptedStorage = await loadEncryptedStorage();
  if (!encryptedStorage) {
    const defaultStorage = {
      personas: [],
      keys: {},
      settings: {
        theme: 'dark',
        privacyLevel: 'high',
        initialized: true
      }
    };
    const encrypted = await encryptStorage(defaultStorage);
    await saveEncryptedStorage(encrypted);
  }
}

/**
 * Securely loads and returns the decrypted storage
 * Initializes default storage if none exists
 * @returns Decrypted storage object
 */
export async function SecureStorage(): Promise<any> {
  try {
    let encryptedStorage = await loadEncryptedStorage();
    if (!encryptedStorage) {
      await initializeStorage();
      encryptedStorage = await loadEncryptedStorage();
    }
    if (!encryptedStorage) {
      throw new Error('Failed to initialize secure storage.');
    }
    const storage = await decryptStorage(encryptedStorage);
    return storage;
  } catch (error) {
    console.error('Error accessing SecureStorage:', error);
    throw error;
  }
}

/**
 * Creates a new persona
 * @param input Persona creation data
 * @returns Updated storage, created persona, and new private key
 */
export async function createPersona(
  { name, email, isPublic }: CreatePersonaInput
): Promise<{ updatedStorage: any; persona: Persona; privateKey: string }> {
  let encryptedStorage = await loadEncryptedStorage();
  if (!encryptedStorage) {
    await initializeStorage();
    encryptedStorage = await loadEncryptedStorage();
  }

  const storage = await decryptStorage(encryptedStorage);

  const { publicKey, privateKey } = await generateKeyPair();

  const persona: Persona = {
    id: `persona_${Date.now()}`, // simple ID generation (or use uuidv4() if you prefer)
    publicKey,
    privateData: {
      accounts: [],
      signedProofs: [],
      notes: `Created with email: ${email}`, // store hidden email
    },
    createdAt: new Date().toISOString(),
    isPublic,
    name,
  };

  storage.personas = storage.personas || [];
  storage.personas.push(persona);

  const newEncryptedStorage = await encryptStorage(storage);
  await saveEncryptedStorage(newEncryptedStorage);

  

  return {
    updatedStorage: storage,
    persona,
    privateKey,
  };


}

  // Default export for the entire module
export default {
    SecureStorage,
    savePersonas,
    loadPersonas,
    saveKeys,
    loadKeys,
    saveSettings,
    loadSettings,
    exportStorage,
    importStorage,
    clearStorage,
    encryptStorage,
    decryptStorage,
    saveEncryptedStorage,
    loadEncryptedStorage,
    initializeStorage,
    createPersona
  };