import { useEffect, useState } from "react";
import TokenModal from "./TokenModal";
import { useSelector, useDispatch } from "react-redux";
import useEthers from "../hooks/useEthers";
import {
  BrowserProvider,
  Contract,
  formatUnits,
  parseUnits,
  ZeroAddress,
} from "ethers";
import routerAbi from "../routerAbi.json";
import useBalance from "../hooks/useBalance";
import erc20Abi from "../ERC20Abi.json";
import { tkns as tokens } from "../Data/data";
import { ArrowUpDown, Wallet } from "lucide-react";
// import base32 from "hi-base32";
import {
  isSuccessModalVisible,
  isErrorModalVisible,
  setSuccessMessage,
  setErrorMessage,
} from "../redux/slice/modalSlice";
import { zeroAddress } from "viem";
import axios from "axios";

export default function BuyBox({ isVisible, showModal }) {
  const [fromToken, setFromToken] = useState("USDT-OpBNB");
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
  const { connectWallet, provider, provider2 } = useEthers();
  const dispatch = useDispatch();
  const isConnected = useSelector((state) => state.user.isConnected);
  const walletAddress = useSelector((state) => state.user.walletAddress);

  const ROUTER_ADDRESS = useSelector((state) => state.global.routerAddress);
  // const FACTORY_ADDRESS = useSelector((state) => state.global.factoryAddress);
  const USDT_ADDRESS = "0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3";
  const DEAD_LINE = useSelector(
    (state) => state.transaction.transactionDeadline
  );
  const SILP_PAGE = useSelector((state) => state.transaction.slippageTolerance);

  const OPBNB_BRIDGE = "0x6a5f01FD554038756B107002E0ACD7d8f15A97Bc";
  const ANGH_BRIDGE = "0xd620d6c887ea243449b0ffb71534827fe82e0913";

  const opBridgeAbi = [
    "function deposit(uint256 amount) external",
    "function claim(uint256 srcChainId, bytes32 srcTxHash, address to, uint256 amount, bytes signature) external",
  ];

  const anghBridgeAbi = [
    "function depositToken(address token, uint256 amount) external",
    "function depositNative() external payable",
    "function claim(uint256 srcChainId, bytes32 srcTxHash, address payable to, address token, uint256 amount, bytes signature) external",
  ];

  const walletBalance = useBalance(provider, tokens, balanceRefresh);

  const showError = (msg) => {
    dispatch(setErrorMessage(msg));
    dispatch(isErrorModalVisible(true));
    setTimeout(() => {
      dispatch(setErrorMessage(""));
      dispatch(isErrorModalVisible(false));
    }, 1500);
  };

  // const buildSwapPath = (tokenA, tokenB) => {
  //   if (tokenA === tokenB) {
  //     throw new Error("Invalid: same token swap not allowed");
  //   }

  //   // If either is USDT, swap directly
  //   if (tokenA === USDT_ADDRESS || tokenB === USDT_ADDRESS) {
  //     return [tokenA, tokenB];
  //   }

  //   // Otherwise, route via USDT
  //   return [tokenA, USDT_ADDRESS, tokenB];
  // };

  const waitForChainId = async (prov, expectedChainId, timeout = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const chainId = await prov.request({ method: "eth_chainId" });
      if (chainId.toLowerCase() === expectedChainId.toLowerCase()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait half a second before retrying
    }
    throw new Error("Network switch timeout");
  };

  const CHAIN_PARAMS = {
    chainId: "0x420A8",
    chainName: "AnghChain Mainnet",
    nativeCurrency: { name: "ANGH", symbol: "ANGH", decimals: 18 },
    rpcUrls: ["https://rpc.anghscan.org/"],
    blockExplorerUrls: ["https://anghscan.org/"],
  };

  const switchNetworkToAngh = async (prov) => {
    if (!prov?.request) return;

    try {
      await prov.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_PARAMS.chainId }],
      });
      console.log("Switch request sent to AnghChain");

      // Wait until network is confirmed
      await waitForChainId(prov, CHAIN_PARAMS.chainId);
      console.log("Switched to AnghChain successfully");
    } catch (error) {
      if (error.code === 4902) {
        await prov.request({
          method: "wallet_addEthereumChain",
          params: [CHAIN_PARAMS],
        });
        console.log("Added and switched to AnghChain");

        await waitForChainId(prov, CHAIN_PARAMS.chainId);
      } else {
        throw error;
      }
    }
  };

  const CHAIN_PARAMS2 = {
    chainId: "0xCC",
    chainName: "opBNB Mainnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://opbnb-mainnet-rpc.bnbchain.org"],
    blockExplorerUrls: ["https://opbnbscan.com"],
  };

  const switchNetworkToOpBNB = async (prov) => {
    if (!prov?.request) return;

    try {
      await prov.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_PARAMS2.chainId }],
      });
      console.log("Switch request sent to opBNB");

      await waitForChainId(prov, CHAIN_PARAMS2.chainId);
      console.log("Switched to opBNB successfully");
    } catch (error) {
      if (error.code === 4902) {
        await prov.request({
          method: "wallet_addEthereumChain",
          params: [CHAIN_PARAMS2],
        });
        console.log("Added and switched to opBNB");

        await waitForChainId(prov, CHAIN_PARAMS2.chainId);
      } else {
        throw error;
      }
    }
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
    console.log({fromUSD, toUSD});
    
    if (isConnected && toToken) {
      // const providerr = new ethers.JsonRpcProvider(
      //   "https://bsc-dataseed.binance.org/"
      // );
      // console.log("usd");
      setFetchingPrice(true);
      const router = new Contract(ROUTER_ADDRESS, routerAbi, provider); //if Error replace provider with providerr
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
        let result;
        let toValue;
        const amountIn = parseUnits(debouncedFromValue, fromTokenDecimal);

        if (parseFloat(fromAmount) > 0) {
          if (tokenFromAddress.toLowerCase() == USDT_ADDRESS.toLowerCase()) {
            if (toToken == "USDT-ANGH20") {
              toValue = fromAmount;
              console.log(typeof toValue);
            } else if (toToken == "ANGH") {
              result = await router.getAmountsOut(amountIn, [
                "0xd1b7916d20F3b9D439B66AF25FC45f6A28c157d0",
                tokenToAddress,
              ]);

              let val = formatUnits(result["1"], toTokenDecimal);

              let arr = val.split(".");
              arr[1] = arr[1].slice(0, 4);
              toValue = arr.join(".");
            } else if (toToken == "ZNX") {
              toValue = parseFloat(fromAmount) / 10;
            }
          } else {
            if (fromToken == "USDT-ANGH20") {
              toValue = fromAmount;
            } else if (fromToken == "ANGH") {
              result = await router.getAmountsOut(amountIn, [
                tokenFromAddress,
                "0xd1b7916d20F3b9D439B66AF25FC45f6A28c157d0",
              ]);

              let val = formatUnits(result["1"], fromTokenDecimal);

              let arr = val.split(".");
              arr[1] = arr[1].slice(0, 4);
              toValue = arr.join(".");
            } else if (fromToken == "ZNX") {
              toValue = parseFloat(fromAmount) * 10;
            }
          }

          setToAmount(toValue);
        }
        // console.log(result);
        // if (tokenFromAddress == USDT_ADDRESS) {
        //   // console.log("in here tokenFromAddress");
        //   setFromUSD(debouncedFromValue);
        //   const toUsd = await router.getAmountsOut(result["1"], [
        //     tokenToAddress,
        //     USDT_ADDRESS,
        //   ]);

        //   const toUsdValue = formatUnits(toUsd["1"], 18);
        //   setToUSD(toUsdValue);
        // } else if (tokenToAddress == USDT_ADDRESS) {
        //   // console.log("in here tokenToAddress");

        //   toAmount && setToUSD(toAmount);
        //   setFromUSD(toValue);
        // } else {
        //   // console.log("in here");

        //   const fromUsd = await router.getAmountsOut(result["0"], [
        //     tokenFromAddress,
        //     USDT_ADDRESS,
        //   ]);
        //   const toUsd = await router.getAmountsOut(result["2"], [
        //     tokenToAddress,
        //     USDT_ADDRESS,
        //   ]);

        //   const fromUsdValue = formatUnits(fromUsd["1"], 18);
        //   const toUsdValue = formatUnits(toUsd["1"], 18);

        //   setFromUSD(fromUsdValue);
        //   setToUSD(toUsdValue);
        // }
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

    getTokenPriceInUsd();

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
      setFromToken("USDT-OpBNB");
    }
  }, [isConnected]);

  const handleToAmountChange = (e) => {
    // console.log("to Ran");

    setToAmount(e.target.value);
    setLastEdited("to");
  };

  const handleFromAmountChange = (e) => {
    // console.log("from Ran");
    if (e.target.value < 0) {
      setFromAmount("0");
      return;
    }
    const rawValue = e.target.value;
    const wholeNumber = rawValue === "" ? "" : Math.floor(Number(rawValue));
    const n = String(wholeNumber);
    // console.log(typeof n);

    setFromAmount(n);

    setLastEdited("from");
    // console.log(e.target.value);
  };

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

    try {
      console.log(typeof fromAmount);
      console.log(typeof toAmount);
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

      const value = parseUnits(fromAmount, 18);
      const prov = provider2 || window.ethereum;
      let txHash;
      let srcChain;
      let destChain;
      const recipient = walletAddress;
      if (tokenA.symbol == "USDT-OpBNB") {
        console.log("1");

        await switchNetworkToOpBNB(provider2 || window.ethereum);
        console.log("2");

        const ethersProvider = new BrowserProvider(prov);
        const signer = await ethersProvider.getSigner();

        const bridge = new Contract(OPBNB_BRIDGE, opBridgeAbi, signer);
        console.log(tokenA.address);

        const usdt = new Contract(tokenA.address, erc20Abi, signer);
        console.log({ value });

        const allowance = await usdt.allowance(walletAddress, OPBNB_BRIDGE);

        if (allowance < value) {
          console.log({ OPBNB_BRIDGE, value });

          const approveTx = await usdt.approve(OPBNB_BRIDGE, value);
          console.log("Waiting for approval confirmation...");
          await approveTx.wait();
          console.log("Approval confirmed.");
        }
        const tx = await bridge.deposit(value, { gasLimit: 300000 });
        await tx.wait();
        txHash = tx.hash;
        srcChain = "opbnb";
        destChain = "angh";
        console.log({ txHash, srcChain, destChain });
        await switchNetworkToAngh(provider2 || window.ethereum);
      } else {
        console.log("1a");
        await switchNetworkToAngh(provider2 || window.ethereum);
        console.log("2a");

        const ethersProvider = new BrowserProvider(prov);
        const signer = await ethersProvider.getSigner();

        const bridge = new Contract(ANGH_BRIDGE, anghBridgeAbi, signer);
        if (tokenA.symbol == "ANGH") {
          console.log("3a");

          const tx = await bridge.depositNative({ value });
          await tx.wait();
          txHash = tx.hash;
          srcChain = "angh";
          destChain = "opbnb";
          console.log({ txHash, srcChain, destChain });
        } else {
          console.log(tokenA.address);

          const tokenCtr = new Contract(tokenA.address, erc20Abi, signer);
          console.log("5a");

          const allowance = await tokenCtr.allowance(
            walletAddress,
            ANGH_BRIDGE
          );
          console.log({ allowance, value });

          if (allowance < value) {
            console.log({ ANGH_BRIDGE, value });
            const approveTx = await tokenCtr.approve(ANGH_BRIDGE, value);
            console.log("Waiting for approval confirmation...");
            await approveTx.wait();
            console.log("Approval confirmed.");
          }
          const tx = await bridge.depositToken(tokenA.address, value, {
            gasLimit: 300000,
          });
          await tx.wait();
          txHash = tx.hash;
          srcChain = "angh";
          destChain = "opbnb";
          console.log({ txHash, srcChain, destChain });
        }
      }

      let desiredToken;

      if (tokenB.symbol == "ANGH") {
        desiredToken = zeroAddress;
      } else {
        desiredToken = tokenB.address;
      }
      console.log({ srcChain, txHash, destChain, desiredToken, recipient });

      // async function hitAfterDelay() {
      try {
        const res = await axios.post(
          "https://anghswap.info:3535/verify-and-sign",
          {
            srcChain,
            txHash,
            destChain,
            desiredToken,
            recipient,
          }
        );
        const data = await res.data;

        if (!data.ok) {
          console.log("Relayer error: " + JSON.stringify(data));
          return;
        }

        if (destChain === "opbnb") {
          await switchNetworkToOpBNB(provider2 || window.ethereum);

          const ethersProvider = new BrowserProvider(prov);
          const signer = await ethersProvider.getSigner();

          const bridge = new Contract(OPBNB_BRIDGE, opBridgeAbi, signer);
          const amount = parseUnits(toAmount, 18);
          const tx = await bridge.claim(
            270504,
            txHash,
            recipient,
            amount,
            data.signature,
            { gasLimit: 600000 }
          );
          await tx.wait();
          console.log(tx.hash);
          await switchNetworkToAngh(provider2 || window.ethereum);
        } else {
          await switchNetworkToAngh(provider2 || window.ethereum);

          const ethersProvider = new BrowserProvider(prov);
          const signer = await ethersProvider.getSigner();

          const bridge = new Contract(ANGH_BRIDGE, anghBridgeAbi, signer);

          const amount = parseUnits(toAmount, 18);
          let tx;

          let tokenAddr;

          if (tokenB.symbol == "ANGH") {
            tokenAddr = zeroAddress;
          } else {
            tokenAddr = tokenB.address;
          }

          console.log({ txHash });
          tx = await bridge.claim(
            204,
            txHash,
            recipient,
            tokenAddr,
            amount,
            data.signature,
            { gasLimit: 600000 }
          );

          await tx.wait();
          console.log(tx.hash);
          setBalanceRefresh((prev) => prev + 1);
        }
        dispatch(setSuccessMessage("Swap successful!"));
        dispatch(isSuccessModalVisible(true));
        setTimeout(() => {
          dispatch(setSuccessMessage(""));
          dispatch(isSuccessModalVisible(false));
        }, 1500);
        setBalanceRefresh((prev) => prev + 1);
        setFromAmount("");
        setToAmount("");
        setLoading(false);
        setToToken(null);

        // setTimeout(() => {
        //   window.location.reload();
        // }, 3000);
      } catch (err) {
        console.log("Relayer error: " + JSON.stringify(err));
        dispatch(setSuccessMessage("Swap successful!"));
        dispatch(isSuccessModalVisible(true));
        setTimeout(() => {
          dispatch(setSuccessMessage(""));
          dispatch(isSuccessModalVisible(false));
        }, 1500);
        setFromAmount("");
        setToAmount("");
        setLoading(false);
        setBalanceRefresh((prev) => prev + 1);
        // setToToken(null);
        // setTimeout(() => {
        //   window.location.reload();
        // }, 3000);
        return;
      }
      // }

      // setTimeout(() => {
      //   hitAfterDelay();
      // }, 60000);
    } catch (err) {
      console.error("Approval failed:", err);
      setLoading(false);
      showError("Transaction Failed!");
      // window.location.reload();
    } finally {
      await switchNetworkToAngh(provider2 || window.ethereum);
      setBalanceRefresh((prev) => prev + 1);
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
                {/* <span className="text-sm text-muted-foreground truncate ml-2">
                  $ {parseFloat(fromUSD).toFixed(4)}
                </span> */}
              </div>
              <div className="bg-muted rounded-xl p-4 hover:bg-muted/80 transition-colors duration-200">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    disabled={
                      !isConnected ||
                      tokens.find((t) => t.symbol === fromToken)?.address ==
                        USDT_ADDRESS
                    }
                    onClick={() => setIsFromModalOpen(true)}
                    className="flex items-center space-x-2 text-foreground font-semibold text-base sm:text-lg cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0"
                  >
                    <img
                      className="h-10"
                      src={tokens.find((t) => t.symbol === fromToken)?.icon}
                      alt=""
                    />

                    <span>{fromToken ? fromToken : "Select"}</span>
                    {tokens.find((t) => t.symbol === fromToken)?.address !=
                      USDT_ADDRESS && (
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
                    )}
                  </button>
                  <input
                    type="number"
                    value={fromAmount}
                    disabled={loading}
                    onChange={handleFromAmountChange}
                    // onWheel={(e) => e.preventDefault()}
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
                onClick={() =>
                  fromToken &&
                  setFromAmount(
                    String(
                      Math.floor(
                        walletBalance.find(
                          (b) =>
                            b?.symbol?.toLowerCase() ===
                            fromToken?.toLowerCase()
                        )?.balance
                      )
                    )
                  )
                }
                className="absolute right-3 -bottom-7 font-semibold text-accent cursor-pointer hover:text-accent/80 transition ease-in-out duration-300"
              >
                Max
              </span>
            </div>

            <div className="flex justify-center">
              <button
                disabled={!isConnected}
                onClick={handleSwapTokens}
                className="w-10 h-10 cursor-pointer bg-gradient-to-r from-accent to-accent/80 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl border border-accent/20"
              >
                <span className="text-white text-lg font-bold">
                  <ArrowUpDown size={18} />
                </span>
              </button>
            </div>

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
                {/* <span className="text-sm text-muted-foreground truncate ml-2">
                  $ {parseFloat(toUSD).toFixed(4)}
                </span> */}
              </div>
              <div className="bg-muted rounded-xl p-4 hover:bg-muted/80 transition-colors duration-200">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    disabled={
                      !isConnected ||
                      tokens.find((t) => t.symbol === toToken)?.address ==
                        USDT_ADDRESS
                    }
                    onClick={() => setIsToModalOpen(true)}
                    className="flex items-center space-x-2 text-foreground font-semibold text-base sm:text-lg cursor-pointer transition-all duration-300 hover:scale-105 flex-shrink-0"
                  >
                    <img
                      className="h-10"
                      src={tokens.find((t) => t.symbol === toToken)?.icon}
                      alt=""
                    />

                    <span>{toToken ? toToken : "Select"}</span>
                    {tokens.find((t) => t.symbol === toToken)?.address !=
                      USDT_ADDRESS && (
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
                    )}
                  </button>
                  <input
                    type="number"
                    value={toAmount}
                    disabled
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
                // disabled
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
                    `Buy ${toToken ? toToken : "Token"}`
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
          <p className="text-sm text-center mt-3 font-semibold">
            Enter the value in the Multiple of 1.
          </p>
          {loading && (
            <p className="text-sm text-center mt-3 font-semibold text-red-600">
              Please Wait & Do Not Reload The Page.
            </p>
          )}
        </div>
      </div>

      <TokenModal
        isOpen={isFromModalOpen}
        onClose={() => setIsFromModalOpen(false)}
        onTokenSelect={handleFromTokenSelect}
        tokens={tokens.filter((t) => t.symbol !== toToken)}
        walletBalance={walletBalance}
      />

      <TokenModal
        isOpen={isToModalOpen}
        onClose={() => setIsToModalOpen(false)}
        onTokenSelect={handleToTokenSelect}
        tokens={tokens.filter((t) => t.symbol !== fromToken)}
        walletBalance={walletBalance}
      />
    </>
  );
}

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
