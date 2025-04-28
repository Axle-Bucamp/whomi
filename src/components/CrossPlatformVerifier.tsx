'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  getProof,
  isProofPublic,
  verifyProof,
} from '@/lib/blockchain/contractInteractions';

export default function CrossPlatformVerifier() {
  const [step, setStep] = useState(1);
  const [proofId, setProofId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingVisibility, setIsCheckingVisibility] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    personaDetails?: {
      name?: string;
      platform?: string;
      timestamp?: string;
      isPublic?: boolean;
    };
  } | null>(null);

  // Generate a verification code when component mounts
  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setVerificationCode(code);
  }, []);

  const checkProofVisibility = async () => {
    if (!proofId) return false;
    
    setIsCheckingVisibility(true);
    try {
      const isPublic = await isProofPublic(proofId);
      return isPublic;
    } catch (error) {
      console.error('Error checking proof visibility:', error);
      return false;
    } finally {
      setIsCheckingVisibility(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // First check if the proof is public
      const isPublic = await checkProofVisibility();
      
      if (!isPublic) {
        setVerificationResult({
          success: false,
          message: 'This proof is private. The owner has not made it publicly available for verification.'
        });
        setIsVerifying(false);
        return;
      }
      
      // Get the proof details
      const proofDetails = await getProof(proofId);
      
      if (!proofDetails) {
        setVerificationResult({
          success: false,
          message: 'Proof not found. Please check the Proof ID.'
        });
        setIsVerifying(false);
        return;
      }
      
      // Then verify the proof against the platform
      const isValid = await verifyProof(proofId, proofDetails.publicKey, platformId);
      
      if (isValid) {
        // Format timestamp
        const date = new Date(proofDetails.timestamp * 1000);
        const formattedDate = date.toLocaleString();
        
        setVerificationResult({
          success: true,
          message: 'Verification successful! This is the same persona across platforms.',
          personaDetails: {
            platform: platformId,
            timestamp: formattedDate,
            isPublic: true
          }
        });
        
        // Move to step 2 if verification is successful
        setStep(2);
      } else {
        setVerificationResult({
          success: false,
          message: 'Verification failed. This may not be the same persona or the platform ID may be incorrect.'
        });
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
      setVerificationResult({
        success: false,
        message: 'An error occurred during verification. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Cross-Platform Verification</h2>
      
      {step === 1 && (
        <>
          <p className="text-gray-300 mb-4">
            Verify that a persona is the same across different platforms by entering their proof ID and platform.
            <span className="block mt-1 text-yellow-400 text-sm">
              Note: This method only works with public proofs. For private proofs, use Direct Verification.
            </span>
          </p>
          
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label htmlFor="proofId" className="block text-gray-300 mb-2">Proof ID</label>
              <input
                id="proofId"
                type="text"
                value={proofId}
                onChange={(e) => setProofId(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="0x1234..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="platformId" className="block text-gray-300 mb-2">Platform ID</label>
              <input
                id="platformId"
                type="text"
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="twitter, github, etc."
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                The platform where you want to verify this persona (e.g., twitter, github, discord)
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center justify-center"
              disabled={isVerifying || isCheckingVisibility}
            >
              {isVerifying || isCheckingVisibility ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isVerifying ? 'Verifying...' : 'Checking Visibility...'}
                </>
              ) : 'Verify Identity'}
            </button>
          </form>
          
          {verificationResult && !verificationResult.success && (
            <div className="mt-6 p-4 rounded bg-red-900/50 border border-red-500 text-red-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
                <span>{verificationResult.message}</span>
              </div>
              
              {verificationResult.message.includes('private') && (
                <div className="mt-3 ml-7">
                  <p className="text-sm text-yellow-300 mb-2">
                    This proof is set to private by the owner. You can:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    <li>Ask the owner to make it public</li>
                    <li>Use Direct Verification if you have their public key</li>
                  </ul>
                  <button
                    onClick={() => {
                      const tabButtons = document.querySelectorAll('[role="tab"]');
                      const directVerificationTab = Array.from(tabButtons).find(
                        button => button.textContent?.includes('Direct Verification')
                      ) as HTMLButtonElement | undefined;
                      
                      if (directVerificationTab) {
                        directVerificationTab.click();
                      }
                    }}
                    className="mt-3 text-indigo-300 hover:text-indigo-200 text-sm underline"
                  >
                    Switch to Direct Verification
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {step === 2 && verificationResult && verificationResult.success && (
        <div className="space-y-6">
          <div className="p-4 rounded bg-green-900/50 border border-green-500 text-green-200">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span className="font-bold">{verificationResult.message}</span>
            </div>
            
            <div className="ml-7 space-y-1 text-sm">
              <p><span className="font-semibold">Platform:</span> {verificationResult.personaDetails?.platform}</p>
              <p><span className="font-semibold">Proof Created:</span> {verificationResult.personaDetails?.timestamp}</p>
              <p><span className="font-semibold">Visibility:</span> {verificationResult.personaDetails?.isPublic ? 'Public' : 'Private'}</p>
              <p><span className="font-semibold">Proof ID:</span> {proofId}</p>
            </div>
          </div>
          
          <div className="bg-indigo-900/30 border border-indigo-500 rounded p-4">
            <h3 className="font-semibold text-white mb-2">Verification Code</h3>
            <p className="text-gray-300 text-sm mb-3">
              Ask the persona to provide this code to prove they control the account:
            </p>
            <div className="bg-gray-900 p-3 rounded font-mono text-center text-xl text-indigo-400 tracking-wider">
              {verificationCode}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => {
                setStep(1);
                setVerificationResult(null);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Back
            </button>
            
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
