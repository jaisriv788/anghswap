import { X } from "lucide-react";

function Notice({ setIsOpen, message, setMsg }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative transform transition-all duration-300 scale-100 hover:scale-[1.02]">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
        >
          <X className="w-6 h-6 cursor-pointer" />
        </button>

        {/* Notice Header with Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Notice</h2>
        </div>

        {/* Message */}
        <p className="text-gray-600 leading-relaxed">{message}</p>

        {/* Footer button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              setIsOpen(false);
              setMsg("")
            }}
            className="px-5 py-2.5 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow hover:opacity-90 active:scale-95 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default Notice;
