"use client";
import { useState } from "react";
import hljs from "highlight.js";
import ExplainDropdown from "./ExplainDropdown";

interface Props {
  code: string;
  lang: string;
  isReceiver: boolean;
  onOpenCompiler: (code: string, lang: string) => void;
  onCopyCode: (code: string) => void;
}

export default function CodeBlock({ code, lang, isReceiver, onOpenCompiler, onCopyCode }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);

  const handleExplain = async (mode: string) => {
    setIsLoading(true);
    setActiveMode(mode);
    setExplanation(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, mode })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExplanation(data.explanation);
    } catch (err: any) {
      setExplanation(`Error: ${err.message}`);
    }
    setIsLoading(false);
  };

  let highlightedCode = code;
  try {
    highlightedCode = hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value;
  } catch (e) {}

  return (
    <div className={`relative group ${isReceiver ? "my-6" : "my-3"}`}>
      <div className="absolute top-0 right-0 flex z-20 border-b border-l border-gray-700 shadow-md rounded-bl-lg overflow-visible">
        <ExplainDropdown onSelect={handleExplain} isLoading={isLoading} />
        <button onClick={() => onOpenCompiler(code, lang)} className="bg-blue-600 hover:bg-blue-500 text-[10px] px-3 py-1 text-white font-bold uppercase transition-colors border-r border-gray-600">▶ Run</button>
        <button onClick={() => onCopyCode(code)} className="bg-gray-700 hover:bg-gray-600 text-[10px] px-3 py-1 text-white font-bold uppercase transition-colors border-r border-gray-600">Copy</button>
        {lang && <div className="bg-gray-800 text-[10px] px-3 py-1 text-gray-400 font-bold uppercase select-none">{lang}</div>}
      </div>

      {/* Split Screen Grid */}
      <div className={`grid gap-4 transition-all duration-500 ${explanation || isLoading ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        <pre className={`p-4 pt-10 rounded-lg overflow-x-auto overflow-y-auto max-h-400px border border-gray-700 m-0 bg-[#1e1e1e] text-left ${isReceiver ? "shadow-2xl shadow-black/50 p-5" : "shadow-inner"}`}>
          <code className={`text-xs font-mono hljs language-${lang} whitespace-pre`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>

        {/* AI Explanation Panel */}
        {(explanation || isLoading) && (
          <div className="relative p-5 pt-10 rounded-lg border border-purple-500/30 bg-gray-900/50 shadow-inner overflow-y-auto max-h-400px">
            <div className="absolute top-0 left-0 bg-purple-600 text-[10px] px-3 py-1 text-white font-bold uppercase rounded-br-lg shadow-md">
              {activeMode} MODE
            </div>
            <button onClick={() => setExplanation(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors">✕</button>
            
            {isLoading ? (
              <div className="flex items-center space-x-2 text-purple-400 font-mono text-sm mt-4 animate-pulse">
                <span>⚡ Generating explanation...</span>
              </div>
            ) : (
              <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed mt-2 font-sans">
                {explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}