"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props { isOpen: boolean; onClose: () => void; initialCode: string; initialLang: string; }

export default function CompilerStudio({ isOpen, onClose, initialCode, initialLang }: Props) {
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode(initialCode); setLang(initialLang.toLowerCase()); setInput("");
      setOutput("Ready to compile. Press 'Run Code'.\nNote: Interactive inputs (like C++ cin) must be provided in the Standard Input box before running.");
    }
  }, [isOpen, initialCode, initialLang]);

  const executeCode = async () => {
    setIsCompiling(true); setOutput("Sending to secure backend...");
    try {
      let mappedLang = "";
      if (lang === 'python') mappedLang = 'python-3.14';
      if (lang === 'javascript' || lang === 'node') mappedLang = 'typescript-deno'; 
      if (lang === 'c++' || lang === 'cpp') mappedLang = 'g++-15';
      if (lang === 'c#') mappedLang = 'dotnet-csharp-9';
      if (lang === 'ruby') mappedLang = 'ruby-4.0';
      if (lang === 'java') mappedLang = 'openjdk-25';

      if (!mappedLang) { setOutput(`Language '${lang}' is not supported on this engine.`); setIsCompiling(false); return; }

      const res = await fetch("/api/compile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compiler: mappedLang, code, input })
      });
      if (!res.ok) { setOutput(`--- SERVER ERROR ${res.status} ---\nFailed to reach the API route.`); setIsCompiling(false); return; }
      const data = await res.json();
      if (data.status === "success") setOutput(data.output || "Program finished successfully with no output.");
      else setOutput("--- COMPILER ERROR ---\n" + (data.error || "Execution failed."));
    } catch (err: any) { setOutput(`Error: Could not connect to the compilation server.\nDetails: ${err.message}`); }
    setIsCompiling(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
              <h3 className="text-lg font-bold text-blue-400 flex items-center space-x-2"><span>▶</span> <span>Execution Studio</span> <span className="text-gray-500 text-xs ml-2 uppercase">({lang})</span></h3>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-xl transition-colors">✕</button>
            </div>
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col border-r border-gray-800">
                <div className="bg-gray-950 px-4 py-2 text-xs text-gray-500 font-bold uppercase tracking-wider">Source Code (Editable)</div>
                <textarea value={code} onChange={(e) => setCode(e.target.value)} className="flex-1 w-full bg-[#1e1e1e] text-green-400 font-mono p-4 focus:outline-none resize-none text-sm" spellCheck="false" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="h-1/3 flex flex-col border-b border-gray-800">
                  <div className="bg-gray-950 px-4 py-2 text-xs text-gray-500 font-bold uppercase tracking-wider">Standard Input (stdin)</div>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter inputs here before running..." className="flex-1 w-full bg-[#1e1e1e] text-white font-mono p-4 focus:outline-none resize-none text-sm" spellCheck="false" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="bg-gray-950 px-4 py-2 text-xs text-gray-500 font-bold uppercase tracking-wider flex justify-between items-center">
                    <span>Terminal Output</span>
                    {isCompiling && <span className="text-blue-400 animate-pulse text-[10px]">Processing...</span>}
                  </div>
                  <pre className="flex-1 w-full bg-black text-gray-300 font-mono p-4 overflow-y-auto text-sm whitespace-pre-wrap">{output}</pre>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-950 border-t border-gray-800 flex justify-end">
              <button onClick={executeCode} disabled={isCompiling} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-2 rounded-lg font-bold transition-colors flex items-center space-x-2">
                <span>{isCompiling ? "Executing..." : "Run Code"}</span>{!isCompiling && <span>▶</span>}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}