"use client";

import { useState, useRef, useEffect } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Closes the menu when clicking outside of it (mobile and PC friendly)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModeSelect = (modeId: string) => {
    onSelect(modeId);
    setIsOpen(false); // Closes the dropdown once selected
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button 
        type="button"
        disabled={isLoading} 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-[10px] px-3 py-1.5 text-white font-bold uppercase transition-colors border-r border-gray-600 flex items-center space-x-1 cursor-pointer"
      >
        <span>✨ {isLoading ? "Thinking..." : "Explain Code"}</span>
      </button>
      
      {!isLoading && isOpen && (
        /* Replaced 'group-hover' with solid state triggers and solid dark BG colours */
        <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e1e1e] border border-gray-700 rounded shadow-2xl z-50">
          {MODES.map((mode) => (
            <div key={mode.id} className="relative group/item border-b border-gray-800 last:border-0">
              <button
                type="button"
                onClick={() => handleModeSelect(mode.id)}
                className="w-full text-left px-4 py-2.5 text-xs text-white bg-[#1e1e1e] hover:bg-purple-600 transition-colors font-bold cursor-pointer block"
              >
                {mode.label}
              </button>
              
              {/* Tooltip - still pops out cleanly on PC hover */}
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