// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title mt_note (Mantle Transaction Note)
 * @notice A decentralized registry linking Transaction Hashes to IPFS CIDs.
 * @dev Optimized for the Mantle Network.
 */
contract mt_note {
    
    // --- Events ---
    // We emit an event so your Chrome Extension can easily find all notes
    // created by a specific user without needing to loop through arrays.
    event NoteLog(
        address indexed user, 
        bytes32 indexed txHash, 
        string ipfsCid, 
        uint256 timestamp
    );

    // --- State Variables ---
    // Mapping: User Address -> Transaction Hash -> IPFS CID
    mapping(address => mapping(bytes32 => string)) private userNotes;

    // --- Functions ---

    /**
     * @notice Save a note link to the blockchain.
     * @param _txHash The hash of the transaction you are annotating.
     * @param _ipfsCid The IPFS ID where the encrypted text is stored.
     */
    function addNote(bytes32 _txHash, string calldata _ipfsCid) external {
        // Validation: Don't allow empty CIDs (save gas if mistake)
        require(bytes(_ipfsCid).length > 0, "CID cannot be empty");

        // Update state
        userNotes[msg.sender][_txHash] = _ipfsCid;

        // Emit event for the frontend/indexer
        emit NoteLog(msg.sender, _txHash, _ipfsCid, block.timestamp);
    }

    /**
     * @notice Retrieve a note for a specific transaction.
     * @param _user The address of the note creator.
     * @param _txHash The transaction hash to look up.
     */
    function getNote(address _user, bytes32 _txHash) external view returns (string memory) {
        return userNotes[_user][_txHash];
    }
}