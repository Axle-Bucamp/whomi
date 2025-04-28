import * as openpgp from 'openpgp';
import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import { blockchainService } from '../blockchain/solana';

/**
 * Web3 OAuth Authentication System for WHOIM
 */
export class Web3Auth {
  /**
   * Generate a challenge for authentication
   */
  static generateChallenge(personaId: string): string {
    const timestamp = Date.now();
    const nonce = Math.floor(Math.random() * 1000000);
    return `whoim-auth-${personaId}-${timestamp}-${nonce}`;
  }

  /**
   * Sign a challenge with PGP key
   */
  static async signChallenge(challenge: string, privateKey: string): Promise<string> {
    try {
      const privateKeyObj = await openpgp.readPrivateKey({ armoredKey: privateKey });
      const message = await openpgp.createMessage({ text: challenge });
      
      const signed = await openpgp.sign({
        message,
        signingKeys: privateKeyObj
      });
      
      return signed.toString();
    } catch (error) {
      console.error('Error signing challenge with PGP:', error);
      throw new Error('Failed to sign challenge with PGP key');
    }
  }

  /**
   * Verify a PGP-signed challenge
   */
  static async verifyPgpSignature(
    signedChallenge: string,
    publicKey: string
  ): Promise<{ valid: boolean; challenge: string }> {
    try {
      const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
      const message = await openpgp.readMessage({ armoredMessage: signedChallenge });
      
      const { data, signatures } = await openpgp.verify({
        message,
        verificationKeys: publicKeyObj
      });
      
      const valid = await signatures[0].verified;
      
      return {
        valid,
        challenge: data.toString()
      };
    } catch (error) {
      console.error('Error verifying PGP signature:', error);
      return {
        valid: false,
        challenge: ''
      };
    }
  }

  /**
   * Sign a challenge with Solana keypair
   */
  static signChallengeWithSolana(challenge: string, keypair: Keypair): string {
    try {
      const messageBytes = ethers.utils.toUtf8Bytes(challenge);
      const signature = keypair.sign(messageBytes).toString('base64');
      return signature;
    } catch (error) {
      console.error('Error signing challenge with Solana:', error);
      throw new Error('Failed to sign challenge with Solana key');
    }
  }

  /**
   * Verify a Solana-signed challenge
   */
  static verifySolanaSignature(
    challenge: string,
    signature: string,
    publicKey: string
  ): boolean {
    return blockchainService.verifySignature(challenge, signature, publicKey);
  }

  /**
   * Generate an authentication token
   */
  static generateAuthToken(personaId: string, expiresIn: number = 3600): string {
    const payload = {
      sub: personaId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn
    };
    
    // In a real implementation, we would use a proper JWT library
    // For demo purposes, we'll use a simple base64 encoding
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = this.mockSignToken(encodedPayload);
    
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Mock function to sign a token (for demo purposes)
   */
  private static mockSignToken(payload: string): string {
    // In a real implementation, we would use a proper JWT library
    // For demo purposes, we'll use a simple hash
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(payload)).slice(2, 34);
  }

  /**
   * Verify an authentication token
   */
  static verifyAuthToken(token: string): { valid: boolean; personaId: string } {
    try {
      const [encodedPayload, signature] = token.split('.');
      
      // Verify signature
      const expectedSignature = this.mockSignToken(encodedPayload);
      if (signature !== expectedSignature) {
        return { valid: false, personaId: '' };
      }
      
      // Decode payload
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
      
      // Check expiration
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, personaId: '' };
      }
      
      return { valid: true, personaId: payload.sub };
    } catch (error) {
      console.error('Error verifying auth token:', error);
      return { valid: false, personaId: '' };
    }
  }
}

/**
 * OAuth Provider for third-party integration
 */
export class OAuthProvider {
  private clientId: string;
  private redirectUri: string;
  
  constructor(clientId: string, redirectUri: string) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }
  
  /**
   * Generate an OAuth authorization URL
   */
  generateAuthUrl(state: string, scope: string[] = ['identity']): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
      scope: scope.join(' ')
    });
    
    // In a real implementation, this would be a proper OAuth endpoint
    return `/oauth/authorize?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(code: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
  }> {
    // In a real implementation, this would make an API request
    // For demo purposes, we'll return a mock response
    return {
      access_token: `mock_access_token_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: `mock_refresh_token_${Date.now()}`
    };
  }
  
  /**
   * Get user information from access token
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    username: string;
    email: string;
  }> {
    // In a real implementation, this would make an API request
    // For demo purposes, we'll return a mock response
    return {
      id: `user_${Date.now()}`,
      username: 'demo_user',
      email: 'demo@example.com'
    };
  }
}

/**
 * Generate a Web3 OAuth client script for third-party integration
 */
export function generateOAuthClientScript(clientId: string, redirectUri: string): string {
  return `
// WHOIM Web3 OAuth Client
(function() {
  const WHOIM = {
    clientId: "${clientId}",
    redirectUri: "${redirectUri}",
    
    /**
     * Initialize the WHOIM OAuth client
     */
    init: function(options = {}) {
      this.clientId = options.clientId || this.clientId;
      this.redirectUri = options.redirectUri || this.redirectUri;
      
      // Check for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        this.handleCallback(code, state);
      }
      
      return this;
    },
    
    /**
     * Start the OAuth flow
     */
    login: function(options = {}) {
      const state = options.state || this.generateState();
      const scope = options.scope || ['identity'];
      
      // Store state for verification
      localStorage.setItem('whoim_oauth_state', state);
      
      // Generate authorization URL
      const authUrl = this.generateAuthUrl(state, scope);
      
      // Redirect to authorization URL
      window.location.href = authUrl;
    },
    
    /**
     * Handle OAuth callback
     */
    handleCallback: function(code, state) {
      // Verify state
      const storedState = localStorage.getItem('whoim_oauth_state');
      if (state !== storedState) {
        this.triggerEvent('error', { message: 'Invalid state parameter' });
        return;
      }
      
      // Exchange code for token
      this.exchangeCode(code)
        .then(response => {
          // Store tokens
          localStorage.setItem('whoim_access_token', response.access_token);
          localStorage.setItem('whoim_refresh_token', response.refresh_token);
          
          // Get user info
          return this.getUserInfo(response.access_token);
        })
        .then(userInfo => {
          this.triggerEvent('login', { user: userInfo });
        })
        .catch(error => {
          this.triggerEvent('error', { message: error.message });
        });
    },
    
    /**
     * Exchange authorization code for access token
     */
    exchangeCode: function(code) {
      return fetch('/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
          code
        })
      }).then(response => response.json());
    },
    
    /**
     * Get user information
     */
    getUserInfo: function(accessToken) {
      return fetch('/oauth/userinfo', {
        headers: {
          'Authorization': \`Bearer \${accessToken}\`
        }
      }).then(response => response.json());
    },
    
    /**
     * Generate a random state parameter
     */
    generateState: function() {
      return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    },
    
    /**
     * Generate authorization URL
     */
    generateAuthUrl: function(state, scope) {
      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        response_type: 'code',
        state,
        scope: scope.join(' ')
      });
      
      return \`https://whoim.io/oauth/authorize?\${params.toString()}\`;
    },
    
    /**
     * Trigger custom event
     */
    triggerEvent: function(name, data) {
      const event = new CustomEvent(\`whoim:\${name}\`, { detail: data });
      window.dispatchEvent(event);
    }
  };
  
  // Expose WHOIM to global scope
  window.WHOIM = WHOIM;
})();
  `;
}

/**
 * Helper functions for authentication
 */

/**
 * Generate a challenge for authentication
 */
export function generateAuthChallenge(personaId: string): string {
  return Web3Auth.generateChallenge(personaId);
}

/**
 * Sign a challenge with PGP key
 */
export async function signAuthChallenge(challenge: string, privateKey: string): Promise<string> {
  return Web3Auth.signChallenge(challenge, privateKey);
}

/**
 * Verify a PGP-signed challenge
 */
export async function verifyAuthSignature(
  signedChallenge: string,
  publicKey: string
): Promise<{ valid: boolean; challenge: string }> {
  return Web3Auth.verifyPgpSignature(signedChallenge, publicKey);
}

/**
 * Generate an authentication token
 */
export function generateAuthToken(personaId: string, expiresIn: number = 3600): string {
  return Web3Auth.generateAuthToken(personaId, expiresIn);
}

/**
 * Verify an authentication token
 */
export function verifyAuthToken(token: string): { valid: boolean; personaId: string } {
  return Web3Auth.verifyAuthToken(token);
}
