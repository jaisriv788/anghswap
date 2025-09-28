import BuyBox from "../components/BuyBox";
import { useState, useEffect } from "react";

function Trade({ showModal }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="mt-25 flex justify-center">
      <div className="h-fit w-fit min-w-0 px-1 ">
        <BuyBox isVisible={isVisible} showModal={showModal} />
      </div>
    </div>
  );
}

export default Trade;
