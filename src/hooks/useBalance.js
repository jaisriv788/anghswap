import { useEffect, useState } from "react";
import { ethers } from "ethers";
import erc20Abi from "../ERC20Abi.json";
import { useSelector } from "react-redux";

export default function useBalances(provider, tokens, refreshTrigger = 0) {
  const [balances, setBalances] = useState([]);
  const [fetched, setFetched] = useState(false); // ✅ stop continuous fetching
  const address = useSelector((state) => state.user.walletAddress);
  const isConnected = useSelector((state) => state.user.isConnected);
  const RPC = useSelector((state) => state.global.rpc_one);
  const isRefreshed = useSelector((state) => state.user.refresher);

  useEffect(() => {
    // console.log({ tokens });
    // console.log({ address, isConnected, fetched, refreshTrigger, isRefreshed });
    if (!address || !isConnected) {
      setBalances([]);
      return;
    }
    if (fetched && refreshTrigger === 0) {
      setFetched(false);
      return;
    } // stop continuous fetch unless refresh is triggered

    async function fetchBalances() {
      try {
        const results = [];

        const providerr = new ethers.JsonRpcProvider(RPC);

        for (let token of tokens) {
          if (token.address == "0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3") {
            const providerrOpBNB = new ethers.JsonRpcProvider(
              "https://opbnb-mainnet-rpc.bnbchain.org"
            );

            const contract = new ethers.Contract(
              token.address,
              erc20Abi,
              providerrOpBNB
            );

            const [rawBal, decimals, symbol] = await Promise.all([
              contract.balanceOf(address),
              contract.decimals(),
              contract.symbol(),
            ]);

            console.log({ rawBal, decimals, symbol });
            results.push({
              symbol:"USDT-OpBNB",
              balance: ethers.formatUnits(rawBal, decimals),
            });

            continue;
          }

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

        console.log({ results });
        setBalances(results);
        setFetched(true);
      } catch (err) {
        console.error("Error fetching balances:", err);
      }
    }

    fetchBalances();
  }, [address, isConnected, tokens, refreshTrigger, isRefreshed]);

  return balances;
}
