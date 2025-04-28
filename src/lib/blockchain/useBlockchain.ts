import { useEffect, useState } from 'react';
import { BlockchainProof } from '@/types';
import { blockchainService, mockContract, generateProofHash, verifyProof } from './solana';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

/**
 * Custom hook for interacting with the blockchain
 */
export function useBlockchain() {
  const [isConnected, setIsConnected] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize connection on component mount
  useEffect(() => {
    initConnection();
  }, []);

  /**
   * Initialize connection to Solana network
   */
  const initConnection = async () => {
    try {
      const conn = blockchainService.getConnection();
      setConnection(conn);
      
      // Check connection by getting the version
      const version = await conn.getVersion();
      console.log('Connected to Solana network:', version);
      
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Failed to connect to Solana network:', err);
      setIsConnected(false);
      setError('Failed to connect to blockchain network');
    }
  };

  /**
   * Create a proof record on the blockchain
   */
  const createProof = async (
    personaPublicKey: string,
    proofData: string,
    proofUrls: string[]
  ): Promise<BlockchainProof | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate hash from proof data
      const proofHash = generateProofHash(proofData);
      
      // In a real implementation, this would create a transaction on the blockchain
      // For demo purposes, we'll use the mock contract
      await mockContract.createProof(personaPublicKey, proofHash, proofUrls);
      
      const proof: BlockchainProof = {
        personaPublicKey,
        proofHash,
        proofUrls,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      return proof;
    } catch (err) {
      console.error('Failed to create proof on blockchain:', err);
      setError('Failed to create proof on blockchain');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify a proof on the blockchain
   */
  const verifyBlockchainProof = async (proofHash: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would query the blockchain
      // For demo purposes, we'll use the mock contract
      const isValid = await verifyProof(proofHash);
      return isValid;
    } catch (err) {
      console.error('Failed to verify proof on blockchain:', err);
      setError('Failed to verify proof on blockchain');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all proofs for a persona
   */
  const getProofsForPersona = async (personaPublicKey: string): Promise<BlockchainProof[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would query the blockchain
      // For demo purposes, we'll use the mock contract
      const proofs = await mockContract.getProofsForPersona(personaPublicKey);
      return proofs;
    } catch (err) {
      console.error('Failed to get proofs from blockchain:', err);
      setError('Failed to get proofs from blockchain');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get a specific proof by hash
   */
  const getProofByHash = async (proofHash: string): Promise<BlockchainProof | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would query the blockchain
      // For demo purposes, we'll use the mock contract
      const proof = await mockContract.getProof(proofHash);
      return proof;
    } catch (err) {
      console.error('Failed to get proof from blockchain:', err);
      setError('Failed to get proof from blockchain');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate a Solana keypair from a PGP private key
   */
  const generateKeypairFromPGP = (pgpPrivateKey: string): Keypair => {
    return blockchainService.generateSolanaKeypair(pgpPrivateKey);
  };

  /**
   * Get the balance of a Solana account
   */
  const getAccountBalance = async (publicKey: string): Promise<number> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!connection) {
        throw new Error('Not connected to Solana network');
      }
      
      const balance = await blockchainService.getBalance(publicKey);
      return balance;
    } catch (err) {
      console.error('Failed to get account balance:', err);
      setError('Failed to get account balance');
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    error,
    connection,
    createProof,
    verifyBlockchainProof,
    getProofsForPersona,
    getProofByHash,
    generateKeypairFromPGP,
    getAccountBalance,
    reconnect: initConnection
  };
}
