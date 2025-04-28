# WHOIM V2 Documentation

## Overview

WHOIM V2 is a decentralized identity proof platform that serves as a blockchain proof of personhood, Web3 OAuth system, and privacy-focused identity management solution. The application allows users to create and manage multiple personas, generate cryptographic proofs of identity, and analyze potential privacy leaks between different online identities.

## Architecture

WHOIM V2 is built using the following technologies:

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Cryptography**: OpenPGP for key generation and management
- **Blockchain Integration**: Solana Web3.js for blockchain verification
- **Privacy Analysis**: D3.js for visualization of identity relationships
- **Local Storage**: Encrypted local-first storage for private keys
- **Authentication**: Web3 OAuth system for third-party integration

## Key Features

### 1. Multiple Persona Management

- Create and manage separate online identities
- Each persona has its own cryptographic key pair
- Switch between personas for different online contexts

### 2. Local-First Storage

- All private keys are stored locally in an encrypted configuration file
- No server-side storage of sensitive information
- Import/export functionality for backup and recovery

### 3. Blockchain Proof Verification

- Generate cryptographic proofs of identity
- Verify proofs on the Solana blockchain
- Connect external accounts to personas

### 4. Privacy Analysis

- Visualize relationships between personas
- Detect potential privacy leaks
- Generate privacy score and recommendations
- Interactive graph visualization

### 5. Web3 OAuth

- Allow third-party services to authenticate users
- Persona-based authentication
- Selective disclosure of identity information

## Security Considerations

- Private keys never leave the user's device
- All cryptographic operations are performed client-side
- Privacy analysis helps users maintain separation between identities
- No central server storing user data

## User Guide

### Getting Started

1. Access the application at: https://44171-i6xshliwmng5d8plm6eaa-3a4debb8.manus.computer
2. Create your first identity by providing a name and email
3. A default persona will be created with a new PGP key pair
4. You'll be redirected to the dashboard

### Managing Personas

1. Navigate to the "Personas" tab or click "Create New Persona" on the dashboard
2. Each persona has its own cryptographic identity
3. Use different personas for different online contexts

### Connecting Accounts

1. Click "Connect Account" from the dashboard
2. Follow the authentication flow for the external service
3. The connection will be verified on the blockchain
4. Connected accounts will appear in your dashboard

### Privacy Analysis

1. View your privacy score on the dashboard
2. Click "View detailed privacy graph" for in-depth analysis
3. The graph visualizes relationships between your personas
4. Address any privacy concerns highlighted in the analysis

### Backup and Recovery

1. Click "Export Backup" from the dashboard
2. Save the encrypted backup file securely
3. To recover, use the import function in the settings page

## Technical Implementation

### Local Storage System

The application uses a combination of browser localStorage and IndexedDB for storing encrypted data. Private keys are encrypted using a master password before being stored locally.

```typescript
// Key generation and storage
const generateKeyPair = async (name: string, email: string): Promise<KeyPair> => {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: 'ecc',
    curve: 'curve25519',
    userIDs: [{ name, email }],
    format: 'armored'
  });
  
  return { privateKey, publicKey };
};
```

### Blockchain Integration

The application integrates with Solana blockchain for proof verification:

```typescript
// Verify proof on blockchain
const verifyProof = async (proofId: string): Promise<boolean> => {
  const connection = new Connection(SOLANA_NETWORK);
  const proof = await connection.getAccountInfo(new PublicKey(proofId));
  
  if (!proof) return false;
  
  // Verify signature and data
  return verifySignature(proof.data);
};
```

### Privacy Analysis

The privacy analysis system uses graph theory to detect potential leaks:

```typescript
// Analyze privacy connections
const analyzePrivacy = (personas: Persona[], connections: Connection[]): PrivacyResult => {
  const graph = new Graph();
  
  // Build graph of connections
  personas.forEach(p => graph.addNode(p.id));
  connections.forEach(c => graph.addEdge(c.sourceId, c.targetId));
  
  // Detect potential leaks
  const leaks = detectLeaks(graph);
  
  // Calculate privacy score
  const score = calculatePrivacyScore(leaks);
  
  return { score, leaks, recommendations: generateRecommendations(leaks) };
};
```

## Tor Compatibility

WHOIM V2 is fully compatible with Tor for enhanced privacy:

1. The application uses client-side rendering for most operations
2. No tracking or fingerprinting techniques are used
3. All network requests can be routed through Tor
4. The application can be accessed via Tor Browser

## Future Enhancements

1. Support for additional blockchain networks
2. Enhanced privacy analysis algorithms
3. Decentralized storage options
4. Mobile application support
5. Integration with decentralized identity standards

## Troubleshooting

### Common Issues

1. **Key Generation Fails**: Ensure you have sufficient entropy and your browser supports the Web Crypto API
2. **Blockchain Verification Timeout**: Check your network connection and try again
3. **Privacy Analysis Not Loading**: Ensure you have at least two personas created
4. **Import/Export Issues**: Verify the backup file format and integrity

### Support

For additional support, please refer to the GitHub repository or contact the development team.
