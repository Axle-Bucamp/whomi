export interface Persona {
  id: string;
  publicKey: string;
  privateData: {
    accounts: string[];
    signedProofs: string[];
    notes: string;
  };
  createdAt : string;
  isPublic : boolean;
  name : string;
}

export interface CreatePersonaInput {
  name: string;
  email: string;
  isPublic: boolean;
}

export interface LocalStorage {
  personas: Persona[];
  settings: {
    theme: string;
    notifications: boolean;
  };
}

export interface BlockchainProof {
  personaPublicKey: string;
  proofHash: string;
  proofUrls: string[];
  timestamp: number;
}

export interface PrivacyWarning {
  type: 'account_overlap' | 'username_reuse' | 'metadata_similarity';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedPersonas: string[];
}

export interface AuthChallenge {
  challenge: string;
  timestamp: number;
  expires: number;
}

export interface AuthResponse {
  challenge: string;
  signature: string;
  publicKey: string;
}
