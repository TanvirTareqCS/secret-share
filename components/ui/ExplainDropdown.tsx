"use client";

interface Props {
  onSelect: (mode: string) => void;
  isLoading: boolean;
}

const MODES = [
  { id: "ADIB", label: "ADIB Mode", tooltip: "Simple BANGLA Explanation" },
  { id: "FABIHA", label: "FABIHA Mode", tooltip: "Easy ENGLISH Explanation" },
  { id: "MAHATAB", label: "MAHATAB Mode", tooltip: "Explain the thing shortly" },
  { id: "MAHIN", label: "MAHIN Mode", tooltip: "Explain easiest thing in details" },
];

export default function ExplainDropdown({ onSelect, isLoading }: Props) {
  return (
    /* Changed to a named group/dropdown to prevent triggering from parent container */
    <div className="relative group/dropdown inline-block">
      <button disabled={isLoading} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-[10px] px-3 py-1 text-white font-bold uppercase transition-colors border-r border-gray-600 flex items-center space-x-1">
        <span>✨ {isLoading ? "Thinking..." : "Explain Code"}</span>
      </button>
      
      {!isLoading && (
        /* Changed hover triggers to specifically listen to group-hover/dropdown */
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 z-50">
          {MODES.map((mode) => (
            <div key={mode.id} className="relative group/item">
              <button
                onClick={() => onSelect(mode.id)}
                className="w-full text-left px-4 py-2 text-xs text-white hover:bg-purple-600/50 transition-colors border-b border-gray-800 last:border-0 font-bold"
              >
                {mode.label}
              </button>
              <div className="absolute top-0 left-full ml-1 w-48 bg-gray-800 border border-purple-500/50 text-gray-200 text-[10px] p-2 rounded shadow-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 pointer-events-none">
                {mode.tooltip}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}