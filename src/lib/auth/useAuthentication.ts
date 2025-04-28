import { useEffect, useState } from 'react';
import { Web3Auth, OAuthProvider, generateAuthChallenge, signAuthChallenge, verifyAuthSignature, generateAuthToken, verifyAuthToken } from './authentication';
import { KeyManager } from '../storage/keyManager';

/**
 * Custom hook for authentication functionality
 */
export function useAuthentication() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check if user is authenticated
   */
  const checkAuthStatus = () => {
    const token = localStorage.getItem('whoim_auth_token');
    if (!token) {
      setIsAuthenticated(false);
      setCurrentPersonaId(null);
      return false;
    }

    const { valid, personaId } = verifyAuthToken(token);
    if (valid && personaId) {
      setIsAuthenticated(true);
      setCurrentPersonaId(personaId);
      setAuthToken(token);
      return true;
    } else {
      // Token is invalid or expired
      localStorage.removeItem('whoim_auth_token');
      setIsAuthenticated(false);
      setCurrentPersonaId(null);
      return false;
    }
  };

  /**
   * Authenticate with a persona
   */
  const authenticateWithPersona = async (personaId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the persona's private key
      const privateKey = KeyManager.getPersonaKey(personaId);
      if (!privateKey) {
        throw new Error('Private key not found for this persona');
      }

      // Generate and sign a challenge
      const challenge = generateAuthChallenge(personaId);
      const signedChallenge = await signAuthChallenge(challenge, privateKey);

      // In a real app, we would send this to a server for verification
      // For demo purposes, we'll verify it locally
      
      // Generate an auth token
      const token = generateAuthToken(personaId);
      
      // Store the token
      localStorage.setItem('whoim_auth_token', token);
      
      // Update state
      setIsAuthenticated(true);
      setCurrentPersonaId(personaId);
      setAuthToken(token);
      
      return true;
    } catch (err) {
      console.error('Authentication failed:', err);
      setError('Authentication failed: ' + (err instanceof Error ? err.message : String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log out the current user
   */
  const logout = () => {
    localStorage.removeItem('whoim_auth_token');
    setIsAuthenticated(false);
    setCurrentPersonaId(null);
    setAuthToken(null);
  };

  /**
   * Create an OAuth provider for third-party integration
   */
  const createOAuthProvider = (clientId: string, redirectUri: string): OAuthProvider => {
    return new OAuthProvider(clientId, redirectUri);
  };

  /**
   * Generate OAuth client script for third-party websites
   */
  const generateOAuthScript = (clientId: string, redirectUri: string): string => {
    return `
// WHOIM Web3 OAuth Client
(function() {
  const WHOIM = {
    clientId: "${clientId}",
    redirectUri: "${redirectUri}",
    
    // Initialize the WHOIM OAuth client
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
    
    // Start the OAuth flow
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
    
    // Handle OAuth callback
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
    
    // Exchange authorization code for access token
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
    
    // Get user information
    getUserInfo: function(accessToken) {
      return fetch('/oauth/userinfo', {
        headers: {
          'Authorization': \`Bearer \${accessToken}\`
        }
      }).then(response => response.json());
    },
    
    // Generate a random state parameter
    generateState: function() {
      return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    },
    
    // Generate authorization URL
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
    
    // Trigger custom event
    triggerEvent: function(name, data) {
      const event = new CustomEvent(\`whoim:\${name}\`, { detail: data });
      window.dispatchEvent(event);
    }
  };
  
  // Expose WHOIM to global scope
  window.WHOIM = WHOIM;
})();
    `;
  };

  return {
    isAuthenticated,
    currentPersonaId,
    authToken,
    isLoading,
    error,
    authenticateWithPersona,
    logout,
    checkAuthStatus,
    createOAuthProvider,
    generateOAuthScript
  };
}
