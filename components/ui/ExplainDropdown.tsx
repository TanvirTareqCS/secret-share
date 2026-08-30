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
    <div className="relative group inline-block">
      <button 
        disabled={isLoading} 
        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-[10px] px-3 py-1.5 text-white font-bold uppercase transition-colors border-r border-gray-600 flex items-center space-x-1 cursor-pointer"
      >
        <span>✨ {isLoading ? "Thinking..." : "Explain Code"}</span>
      </button>
      
      {!isLoading && (
        /* Removed mt-1 so it sits perfectly flush with no gap. Uses absolute solid bg-[#1e1e1e] */
        <div className="absolute top-full left-0 w-48 bg-[#1e1e1e] border border-gray-700 rounded shadow-2xl hidden group-hover:block z-50">
          {MODES.map((mode) => (
            <div key={mode.id} className="relative group/item border-b border-gray-800 last:border-0">
              <button
                onClick={() => onSelect(mode.id)}
                /* Solid bg-[#1e1e1e] ensures 100% opacity covering all code lines beneath */
                className="w-full text-left px-4 py-2.5 text-xs text-white bg-[#1e1e1e] hover:bg-purple-600 transition-colors font-bold cursor-pointer block"
              >
                {mode.label}
              </button>
              
              {/* Tooltip on hover - set to solid pure black with absolutely no transparent classes */}
              <div className="absolute top-0 left-full ml-0.5 w-48 bg-black border border-purple-500/50 text-gray-200 text-[10px] p-2 rounded shadow-lg hidden group-hover/item:block pointer-events-none z-50">
                {mode.tooltip}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}