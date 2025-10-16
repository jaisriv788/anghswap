import { Routes, Route } from "react-router";
import Landing from "./screens/Landing";
import Navbar from "./components/Navbar";
import Trade from "./screens/Trade";
import Liquidity from "./screens/Liquidity";
import Withdraw from "./screens/Withdraw";
import TestingScreen from "./screens/TesingScreen";
import Notice from "./components/Notice";
import Buy from "./screens/Buy";
import Setting from "./components/Settings";
import { useDispatch, useSelector } from "react-redux";
import { isSettingModalVisible } from "./redux/slice/modalSlice";
import { useEffect, useState } from "react";
import WalletOptions from "./components/WalletOptions";

function App() {
  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState("")

  const dispatch = useDispatch();
  const isSetModalVisible = useSelector(
    (state) => state.showModal.showSettingModal
  );

  const showSuccessModal = useSelector(
    (state) => state.showModal.showSuccessModal
  );
  const showErrorModal = useSelector((state) => state.showModal.showErrorModal);
  const successMessage = useSelector((state) => state.showModal.successMessage);
  const errorMessage = useSelector((state) => state.showModal.errorMessage);

  function visibility(val) {
    setShowModal(val);
  }

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          console.log("🚨 Wallet disconnected");
        } else {
          console.log("🔄 Wallet address changed:", accounts[0]);
        }
      });

      window.ethereum.on("chainChanged", (chainId) => {
        console.log("🌐 Network changed:", chainId);
      });

      window.ethereum.on("disconnect", (error) => {
        console.log("❌ Wallet disconnected:", error);
      });
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", () => { });
        window.ethereum.removeListener("chainChanged", () => { });
        window.ethereum.removeListener("disconnect", () => { });
      }
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* <div
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: `
        radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #ec4899 100%)
      `,
          backgroundSize: "100% 100%",
        }}
      /> */}
      {/* 
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px),
        radial-gradient(circle 800px at 100% 200px, #d5c5ff, transparent)
      `,
          backgroundSize: "96px 64px, 96px 64px, 100% 100%",
        }}
      /> */}

      {/* <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        linear-gradient(135deg, 
          rgba(248,250,252,1) 0%, 
          rgba(219,234,254,0.7) 30%, 
          rgba(165,180,252,0.5) 60%, 
          rgba(129,140,248,0.6) 100%
        ),
        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(199,210,254,0.4) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(224,231,255,0.3) 0%, transparent 60%)
      `,
        }}
      /> */}

      {/* <div
        className="absolute inset-0 z-0"
        style={{
          background: "#ffffff",
          backgroundImage: `
       radial-gradient(circle at top center, rgba(59, 130, 246, 0.5),transparent 70%)
     `,
        }}
      /> */}

      {/* <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px),
        radial-gradient(circle 800px at 0% 200px, #d5c5ff, transparent)
      `,
          backgroundSize: "96px 64px, 96px 64px, 100% 100%",
        }}
      /> */}

      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
        radial-gradient(circle 500px at 0% 20%, rgba(139,92,246,0.3), transparent),
        radial-gradient(circle 500px at 100% 0%, rgba(59,130,246,0.3), transparent)
      `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />

      {showSuccessModal && (
        <div
          role="alert"
          className="fixed right-2 bottom-2 opacity-85 text-white font-semibold bg-emerald-500 alert alert-success z-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {showErrorModal && (
        <div
          role="alert"
          className="fixed z-50 right-2 bottom-2 bg-red-500 opacity-85 text-white font-semibold alert alert-error"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {isOpen && (
        <Notice
          setIsOpen={setIsOpen}
          setMsg={setMsg}
          message={msg}
        />
      )}

      {showModal && <WalletOptions showModal={visibility} />}
      <Setting
        isOpen={isSetModalVisible}
        onClose={() => dispatch(isSettingModalVisible(false))}
      />
      <Navbar showModal={visibility} setIsOpen={setIsOpen} setMsg={setMsg} />
      <Routes>
        <Route path="/" element={<Landing showModal={visibility} setIsOpen={setIsOpen} setMsg={setMsg} />} />
        <Route path="/trade" element={<Trade showModal={visibility} setIsOpen={setIsOpen} setMsg={setMsg} />} />
        <Route
          path="/liquidity"
          // path="/liquidityabaljkhfosdjfvhilsdhvsi"
          element={<Liquidity showModal={visibility} />}
        />
        {/* <Route path="/withdraw" element={<Withdraw showModal={visibility} />} /> */}
        <Route
          // path="/buy"
          path="/buyfjbhsdfgshdgoisdhglishglisuygiu"
          element={<Buy showModal={visibility} />}
        />
        {/* <Route
          path="/test"
          element={<TestingScreen showModal={visibility} />}
        /> */}
      </Routes>
    </div>
  );
}

export default App;
