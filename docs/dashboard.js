// dashboard.js

const CONTRACT_ADDRESS = window.MT_NOTE_ADDRESS || "0x4e752A4d38B33354a334bf95248D1498bef89319"; 
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
    // 1. Wait for MetaMask to load
    const eth = await waitForEthereum();
    
    if (!eth) {
        // If still nothing after 3 seconds, show error
        document.getElementById('status-bar').style.display = 'block';
        document.getElementById('status-bar').innerHTML = `
            <b>MetaMask not detected.</b><br>
            If you have it installed, try refreshing this page.
        `;
        return;
    }
    
    // 2. Setup Provider
    provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request access (this triggers the MetaMask popup)
    try {
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, window.MT_NOTE_ABI, signer);
        
        const address = await signer.getAddress();
        
        // Update UI
        document.getElementById('connect-btn').innerText = "Connected: " + address.slice(0,6) + "...";
        document.getElementById('connect-btn').classList.add('btn-outline');
        updateStatus("Scanning blockchain for your notes... (This might take a moment)");

        // 3. Query Events
        const filter = contract.filters.NoteLog(address);
        
        // Fetch logs
        const events = await contract.queryFilter(filter, 0, "latest");
        allEvents = events.reverse(); 
        
        renderTable(allEvents, null); // Render LOCKED initially
        
        // Change button to "Unlock"
        const btn = document.getElementById('connect-btn');
        btn.innerText = "🔓 Unlock My Notes";
        btn.className = "btn"; 
        btn.onclick = unlockNotes;
        
        updateStatus(`✅ Found ${events.length} notes. Click 'Unlock' to decrypt them.`);

    } catch (err) {
        console.error(err);
        updateStatus("❌ Connection Error: " + err.message);
    }
}

async function unlockNotes() {
    try {
        updateStatus("✍️ Please sign the message to generate your decryption key...");
        
        // 1. Get Key
        const msg = "Sign this message to unlock your MT Notes.\n\n(This does not cost gas)";
        const signature = await signer.signMessage(msg);
        
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