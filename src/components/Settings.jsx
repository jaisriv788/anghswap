import { CircleQuestionMark } from "lucide-react";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSlippage, setDeadline } from "../redux/slice/transactionSlice";

function Settings({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const slippageTolerance = useSelector(
    (state) => state.transaction.slippageTolerance
  );
  const deadline = useSelector(
    (state) => state.transaction.transactionDeadline
  );

  const [slippageValue, setSlippageValue] = useState(slippageTolerance);
  const [deadlineValue, setDeadlineValue] = useState(deadline);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSecondTooltip, setShowSecondTooltip] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card min-w-[380px] border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-foreground">Settings</h3>
            <button
              onClick={onClose}
              className="w-8 cursor-pointer h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors duration-200"
            >
              <span className="text-muted-foreground text-lg">×</span>
            </button>
          </div>

          <div className="mb-3">
            <h3 className="text-sm font-semibold mb-3">Transaction Settings</h3>
            <h3 className="text-sm flex items-center gap-2 mb-1.5 relative">
              Slippage Tolerance{" "}
              <CircleQuestionMark
                className="cursor-pointer"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                size={16}
              />
              {showTooltip && (
                <div className="absolute text-justify top-6 left-6 w-54 bg-accent text-white text-sm rounded-md shadow-lg px-3 py-2 z-50">
                  Your transaction will revert if the price changes unfavorably
                  by more than this percentage.
                </div>
              )}
            </h3>
            <div className="flex gap-2 text-sm mb-2">
              <div
                onClick={() => {
                  dispatch(setSlippage(0.1));
                  setSlippageValue(0.1);
                }}
                className={`${
                  slippageValue == 0.1
                    ? "border-accent bg-accent text-white"
                    : "border-gray-400"
                }  cursor-pointer border p-1 rounded-full w-12 text-center`}
              >
                0.1%
              </div>
              <div
                onClick={() => {
                  dispatch(setSlippage(0.5));
                  setSlippageValue(0.5);
                }}
                className={`${
                  slippageValue == 0.5
                    ? "border-accent bg-accent text-white"
                    : "border-gray-400"
                }  cursor-pointer border p-1 rounded-full w-12 text-center`}
              >
                0.5%
              </div>
              <div
                onClick={() => {
                  dispatch(setSlippage(1));
                  setSlippageValue(1);
                }}
                className={`${
                  slippageValue == 1
                    ? "border-accent bg-accent text-white"
                    : "border-gray-400"
                } cursor-pointer border p-1 rounded-full w-12 text-center`}
              >
                1%
              </div>
              <div className="relative flex-1">
                <input
                  value={slippageValue ?? ""}
                  placeholder="0.00"
                  onChange={(e) => {
                    let value = e.target.value;

                    // strip non-digits except dot
                    value = value.replace(/[^\d.]/g, "");

                    if (value.startsWith(".")) {
                      value = "0" + value;
                    }

                    setSlippageValue(value);

                    if (value !== "" && !isNaN(value)) {
                      dispatch(setSlippage(parseFloat(value)));
                    } else {
                      dispatch(setSlippage(0.0));
                    }
                  }}
                  type="text"
                  inputMode="decimal"
                  className="border text-lg border-accent w-full h-full rounded-full px-2 pr-6 text-right"
                />
                {/* fixed % sign */}
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-semibold">
                  %
                </span>
              </div>
            </div>
            <div className="text-sm">
              {slippageValue == 0.1 ? (
                <span className="font-semibold text-orange-500">
                  Your transaction may fail.
                </span>
              ) : slippageValue > 5 && slippageValue < 50 ? (
                <span className="font-semibold text-orange-500">
                  Your transaction may be frontrun.
                </span>
              ) : (
                slippageValue >= 50 && (
                  <span className="font-semibold text-red-500">
                    Enter a valid percentage.
                  </span>
                )
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm flex items-center gap-2 mb-1.5 relative">
              Transaction deadline
              <CircleQuestionMark
                className="cursor-pointer"
                onMouseEnter={() => setShowSecondTooltip(true)}
                onMouseLeave={() => setShowSecondTooltip(false)}
                size={16}
              />
              {showSecondTooltip && (
                <div className="absolute text-justify top-6 left-6 w-54 bg-accent text-white text-sm rounded-md shadow-lg px-3 py-2 z-50">
                  Your transaction will revert if it is pending for more than
                  this long.
                </div>
              )}
            </h3>
            <div className="flex gap-2 text-sm mb-2 items-center">
              <input
                value={deadlineValue ?? 0}
                placeholder="0.00"
                onChange={(e) => {
                  const val = e.target.value;
                  setDeadlineValue(val);
                  if (val === "" || isNaN(val)) {
                    dispatch(setDeadline(0));
                  } else {
                    dispatch(setDeadline(parseFloat(val)));
                  }
                }}
                type="number"
                className={`border w-30 ${
                  deadlineValue > 180
                    ? "border-red-400 focus:ring-red-400"
                    : "border-accent"
                }  pr-3 rounded-full text-right text-lg`}
              />
              <span className="font-semibold">Minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
