import { useEffect, useState } from "react";
import { ethers, isAddress } from "ethers";
import ERC20ABI from "../ERC20Abi.json";
import useEthers from "../hooks/useEthers";
import { useLocation } from "react-router";

export default function TokenModal({
  isOpen,
  onClose,
  onTokenSelect,
  tokens,
  walletBalance,
  onAddToken,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { provider } = useEthers();

  const isPage = location.pathname === "/buy";

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!isAddress(searchTerm)) return;
      if (
        tokens.find((t) => t.address.toLowerCase() === searchTerm.toLowerCase())
      )
        return;

      setLoading(true);
      try {
        const contract = new ethers.Contract(searchTerm, ERC20ABI, provider);

        const name = await contract.name();
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();

        const newToken = {
          symbol,
          name,
          address: searchTerm,
          decimals: parseInt(decimals),
        };
        console.log(newToken);
        // Save token in localStorage
        const stored = localStorage.getItem("userTokens");
        const userTokens = stored ? JSON.parse(stored) : [];
        // Avoid duplicates
        if (
          !userTokens.find(
            (t) => t.address.toLowerCase() === newToken.address.toLowerCase()
          )
        ) {
          userTokens.push(newToken);
          localStorage.setItem("userTokens", JSON.stringify(userTokens));
        }

        onAddToken(newToken);
      } catch (error) {
        console.error("Error fetching token details:", error);
      }
      setLoading(false);
    };

    fetchTokenDetails();
  }, [searchTerm]);

  const handleTokenSelect = (tokenSymbol) => {
    onTokenSelect(tokenSymbol);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Select Token</h3>
            <button
              onClick={onClose}
              className="w-8 cursor-pointer h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors duration-200"
            >
              <span className="text-muted-foreground text-lg">×</span>
            </button>
          </div>

          {!isPage && <div className="mb-4">
            <input
              type="text"
              placeholder="Search tokens or paste address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            />
            {loading && (
              <p className="text-sm text-muted-foreground mt-2">
                Loading token details...
              </p>
            )}
          </div>}

          <div className="max-h-80 overflow-y-auto space-y-2 px-2">
            {filteredTokens.map((token) => {
              const balanceObj = walletBalance.find(
                (b) => b.symbol.toLowerCase() === token.symbol.toLowerCase()
              );
              // console.log(balanceObj);
              return (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token.symbol)}
                  className="w-full cursor-pointer flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted hover:from-accent/20 hover:to-accent/10 border border-transparent hover:border-accent/30 transition-all duration-300 hover:shadow-lg group transform-gpu"
                  style={{ transformOrigin: "center" }}
                >
                  {token.icon ? (
                    <img className="h-10" src={token.icon} />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-400 flex justify-center items-center font-semibold text-lg text-white">
                      {token.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-foreground group-hover:text-accent transition-colors duration-200">
                      {token.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {token.name}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Balance:{" "}
                    {balanceObj ? parseFloat(balanceObj.balance).toFixed(4) : 0}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
