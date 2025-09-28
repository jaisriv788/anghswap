import { useEffect, useState } from "react";
import useEthers from "../hooks/useEthers";
import { useSelector } from "react-redux";
import safepalSrc from "../assets/safepal.png";

function WalletOptions({ showModal }) {
  const [wallets, setWallets] = useState([]);
  const { connectWallet } = useEthers();
  const isConnected = useSelector((state) => state.user.isConnected);
  const connectedWallet = sessionStorage.getItem("walletName");

  useEffect(() => {
    let detected = [];

    function handler(event) {
      detected.push(event.detail);
      setWallets([...detected]);
    }

    window.addEventListener("eip6963:announceProvider", handler);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    setTimeout(async () => {
      if (
        detected.length === 0 &&
        window.ethereum &&
        window.ethereum.isSafePal
      ) {
        let accounts = [];
        try {
          accounts = await window.ethereum.request({ method: "eth_accounts" });
        } catch (err) {
          console.log(err);
        }
        const dynamicUuid = accounts.length
          ? `safepal-${accounts[0].slice(0, 6)}`
          : `safepal-${Date.now()}`;
        detected.push({
          info: {
            name: "SafePal",
            icon: safepalSrc,
            uuid: dynamicUuid,
          },
          provider: window.ethereum,
        });
        setWallets([...detected]);
      }
    }, 1000);

    return () =>
      window.removeEventListener("eip6963:announceProvider", handler);
  }, []);

  return (
    <div
      onClick={() => showModal(false)}
      className="fixed bg-black/50 backdrop-blur-sm inset-0 z-50 flex justify-center items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card min-w-[380px] border border-border rounded-2xl w-full max-w-md shadow-xl animate-in fade-in-0 zoom-in-95 duration-300"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">
              Connect Wallet
            </h3>
            <button
              onClick={() => showModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <span className="text-muted-foreground text-lg cursor-pointer">
                ×
              </span>
            </button>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-72 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
            {wallets.map((wallet, i) => (
              <button
                key={i}
                onClick={() => {
                  connectWallet(wallet);
                  showModal(false);
                }}
                disabled={isConnected}
                className="flex items-center min-h-14 space-x-3 p-3 border rounded-xl shadow-sm relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-emerald-400 disabled:cursor-not-allowed"
              >
                {isConnected && wallet.info.name !== connectedWallet && (
                  <div className="bg-black/5 absolute inset-0 w-full h-full rounded-xl"></div>
                )}
                <img
                  src={wallet.info.icon}
                  alt={wallet.info.name}
                  className="w-10 h-10 rounded-full border shadow-sm"
                />
                <span className="font-medium text-foreground">
                  {wallet.info.name}
                </span>
                {isConnected && wallet.info.name === connectedWallet && (
                  <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                )}
              </button>
            ))}
          </div>
          {isConnected && (
            <div className="mt-4 text-xs text-center text-muted-foreground">
              <span className="font-semibold text-foreground">Note:</span>{" "}
              Disconnect the current wallet to switch wallets.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletOptions;

// import { useEffect, useState } from "react";
// import useEthers from "../hooks/useEthers";
// import { useSelector } from "react-redux";

// function WalletOptions({ showModal }) {
//   const [wallets, setWallets] = useState([]);
//   const { connectWallet } = useEthers();

//   const isConnected = useSelector((state) => state.user.isConnected);
//   const connectedWallet = sessionStorage.getItem("walletName");

//   useEffect(() => {
//     let detected = [];

//     function handler(event) {
//       detected.push(event.detail);
//       setWallets([...detected]);
//     }

//     window.addEventListener("eip6963:announceProvider", handler);
//     window.dispatchEvent(new Event("eip6963:requestProvider"));

//     if (detected.length == 0) {
//       if (window.ethereum) {
//         if (window.ethereum.isSafePal) {

//           detected.push({
//             info: {
//               name: "SafePal",
//               icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
//               uuid: "injected",
//             },
//             provider: window.ethereum,
//           });
//           setWallets([...detected]);
//         }
//       } else {
//         alert("No Wallet Detected");
//       }
//     }
//     return () =>
//       window.removeEventListener("eip6963:announceProvider", handler);
//   }, []);

//   return (
//     <div
//       onClick={() => showModal(false)}
//       className="fixed bg-black/50 backdrop-blur-sm inset-0 z-50 flex justify-center items-center"
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className="bg-card min-w-[380px] border border-border rounded-2xl w-full max-w-md shadow-xl animate-in fade-in-0 zoom-in-95 duration-300"
//       >
//         <div className="p-6">
//           {/* Header */}
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-xl font-bold text-foreground">
//               Connect Wallet
//             </h3>
//             <button
//               onClick={() => showModal(false)}
//               className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
//             >
//               <span className="text-muted-foreground text-lg cursor-pointer">
//                 ×
//               </span>
//             </button>
//           </div>

//           {/* Wallet List with Scroll */}
//           <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-72 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
//             {wallets.map((wallet, i) => (
//               <button
//                 key={i}
//                 onClick={() => {
//                   connectWallet(wallet); // ✅ useEthers handles connection
//                   showModal(false);
//                 }}
//                 disabled={isConnected}
//                 className="flex items-center min-h-14 space-x-3 p-3 border rounded-xl shadow-sm relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-emerald-400 disabled:cursor-not-allowed"
//               >
//                 {isConnected && wallet.info.name !== connectedWallet && (
//                   <div className="bg-black/5 absolute inset-0 w-full h-full rounded-xl"></div>
//                 )}

//                 <img
//                   src={wallet.info.icon}
//                   alt={wallet.info.name}
//                   className="w-10 h-10 rounded-full border shadow-sm"
//                 />
//                 <span className="font-medium text-foreground">
//                   {wallet.info.name}
//                 </span>

//                 {isConnected && wallet.info.name == connectedWallet && (
//                   <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
//                     Connected
//                   </span>
//                 )}
//               </button>
//             ))}
//           </div>

//           {/* Note Section */}
//           {isConnected && (
//             <div className="mt-4 text-xs text-center text-muted-foreground">
//               <span className="font-semibold text-foreground">Note:</span>{" "}
//               Disconnect the current wallet to switch wallets.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default WalletOptions;
