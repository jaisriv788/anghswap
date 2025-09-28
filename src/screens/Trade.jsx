import SwapBox from "../components/SwapBox";
import { useState, useEffect } from "react";

function Trade({ showModal }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // const value = sessionStorage.getItem("walletId");
    // console.log({ value });
    // console.log(sessionStorage.getItem("provider"));
  }, []);

  return (
    <div className="mt-25 flex justify-center">
      <div className="h-fit w-fit min-w-0 px-1 ">
        <SwapBox isVisible={isVisible} showModal={showModal} />
      </div>
    </div>
  );
}

export default Trade;
