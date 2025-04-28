// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title WHOIM Identity Proof Contract
 * @dev Smart contract for verifying identity proofs with zero-cost read operations
 */
contract WHOIMIdentityProof {
    struct Proof {
        address owner;
        string publicKey;
        string proofHash;
        bool isPublic;
        uint256 timestamp;
        string platformId;
    }
    
    // Mapping from proofId to Proof
    mapping(bytes32 => Proof) private proofs;
    
    // Mapping from address to array of proofIds
    mapping(address => bytes32[]) private userProofs;
    
    // Events
    event ProofCreated(bytes32 indexed proofId, address indexed owner, string platformId);
    event ProofUpdated(bytes32 indexed proofId, bool isPublic);
    
    /**
     * @dev Create a new identity proof
     * @param publicKey The PGP public key associated with the identity
     * @param proofHash The hash of the proof data
     * @param isPublic Whether the proof is publicly visible
     * @param platformId The platform identifier for cross-platform verification
     * @return proofId The unique identifier for the proof
     */
    function createProof(
        string memory publicKey,
        string memory proofHash,
        bool isPublic,
        string memory platformId
    ) public returns (bytes32) {
        bytes32 proofId = keccak256(abi.encodePacked(msg.sender, publicKey, block.timestamp));
        
        Proof memory newProof = Proof({
            owner: msg.sender,
            publicKey: publicKey,
            proofHash: proofHash,
            isPublic: isPublic,
            timestamp: block.timestamp,
            platformId: platformId
        });
        
        proofs[proofId] = newProof;
        userProofs[msg.sender].push(proofId);
        
        emit ProofCreated(proofId, msg.sender, platformId);
        
        return proofId;
    }
    
    /**
     * @dev Update the visibility of a proof
     * @param proofId The unique identifier for the proof
     * @param isPublic The new visibility status
     */
    function updateProofVisibility(bytes32 proofId, bool isPublic) public {
        require(proofs[proofId].owner == msg.sender, "Not the owner of this proof");
        
        proofs[proofId].isPublic = isPublic;
        
        emit ProofUpdated(proofId, isPublic);
    }
    
    /**
     * @dev Get a proof by its ID (zero-cost read operation)
     * @param proofId The unique identifier for the proof
     * @return owner The address of the proof owner
     * @return publicKey The PGP public key
     * @return proofHash The hash of the proof data
     * @return isPublic Whether the proof is publicly visible
     * @return timestamp When the proof was created
     * @return platformId The platform identifier
     */
    function getProof(bytes32 proofId) public view returns (
        address owner,
        string memory publicKey,
        string memory proofHash,
        bool isPublic,
        uint256 timestamp,
        string memory platformId
    ) {
        Proof memory proof = proofs[proofId];
        
        // Only return data if the proof is public or the caller is the owner
        require(proof.isPublic || proof.owner == msg.sender, "Not authorized to view this proof");
        
        return (
            proof.owner,
            proof.publicKey,
            proof.proofHash,
            proof.isPublic,
            proof.timestamp,
            proof.platformId
        );
    }
    
    /**
     * @dev Verify if a proof exists and matches the provided data
     * @param proofId The unique identifier for the proof
     * @param publicKey The PGP public key to verify
     * @param platformId The platform identifier to verify
     * @return isValid Whether the proof is valid
     */
    function verifyProof(
        bytes32 proofId,
        string memory publicKey,
        string memory platformId
    ) public view returns (bool isValid) {
        Proof memory proof = proofs[proofId];
        
        // Proof must exist and be public or owned by caller
        if (!proof.isPublic && proof.owner != msg.sender) {
            return false;
        }
        
        // Verify the public key and platform ID match
        return (
            keccak256(abi.encodePacked(proof.publicKey)) == keccak256(abi.encodePacked(publicKey)) &&
            keccak256(abi.encodePacked(proof.platformId)) == keccak256(abi.encodePacked(platformId))
        );
    }
    
    /**
     * @dev Get all proofs for a user (zero-cost read operation)
     * @param user The address of the user
     * @return proofIds Array of proof IDs belonging to the user
     */
    function getUserProofs(address user) public view returns (bytes32[] memory) {
        return userProofs[user];
    }
    
    /**
     * @dev Check if a proof is public (zero-cost read operation)
     * @param proofId The unique identifier for the proof
     * @return isPublic Whether the proof is publicly visible
     */
    function isProofPublic(bytes32 proofId) public view returns (bool) {
        return proofs[proofId].isPublic;
    }
}
