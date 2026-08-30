"use client";

import { useState, Fragment } from "react";
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
    highlightedCode = hljs.getLanguage(lang) 
      ? hljs.highlight(code, { language: lang }).value 
      : hljs.highlightAuto(code).value;
  } catch (e) {}

  // Single-pass inline markdown parser (Bold, Italics, Inline Code)
  // Guarantees 100% unique key props for every element inside arrays
  const parseInlineMarkdown = (text: string, lineIdx: number): React.ReactNode => {
    if (!text || typeof text !== "string") return "";

    // Match bold (**text**), italics (*text* or _text_), and inline code (`code`)
    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)/g;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let tokenIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;

      // Add preceding plain text
      if (matchIndex > lastIndex) {
        const plainText = text.substring(lastIndex, matchIndex);
        elements.push(
          <span key={`ln-${lineIdx}-txt-${tokenIdx++}`}>{plainText}</span>
        );
      }

      const [
        _,
        boldFull, boldText,
        italicStarFull, italicStarText,
        italicUnderFull, italicUnderText,
        codeFull, codeText
      ] = match;

      if (boldFull) {
        elements.push(
          <strong key={`ln-${lineIdx}-bold-${tokenIdx++}`} className="font-extrabold text-white">
            {boldText}
          </strong>
        );
      } else if (italicStarFull || italicUnderFull) {
        const itText = italicStarText || italicUnderText;
        elements.push(
          <em key={`ln-${lineIdx}-italic-${tokenIdx++}`} className="italic text-purple-200">
            {itText}
          </em>
        );
      } else if (codeFull) {
        elements.push(
          <code key={`ln-${lineIdx}-code-${tokenIdx++}`} className="bg-gray-950/80 text-red-400 font-mono text-xs px-1.5 py-0.5 rounded border border-gray-800">
            {codeText}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Add trailing text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      elements.push(
        <span key={`ln-${lineIdx}-txt-end-${tokenIdx++}`}>{remainingText}</span>
      );
    }

    return elements.length > 0 ? (
      <Fragment key={`ln-${lineIdx}-parsed-root`}>{elements}</Fragment>
    ) : (
      text
    );
  };

  // Renders the block-level elements for headers, lists, and spacing
  const renderFormattedExplanation = (text: string | null) => {
    if (!text) return null;

    const lines = text.split("\n");
    return (
      <div className="space-y-3 mt-2 font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Heading 3 (### Heading)
          if (trimmed.startsWith("### ")) {
            return (
              <h4 key={`block-${idx}`} className="text-base font-bold text-purple-400 mt-4 mb-2">
                {parseInlineMarkdown(trimmed.slice(4), idx)}
              </h4>
            );
          }
          // Heading 2 (## Heading)
          if (trimmed.startsWith("## ")) {
            return (
              <h3 key={`block-${idx}`} className="text-lg font-extrabold text-purple-300 mt-5 mb-2 border-b border-gray-800 pb-1">
                {parseInlineMarkdown(trimmed.slice(3), idx)}
              </h3>
            );
          }
          // Heading 1 (# Heading)
          if (trimmed.startsWith("# ")) {
            return (
              <h2 key={`block-${idx}`} className="text-xl font-black text-purple-200 mt-6 mb-3 border-b border-purple-950 pb-1">
                {parseInlineMarkdown(trimmed.slice(2), idx)}
              </h2>
            );
          }

          // Bullet point lists
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <ul key={`block-${idx}`} className="list-disc pl-5 text-gray-300">
                <li key={`li-${idx}`}>{parseInlineMarkdown(trimmed.slice(2), idx)}</li>
              </ul>
            );
          }

          // Numbered lists
          const matchOrder = trimmed.match(/^(\d+)\.\s(.*)/);
          if (matchOrder) {
            return (
              <ol key={`block-${idx}`} className="list-decimal pl-5 text-gray-300" start={parseInt(matchOrder[1])}>
                <li key={`li-${idx}`}>{parseInlineMarkdown(matchOrder[2], idx)}</li>
              </ol>
            );
          }

          // Break spacing
          if (trimmed === "") {
            return <div key={`block-${idx}`} className="h-1" />;
          }

          // Standard paragraph
          return (
            <p key={`block-${idx}`} className="text-gray-300 leading-relaxed text-[13px]">
              {parseInlineMarkdown(line, idx)}
            </p>
          );
        })}
      </div>
    );
  };

  const isShowingExplanation = explanation || isLoading;

  return (
    <div className={`relative group ${isReceiver ? "my-6" : "my-3"}`}>
      <div className="absolute top-0 right-0 flex z-20 border-b border-l border-gray-700 shadow-md rounded-bl-lg overflow-visible">
        <ExplainDropdown onSelect={handleExplain} isLoading={isLoading} />
        <button 
          onClick={() => onOpenCompiler(code, lang)} 
          className="bg-blue-600 hover:bg-blue-500 text-[10px] px-3 py-1 text-white font-bold uppercase transition-colors border-r border-gray-600 cursor-pointer"
        >
          ▶ Run
        </button>
        <button 
          onClick={() => onCopyCode(code)} 
          className="bg-gray-700 hover:bg-gray-600 text-[10px] px-3 py-1 text-white font-bold uppercase transition-colors border-r border-gray-600 cursor-pointer"
        >
          Copy
        </button>
        {lang && (
          <div className="bg-gray-800 text-[10px] px-3 py-1 text-gray-400 font-bold uppercase select-none">
            {lang}
          </div>
        )}
      </div>

      {/* Split Screen Grid Layout */}
      <div className={`grid gap-4 transition-all duration-500 ${isShowingExplanation ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* Code Pre container */}
        <pre 
          className={`p-4 pt-10 rounded-lg overflow-x-auto overflow-y-auto border border-gray-700 m-0 bg-[#1e1e1e] text-left transition-all duration-300 ${
            isShowingExplanation ? "h-380px" : "max-h-350px"
          } ${isReceiver ? "shadow-2xl shadow-black/50 p-5" : "shadow-inner"}`}
        >
          <code 
            className={`text-xs font-mono hljs language-${lang} whitespace-pre`} 
            dangerouslySetInnerHTML={{ __html: highlightedCode }} 
          />
        </pre>

        {/* AI Explanation Panel */}
        {isShowingExplanation && (
          <div className="relative p-5 pt-10 rounded-lg border border-purple-500/30 bg-gray-900/50 shadow-inner overflow-y-auto h-380px transition-all duration-300">
            <div className="absolute top-0 left-0 bg-purple-600 text-[10px] px-3 py-1 text-white font-bold uppercase rounded-br-lg shadow-md select-none">
              {activeMode} MODE
            </div>
            
            <button 
              onClick={() => {
                setExplanation(null);
                setActiveMode(null);
              }} 
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
            
            {isLoading ? (
              <div className="flex items-center space-x-2 text-purple-400 font-mono text-sm mt-4 animate-pulse">
                <span>⚡ Generating explanation...</span>
              </div>
            ) : (
              renderFormattedExplanation(explanation)
            )}
          </div>
        )}
      </div>
    </div>
  );
}