import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ethers, formatUnits } from "ethers";
import useEthers from "../hooks/useEthers";
import erc20Abi from "../ERC20Abi.json";

function Withdraw({ showModal }) {
  const [balance, setBalance] = useState("");
  const [amount, setAmount] = useState("");

  const isConnected = useSelector((state) => state.user.isConnected);
  const address = useSelector((state) => state.user.walletAddress);
  const RPC = useSelector((state) => state.global.rpc_one);

  const TOKEN_ADDRESS = "0x6a5f01FD554038756B107002E0ACD7d8f15A97Bc";

  const { signer } = useEthers();

  async function handleWithdraw() {
    console.log("clicked");
  }

  async function getBalance() {
    const providerr = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, providerr);
    const rawBalance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const formatted = formatUnits(rawBalance, decimals);
    setBalance(formatted);
  }

  useEffect(() => {
    getBalance();
  }, []);
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="w-full sm:w-5/6 lg:w-1/2">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-lg transition-all duration-300">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Withdraw
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Convert your <strong>WANGH</strong> into{" "}
              <strong>ANGH Native</strong>.
            </p>
          </div>

          {/* Balance Display */}
          <div className="mb-6 bg-gray-100 rounded-xl p-4 flex justify-between items-center text-sm font-medium text-gray-700 shadow-inner">
            <span>Balance</span>
            <span className="text-gray-900 font-semibold">
              {parseFloat(balance).toFixed(5)} WANGH
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 justify-between bg-gray-100 rounded-xl px-4 py-3 shadow-inner border border-gray-200 focus-within:ring-2 focus-within:ring-purple-400">
              <div className="flex items-center gap-2 text-gray-800 font-semibold text-base">
                <span>WANGH</span>
              </div>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="bg-transparent text-right text-xl sm:text-2xl font-bold outline-none border-none w-full placeholder-gray-400"
              />
            </div>
            {parseFloat(amount) > parseFloat(balance) && (
              <span className="text-red-500 text-sm">Invalid Amount!</span>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleWithdraw}
              disabled={!isConnected || parseFloat(amount) > parseFloat(balance)}
              className={`w-full  text-white py-4 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md border focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
            ${
              isConnected && parseFloat(amount) < parseFloat(balance)
                ? "bg-gradient-to-r from-[#8357E8] to-[#7c4ddb] border-purple-200 hover:scale-105 active:scale-95 hover:shadow-lg"
                : "bg-gray-400 cursor-not-allowed"
            }
          `}
            >
              Withdraw
            </button>

            {!isConnected && (
              <button
                onClick={() => showModal(true)}
                className="w-full  cursor-pointer text-white py-4 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:scale-105 active:scale-95 hover:shadow-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                style={{
                  background: "linear-gradient(to right, #8357E8, #7c4ddb)",
                }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Withdraw;
