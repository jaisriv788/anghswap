import { useState, useEffect } from "react";
import SwapBox from "../components/SwapBox";
import angh from "../assets/tokens/angh.jpg";
import usdt from "../assets/tokens/usdt.png";
import znx from "../assets/tokens/znx.png";

export default function HomePage({ showModal }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-bounce opacity-60 "
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${8 + Math.random() * 12}s`,
                width: `${10 + Math.random() * 30}px`,
                height: `${10 + Math.random() * 30}px`,
                animation: `float-up ${
                  8 + Math.random() * 12
                }s infinite linear`,
              }}
            ></div>
          ))}
        </div>

        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-cyan-300/10 via-blue-300/10 to-purple-300/10 animate-pulse opacity-40 blur-md"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 25}s`,
                animationDuration: `${15 + Math.random() * 15}s`,
                width: `${50 + Math.random() * 100}px`,
                height: `${50 + Math.random() * 100}px`,
                animation: `float-around ${
                  15 + Math.random() * 15
                }s infinite ease-in-out`,
              }}
            ></div>
          ))}
        </div>
      </div>

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
      
      <section className="min-h-screen flex items-center px-1 sm:px-6 lg:px-8 relative z-10 pt-20 sm:pt-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:pb-0 pb-10 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div
              className={`transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              } text-center lg:text-left`}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-4 sm:mb-6 leading-tight break-words">
                Trade Crypto with
                <span className="text-accent block">Zero Limits</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground md:mb-5 leading-relaxed max-w-2xl mx-auto lg:mx-0 break-words">
                The most advanced decentralized exchange. Swap thousands of
                tokens with lightning speed, maximum security, and minimal fees.
              </p>
              <div className="hidden md:flex items-center justify-center lg:justify-start">
                <div className="flex items-center space-x-4 sm:space-x-6 text-2xl sm:text-3xl">
                  {[usdt, angh, znx].map((icon, i) => (
                    <div
                      key={i}
                      className="h-14 w-14 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 
                   transition-transform duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
                    >
                      <img
                        className="h-10 w-10 object-contain"
                        src={icon}
                        alt="crypto-icon"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SwapBox showModal={showModal} isVisible={isVisible} />
          </div>
        </div>
      </section>

      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(50px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-around {
          0%,
          100% {
            transform: translateX(0px) translateY(0px) scale(1);
          }
          25% {
            transform: translateX(50px) translateY(-30px) scale(1.1);
          }
          50% {
            transform: translateX(-30px) translateY(-60px) scale(0.9);
          }
          75% {
            transform: translateX(-60px) translateY(30px) scale(1.05);
          }
        }
      `}</style>
    </main>
  );
}
