// inpage.js

// Ensure the address is set (Safety check)
// Replace with your ACTUAL contract address if different
const CONTRACT_ADDRESS = window.MT_NOTE_ADDRESS || "0x4e752A4d38B33354a334bf95248D1498bef89319"; 

async function init() {
    console.log("😈 MT Note: Initializing...");

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
                😈 <span style="font-weight: 700;">MT Note</span>
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
    const saveBtn = document.getElementById('mt-save');
    saveBtn.onclick = async () => {
        await saveNote(txHash);
    };
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

// --- Action: Save Note ---
async function saveNote(txHash) {
    const input = document.getElementById('mt-input');
    const status = document.getElementById('mt-status');
    const noteText = input.value;

    if (!noteText) return alert("Write something first!");

    try {
        status.innerText = "Waiting for approval...";
        status.style.color = "#fbbf24"; // Yellow

        const contract = await getContract();

        // 1. Prepare Data
        // TODO: In the next step, we will encrypt this!
        // For now: Text -> Fake CID to prove connection
        const fakeCid = "text:" + noteText; 

        // 2. Send Transaction
        status.innerText = "Check your wallet...";
        const tx = await contract.addNote(txHash, fakeCid);
        
        console.log("Tx Sent:", tx.hash);
        status.innerText = "Mining...";
        
        // 3. Wait for Receipt
        await tx.wait();
        
        status.innerText = "Saved to Blockchain! 🚀";
        status.style.color = "#65b3ad"; // Mantle Green
        
        // Update UI
        input.value = "";
        await checkExistingNote(txHash);

    } catch (err) {
        console.error(err);
        status.innerText = "Error: " + (err.shortMessage || err.message);
        status.style.color = "#ef4444"; // Red
    }
}

// --- Action: Read Note ---
async function checkExistingNote(txHash) {
    if (!window.ethereum) return;

    try {
        // Read-only provider (no popup needed usually, but simplest to reuse)
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, window.MT_NOTE_ABI, provider);
        
        // We need an address to query 'userNotes[address][txHash]'
        // Since the mapping is private/nested, we used 'getNote(user, txHash)'
        // But we need the CURRENT user's address. 
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) return; // Not connected yet
        
        const userAddress = accounts[0].address;
        const note = await contract.getNote(userAddress, txHash);

        if (note && note.length > 0) {
            const display = document.getElementById('mt-display');
            display.style.display = "block";
            // Remove the 'text:' prefix we added
            display.innerText = "📝 Found Note: " + note.replace("text:", "");
        }
    } catch (err) {
        console.log("Could not fetch notes (probably not connected yet).");
    }
}

// Wait for ethers.js to load, then start
setTimeout(init, 1000);