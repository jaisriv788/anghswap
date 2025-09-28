import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import factoryAbi from "../factoryAbi.json";
// import { pairs } from "../Data/data";
import { ethers } from "ethers";
import pairAbi from "../pairAbi.json";
import { X } from "lucide-react";
import { tokens as initialTokens } from "../Data/data";
import RemoveLiquidity from "./RemoveLiquidity";

function Pools({ handlePoolAddLiquidity, refresh }) {
  const isConnected = useSelector((state) => state.user.isConnected);
  const factoryAddress = useSelector((state) => state.global.factoryAddress);
  const address = useSelector((state) => state.user.walletAddress);
  const RPC = useSelector((state) => state.global.rpc_one);

  const [tokens, setTokens] = useState([]);
  const [liquidityPools, setLiquidityPools] = useState([]);
  const [clickedPool, setClickedPool] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchPairs() {
    setLoading(true);
    const providerr = new ethers.JsonRpcProvider(RPC);
    const factory = new ethers.Contract(factoryAddress, factoryAbi, providerr);

    const results = [];
    const pairs = [];
    let Tkn;
    const stored = localStorage.getItem("userTokens");
    const userTokens = stored ? JSON.parse(stored) : [];
    Tkn = [...initialTokens, ...userTokens];
    setTokens(Tkn);

    for (let i = 0; i < Tkn.length; i++) {
      for (let j = i + 1; j < Tkn.length; j++) {
        pairs.push({
          symbolA: Tkn[i].symbol,
          tokenA: Tkn[i].address,
          decimalsA: Tkn[i].decimals,
          iconA: Tkn[i].icon,
          symbolB: Tkn[j].symbol,
          tokenB: Tkn[j].address,
          decimalsB: Tkn[j].decimals,
          iconB: Tkn[j].icon,
        });
      }
    }

    // console.log(Tkn);
    // console.log({ pairs });
    for (let {
      tokenA,
      tokenB,
      symbolA,
      symbolB,
      decimalsA,
      decimalsB,
      iconA,
      iconB,
    } of pairs) {
      // console.log("here");
      const pairAddress = await factory.getPair(tokenA, tokenB);
      // console.log({ pairAddress });
      // console.log(pairAddress == 0);
      if (pairAddress == 0) continue;
      // console.log("hi");

      const pair = new ethers.Contract(pairAddress, pairAbi, providerr);
      // console.log("hi2");
      const [reserveData, token0, token1, totalSupply, userLP] =
        await Promise.all([
          pair.getReserves(),
          pair.token0(),
          pair.token1(),
          pair.totalSupply(),
          pair.balanceOf(address),
        ]);
      // console.log({ pairAddress, userLP });
      if (userLP == "0") continue;
      const [reserve0, reserve1] = reserveData;
      const share = (userLP * 10n ** 18n) / totalSupply;
      const sharePercentage = (
        (parseFloat(userLP) / parseFloat(totalSupply)) *
        100
      ).toFixed(4);
      const amount0 = (reserve0 * share) / 10n ** 18n;
      const amount1 = (reserve1 * share) / 10n ** 18n;

      if (token0.toLowerCase() == tokenA.toLowerCase()) {
        results.push({
          pair: `${symbolA}-${symbolB} LP`,
          iconA,
          iconB,
          lpToken: pairAddress,
          reserve0,
          reserve1,
          totalSupply,
          userLP: ethers.formatUnits(userLP, 18),
          sharePercentage,
          tokenA: {
            token: token0,
            symbol: symbolA,
            amount: ethers.formatUnits(amount0, decimalsA),
            decimal: decimalsA,
          },
          tokenB: {
            token: token1,
            symbol: symbolB,
            amount: ethers.formatUnits(amount1, decimalsB),
            decimal: decimalsB,
          },
        });
      } else {
        results.push({
          pair: `${symbolB}-${symbolA} LP`,
          iconA: iconB,
          iconB: iconA,
          lpToken: pairAddress,
          reserve0,
          reserve1,
          totalSupply,
          userLP: ethers.formatUnits(userLP, 18),
          sharePercentage,
          tokenA: {
            token: token0,
            symbol: symbolB,
            amount: ethers.formatUnits(amount0, decimalsB),
            decimal: decimalsB,
          },
          tokenB: {
            token: token1,
            symbol: symbolA,
            amount: ethers.formatUnits(amount1, decimalsA),
            decimal: decimalsA,
          },
        });
      }
    }
    setLoading(false);
    return results;
  }

  useEffect(() => {
    const loadPairs = async () => {
      const res = await fetchPairs();
      // console.log("Fetched pairs:", res);
      if (res.length > 0) {
        setLiquidityPools(res);
      } else {
        setLiquidityPools([]);
      }
    };

    loadPairs();
  }, [isConnected, showRemoveModal, refresh]);

  function handleLiquidityAction(item) {
    setClickedPool(item);
    setShowModal(true);
  }

  function AddLiquidity() {
    const matchedTokenOne = tokens.find(
      (token) =>
        token.address.toLowerCase() == clickedPool.tokenA.token.toLowerCase()
    );
    const matchedTokenTwo = tokens.find(
      (token) =>
        token.address.toLowerCase() == clickedPool.tokenB.token.toLowerCase()
    );
    setShowModal(false);
    handlePoolAddLiquidity(matchedTokenOne, matchedTokenTwo);
  }
  return (
    <div className="w-full sm:w-5/6 lg:w-1/2 ">
      {showModal && (
        <div
          onClick={() => {
            setShowModal(false);
            setClickedPool(null);
          }}
          className="fixed z-50 px-2 top-0 h-screen bg-black/60 backdrop-blur-sm inset-0 flex justify-center items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="space-y-4 relative bg-white w-full sm:w-9/12  lg:w-5/12 p-5 rounded-xl"
          >
            <X
              size={14}
              onClick={() => {
                setShowModal(false);
                setClickedPool(null);
              }}
              className="cursor-pointer absolute right-3 top-3 "
            />
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                {clickedPool.iconA ? (
                  <img
                    className="h-8 bg-gray-300 rounded-full"
                    src={clickedPool.iconA}
                  />
                ) : (
                  <div className="h-8 w-8 font-semibold flex justify-center items-center bg-gray-300 rounded-full">
                    {clickedPool.tokenA.symbol[0]}
                  </div>
                )}
                {clickedPool.iconB ? (
                  <img
                    className="h-8 bg-gray-300 rounded-full"
                    src={clickedPool.iconB}
                  />
                ) : (
                  <div className="h-8 w-8 font-semibold flex justify-center items-center bg-gray-300 rounded-full">
                    {clickedPool.tokenB.symbol[0]}
                  </div>
                )}
              </div>
              <div className="font-bold text-lg">{clickedPool.pair}</div>
            </div>
            <div className="font-bold">
              Liquidity -{" "}
              <span className="font-semibold">
                {clickedPool.userLP} ({clickedPool.sharePercentage}%)
              </span>
            </div>
            <div className="bg-gray-200 p-2 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  {clickedPool.iconA ? (
                    <img className="h-8" src={clickedPool.iconA} />
                  ) : (
                    <div className="h-8 w-8 bg-gray-400 rounded-full font-semibold text-white text-lg flex items-center justify-center">
                      {clickedPool.tokenA.symbol[0]}
                    </div>
                  )}
                  <span className="text-sm font-semibold">
                    {clickedPool.tokenA.symbol}
                  </span>
                </div>
                <div>~{parseFloat(clickedPool.tokenA.amount).toFixed(5)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  {clickedPool.iconB ? (
                    <img className="h-8" src={clickedPool.iconB} />
                  ) : (
                    <div className="h-8 w-8 bg-gray-400 rounded-full font-semibold text-white text-lg flex items-center justify-center">
                      {clickedPool.tokenB.symbol[0]}
                    </div>
                  )}
                  <span className="text-sm font-semibold">
                    {clickedPool.tokenB.symbol}
                  </span>
                </div>
                <div>~{parseFloat(clickedPool.tokenB.amount).toFixed(5)}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={AddLiquidity}
                className="bg-emerald-500  hover:bg-emerald-700 cursor-pointer transition ease-in-out duration-300 w-full rounded-lg py-2 text-white "
              >
                Add Liquidity
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowRemoveModal(true);
                }}
                className="bg-red-500 hover:bg-red-700 cursor-pointer transition ease-in-out duration-300 w-full rounded-lg py-2 text-white"
              >
                Remove Liquidity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* {showModal && (
        <div
          onClick={() => {
            setShowModal(false);
            setClickedPool(null);
          }}
          className="fixed z-50 px-2 top-0 h-screen bg-black/60 backdrop-blur-sm inset-0 flex justify-center items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="space-y-6 relative bg-white w-full sm:w-9/12 lg:w-5/12 p-6 
               rounded-2xl shadow-xl border border-gray-100"
          >
            <X
              size={18}
              onClick={() => {
                setShowModal(false);
                setClickedPool(null);
              }}
              className="cursor-pointer absolute right-4 top-4 text-gray-400 hover:text-gray-700 transition"
            />

            <div className="flex gap-3 items-center">
              <div className="relative flex">
                <img
                  className="h-10 w-10 object-cover rounded-full border border-white shadow-md"
                  src={clickedPool.iconA}
                />
                <img
                  className="h-10 w-10 object-cover rounded-full border border-white shadow-md -ml-3"
                  src={clickedPool.iconB}
                />
              </div>
              <div className="font-bold text-lg text-gray-900">
                {clickedPool.pair}
              </div>
            </div>

            <div className="font-semibold text-gray-700">
              Liquidity -{" "}
              <span className="text-gray-900 font-bold">
                {clickedPool.userLP} ({clickedPool.sharePercentage}%)
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <img
                    className="h-8 w-8 rounded-full border border-gray-300"
                    src={clickedPool.iconA}
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {clickedPool.tokenA.symbol}
                  </span>
                </div>
                <div className="font-semibold text-gray-900">
                  ~{parseFloat(clickedPool.tokenA.amount).toFixed(5)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <img
                    className="h-8 w-8 rounded-full border border-gray-300"
                    src={clickedPool.iconB}
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {clickedPool.tokenB.symbol}
                  </span>
                </div>
                <div className="font-semibold text-gray-900">
                  ~{parseFloat(clickedPool.tokenB.amount).toFixed(5)}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={AddLiquidity}
                className="relative w-full rounded-lg py-2.5 font-medium text-white 
             bg-gradient-to-r from-[#7C52DC] to-indigo-600 
             shadow-md overflow-hidden cursor-pointer"
              >
                <span className="relative z-10">Add Liquidity</span>
                <span
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-[#7C52DC] 
                   opacity-0 hover:opacity-100 
                   transition-opacity duration-500"
                ></span>
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  setShowRemoveModal(true);
                }}
                className="w-full rounded-lg py-2.5 font-medium text-[#7C52DC] border 
                   border-[#7C52DC] bg-white hover:bg-[#f8f5ff] 
                   shadow-sm hover:shadow-md transition-all cursor-pointer duration-300"
              >
                Remove Liquidity
              </button>
            </div>
          </div>
        </div>
      )} */}

      {showRemoveModal && (
        <RemoveLiquidity
          setClickedPool={setClickedPool}
          setShowRemoveModal={setShowRemoveModal}
          data={clickedPool}
        />
      )}

      <div className="bg-white flex flex-col max-h-screen border border-gray-200 rounded-2xl p-3 sm:p-6 shadow-2xl backdrop-blur-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Liquidity Pools
          </h2>
          <p className="text-sm text-gray-600">
            Select a pool to add or remove liquidity
          </p>
        </div>

        <div className="space-y-4 z-10 flex-1 overflow-x-hidden overflow-y-auto">
          {isConnected ? (
            loading ? (
              <div className="text-center text-black/50 bg-gray-200 py-10 rounded-xl border-2 border-black/30 border-dashed">
                <span className="loading loading-spinner loading-xl"></span>
                {/* Loading<span className="loading loading-dots loading-md"></span> */}
              </div>
            ) : liquidityPools.length == 0 ? (
              <div className="text-center text-black/50 bg-gray-200 py-10 rounded-xl border-2 border-black/30 border-dashed">
                No Liquidity Pool Found
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-1">
                {liquidityPools.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleLiquidityAction(item)}
                    className="cursor-pointer group relative overflow-hidden 
                       rounded-2xl border border-gray-200 bg-white 
                       shadow-sm hover:shadow-lg 
                       transition-all duration-300 hover:scale-[1.03] hover:z-50 
                      w-full sm:w-11/12"
                  >
                    {/* Background glow effect on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 
                         transition duration-500 bg-gradient-to-br 
                         from-blue-50 via-purple-50 to-pink-50"
                    />

                    <div className="relative p-5">
                      {/* Pair icons */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex">
                          {item.iconA ? (
                            <img
                              className="h-10 w-10 object-cover rounded-full border border-white shadow-md"
                              src={item.iconA}
                            />
                          ) : (
                            <div className="h-10 w-10 object-cover rounded-full border border-white shadow-md -ml-3 font-semibold flex items-center text-lg text-white justify-center bg-gray-400">
                              {item.tokenA.symbol[0]}
                            </div>
                          )}
                          {item.iconB ? (
                            <img
                              className="h-10 w-10 object-cover rounded-full border border-white shadow-md -ml-3"
                              src={item.iconB}
                            />
                          ) : (
                            <div className="h-10 w-10 object-cover rounded-full border border-white shadow-md -ml-3 font-semibold flex items-center text-lg text-white justify-center bg-gray-400">
                              {item.tokenB.symbol[0]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pair info */}
                      <div className="mt-4 flex flex-col">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <span className="font-bold text-gray-900 sm:text-lg tracking-wide">
                            {item.pair}
                          </span>
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full shadow-sm">
                            {parseFloat(item.tokenA.amount).toFixed(5)} /{" "}
                            {parseFloat(item.tokenB.amount).toFixed(5)}
                          </span>
                        </div>

                        {/* LP Token Info */}
                        <div className="mt-3 flex items-center justify-between sm:justify-start gap-2 text-sm sm:text-base">
                          <span className="text-gray-600 font-medium">
                            LP Token
                          </span>
                          <span
                            className="hidden sm:inline-flex items-center gap-1 font-medium text-gray-800 
                               bg-blue-50 px-3 py-1 rounded-lg shadow-sm"
                          >
                            <span>{item.userLP}</span>
                            <span className="text-blue-600">
                              ({item.sharePercentage}%)
                            </span>
                          </span>
                          <span className="sm:hidden inline-flex text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md shadow-sm">
                            {parseFloat(item.userLP).toFixed(8)} (
                            {parseFloat(item.sharePercentage)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center text-black/50 bg-gray-200 py-10 rounded-xl border-2 border-black/30 border-dashed">
              Connect Wallet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Pools;

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };
