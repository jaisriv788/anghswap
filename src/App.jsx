import { Routes, Route } from "react-router";
import Landing from "./screens/Landing";
import Navbar from "./components/Navbar";
import Trade from "./screens/Trade";
import Liquidity from "./screens/Liquidity";
import Withdraw from "./screens/Withdraw";
import TestingScreen from "./screens/TesingScreen";
import Buy from "./screens/Buy";
import Setting from "./components/Settings";
import { useDispatch, useSelector } from "react-redux";
import { isSettingModalVisible } from "./redux/slice/modalSlice";
import { useEffect, useState } from "react";
import WalletOptions from "./components/WalletOptions";

function App() {
  const [showModal, setShowModal] = useState(false);

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
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
        window.ethereum.removeListener("disconnect", () => {});
      }
    };
  }, []);

  return (
    <>
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

      {showModal && <WalletOptions showModal={visibility} />}
      <Setting
        isOpen={isSetModalVisible}
        onClose={() => dispatch(isSettingModalVisible(false))}
      />
      <Navbar showModal={visibility} />
      <Routes>
        <Route path="/" element={<Landing showModal={visibility} />} />
        <Route path="/trade" element={<Trade showModal={visibility} />} />
        <Route
          path="/liquidity"
          element={<Liquidity showModal={visibility} />}
        />
        {/* <Route path="/withdraw" element={<Withdraw showModal={visibility} />} /> */}
        <Route path="/buy" element={<Buy showModal={visibility} />} />
        <Route
          path="/test"
          element={<TestingScreen showModal={visibility} />}
        />
      </Routes>
    </>
  );
}

export default App;
