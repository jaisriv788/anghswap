<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bridge UI</title>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .card { background: #fff; padding: 20px; margin-bottom: 20px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
    h2 { margin-top: 0; }
    input, select, button { padding: 8px; margin: 5px 0; width: 100%; border-radius: 5px; border: 1px solid #ccc; }
    button { cursor: pointer; background: #007bff; color: #fff; border: none; }
    button:hover { background: #0056b3; }
    pre { background: #222; color: #0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>

  <h1>Cross-Chain Bridge</h1>

  <div class="card">
    <h2>1. Connect Wallet</h2>
    <button id="connectWallet">Connect MetaMask</button>
    <p>Connected Account: <span id="account">Not connected</span></p>
    <p>Network: <span id="network">-</span></p>
  </div>

  <div class="card">
    <h2>2. Deposit</h2>
    <label>Chain:</label>
    <select id="depositChain">
      <option value="opbnb">opBNB (USDT only)</option>
      <option value="angh">ANGH (USDT, Zenix, Native)</option>
    </select>

    <label>Token:</label>
    <select id="depositToken">
      <option value="usdt">USDT</option>
      <option value="zenix">Zenix</option>
      <option value="native">Native Coin</option>
    </select>

    <label>Amount:</label>
    <input type="text" id="depositAmount" placeholder="Enter amount" />

    <button id="depositBtn">Deposit</button>
    <pre id="depositLog"></pre>
  </div>

  <div class="card">
    <h2>3. Claim from Other Chain</h2>
    <label>Source Chain:</label>
    <select id="srcChain">
      <option value="opbnb">opBNB</option>
      <option value="angh">ANGH</option>
    </select>

    <label>Destination Chain:</label>
    <select id="destChain">
      <option value="angh">ANGH</option>
      <option value="opbnb">opBNB</option>
    </select>

    <label>Source Tx Hash:</label>
    <input type="text" id="srcTxHash" placeholder="0x..." />

    <label>Recipient:</label>
    <input type="text" id="recipient" placeholder="Your wallet address" />

    <button id="claimBtn">Claim</button>
    <pre id="claimLog"></pre>
  </div>

<script>
const relayerUrl = "http://anghswap.info:3535"; // change to your deployed Node API

// ====== Contract addresses (replace with your deployed addresses) ======
const OPBNB_BRIDGE = "0xf89Eb589dA6A5ce35e70742F35d2d6d87D25c97E"; 
const ANGH_BRIDGE = "0x0b97Dad15cE3A22f5cAa415EFc2AE5e1c6f18408"; 
const USDT_OPBNB = "0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3"; 
const USDT_ANGH  = "0xd1b7916d20F3b9D439B66AF25FC45f6A28c157d0"; 
const ZENIX_ANGH = "0x447c7dBEAB63Ca1813839d53C51EACaF2b09f14F"; 

// Minimal ABIs
const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const opBridgeAbi = [
  "function deposit(uint256 amount) external",
  "function claim(uint256 srcChainId, bytes32 srcTxHash, address to, uint256 amount, bytes signature) external"
];

const anghBridgeAbi = [
  "function depositToken(address token, uint256 amount) external",
  "function depositNative() external payable",
  "function claim(uint256 srcChainId, bytes32 srcTxHash, address payable to, address token, uint256 amount, bytes signature) external"
];

// ====== State ======
let provider, signer, account;

// ====== Wallet connect ======
$("#connectWallet").on("click", async function() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    account = await signer.getAddress();
    const network = await provider.getNetwork();
    $("#account").text(account);
    $("#network").text(network.name + " (" + network.chainId + ")");
  } else {
    alert("MetaMask not found");
  }
});

// ====== Deposit ======
$("#depositBtn").on("click", async function() {
  try {
    const chain = $("#depositChain").val();
    const token = $("#depositToken").val();
    const amount = $("#depositAmount").val();
    const value = ethers.utils.parseUnits(amount, 18); // default 18 decimals

    if (chain === "opbnb") {
      if (token !== "usdt") return alert("opBNB only supports USDT");
      const bridge = new ethers.Contract(OPBNB_BRIDGE, opBridgeAbi, signer);
      const usdt = new ethers.Contract(USDT_OPBNB, erc20Abi, signer);
      const allowance = await usdt.allowance(account, OPBNB_BRIDGE);
      if (allowance.lt(value)) {        
        await usdt.approve(OPBNB_BRIDGE, value);
      }
      alert(value);
      const tx = await bridge.deposit(value);
      $("#depositLog").text("Deposit sent: " + tx.hash);

    } else {
      const bridge = new ethers.Contract(ANGH_BRIDGE, anghBridgeAbi, signer);

      if (token === "native") {
        const tx = await bridge.depositNative({ value });
        $("#depositLog").text("Native deposit sent: " + tx.hash);
      } else {
        const tokenAddr = token === "usdt" ? USDT_ANGH : ZENIX_ANGH;
        const tokenCtr = new ethers.Contract(tokenAddr, erc20Abi, signer);
        const allowance = await tokenCtr.allowance(account, ANGH_BRIDGE);
        if (allowance.lt(value)) {
          await tokenCtr.approve(ANGH_BRIDGE, value);
        }
        const tx = await bridge.depositToken(tokenAddr, value);
        $("#depositLog").text("Token deposit sent: " + tx.hash);
      }
    }
  } catch (err) {
    console.error(err);
    $("#depositLog").text("Error: " + err.message);
  }
});

// ====== Claim ======
$("#claimBtn").on("click", async function() {
  // try {
    const srcChain = $("#srcChain").val();
    const destChain = $("#destChain").val();
    const txHash = $("#srcTxHash").val().trim();
    const recipient = $("#recipient").val().trim();
    // const desiredToken = '0xd1b7916d20F3b9D439B66AF25FC45f6A28c157d0';
    const desiredToken = ethers.constants.AddressZero;

    const res = await fetch(relayerUrl + "/verify-and-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srcChain, txHash, destChain,desiredToken, recipient })
    });
    const data = await res.json();
    if (!data.ok) {
      $("#claimLog").text("Relayer error: " + JSON.stringify(data));
      return;
    }

    $("#claimLog").text("Got signature: " + data.signature);

    // user can now call claim on destChain
    alert(destChain);
    if (destChain === "opbnb") {
      const bridge = new ethers.Contract(OPBNB_BRIDGE, opBridgeAbi, signer);
      const amount = ethers.utils.parseUnits("0.1", 18);
      const tx = await bridge.claim(
        270504, // ANGH chainId (set correct)
        txHash,
        recipient,
        amount, // fix amount (better to get from relayer `decoded.amount`)
        data.signature
      );
      $("#claimLog").append("\nClaim tx sent: " + tx.hash);
    } else {
        const bridge = new ethers.Contract(ANGH_BRIDGE, anghBridgeAbi, signer);
        // const tokenAddr = '0xd1b7916d20F3b9D439B66AF25FC45f6A28c157d0' || ethers.constants.AddressZero; 
        const tokenAddr = ethers.constants.AddressZero; 
        const amount = ethers.utils.parseUnits("0.1", 18); // 0.1 native coin
        alert(amount);
        alert(tokenAddr);
        alert(recipient);
        alert(data.signature);
        const tx = await bridge.claim(
          204,
          ethers.utils.hexZeroPad(txHash, 32),
          recipient,
          tokenAddr,
          amount,
          data.signature,
          { gasLimit: 600000 } 
        );

        $("#claimLog").append("\nClaim tx sent: " + tx.hash);
    } 

  // } catch (err) {
  //   console.error(err);
  //   $("#claimLog").text("Error: " + err.message);
  // }
});
</script>
</body>
</html>
