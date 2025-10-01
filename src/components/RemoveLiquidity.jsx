import { formatUnits, parseUnits } from "ethers";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import lpAbi from "../pairAbi.json";
import routerAbi from "../routerAbi.json";
import useEthers from "../hooks/useEthers";
import { useSelector, useDispatch } from "react-redux";
import {
  isSuccessModalVisible,
  isErrorModalVisible,
  setSuccessMessage,
  setErrorMessage,
} from "../redux/slice/modalSlice";
// import tokenAbi from "../ERC20Abi.json";

function RemoveLiquidity({ setShowRemoveModal, setClickedPool, data }) {
  const dispatch = useDispatch();

  const [removeAmount, setRemoveAmount] = useState(25);
  const [actualValue, setActualValue] = useState("0");
  const [tokenOneAmount, setTokenOneAmount] = useState(0);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(0);
  const [loading, setloading] = useState(false);

  const { signer } = useEthers();
  const pairAddress = data.lpToken;

  const showError = (msg) => {
    dispatch(setErrorMessage(msg));
    dispatch(isErrorModalVisible(true));
    setTimeout(() => {
      dispatch(setErrorMessage(""));
      dispatch(isErrorModalVisible(false));
    }, 1500);
  };

  const DEAD_LINE = useSelector(
    (state) => state.transaction.transactionDeadline
  );
  const SILP_PAGE = useSelector((state) => state.transaction.slippageTolerance);

  const ROUTER_ADDRESS = useSelector((state) => state.global.routerAddress);
  const address = useSelector((state) => state.user.walletAddress);

  async function calculateRemoveAmount() {
    const originalValue = parseUnits(data.userLP, 18); // BigInt
    const removeAmt = (originalValue * BigInt(removeAmount)) / BigInt(100);
    const bigValue = formatUnits(removeAmt, 18);
    setActualValue(bigValue);
    // console.log({ originalValue, removeAmt, bigValue });
  }

  useEffect(() => {
    if (removeAmount) calculateRemoveAmount();

    console.log(pairAddress);
  }, [removeAmount]);

  async function calculateReceiveAmount() {
    const userLP = parseUnits(actualValue, 18);
    const amount0 = (data.reserve0 * userLP) / data.totalSupply;
    const amount1 = (data.reserve1 * userLP) / data.totalSupply;
    const token0 = formatUnits(amount0, data.tokenA.decimal);
    const token1 = formatUnits(amount1, data.tokenB.decimal);
    setTokenOneAmount(token0);
    setTokenTwoAmount(token1);
  }

  useEffect(() => {
    // console.log(data);
    calculateReceiveAmount();
  }, [actualValue]);

  async function handleRemoveLiquidity() {
    if (SILP_PAGE < 0.1 || DEAD_LINE < 1) {
      showError("Either Slippage Or Transaction Deadline Is Low!");
      return;
    }

    if (SILP_PAGE > 5 && SILP_PAGE < 50) {
      showError("Slippage exceeds 5%. Your transaction may be frontrun.");
      return;
    }

    if (SILP_PAGE >= 50) {
      showError("Invalid: Slippage cannot exceed 50%!");
      return;
    }

    if (DEAD_LINE > 10) {
      showError("Invalid: Deadline cannot exceed 10 min!");
      return;
    }

    try {
      setloading(true);
      // console.log({ pairAddress, lpAbi, signer });
      const lpToken = new ethers.Contract(pairAddress, lpAbi, signer);
      const liquidity = parseUnits(actualValue, 18);

      const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);
      const amountAMin = 0;
      const amountBMin = 0;
      const to = address;
      const tokenA = data.tokenA.token;
      const tokenB = data.tokenB.token;
      const deadline = Math.floor(Date.now() / 1000) + 60 * DEAD_LINE;

      console.log("Approving LP tokens...");
      const tx2 = await lpToken.approve(ROUTER_ADDRESS, liquidity);
      await tx2.wait();
      console.log("LP tokens approved");

      // const tokenContract = new ethers.Contract(tokenB, tokenAbi, provider);
      // const balance = await tokenContract.balanceOf(address);
      // console.log("Token balance:", formatUnits(balance, 18));

      // const allowance = await lpToken.allowance(address, ROUTER_ADDRESS);
      // console.log("Allowance:", formatUnits(allowance, 18));

      // console.log({ tokenA, tokenB });
      let tx;

      // if (
      //   tokenA.toLowerCase() ==
      //   "0x6a5f01FD554038756B107002E0ACD7d8f15A97Bc".toLowerCase()
      // ) {
      //   console.log({
      //     tokenB,
      //     liquidity,
      //     amountAMin,
      //     amountBMin,
      //     to,
      //     deadline,
      //   });
      //   tx = await router.removeLiquidityWANGH(
      //     tokenB,
      //     liquidity,
      //     amountAMin,
      //     amountBMin,
      //     to,
      //     deadline,
      //     { gasLimit: 3000000 }
      //   );
      // } else if (
      //   tokenB.toLowerCase() ==
      //   "0x6a5f01FD554038756B107002E0ACD7d8f15A97Bc".toLowerCase()
      // ) {
      //   console.log({
      //     tokenB,
      //     liquidity,
      //     amountAMin,
      //     amountBMin,
      //     to,
      //     deadline,
      //   });

      //   tx = await router.removeLiquidityWANGH(
      //     tokenA,
      //     liquidity,
      //     amountAMin,
      //     amountBMin,
      //     to,
      //     deadline,
      //     { gasLimit: 3000000 }
      //   );
      // } else {
      tx = await router.removeLiquidity(
        tokenA,
        tokenB,
        liquidity,
        amountAMin,
        amountBMin,
        to,
        deadline
      );
      // }

      const receipt = await tx.wait();
      console.log("Removed liquidity:", receipt);
      dispatch(setSuccessMessage("Liquidity Removed!"));
      dispatch(isSuccessModalVisible(true));
      setTimeout(() => {
        dispatch(setSuccessMessage(""));
        dispatch(isSuccessModalVisible(false));
      }, 1500);
    } catch (error) {
      console.log(error);
      showError("Transaction failed: Unable to remove liquidity!");
    } finally {
      setShowRemoveModal(false);
      setloading(false);
    }
  }

  return (
    <div
      onClick={() => {
        if (!loading) setShowRemoveModal(false);
      }}
      className="fixed z-30 px-2 top-0 h-screen bg-black/60 backdrop-blur-sm inset-0 flex justify-center items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="space-y-5 relative bg-white w-full sm:w-9/12 lg:w-5/12 p-6 
               rounded-2xl shadow-xl border border-gray-100"
      >
        <X
          size={16}
          onClick={() => {
            setShowRemoveModal(false);
            setClickedPool(null);
          }}
          className="cursor-pointer absolute right-4 top-4 text-gray-400 hover:text-gray-700 transition"
        />

        {/* Header */}
        <div className="flex gap-3 items-center">
          <div className="gap-1 hidden sm:flex">
            {data.iconA ? (
              <img
                className="h-10 w-10 object-cover bg-gray-200 rounded-full border border-gray-300 shadow-sm"
                src={data.iconA}
              />
            ) : (
              <div className="h-10 w-10 font-semibold text-lg flex justify-center items-center object-cover bg-gray-200 rounded-full border border-gray-300 shadow-sm -ml-2">
                {data.tokenA.symbol[0]}
              </div>
            )}
            {data.iconB ? (
              <img
                className="h-10 w-10 object-cover bg-gray-200 rounded-full border border-gray-300 shadow-sm -ml-2"
                src={data.iconB}
              />
            ) : (
              <div className="h-10 w-10 object-cover font-semibold text-lg flex justify-center items-center bg-gray-200 rounded-full border border-gray-300 shadow-sm -ml-2">
                {data.tokenB.symbol[0]}
              </div>
            )}
          </div>
          <div className="font-bold text-lg text-gray-900 flex flex-col justify-center">
            <div>Remove {data.pair} Token</div>
            <div className="text-xs font-medium text-gray-500">
              To receive {data.tokenA.symbol} and {data.tokenB.symbol}
            </div>
          </div>
        </div>

        {/* Balance */}
        <span className="font-semibold text-gray-700">Balance Amount</span>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-gray-800">
                {data.pair}
              </span>
            </div>
            <div className="text-gray-900 font-semibold">
              ~{parseFloat(data.userLP).toFixed(8)} LP
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-gray-800">Address</span>
            </div>
            <div className="text-gray-900 font-semibold text-xs">{pairAddress}</div>
          </div>
        </div>

        {/* Remove Amount */}
        <span className="font-semibold text-gray-700">Remove Amount</span>
        <div className="flex flex-col">
          <div className="flex gap-6 mt-1 sm:gap-3 md:flex-row flex-col">
            <div className="flex items-center gap-2">
              {[25, 50, 75, 100].map((val) => (
                <span
                  key={val}
                  onClick={() => setRemoveAmount(val)}
                  className={`${
                    removeAmount == val
                      ? "bg-[#7C52DC] border-[#7C52DC] text-white shadow-md"
                      : "bg-gray-100 border-gray-300 text-[#7C52DC] hover:bg-gray-200"
                  } font-semibold px-3 py-1 cursor-pointer transition-all duration-300 rounded-full border text-sm`}
                >
                  {val === 100 ? "Max" : `${val}%`}
                </span>
              ))}
            </div>
            <div className="flex-1">
              <input
                value={actualValue}
                type="number"
                onChange={(e) => {
                  setActualValue(e.target.value);
                  setRemoveAmount(0);
                }}
                className="w-full text-right rounded-lg px-3 py-2 bg-gray-50 border border-gray-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C52DC]"
              />
            </div>
          </div>
          {data.userLP < actualValue && (
            <div className="text-red-500 text-sm mt-1 ml-auto">
              Invalid: Amount exceeds balance.
            </div>
          )}
        </div>

        {/* Receive Amount */}
        <span className="font-semibold text-gray-700">Receive Amount</span>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              {data.iconA ? (
                <img
                  className="h-8 w-8 rounded-full border border-gray-300"
                  src={data.iconA}
                />
              ) : (
                <div className=" h-8 w-8 bg-gray-400 rounded-full font-semibold text-lg flex items-center justify-center text-white">
                  {data.tokenA.symbol[0]}
                </div>
              )}
              <span className="text-sm font-medium text-gray-800">
                {data.tokenA.symbol}
              </span>
            </div>
            <div className="text-gray-900 font-semibold">
              ~{parseFloat(tokenOneAmount).toFixed(5)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              {data.iconB ? (
                <img
                  className="h-8 w-8 rounded-full border border-gray-300"
                  src={data.iconB}
                />
              ) : (
                <div className=" h-8 w-8 bg-gray-400 rounded-full font-semibold text-lg flex items-center justify-center text-white">
                  {data.tokenB.symbol[0]}
                </div>
              )}
              <span className="text-sm font-medium text-gray-800">
                {data.tokenB.symbol}
              </span>
            </div>
            <div className="text-gray-900 font-semibold">
              ~{parseFloat(tokenTwoAmount).toFixed(5)}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRemoveLiquidity}
          disabled={loading || data.userLP < actualValue}
          className="relative overflow-hidden cursor-pointer w-full rounded-lg py-2.5 font-medium text-white 
                 bg-gradient-to-r from-red-500 to-red-600 
                 hover:from-red-600 hover:to-red-700 
                 disabled:from-red-300 disabled:to-red-400 disabled:cursor-not-allowed 
                 shadow-md hover:shadow-lg transition-all duration-300"
        >
          Remove Liquidity
          {loading && (
            <div className="absolute inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default RemoveLiquidity;
