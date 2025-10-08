import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { tokens as initialTokens } from "../Data/data";
import factoryAbi from "../factoryAbi.json";
import { ethers, formatUnits, parseUnits } from "ethers";
import pairAbi from "../pairAbi.json";
import useEthers from "../hooks/useEthers";
import { Copy, Wallet } from "lucide-react";
import erc20Abi from "../ERC20Abi.json";
import routerAbi from "../routerAbi.json";
import Pools from "../components/Pools";
import Position from "../components/Position";
import {
  isSuccessModalVisible,
  isErrorModalVisible,
  setSuccessMessage,
  setErrorMessage,
} from "../redux/slice/modalSlice";

export default function Liquidity({ showModal }) {
  const dispatch = useDispatch();

  const { signer, provider } = useEthers();
  const [refresh, setRefresh] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [pairAddress, setPairAddress] = useState(null);
  const [createPairLoading, setCreatePairLoading] = useState(false);
  const [balanceRefresh, setBalanceRefresh] = useState(false);
  const [createLiquidityLoading, setCreateLiquidityLoading] = useState(false);
  const [pairExist, setPairExist] = useState(false);
  const [showAddLiquidityForm, setShowAddLiquidityForm] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [lastEdited, setLastEdited] = useState("first");
  const [selectedToken1, setSelectedToken1] = useState(null);
  const [selectedToken2, setSelectedToken2] = useState(null);
  const [inputValueToken1, setInputValueToken1] = useState("");
  const [inputValueToken2, setInputValueToken2] = useState("");
  const [token1Amount, setToken1Amount] = useState("");
  const [token2Amount, setToken2Amount] = useState("");
  const [isToken1ModalOpen, setIsToken1ModalOpen] = useState(false);
  const [isToken2ModalOpen, setIsToken2ModalOpen] = useState(false);
  const [reserveOneDetails, setReserveOneDetails] = useState(null);
  const [reserveTwoDetails, setReserveTwoDetails] = useState(null);
  const [insufficientFundsOne, setInsufficientFundsOne] = useState(false);
  const [insufficientFundsTwo, setInsufficientFundsTwo] = useState(false);
  const [doCalculation, setDoCalculation] = useState(true);
  const [balances, setBalances] = useState([]);

  const showError = (msg) => {
    dispatch(setErrorMessage(msg));
    dispatch(isErrorModalVisible(true));
    setTimeout(() => {
      dispatch(setErrorMessage(""));
      dispatch(isErrorModalVisible(false));
    }, 1500);
  };

  const showSuccess = (msg) => {
    dispatch(setSuccessMessage(msg));
    dispatch(isSuccessModalVisible(true));
    setTimeout(() => {
      dispatch(setSuccessMessage(""));
      dispatch(isSuccessModalVisible(false));
    }, 1500);
  };

  const address = useSelector((state) => state.user.walletAddress);
  const ROUTER_ADDRESS = useSelector((state) => state.global.routerAddress);
  const DEAD_LINE = useSelector(
    (state) => state.transaction.transactionDeadline
  );
  const RPC = useSelector((state) => state.global.rpc_one);
  const SILP_PAGE = useSelector((state) => state.transaction.slippageTolerance);
  const isConnected = useSelector((state) => state.user.isConnected);
  const factoryAddress = useSelector((state) => state.global.factoryAddress);

  useEffect(() => {
    const stored = localStorage.getItem("userTokens");
    const userTokens = stored ? JSON.parse(stored) : [];
    setTokens([...initialTokens, ...userTokens]);
  }, []);

  useEffect(() => {
    if (token1Amount) {
      const handler = setTimeout(() => {
        setInputValueToken1(token1Amount);

        if (
          parseFloat(
            balances?.find(
              (b) =>
                b.symbol.toLowerCase() === selectedToken1?.symbol.toLowerCase()
            )?.balance || 0
          ).toFixed(5) >= parseFloat(token1Amount)
        ) {
          setInsufficientFundsOne(false);
        } else {
          setInsufficientFundsOne(true);
        }
      }, 750);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [token1Amount]);

  useEffect(() => {
    if (token2Amount) {
      const handler = setTimeout(() => {
        setInputValueToken2(token2Amount);

        if (
          parseFloat(
            balances?.find(
              (b) =>
                b.symbol.toLowerCase() === selectedToken2?.symbol.toLowerCase()
            )?.balance || 0
          ).toFixed(5) >= parseFloat(token2Amount)
        ) {
          setInsufficientFundsTwo(false);
        } else {
          setInsufficientFundsTwo(true);
        }
      }, 750);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [token2Amount]);

  useEffect(() => {
    // console.log({
    //   pairExist,
    //   doCalculation,
    //   inputValueToken1,
    //   inputValueToken2,
    // });

    if (pairExist && doCalculation && (inputValueToken1 || inputValueToken2)) {
      // console.log("hi");
      const fetchReserves = async () => {
        try {
          const pair = new ethers.Contract(pairAddress, pairAbi, provider);

          const [reserve0, reserve1] = await pair.getReserves();
          // console.log({ reserve0, reserve1 });
          // console.log("1");

          if (!reserve0 || !reserve1) {
            setDoCalculation(false);
            return;
          }
          // console.log("2");

          const token0 = await pair.token0();
          const token1 = await pair.token1();
          // console.log({ token0, token1 });

          setReserveOneDetails({ token0, reserve0 });
          setReserveTwoDetails({ token1, reserve1 });

          // console.log("here2");
          if (lastEdited == "first") {
            if (token0.toLowerCase() == selectedToken1.address.toLowerCase()) {
              // console.log("up");
              if (token1Amount == "") {
                setToken2Amount("");
                return;
              }
              const tokenOne = parseUnits(
                token1Amount,
                selectedToken1.decimals
              );
              const value = formatUnits(
                (tokenOne * reserve1) / reserve0,
                selectedToken2.decimals
              );
              setToken2Amount(parseFloat(value).toFixed(5));
            } else {
              // console.log("down");
              if (token1Amount == "") {
                setToken2Amount("");
                return;
              }
              const tokenOne = parseUnits(
                token1Amount,
                selectedToken1.decimals
              );
              const value = formatUnits(
                (tokenOne * reserve0) / reserve1,
                selectedToken2.decimals
              );
              setToken2Amount(parseFloat(value).toFixed(5));
            }
          } else if (lastEdited == "second") {
            if (token0.toLowerCase() == selectedToken2.address.toLowerCase()) {
              // console.log("up");

              if (token2Amount == "") {
                setToken1Amount("");
                return;
              }

              const tokenTwo = parseUnits(
                token2Amount,
                selectedToken2.decimals
              );
              // console.log(tokenTwo);
              const value = formatUnits(
                (tokenTwo * reserve1) / reserve0,
                selectedToken1.decimals
              );
              setToken1Amount(parseFloat(value).toFixed(5));
            } else {
              // console.log("down");

              if (token2Amount == "") {
                setToken1Amount("");
                return;
              }

              const tokenTwo = parseUnits(
                token2Amount,
                selectedToken2.decimals
              );
              // console.log(tokenTwo);
              const value = formatUnits(
                (tokenTwo * reserve0) / reserve1,
                selectedToken1.decimals
              );
              setToken1Amount(parseFloat(value).toFixed(5));
            }
          }
        } catch (error) {
          console.error("Error fetching reserves:", error);
        }
      };

      fetchReserves();
    }
  }, [inputValueToken1, inputValueToken2]);

  useEffect(() => {
    if (!provider || !address || !isConnected) return;

    async function fetchBalances() {
      try {
        const providerr = new ethers.JsonRpcProvider(RPC);

        const results = [];

        for (let token of tokens) {
          const contract = new ethers.Contract(
            token.address,
            erc20Abi,
            providerr
          );

          const [rawBal, decimals, symbol] = await Promise.all([
            contract.balanceOf(address),
            contract.decimals(),
            contract.symbol(),
          ]);

          results.push({
            symbol,
            balance: ethers.formatUnits(rawBal, decimals),
          });
        }

        const nativeBal = await providerr.getBalance(address);
        results.unshift({
          symbol: "ANGH",
          balance: ethers.formatEther(nativeBal),
        });

        setBalances(results);
        // console.log(results);
      } catch (err) {
        console.error("Error fetching balances:", err);
      }
    }

    fetchBalances();
  }, [provider, address, isConnected, tokens, balanceRefresh]);

  async function isPairPresent() {
    if (selectedToken1 && selectedToken2) {
      // const factoryContractInstance = new ethers.Contract(
      //   factoryAddress,
      //   factoryAbi,
      //   provider
      // );
      console.log(selectedToken1, selectedToken2);
      // const pairAddress = await factoryContractInstance.getPair(tokenA, tokenB);
    }
  }
  useEffect(() => {
    isPairPresent();
  }, [selectedToken1, selectedToken2]);

  async function handleCreatePair() {
    if (!selectedToken2) {
      showError("Select the second token!");
      return;
    }

    if (
      selectedToken1.address.toLowerCase() ==
      selectedToken2.address.toLowerCase()
    ) {
      showError("Both Tokens Cannot Be Same!");
      return;
    }

    try {
      setCreatePairLoading(true);
      console.log({ factoryAddress, provider, factoryAbi });
      const factoryContractInstance = new ethers.Contract(
        factoryAddress,
        factoryAbi,
        provider
      );

      const tokenA = ethers.getAddress(selectedToken1.address);
      const tokenB = ethers.getAddress(selectedToken2.address);
      // console.log({ tokenA, tokenB });
      // try {
      //   const result = await factoryContractInstance.allPairs(0);
      //   console.log("Simulated result:", result);
      // } catch (error) {
      //   console.error("Simulation failed:", error);
      // }
      // const allPairs = await factoryContractInstance.allPairs(0);
      // console.log("Factory address:", factoryContractInstance.address);
      // console.log("Token A:", tokenA);
      // console.log("Token B:", tokenB);
      // alert("1");

      const pairAddress = await factoryContractInstance.getPair(tokenA, tokenB);
      // alert("2");
      // console.log({ pairAddress });
      if (pairAddress != ethers.ZeroAddress) {
        showSuccess("Pair Found!");
        setPairAddress(pairAddress);
        setPairExist(true);
      }

      setShowDetailsForm(true);
      setShowAddLiquidityForm(false);
    } catch (error) {
      console.log(error);
      showError(error.reason || "Pair creation transaction failed!");
    } finally {
      setCreatePairLoading(false);
    }
  }

  async function handleCreatePosition() {
    if (!token1Amount)
      return showError(`${selectedToken1.symbol} cannot be 0.`);
    if (!token2Amount)
      return showError(`${selectedToken2.symbol} cannot be 0.`);

    if (SILP_PAGE < 0.1 || DEAD_LINE < 1) {
      return showError("Either Slippage Or Transaction Deadline Is Low!");
    }
    if (SILP_PAGE > 5 && SILP_PAGE < 50) {
      return showError(
        "Slippage exceeds 5%. Your transaction may be frontrun."
      );
    }
    if (SILP_PAGE >= 50) {
      return showError("Invalid: Slippage cannot exceed 50%!");
    }
    if (DEAD_LINE > 10) {
      return showError("Invalid: Deadline cannot exceed 10 min!");
    }

    const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);
    const tokenA = new ethers.Contract(
      selectedToken1.address,
      erc20Abi,
      signer
    );
    const tokenB = new ethers.Contract(
      selectedToken2.address,
      erc20Abi,
      signer
    );

    const AmountOne = parseUnits(token1Amount, selectedToken1.decimals);
    const AmountTwo = parseUnits(token2Amount, selectedToken2.decimals);

    try {
      setCreateLiquidityLoading(true);
      console.log({ reserveOneDetails, reserveTwoDetails });

      // console.log({ tokenOneAllowance, AmountOne });
      // console.log({ tokenTwoAllowance, AmountTwo });

      await tokenA.approve(ROUTER_ADDRESS, AmountOne);
      await tokenB.approve(ROUTER_ADDRESS, AmountTwo);

      const deadline = Math.floor(Date.now() / 1000) + 60 * DEAD_LINE;

      const slippageBps = Math.floor(SILP_PAGE * 100);
      const amountOutMinA =
        (AmountOne * BigInt(10000 - slippageBps)) / BigInt(10000);
      const amountOutMinB =
        (AmountTwo * BigInt(10000 - slippageBps)) / BigInt(10000);

      // console.log({
      //   add1: selectedToken1.address,
      //   add2: selectedToken2.address,
      //   AmountOne,
      //   AmountTwo,
      //   amountOutMinA,
      //   amountOutMinB,
      //   address,
      //   deadline,
      // });
      // return;
      let tx;
      // console.log("liquidity");
      if (selectedToken1.symbol == "ANGH") {
        console.log("ANGH Top");
        tx = await router.addLiquidityWANGH(
          selectedToken2.address,
          AmountTwo,
          0,
          0,
          address,
          deadline,
          { gasLimit: 30000000, value: AmountOne }
        );
      } else if (selectedToken2.symbol == "ANGH") {
        console.log("ANGH Bottom");
        console.log("second");
        tx = await router.addLiquidityWANGH(
          selectedToken1.address,
          AmountOne,
          0,
          0,
          address,
          deadline,
          { gasLimit: 30000000, value: AmountTwo }
        );
        return;
      } else {
        // console.log("third");
        tx = await router.addLiquidity(
          selectedToken1.address,
          selectedToken2.address,
          AmountOne,
          AmountTwo,
          amountOutMinA,
          amountOutMinB,
          address,
          deadline,
          { gasLimit: 30000000 }
        );
      }

      console.log("tx sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Liquidity added:", receipt);

      showSuccess("Liquidity Added Successfully");
      setRefresh((prev) => !prev);
      setBalanceRefresh((prev) => !prev);
    } catch (error) {
      console.error("Liquidity addition failed:", error);
      showError(error.reason || error.message || "Liquidity addition failed!");
    } finally {
      setCreateLiquidityLoading(false);
      setShowDetailsForm(false);
      setSelectedToken1(tokens[0]);
      setSelectedToken2(null);
      setToken1Amount("");
      setToken2Amount("");
    }
  }

  const closeCreatePosition = () => {
    if (!createLiquidityLoading) {
      setShowDetailsForm(false);
      setToken1Amount("");
      setToken2Amount("");
      setInputValueToken1("");
      setInputValueToken2("");
      setSelectedToken1(tokens[0]);
      setSelectedToken1(null);
      setSelectedToken2(null);
      setDoCalculation(true);
      setInsufficientFundsOne(false);
      setInsufficientFundsTwo(false);
      setPairExist(false);
      setPairAddress(null);
    }
  };

  async function handlePoolAddLiquidity(token1, token2) {
    setSelectedToken1(token1);
    setSelectedToken2(token2);
    try {
      const factoryContractInstance = new ethers.Contract(
        factoryAddress,
        factoryAbi,
        provider
      );

      const tokenA = ethers.getAddress(token1.address);
      const tokenB = ethers.getAddress(token2.address);

      const pairAddress = await factoryContractInstance.getPair(tokenA, tokenB);
      if (pairAddress != 0) {
        setPairAddress(pairAddress);
        setPairExist(true);
        setShowDetailsForm(true);
        setShowAddLiquidityForm(false);
      }
    } catch (error) {
      console.log(error);
      showError("Error Fetching The Pair!");
    }
  }

  return (
    <div className="space-y-6 mt-20 mb-10 relative">
      {showAddLiquidityForm && (
        <div
          onClick={() => {
            setShowAddLiquidityForm(false);
            setIsToken1ModalOpen(false);
            setIsToken2ModalOpen(false);
            setSelectedToken1(null);
            setSelectedToken2(null);
          }}
          className="fixed z-30 px-2 top-0 h-screen bg-black/60 backdrop-blur-sm inset-0 flex justify-center items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="space-y-4 bg-white w-full sm:w-fit p-5 rounded-xl"
          >
            <div>
              <h1 className="text-lg font-semibold">Select pair</h1>
              <p className="text-xs">
                Choose the tokens you want to provide liquidity for. You can
                select tokens on all supported networks.
              </p>
            </div>
            <div className="flex gap-2 flex-col sm:flex-row">
              {/* First Token */}
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">First Token</span>
                </div>
                <div
                  onClick={() => {
                    setIsToken1ModalOpen(!isToken1ModalOpen);
                    setIsToken2ModalOpen(false);
                  }}
                  className="bg-gray-50 cursor-pointer  rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative w-full">
                      <button className="flex items-center cursor-pointer  space-x-2  w-full text-gray-900 font-semibold text-base transition-all duration-300 hover:scale-105 flex-shrink-0">
                        {selectedToken1 &&
                          (selectedToken1.icon ? (
                            <img
                              className="h-6 w-6"
                              src={selectedToken1.icon}
                              alt={selectedToken1.name}
                            />
                          ) : (
                            <div className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center font-semibold  text-white">
                              {selectedToken1?.symbol.slice(0, 1)}
                            </div>
                          ))}

                        <span>{selectedToken1?.symbol || "Select"}</span>
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {isToken1ModalOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                          {tokens.map((token) => (
                            <button
                              key={token.symbol}
                              onClick={() => {
                                setSelectedToken1(token);
                                setIsToken1ModalOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                            >
                              {token.icon ? (
                                <img
                                  className="h-8 w-8"
                                  src={token.icon}
                                  alt={token.name}
                                />
                              ) : (
                                <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center font-semibold  text-white">
                                  {token.name.slice(0, 1)}
                                </div>
                              )}
                              <div className="text-left">
                                <div className="font-semibold text-gray-900">
                                  {token.symbol}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {token.name}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Token */}
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Second Token</span>
                </div>
                <div
                  onClick={() => {
                    setIsToken2ModalOpen(!isToken2ModalOpen);
                    setIsToken1ModalOpen(false);
                  }}
                  className="bg-gray-50 cursor-pointer rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <button className="flex items-center space-x-2 text-gray-900 font-semibold text-base cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0">
                        {selectedToken2 &&
                          (selectedToken2.icon ? (
                            <img
                              className="h-6 w-6"
                              src={selectedToken2.icon}
                              alt={selectedToken2.name}
                            />
                          ) : (
                            <div className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center font-semibold  text-white">
                              {selectedToken2?.symbol.slice(0, 1)}
                            </div>
                          ))}
                        <span>{selectedToken2?.symbol || "Select"}</span>
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {isToken2ModalOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                          {tokens.map((token) => (
                            <button
                              key={token.symbol}
                              onClick={() => {
                                setSelectedToken2(token);
                                setIsToken2ModalOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                            >
                              {token.icon ? (
                                <img
                                  className="h-8 w-8"
                                  src={token.icon}
                                  alt={token.name}
                                />
                              ) : (
                                <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center font-semibold  text-white">
                                  {token.name.slice(0, 1)}
                                </div>
                              )}
                              <div className="text-left">
                                <div className="font-semibold text-gray-900">
                                  {token.symbol}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {token.name}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={handleCreatePair}
                disabled={createPairLoading}
                className="relative w-full overflow-hidden h-14 cursor-pointer text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 hover:shadow-xl border border-purple-200"
                style={{
                  background: "linear-gradient(to right, #8357E8, #7c4ddb)",
                }}
              >
                {createPairLoading ? (
                  <div className="absolute inset-0 bg-black/60 z-50 backdrop-blur-lg flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg "></span>
                  </div>
                ) : (
                  "Select Tokens"
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddLiquidityForm(false);
                  setSelectedToken1(null);
                  setSelectedToken2(null);
                  setIsToken1ModalOpen(false);
                  setIsToken2ModalOpen(false);
                }}
                className="w-full h-14 cursor-pointer bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/*----------------------------------------------------------------- */}

      {showDetailsForm && (
        <div
          onClick={closeCreatePosition}
          className="fixed z-30 px-2 top-0 h-screen bg-black/60 backdrop-blur-sm inset-0 flex justify-center items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="space-y-4 bg-white w-full sm:w-fit p-5 rounded-xl"
          >
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                    {selectedToken1.icon ? (
                      <img
                        className="w-full h-full object-cover"
                        src={selectedToken1.icon}
                        alt={selectedToken1.symbol}
                      />
                    ) : (
                      <div className="w-full h-full object-cover bg-gray-400 font-semibold text-white flex items-center justify-center">
                        {selectedToken1.symbol[0]}
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                    {selectedToken2.icon ? (
                      <img
                        className="w-full h-full object-cover"
                        src={selectedToken2.icon}
                        alt={selectedToken2.symbol}
                      />
                    ) : (
                      <div className="w-full h-full object-cover bg-gray-400 font-semibold text-white flex items-center justify-center">
                        {selectedToken2.symbol[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h2 className="font-semibold flex items-center gap-1">
                {selectedToken1.symbol}/{selectedToken2.symbol}{" "}
                {pairAddress &&
                  "(" +
                    pairAddress.slice(0, 4) +
                    ".." +
                    pairAddress.slice(-4) +
                    ")"}
                {pairAddress && (
                  <Copy
                    onClick={() => {
                      navigator.clipboard
                        .writeText(String(pairAddress))
                        .then(() => {
                          alert("Copied to clipboard!");
                        })
                        .catch((err) => {
                          console.error("Failed to copy:", err);
                        });
                    }}
                    size={14}
                    className="cursor-pointer hover:text-gray-500 transition ease-in-out duration-300"
                  />
                )}
              </h2>
            </div>

            <div className="flex gap-2 flex-col lg:flex-row">
              {/* First Token */}
              <div className=" flex-1">
                <div className="flex  justify-between items-center">
                  <span className="text-sm text-gray-600">First Token</span>
                  <span className="text-sm text-gray-600 flex gap-1 items-center">
                    <Wallet size={16} />
                    {Number(
                      balances?.find(
                        (b) =>
                          b.symbol.toLowerCase() ===
                          selectedToken1?.symbol.toLowerCase()
                      )?.balance || 0
                    ).toFixed(5)}
                  </span>
                </div>
                <div className="bg-gray-50 mt-2 cursor-pointer rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex relative w-full">
                      <button
                        disabled
                        className="flex items-center cursor-pointer  space-x-2 text-gray-900 font-semibold text-base transition-all duration-300 hover:scale-105 flex-shrink-0"
                      >
                        {selectedToken1 &&
                          (selectedToken1.icon ? (
                            <img
                              className="h-6 w-6"
                              src={selectedToken1.icon}
                              alt={selectedToken1.name}
                            />
                          ) : (
                            <div className="h-8 w-8 bg-gray-400 font-semibold text-white flex items-center justify-center rounded-full">
                              {selectedToken1?.symbol[0]}
                            </div>
                          ))}
                        <span>{selectedToken1?.symbol}</span>
                      </button>
                      <input
                        type="number"
                        value={token1Amount}
                        onChange={(e) => {
                          setToken1Amount(e.target.value);
                          setLastEdited("first");
                          if (e.target.value == "") {
                            setToken2Amount("");
                            return;
                          }
                        }}
                        className="flex-1 bg-transparent min-w-0  text-xl sm:text-2xl font-bold text-foreground border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/50 text-right"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
                {insufficientFundsOne && (
                  <span className="text-sm text-red-400">
                    Insufficient balance
                  </span>
                )}
              </div>

              {/* Second Token */}
              <div className=" flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Second Token</span>
                  <span className="text-sm text-gray-600 flex gap-1 items-center">
                    <Wallet size={16} />
                    {Number(
                      balances?.find(
                        (b) =>
                          b.symbol.toLowerCase() ===
                          selectedToken2?.symbol.toLowerCase()
                      )?.balance || 0
                    ).toFixed(5)}
                  </span>
                </div>
                <div className="bg-gray-50 mt-2 cursor-pointer rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex relative w-full">
                      <button
                        disabled
                        className="flex items-center space-x-2 text-gray-900 font-semibold text-base cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0"
                      >
                        {selectedToken2 &&
                          (selectedToken2.icon ? (
                            <img
                              className="h-6 w-6"
                              src={selectedToken2.icon}
                              alt={selectedToken2.name}
                            />
                          ) : (
                            <div className="h-8 w-8 bg-gray-400 font-semibold text-white flex items-center justify-center rounded-full">
                              {selectedToken2?.symbol[0]}
                            </div>
                          ))}
                        <span>{selectedToken2?.symbol}</span>
                      </button>
                      <input
                        type="number"
                        value={token2Amount}
                        onChange={(e) => {
                          setToken2Amount(e.target.value);
                          setLastEdited("second");
                          if (e.target.value == "") {
                            setToken1Amount("");
                            return;
                          }
                        }}
                        className="flex-1 bg-transparent min-w-0  text-xl sm:text-2xl font-bold text-foreground border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/50 text-right"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
                {insufficientFundsTwo && (
                  <span className="text-sm text-red-400">
                    Insufficient balance
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={handleCreatePosition}
                disabled={
                  insufficientFundsOne ||
                  insufficientFundsTwo ||
                  createLiquidityLoading ||
                  token1Amount === "" ||
                  token2Amount === ""
                }
                className={`relative h-14 w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg border cursor-pointer overflow-hidden disabled:cursor-not-allowed
    ${
      insufficientFundsOne ||
      insufficientFundsTwo ||
      token1Amount === "" ||
      token2Amount === ""
        ? "bg-gray-400 border-gray-400"
        : "bg-gradient-to-r hover:scale-105 active:scale-95 hover:shadow-xl from-[#8357E8] to-[#7c4ddb] border-purple-200"
    }
  `}
              >
                {createLiquidityLoading ? (
                  <div className="absolute inset-0 bg-black/60 z-50 backdrop-blur-lg flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg "></span>
                  </div>
                ) : (
                  "Create Position"
                )}
              </button>

              <button
                onClick={closeCreatePosition}
                disabled={createLiquidityLoading}
                className="w-full relative overflow-hidden h-14 cursor-pointer bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-200"
              >
                {createLiquidityLoading ? (
                  <div className="absolute inset-0 bg-black/60 z-50 backdrop-blur-lg flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg "></span>
                  </div>
                ) : (
                  "Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*----------------------------------------------------------------- */}

      <div className="flex flex-col items-center gap-6 px-3">
        {/* Add Liquidity Column */}
        <Position
          showModal={showModal}
          setShowAddLiquidityForm={setShowAddLiquidityForm}
        />
        {/*----------------------------------------------------------------- */}
        {/* Liquidity Pools Column */}
        <Pools
          handlePoolAddLiquidity={handlePoolAddLiquidity}
          refresh={refresh}
        />
      </div>
    </div>
  );
}
