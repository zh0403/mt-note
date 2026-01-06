const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("mt_note Contract", function () {
  let mt_note;
  let owner;

  // Runs before every test
  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const mt_noteFactory = await ethers.getContractFactory("mt_note");
    mt_note = await mt_noteFactory.deploy();
  });

  it("Should save and retrieve a note correctly", async function () {
    // 1. Mock Data
    const fakeTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // 32 bytes
    const fakeIpfsCid = "QmHashOfYourEncryptedNote";

    // 2. Add the note
    console.log("📝 Adding note...");
    const tx = await mt_note.addNote(fakeTxHash, fakeIpfsCid);
    await tx.wait(); // Wait for block to be mined

    // 3. Verify it exists
    console.log("🔍 Retrieving note...");
    const storedCid = await mt_note.getNote(owner.address, fakeTxHash);
    
    expect(storedCid).to.equal(fakeIpfsCid);
    console.log("✅ Success! Retrieved CID matches:", storedCid);
  });

  it("Should emit an event when a note is added", async function () {
    const fakeTxHash = ethers.id("some transaction");
    const fakeIpfsCid = "QmAnotherHash";

    await expect(mt_note.addNote(fakeTxHash, fakeIpfsCid))
      .to.emit(mt_note, "NoteLog")
      .withArgs(owner.address, fakeTxHash, fakeIpfsCid, (val) => val > 0); // timestamp check
  });
});