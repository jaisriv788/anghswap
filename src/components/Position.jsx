import { useSelector } from "react-redux";

function Position({ showModal, setShowAddLiquidityForm }) {
  const isConnected = useSelector((state) => state.user.isConnected);

  return (
    <div className="w-full sm:w-5/6 lg:w-1/2 ">
      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-6 shadow-2xl backdrop-blur-sm">
        <div className="mb-3 sm:mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            {/* <span style={{ color: "#8357E8" }}>+</span> */}
            Positions
          </h2>
          <p className="text-sm text-gray-600">
            Add Position to earn rewards from trading fees
          </p>
        </div>

        <div className="flex gap-2 justify-center py-4 sm:py-8">
          <button
            onClick={() => setShowAddLiquidityForm(true)}
            disabled={!isConnected}
            className={`w-full max-w-xs text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg border
    ${
      isConnected
        ? "bg-gradient-to-r from-[#8357E8] to-[#7c4ddb]  border-purple-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-xl"
        : "bg-gray-400 cursor-not-allowed"
    }
  `}
          >
            New Position
          </button>
          {!isConnected && (
            <button
              onClick={() => {
                showModal(true);
              }}
              className="w-full max-w-xs cursor-pointer text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 hover:shadow-xl border border-purple-200"
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
  );
}

export default Position;
