import { useEffect, useState } from "react";
import TokenModal from "./TokenModal";
import { useSelector, useDispatch } from "react-redux";
import useEthers from "../hooks/useEthers";
import { ethers, formatUnits, parseUnits } from "ethers";
import routerAbi from "../routerAbi.json";
import useBalance from "../hooks/useBalance";
import erc20Abi from "../ERC20Abi.json";
import wanghAbi from "../wanghAbi.json";
import { tokens as initialTokens } from "../Data/data";
import { ArrowUpDown, Wallet } from "lucide-react";
import {
  isSuccessModalVisible,
  isErrorModalVisible,
  setSuccessMessage,
  setErrorMessage,
} from "../redux/slice/modalSlice";

export default function SwapBox({ isVisible, showModal }) {
  const [fromToken, setFromToken] = useState("USDT-ANGH20");
  const [tokens, setTokens] = useState([]);
  const [lastEdited, setLastEdited] = useState("from");
  const [balanceRefresh, setBalanceRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [toAmount, setToAmount] = useState("");
  const [isFromModalOpen, setIsFromModalOpen] = useState(false);
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [fromUSD, setFromUSD] = useState(0);
  const [toUSD, setToUSD] = useState(0);
  const [debouncedToValue, setDebouncedToValue] = useState("");
  const [debouncedFromValue, setDebouncedFromValue] = useState("");
  const [priceIntervalId, setPriceIntervalId] = useState(null);
  const { connectWallet, provider, signer } = useEthers();
  const dispatch = useDispatch();
  const isConnected = useSelector((state) => state.user.isConnected);
  const address = useSelector((state) => state.user.walletAddress);

  const ROUTER_ADDRESS = useSelector((state) => state.global.routerAddress);
  // const FACTORY_ADDRESS = useSelector((state) => state.global.factoryAddress);
  const TOKEN_ADDRESS = "0x6a5f01FD554038756B107002E0ACD7d8f15A97Bc";
  const USDT_ADDRESS = useSelector((state) => state.global.usdtAddress);
  const DEAD_LINE = useSelector(
    (state) => state.transaction.transactionDeadline
  );
  const SILP_PAGE = useSelector((state) => state.transaction.slippageTolerance);
  const RPC = useSelector((state) => state.global.rpc_one);

  const walletBalance = useBalance(provider, tokens, balanceRefresh);
  // console.log(walletBalance);
  // async function fetchBalance() {
  //   try {
  //     const results = [];
  //     console.log("first", results);

  //     for (let token of tokens) {
  //       const contract = new ethers.Contract(token.address, erc20Abi, provider);

  //       const [rawBal, decimals, symbol] = await Promise.all([
  //         contract.balanceOf(address),
  //         contract.decimals(),
  //         contract.symbol(),
  //       ]);

  //       const formatted = ethers.formatUnits(rawBal, decimals);
  //       results.push({ symbol, balance: formatted });
  //     }

  //     // also add native coin (BNB/ETH/MATIC etc.)
  //     const nativeBal = await provider.getBalance(address);
  //     results.unshift({
  //       symbol: "BNB", // or ETH if Ethereum
  //       balance: ethers.formatEther(nativeBal),
  //     });
  //     console.log(results);
  //     setBalances(results);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // useEffect(() => {
  //   console.log({ provider });
  //   console.log({ address });
  //   console.log({ isConnected });
  //   if (!provider || !address || !isConnected) return;
  //   fetchBalance();
  // }, []);

  useEffect(() => {
    const stored = localStorage.getItem("userTokens");
    const userTokens = stored ? JSON.parse(stored) : [];
    setTokens([...initialTokens, ...userTokens]);
  }, []);

  const handleAddToken = (newToken) => {
    setTokens((prevTokens) => {
      const exists = prevTokens.find(
        (token) =>
          token.address.toLowerCase() === newToken.address.toLowerCase()
      );
      if (exists) return prevTokens; // Avoid duplicates
      const updatedTokens = [...prevTokens, newToken];
      // Save only user-added tokens (exclude default ones)
      const userTokens = updatedTokens.filter(
        (token) =>
          !initialTokens.some(
            (t) => t.address.toLowerCase() === token.address.toLowerCase()
          )
      );
      localStorage.setItem("userTokens", JSON.stringify(userTokens));
      setBalanceRefresh((prev) => prev + 1);
      return updatedTokens;
    });
  };

  const showError = (msg) => {
    dispatch(setErrorMessage(msg));
    dispatch(isErrorModalVisible(true));
    setTimeout(() => {
      dispatch(setErrorMessage(""));
      dispatch(isErrorModalVisible(false));
    }, 1500);
  };

  const buildSwapPath = (tokenA, tokenB) => {
    if (tokenA === tokenB) {
      throw new Error("Invalid: same token swap not allowed");
    }

    // If either is USDT, swap directly
    if (tokenA === USDT_ADDRESS || tokenB === USDT_ADDRESS) {
      return [tokenA, tokenB];
    }

    // Otherwise, route via USDT
    return [tokenA, USDT_ADDRESS, tokenB];
  };

  const getTokenBySymbol = (symbol) => {
    return tokens.find(
      (token) => token.symbol.toLowerCase() === symbol.toLowerCase()
    );
  };

  const getTokenAddress = (symbol) =>
    tokens.find((t) => t.symbol === symbol)?.address;

  const getTokenDecimals = (symbol) =>
    tokens.find((t) => t.symbol === symbol)?.decimals;

  const getTokenPriceInUsd = async () => {
    if (isConnected && toToken) {
      // const providerr = new ethers.JsonRpcProvider(
      //   "https://bsc-dataseed.binance.org/"
      // );
      // console.log("usd");
      setFetchingPrice(true);
      const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, provider); //if Error replace provider with providerr
      const tokenFromAddress = getTokenAddress(fromToken);
      const tokenToAddress = getTokenAddress(toToken);
      const fromTokenDecimal = getTokenDecimals(fromToken);
      const toTokenDecimal = getTokenDecimals(toToken);

      if (lastEdited == "from") {
        if (debouncedFromValue == "0") {
          setToAmount("");
          setFromUSD(0);
          setToUSD(0);
          setFetchingPrice(false);
          return;
        }
        console.log("from");
        let result;
        let toValue;
        const amountIn = parseUnits(debouncedFromValue, fromTokenDecimal);
        console.log({ amountIn });
        if (
          tokenFromAddress.toLowerCase() == USDT_ADDRESS.toLowerCase() ||
          tokenToAddress.toLowerCase() == USDT_ADDRESS.toLowerCase()
        ) {
          console.log("usdt");
          result = await router.getAmountsOut(amountIn, [
            tokenFromAddress,
            tokenToAddress,
          ]);

          toValue = formatUnits(result["1"], toTokenDecimal);
          // console.log({ amountIn, result, toValue });
        } else {
          console.log("No usdt");

          result = await router.getAmountsOut(amountIn, [
            tokenFromAddress,
            USDT_ADDRESS,
            tokenToAddress,
          ]);
          // console.log("No usdt1");

          toValue = formatUnits(result["2"], toTokenDecimal);
        }

        setToAmount(parseFloat(toValue).toFixed(6));
        // console.log(result);
        if (tokenFromAddress == USDT_ADDRESS) {
          // console.log("in here tokenFromAddress");
          setFromUSD(debouncedFromValue);
          const toUsd = await router.getAmountsOut(result["1"], [
            tokenToAddress,
            USDT_ADDRESS,
          ]);

          const toUsdValue = formatUnits(toUsd["1"], 18);
          setToUSD(toUsdValue);
        } else if (tokenToAddress == USDT_ADDRESS) {
          // console.log("in here tokenToAddress");

          toAmount && setToUSD(toAmount);
          setFromUSD(toValue);
        } else {
          // console.log("in here");

          const fromUsd = await router.getAmountsOut(result["0"], [
            tokenFromAddress,
            USDT_ADDRESS,
          ]);
          const toUsd = await router.getAmountsOut(result["2"], [
            tokenToAddress,
            USDT_ADDRESS,
          ]);

          const fromUsdValue = formatUnits(fromUsd["1"], 18);
          const toUsdValue = formatUnits(toUsd["1"], 18);

          setFromUSD(fromUsdValue);
          setToUSD(toUsdValue);
        }
      } else {
        if (debouncedToValue == "0") {
          setFromAmount("");
          setFromUSD(0);
          setToUSD(0);
          setFetchingPrice(false);
          return;
        }
        // console.log("to");

        const amountOut = parseUnits(debouncedToValue, toTokenDecimal);
        let result;
        let fromValue;
        if (
          tokenFromAddress.toLowerCase() == USDT_ADDRESS.toLowerCase() ||
          tokenToAddress.toLowerCase() == USDT_ADDRESS.toLowerCase()
        ) {
          // console.log("usdt");

          result = await router.getAmountsIn(amountOut, [
            tokenFromAddress,
            tokenToAddress,
          ]);
          fromValue = formatUnits(result["0"], fromTokenDecimal);
          // console.log({ amountOut, result, fromValue });
        } else {
          result = await router.getAmountsIn(amountOut, [
            tokenFromAddress,
            USDT_ADDRESS,
            tokenToAddress,
          ]);
          fromValue = formatUnits(result["0"], fromTokenDecimal);
        }

        // console.log(result);

        setFromAmount(parseFloat(fromValue).toFixed(6));

        if (tokenFromAddress == USDT_ADDRESS) {
          fromAmount && setFromUSD(fromAmount);
          const toUsd = await router.getAmountsOut(result["1"], [
            tokenToAddress,
            USDT_ADDRESS,
          ]);
          const toUsdValue = formatUnits(toUsd["1"], 18);
          setToUSD(toUsdValue);
        } else if (tokenToAddress == USDT_ADDRESS) {
          setToUSD(toAmount);
          setFromUSD(toAmount);
        } else {
          const fromUsd = await router.getAmountsOut(result["0"], [
            tokenFromAddress,
            USDT_ADDRESS,
          ]);
          const toUsd = await router.getAmountsOut(result["2"], [
            tokenToAddress,
            USDT_ADDRESS,
          ]);

          const fromUsdValue = formatUnits(fromUsd["1"], 18);
          const toUsdValue = formatUnits(toUsd["1"], 18);

          setFromUSD(fromUsdValue);
          setToUSD(toUsdValue);
        }
      }

      setTimeout(() => {
        setFetchingPrice(false);
      }, 2000);
    }
  };

  useEffect(() => {
    setFetchingPrice(false);

    if (!fromToken || !toToken) return;

    if (!debouncedFromValue && !debouncedToValue) return;

    if (lastEdited == "from") {
      parseFloat(
        walletBalance.find(
          (b) => b?.symbol?.toLowerCase() === fromToken?.toLowerCase()
        )?.balance
      ) >= parseFloat(fromAmount) && getTokenPriceInUsd();
    } else {
      getTokenPriceInUsd();
    }

    if (!fromAmount && lastEdited == "from") {
      setToAmount("");
      setFromUSD(0);
      setToUSD(0);
    }

    if (!toAmount && lastEdited == "to") {
      setFromAmount("");
      setFromUSD(0);
      setToUSD(0);
    }

    const interval = setInterval(() => {
      if (lastEdited == "from") {
        parseFloat(
          walletBalance.find(
            (b) => b?.symbol?.toLowerCase() === fromToken?.toLowerCase()
          )?.balance
        ) >= parseFloat(fromAmount) && getTokenPriceInUsd();
      } else {
        getTokenPriceInUsd();
      }
    }, 20000);

    setPriceIntervalId(interval);
    return () => clearInterval(interval);
  }, [debouncedFromValue, debouncedToValue, fromToken, toToken]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFromValue(fromAmount);
      // console.log({ fromAmount });
    }, 750);
    return () => clearTimeout(handler);
  }, [fromAmount]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedToValue(toAmount);
      // console.log({ toAmount });
    }, 750);
    return () => clearTimeout(handler);
  }, [toAmount]);

  useEffect(() => {
    if (!isConnected) {
      setToToken(null);
      setFromToken("USDT-ANGH20");
    }
  }, [isConnected]);

  const handleToAmountChange = (e) => {
    // console.log("to Ran");

    setToAmount(e.target.value);
    setLastEdited("to");
  };

  const handleFromAmountChange = (e) => {
    // console.log("from Ran");
    setFromAmount(e.target.value);
    setLastEdited("from");
    // console.log(e.target.value);
  };

  // const handleSwapTokens = () => {
  //   const tempToken = fromToken;
  //   const tempAmount = fromAmount;
  //   setDebouncedFromValue(toAmount);
  //   setDebouncedToValue(tempAmount);
  //   setFromToken(toToken);
  //   setToToken(tempToken);
  //   setFromAmount(toAmount);
  //   setToAmount(tempAmount);
  // };
  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setDebouncedFromValue("");
    setDebouncedToValue("");
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount("");
    setToAmount("");
    setToUSD(0);
    setFromUSD(0);
  };

  const handleSwapButtonClick = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (priceIntervalId) {
      clearInterval(priceIntervalId);
      setPriceIntervalId(null);
    }
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

    // console.log(SILP_PAGE);
    // console.log(DEAD_LINE);

    try {
      if (
        (!fromToken && !toToken) ||
        (!fromAmount && !toAmount) ||
        (parseFloat(fromAmount) <= 0 && parseFloat(toAmount) <= 0)
      ) {
        showError("Invalid: Check token and amount!");
        return;
      }
      setLoading(true);
      const tokenA = getTokenBySymbol(fromToken);
      const tokenB = getTokenBySymbol(toToken);

      const fromTokenContract = new ethers.Contract(
        tokenA.address,
        erc20Abi,
        signer
      );

      const amountFromApprove = parseUnits(fromAmount, tokenA.decimals);

      const tx1 = await fromTokenContract.approve(
        ROUTER_ADDRESS,
        amountFromApprove
      );
      // console.log("Approval tx sent:", tx1.hash);
      await tx1.wait();

      // console.log("Approval confirmed");

      const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);
      // console.log(router);

      const amountIn = parseUnits(fromAmount, tokenA.decimals);
      const amountOutCal = parseUnits(toAmount, tokenB.decimals);
      const slippageBps = Math.floor(SILP_PAGE * 100);
      const amountOutMin =
        (amountOutCal * BigInt(10000 - slippageBps)) / BigInt(10000);
      const path = buildSwapPath(tokenA.address, tokenB.address);
      const to = await signer.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 60 * DEAD_LINE;

      // console.log({ amountIn, amountOutCal, amountOutMin, path, to, deadline });
      const tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
      );

      await tx.wait();

      setBalanceRefresh((prev) => prev + 1);

      const providerr = new ethers.JsonRpcProvider(RPC);
      const contract = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, providerr);
      const rawBalance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      const formatted = formatUnits(rawBalance, decimals);
      console.log({ rawBalance, formatted });

      const withdrawInstance = new ethers.Contract(
        TOKEN_ADDRESS,
        wanghAbi,
        signer
      );

      if (toToken == "ANGH") {
        console.log("Withdrawing ANGH");
        const withdrawTx = await withdrawInstance.withdraw(rawBalance);
        await withdrawTx.wait();
      }

      dispatch(setSuccessMessage("Swap successful!"));
      dispatch(isSuccessModalVisible(true));
      setTimeout(() => {
        dispatch(setSuccessMessage(""));
        dispatch(isSuccessModalVisible(false));
      }, 1500);
      setBalanceRefresh((prev) => prev + 1);
    } catch (err) {
      console.error("Approval failed:", err);
      showError("Transaction Failed!");
    } finally {
      setLoading(false);
      setFromAmount("");
      setToAmount("");
      setToUSD(0);
      setFromUSD(0);
    }
  };

  const handleFromTokenSelect = (token) => {
    setFromToken(token);
    setIsFromModalOpen(false);
  };

  const handleToTokenSelect = (token) => {
    setToToken(token);
    setIsToModalOpen(false);
  };

  return (
    <>
      <div
        className={`transition-all duration-1500 delay-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        } mt-8 lg:mt-0 flex justify-center lg:justify-end`}
      >
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl backdrop-blur-sm overflow-hidden">
          <div className="space-y-4">
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="text-sm items-center text-muted-foreground flex gap-1">
                  From: <Wallet size={15} />
                  {isConnected
                    ? walletBalance.find(
                        (b) =>
                          b?.symbol?.toLowerCase() === fromToken?.toLowerCase()
                      )?.balance
                      ? parseFloat(
                          walletBalance.find(
                            (b) =>
                              b?.symbol?.toLowerCase() ===
                              fromToken?.toLowerCase()
                          )?.balance
                        ).toFixed(4)
                      : "0.0000"
                    : "0.0000"}
                </span>
                <span className="text-sm text-muted-foreground truncate ml-2">
                  $ {parseFloat(fromUSD).toFixed(4)}
                </span>
              </div>
              <div className="bg-muted rounded-xl p-4 hover:bg-muted/80 transition-colors duration-200">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    disabled={!isConnected}
                    onClick={() => setIsFromModalOpen(true)}
                    className="flex items-center space-x-2 text-foreground font-semibold text-base sm:text-lg cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0"
                  >
                    {tokens.find((t) => t.symbol === fromToken)?.icon ? (
                      <img
                        className="h-10"
                        src={tokens.find((t) => t.symbol === fromToken)?.icon}
                        alt=""
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-400 flex justify-center items-center font-semibold text-lg text-white">
                        {fromToken.slice(0, 1)}
                      </div>
                    )}

                    <span>{fromToken ? fromToken : "Select"}</span>
                    <svg
                      className="w-4 h-4 text-muted-foreground"
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
                  <input
                    type="number"
                    value={fromAmount}
                    disabled={loading}
                    onChange={handleFromAmountChange}
                    className="flex-1 min-w-0 bg-transparent text-xl sm:text-2xl font-bold text-foreground border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/50 text-right"
                    placeholder="0.0"
                  />
                </div>
              </div>
              {parseFloat(
                walletBalance.find(
                  (b) => b?.symbol?.toLowerCase() === fromToken?.toLowerCase()
                )?.balance
              ) < parseFloat(fromAmount) && (
                <span className="text-red-400">Insufficient balance</span>
              )}
              <span
                onClick={() => {
                  setFromAmount(
                    walletBalance.find(
                      (b) =>
                        b?.symbol?.toLowerCase() === fromToken?.toLowerCase()
                    )?.balance
                  );
                  // console.log(Math.floor(Date.now() / 1000) + 60 * 10)
                }}
                className="absolute right-3 -bottom-7 font-semibold text-accent cursor-pointer hover:text-accent/80 transition ease-in-out duration-300"
              >
                Max
              </span>
            </div>

            <div className="flex justify-center">
              <button
                disabled={!isConnected || !toToken}
                onClick={handleSwapTokens}
                className="w-10 h-10 cursor-pointer bg-gradient-to-r from-accent to-accent/80 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl border border-accent/20"
              >
                <span className="text-white text-lg font-bold">
                  <ArrowUpDown size={18} />
                </span>
              </button>
            </div>

            {/* <button onClick={() => console.log({ toToken })}>log</button> */}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm items-center text-muted-foreground flex gap-1">
                  To: <Wallet size={15} />
                  {toToken
                    ? walletBalance.find(
                        (b) =>
                          b?.symbol?.toLowerCase() === toToken?.toLowerCase()
                      )?.balance
                      ? parseFloat(
                          walletBalance.find(
                            (b) =>
                              b?.symbol?.toLowerCase() ===
                              toToken?.toLowerCase()
                          )?.balance
                        ).toFixed(4)
                      : "0.0000"
                    : "0.0000"}
                </span>
                <span className="text-sm text-muted-foreground truncate ml-2">
                  $ {parseFloat(toUSD).toFixed(4)}
                </span>
              </div>
              <div className="bg-muted rounded-xl p-4 hover:bg-muted/80 transition-colors duration-200">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    disabled={!isConnected}
                    onClick={() => setIsToModalOpen(true)}
                    className="flex items-center space-x-2 text-foreground font-semibold text-base sm:text-lg cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0"
                  >
                    {tokens.find((t) => t.symbol === toToken)?.icon ? (
                      <img
                        className="h-10"
                        src={tokens.find((t) => t.symbol === toToken)?.icon}
                        alt=""
                      />
                    ) : (
                      toToken && (
                        <div className="h-10 w-10 rounded-full bg-gray-400 flex justify-center items-center font-semibold text-lg text-white">
                          {toToken.slice(0, 1)}
                        </div>
                      )
                    )}

                    <span>{toToken ? toToken : "Select"}</span>
                    <svg
                      className="w-4 h-4 text-muted-foreground"
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
                  <input
                    type="number"
                    value={toAmount}
                    disabled={!toToken || loading}
                    onChange={handleToAmountChange}
                    className={`w-full bg-transparent text-xl sm:text-2xl font-bold text-foreground border-none outline-none text-right
      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
      ${!toToken ? "cursor-not-allowed opacity-70" : ""}`}
                    placeholder="0.0"
                  />
                </div>
              </div>
              {/* {parseFloat(
                walletBalance.find(
                  (b) => b?.symbol?.toLowerCase() === toToken?.toLowerCase()
                )?.balance
              ) < parseFloat(toAmount) && (
                <span className="text-red-400">Insufficient balance</span>
              )} */}
            </div>

            {isConnected ? (
              <button
                onClick={handleSwapButtonClick}
                disabled={
                  (!toToken && !fromToken) ||
                  fetchingPrice ||
                  parseFloat(
                    walletBalance.find(
                      (b) =>
                        b?.symbol?.toLowerCase() === fromToken?.toLowerCase()
                    )?.balance
                  ) < parseFloat(fromAmount)
                }
                className={`w-full relative overflow-hidden h-12 cursor-pointer text-accent-foreground  rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-sm border
    ${
      toToken &&
      parseFloat(
        walletBalance.find(
          (b) => b?.symbol?.toLowerCase() === fromToken?.toLowerCase()
        )?.balance
      ) >= parseFloat(fromAmount) &&
      fromToken &&
      !fetchingPrice
        ? "bg-gradient-to-r from-accent to-accent/90 hover:scale-105 active:scale-95 hover:shadow-xl border-accent/20"
        : "bg-gray-500 cursor-not-allowed"
    }`}
              >
                {loading ? (
                  <div className="absolute inset-0 bg-black/60 z-50 backdrop-blur-lg flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg "></span>
                  </div>
                ) : toToken && fromToken ? (
                  fetchingPrice ? (
                    "Fetching Best Price..."
                  ) : parseFloat(
                      walletBalance.find(
                        (b) =>
                          b?.symbol?.toLowerCase() === fromToken?.toLowerCase()
                      )?.balance
                    ) < parseFloat(fromAmount) ? (
                    "Insufficient Balance"
                  ) : (
                    "Swap Tokens"
                  )
                ) : (
                  "Select Token"
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  showModal(true);
                }}
                className="w-full cursor-pointer text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 hover:shadow-xl border border-purple-200"
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

      <TokenModal
        isOpen={isFromModalOpen}
        onClose={() => setIsFromModalOpen(false)}
        onTokenSelect={handleFromTokenSelect}
        tokens={tokens.filter((t) => t.symbol !== toToken)}
        walletBalance={walletBalance}
        onAddToken={handleAddToken}
      />

      <TokenModal
        isOpen={isToModalOpen}
        onClose={() => setIsToModalOpen(false)}
        onTokenSelect={handleToTokenSelect}
        tokens={tokens.filter((t) => t.symbol !== fromToken)}
        walletBalance={walletBalance}
        onAddToken={handleAddToken}
      />
    </>
  );
}

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
