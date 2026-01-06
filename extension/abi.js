// abi.js
window.MT_NOTE_ABI = [
    // --- PASTE YOUR ABI ARRAY HERE ---
    {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "txHash",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "ipfsCid",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "name": "NoteLog",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_txHash",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "_ipfsCid",
            "type": "string"
          }
        ],
        "name": "addNote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_user",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "_txHash",
            "type": "bytes32"
          }
        ],
        "name": "getNote",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
  ];
  
  // YOUR DEPLOYED ADDRESS
  window.MT_NOTE_ADDRESS = "0x4e752A4d38B33354a334bf95248D1498bef89319";