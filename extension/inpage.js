// inpage.js

// Ensure the address is set (Safety check)
// Replace with your ACTUAL contract address if different
const CONTRACT_ADDRESS = window.MT_NOTE_ADDRESS || "0x4e752A4d38B33354a334bf95248D1498bef89319";
let GLOBAL_KEY = null; // We store the key here after they sign once

// --- HELPER: Derive Key from Signature ---
async function getEncryptionKey(signer) {
    if (GLOBAL_KEY) return GLOBAL_KEY;

    // 1. Ask user to sign a static message
    // This signature acts as their "password" but they don't have to remember it!
    const msg = "Sign this message to log into MT Note.\n\n(This does not cost gas)";
    const signature = await signer.signMessage(msg);

    // 2. Turn that signature into a usable AES key
    GLOBAL_KEY = signature; 
    return GLOBAL_KEY;
}

// --- HELPER: Encrypt/Decrypt ---
function encryptData(text, key) {
    if (!text) return "";
    return CryptoJS.AES.encrypt(text, key).toString();
}

function decryptData(ciphertext, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return null; // Failed to decrypt (wrong key or not encrypted)
    }
}

async function init() {
    console.log("📕 MT Note: Initializing...");

    // 1. Get Transaction Hash from URL
    const path = window.location.pathname.split('/');
    const txHash = path[path.length - 1];

    // Only run on actual transaction pages
    if (!txHash.startsWith("0x")) return;

    // 2. Inject UI Container
    const container = document.createElement('div');
    container.style = `
        background: #0f1214; 
        color: #fff; 
        padding: 20px; 
        margin: 20px 0; 
        border-radius: 12px; 
        border: 1px solid #333;
        font-family: 'Inter', sans-serif;
    `;
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                📕 <span style="font-weight: 700;">MT Note</span>
            </h3>
            <span id="mt-status" style="font-size: 12px; color: #888;">Ready</span>
        </div>
        
        <div style="display: flex; gap: 10px;">
            <input type="text" id="mt-input" placeholder="What was this transaction for? (e.g. Lunch, Dev Payment)" 
                style="flex-grow: 1; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1d1f; color: white;">
            
            <button id="mt-save" 
                style="cursor: pointer; background: #65b3ad; color: black; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; transition: all 0.2s;">
                Save
            </button>
        </div>
        <div id="mt-display" style="display:none; margin-top: 15px; padding: 10px; background: #1a1d1f; border-radius: 6px; color: #65b3ad; border: 1px solid #65b3ad;"></div>
    `;

    // 3. Insert into Page
    // Try to find the best spot on MantleScan
    const anchor = document.querySelector('#ContentPlaceHolder1_maintable') || document.querySelector('.card');
    if (anchor) {
        anchor.parentNode.insertBefore(container, anchor);
    }

    // 4. Check if note already exists
    await checkExistingNote(txHash);

    // 5. Add Click Listener
    document.getElementById('mt-save').onclick = async () => {
        await saveNote(txHash);
    };
    
    // Auto-check (this will show "Encrypted" status first)
    await checkExistingNote(txHash);
}

// --- Action: Save Encrypted Note ---
async function saveNote(txHash) {
    const input = document.getElementById('mt-input');
    const status = document.getElementById('mt-status');
    const noteText = input.value;

    if (!noteText) return alert("Write something first!");

    try {
        status.innerText = "Please sign to encrypt...";
        const contract = await getContract();
        
        // 1. Get the Key (MetaMask Popup #1)
        // We need the signer from the contract object
        const key = await getEncryptionKey(contract.runner);

        // 2. Encrypt
        status.innerText = "Encrypting...";
        const encryptedCid = "enc:" + encryptData(noteText, key);
        console.log("Encrypted Data:", encryptedCid);

        // 3. Save to Blockchain (MetaMask Popup #2 - Gas Fee)
        status.innerText = "Check your wallet...";
        const tx = await contract.addNote(txHash, encryptedCid);
        
        status.innerText = "Saving...";
        await tx.wait();
        
        status.innerText = "Saved & Secured! 🔒";
        input.value = "";
        
        // Refresh display
        await checkExistingNote(txHash);

    } catch (err) {
        console.error(err);
        status.innerText = "Error: " + err.message;
    }
}

// --- Action: Read Encrypted Note ---
async function checkExistingNote(txHash) {
    if (!window.ethereum) return;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, window.MT_NOTE_ABI, provider);
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) return;
        
        const userAddress = accounts[0].address;
        const note = await contract.getNote(userAddress, txHash);

        if (note && note.length > 0) {
            const display = document.getElementById('mt-display');
            display.style.display = "block";

            // CHECK: Is it encrypted?
            if (note.startsWith("enc:")) {
                const rawCipher = note.replace("enc:", "");
                
                // If we already have the key (from saving), decrypt immediately
                if (GLOBAL_KEY) {
                    const plain = decryptData(rawCipher, GLOBAL_KEY);
                    display.innerText = "🔓 Decrypted: " + plain;
                } else {
                    // If no key yet, show a button to Unlock
                    display.innerHTML = `
                        🔒 <b>Encrypted Note Found</b><br>
                        <button id="mt-unlock-btn" style="margin-top:5px; cursor:pointer; background:#333; color:white; border:none; padding:5px 10px; border-radius:4px;">
                            Unlock to Read
                        </button>
                    `;
                    // Add listener to the new button
                    setTimeout(() => {
                        const btn = document.getElementById('mt-unlock-btn');
                        if (btn) btn.onclick = async () => {
                            const provider = new ethers.BrowserProvider(window.ethereum);
                            const signer = await provider.getSigner();
                            const key = await getEncryptionKey(signer);
                            const plain = decryptData(rawCipher, key);
                            display.innerText = "🔓 Decrypted: " + plain;
                        };
                    }, 500);
                }
            } else {
                // Legacy (Plain text)
                display.innerText = "📝 Note: " + note.replace("text:", "");
            }
        }
    } catch (err) {
        console.log("Error fetching note:", err);
    }
}

// --- Helper: Get Contract ---
async function getContract() {
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        throw new Error("No Wallet Found");
    }

    // Connect to Browser Provider (MetaMask)
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request Account Access
    await provider.send("eth_requestAccounts", []);
    
    // Check Network (Chain ID 5003 is Mantle Sepolia)
    const network = await provider.getNetwork();
    if (network.chainId !== 5003n) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x138b' }], // 5003 in hex
            });
        } catch (e) {
            alert("Please switch MetaMask to Mantle Sepolia Testnet!");
            throw e;
        }
    }

    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, window.MT_NOTE_ABI, signer);
}

// Wait for ethers.js to load, then start
setTimeout(init, 1000);