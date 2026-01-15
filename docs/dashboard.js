// dashboard.js

const CONTRACT_ADDRESS = window.MT_NOTE_ADDRESS || "0xb04D5E5234D5556b5B46600414763ff3829199fd"; 
let provider, signer, contract;
let allEvents = []; // Store raw events here

document.getElementById('connect-btn').onclick = initDashboard;

// --- Polling Helper to wait for MetaMask ---
async function waitForEthereum() {
    if (window.ethereum) return window.ethereum;
    
    console.log("Waiting for MetaMask to inject...");
    // Check every 100ms for up to 3 seconds
    for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (window.ethereum) return window.ethereum;
    }
    return null;
}

async function initDashboard() {
    // 1. Wait for MetaMask
    const eth = await waitForEthereum();
    if (!eth) return showMetaMaskError();

    // 2. Setup Provider
    provider = new ethers.BrowserProvider(window.ethereum);
    
    try {
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, window.MT_NOTE_ABI, signer);
        
        const address = await signer.getAddress();

        // Get the current block number first
        const currentBlock = await provider.getBlockNumber();
        
        // We only scan the last 5,000 blocks to stay under the 10k limit
        // (This covers about ~2 hours of history, perfect for a demo)
        const startBlock = currentBlock - 5000; 

        console.log(`Scanning from block ${startBlock} to ${currentBlock}`);

        const filter = contract.filters.NoteLog(address);
        
        // Pass 'startBlock' instead of 0
        const events = await contract.queryFilter(filter, startBlock, "latest");
        allEvents = events.reverse(); 
        
        // 3. Render table and update stats based on fetched events
        renderTable(allEvents, null); // Render LOCKED initially

        // 4. Update UI statistics
        const totalNotes = allEvents.length;
        document.getElementById('stat-count').innerText = totalNotes;
        
        if (totalNotes > 0) {
            // Get the block number of the most recent event (first in array since we reversed it)
            const lastBlock = allEvents[0].blockNumber;
            document.getElementById('stat-last').innerText = "Block " + lastBlock;
        } else {
            document.getElementById('stat-last').innerText = "None";
        }
        
        // Change button to "Unlock"
        const btn = document.getElementById('connect-btn');
        btn.innerText = "Unlock My Notes";
        btn.className = "btn"; 
        btn.onclick = unlockNotes;
        
        updateStatus(`Found ${events.length} notes in the last 5,000 blocks.`);

    } catch (err) {
        console.error(err);
        updateStatus("Connection Error: " + (err.reason || err.message));
    }
}

async function unlockNotes() {
    try {
        updateStatus("✍️ Please sign the message to generate your decryption key...");
        
        // 1. Get Key
        const msg = "UNLOCK_MT_NOTE";
        const signature = await signer.signMessage(msg);

        // Debugging: Print the key to console to verify
        console.log("Generated Key:", signature);
        
        // 2. Re-render Table with Key
        updateStatus("🔓 Decrypting...");
        renderTable(allEvents, signature); // Pass the key this time
        
        // 3. Update UI
        document.getElementById('connect-btn').style.display = 'none';
        updateStatus("✨ Ledger Unlocked. All data visible.");
        
    } catch (err) {
        alert("Unlock failed: " + err.message);
    }
}

function renderTable(events, key) {
    const tbody = document.getElementById('ledger-body');
    tbody.innerHTML = ""; // Clear current rows

    if (events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No notes found for this wallet.</td></tr>`;
        return;
    }

    events.forEach(event => {
        const txHash = event.args.txHash;
        const rawNote = event.args.ipfsCid; // In our 'Lite' version this is the text/cipher
        const blockTime = event.args.timestamp; // We added this to the contract? 
        // Wait, did we add timestamp to the event in Step 2? 
        // If your contract version doesn't have timestamp in the event, we can't show Date easily without fetching block.
        // For Hackathon speed, let's just show "Block " + event.blockNumber if timestamp is missing.
        
        let displayDate = "Block " + event.blockNumber;
        
        let displayNote = "";
        let isEncrypted = rawNote.startsWith("enc:");

        if (isEncrypted) {
            if (key) {
                // Try to decrypt
                const cipher = rawNote.replace("enc:", "");
                const plain = decrypt(cipher, key);
                displayNote = plain ? plain : "⚠️ Decryption Failed";
            } else {
                displayNote = "🔒 <i>Encrypted Content</i>";
            }
        } else {
            // Legacy/Plain text
            displayNote = rawNote.replace("text:", "");
        }

        // Format Tx Hash link
        const shortHash = txHash.slice(0, 6) + "..." + txHash.slice(-4);
        const link = `https://sepolia.mantlescan.xyz/tx/${txHash}`;

        const row = `
            <tr>
                <td style="color:#666;">${displayDate}</td>
                <td><a href="${link}" target="_blank">${shortHash}</a></td>
                <td style="color: ${key || !isEncrypted ? '#fff' : '#666'}">${displayNote}</td>
                <td>
                    <button style="background:none; border:none; color:#666; cursor:pointer;">✏️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function decrypt(ciphertext, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) { return null; }
}

function updateStatus(msg) {
    const el = document.getElementById('status-bar');
    el.style.display = 'block';
    el.innerText = msg;
}