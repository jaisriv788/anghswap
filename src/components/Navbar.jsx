import {
  DollarSign,
  HandCoins,
  Home,
  LogOut,
  Menu,
  Power,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { isSettingModalVisible } from "../redux/slice/modalSlice";
import { setAddress, setConnection } from "../redux/slice/userDetails";
import iconSrc from "../assets/angh.png";

function Navbar({ showModal }) {
  const [isVisible, setIsVisible] = useState(false);
  const [wallets, setWallets] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const connectedWallet = sessionStorage.getItem("walletName");

  const account = useSelector((state) => state.user.walletAddress);
  const isConnected = useSelector((state) => state.user.isConnected);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    setWallets([]);

    function handler(event) {
      setWallets((prev) => {
        if (prev.find((p) => p.info.uuid === event.detail.info.uuid)) {
          return prev;
        }
        return [...prev, event.detail];
      });
    }
    window.addEventListener("eip6963:announceProvider", handler);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () =>
      window.removeEventListener("eip6963:announceProvider", handler);
  }, []);

  function handleLogout() {
    dispatch(setAddress(null));
    dispatch(setConnection(false));
    sessionStorage.clear();
  }

  return (
    <nav
      className={`fixed top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center">
                <img src={iconSrc} />
              </div>
              <span className="text-2xl font-bold text-foreground">
                ANGHSwap
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a
                onClick={() => navigate("/trade")}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium hover:scale-105 transform cursor-pointer duration-200"
              >
                Trade
              </a>
              <a
                onClick={() => navigate("/liquidity")}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium hover:scale-105 transform cursor-pointer duration-200"
              >
                Liquidity
              </a>
              {/* <a
                onClick={() => navigate("/withdraw")}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium hover:scale-105 transform cursor-pointer duration-200"
              >
                Withdraw
              </a> */}
              <a
                onClick={() => navigate("/buy")}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium hover:scale-105 transform cursor-pointer duration-200"
              >
                Buy
              </a>
            </div>
          </div>
          <div className=" hidden md:flex gap-2 items-center">
            <button
              onClick={() => {
                showModal(true);
              }}
              className="bg-accent flex items-center  cursor-pointer text-accent-foreground px-3 sm:px-4 gap-2 py-2.5 sm:py-2 text-nowrap rounded-lg hover:scale-105 transform transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {isConnected &&
                wallets
                  .filter((item) => item.info.name === connectedWallet)
                  .map((item, index) => (
                    <img
                      key={index}
                      src={item.info.icon}
                      alt={item.info.name}
                      className="h-5 w-5"
                    />
                  ))}
              {account
                ? account.slice(0, 4) + "..." + account.slice(-4)
                : "Connect Wallet"}
            </button>
            <button
              onClick={() => dispatch(isSettingModalVisible(true))}
              className="cursor-pointer hover:scale-105 transform transition-all duration-200 text-accent bg-gray-200  h-full p-2 rounded-lg shadow-lg hover:shadow-xl"
            >
              <Settings size={24} />
            </button>
            {isConnected && (
              <button
                onClick={handleLogout}
                className="cursor-pointer hover:scale-105 transform transition-all duration-200 text-accent bg-gray-200  h-full p-2 rounded-lg shadow-lg hover:shadow-xl"
              >
                <LogOut size={24} />
              </button>
            )}
          </div>
          <div className="dropdown dropdown-end block md:hidden">
            <div tabIndex={0} role="button" className="m-1 cursor-pointer">
              <Menu />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
            >
              <div className="border-b mb-1">Navigation</div>
              <li onClick={() => navigate("/")}>
                <a>
                  <Home size={15} />
                  Home
                </a>
              </li>
              <li onClick={() => navigate("/trade")}>
                <a>
                  <DollarSign size={15} />
                  Trade
                </a>
              </li>
              <li onClick={() => navigate("/liquidity")}>
                <a>
                  <HandCoins size={15} />
                  Liquidity
                </a>
              </li>
              <li onClick={() => navigate("/buy")}>
                <a>
                  <ShoppingBag size={15} />
                  Buy
                </a>
              </li>
              <div className="border-b mt-2 mb-1">Others</div>
              <li
                onClick={() => {
                  showModal(true);
                }}
              >
                <a>
                  <Power size={15} />
                  {account
                    ? account.slice(0, 4) + "..." + account.slice(-4)
                    : "Connect Wallet"}
                  {isConnected &&
                    wallets
                      .filter((item) => item.info.name === connectedWallet)
                      .map((item, index) => (
                        <img
                          key={index}
                          src={item.info.icon}
                          alt={item.info.name}
                          className="h-4 w-4"
                        />
                      ))}
                </a>
              </li>
              <li onClick={() => dispatch(isSettingModalVisible(true))}>
                <a>
                  <Settings size={15} />
                  Settings
                </a>
              </li>
              {isConnected && (
                <li onClick={handleLogout}>
                  <a>
                    <LogOut size={15} />
                    Logout
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
