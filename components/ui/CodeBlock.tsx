"use client";

import { useState, useRef, useEffect, Fragment } from "react";
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

  // Ref and state to dynamically track the height of your code pre-container
  const codePreRef = useRef<HTMLPreElement>(null);
  const [calculatedHeight, setCalculatedHeight] = useState<string>("250px");

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

  // Measure the code block dynamically and apply exact code size or double
  useEffect(() => {
    if ((explanation || isLoading) && codePreRef.current) {
      const naturalHeight = codePreRef.current.scrollHeight;
      
      // If code is short (under 150px), double it so the explanation box has room
      if (naturalHeight < 150) {
        setCalculatedHeight(`${naturalHeight * 2}px`);
      } else {
        // Otherwise, match the exact size of the main code block
        setCalculatedHeight(`${naturalHeight}px`);
      }
    }
  }, [explanation, isLoading, code]);

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
    const elements: React.ReactNode[] = [];
    
    let isInCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLineStart = 0;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const trimmed = line.trim();

      // Handle nested markdown code blocks (``` or ''')
      if (trimmed.startsWith("```") || trimmed.startsWith("'''")) {
        if (isInCodeBlock) {
          // Close code snippet
          const codeString = codeBlockContent.join("\n");
          elements.push(
            <pre key={`nested-code-${codeBlockLineStart}`} className="p-3 my-2.5 rounded-md bg-black/60 border border-gray-800 overflow-x-auto text-left shadow-inner">
              <code className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-words">
                {codeString}
              </code>
            </pre>
          );
          isInCodeBlock = false;
          codeBlockContent = [];
        } else {
          // Open code snippet
          isInCodeBlock = true;
          codeBlockLineStart = idx;
        }
        continue;
      }

      if (isInCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Horizontal Separator rule (---)
      if (trimmed === "---") {
        elements.push(<hr key={`hr-${idx}`} className="border-gray-800 my-4" />);
        continue;
      }

      // Blockquotes (>)
      if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote key={`quote-${idx}`} className="border-l-4 border-purple-500 pl-4 py-1.5 my-2 italic text-gray-300 bg-purple-950/15 rounded-r text-[13px] leading-relaxed">
            {parseInlineMarkdown(trimmed.slice(2), idx)}
          </blockquote>
        );
        continue;
      }

      // Heading 3 (###)
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4 key={`block-${idx}`} className="text-base font-bold text-purple-400 mt-4 mb-2">
            {parseInlineMarkdown(trimmed.slice(4), idx)}
          </h4>
        );
        continue;
      }

      // Heading 2 (##)
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h3 key={`block-${idx}`} className="text-lg font-extrabold text-purple-300 mt-5 mb-2 border-b border-gray-800 pb-1">
            {parseInlineMarkdown(trimmed.slice(3), idx)}
          </h3>
        );
        continue;
      }

      // Heading 1 (#)
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h2 key={`block-${idx}`} className="text-xl font-black text-purple-200 mt-6 mb-3 border-b border-purple-950 pb-1">
            {parseInlineMarkdown(trimmed.slice(2), idx)}
          </h2>
        );
        continue;
      }

      // Unordered list items (- or *)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <ul key={`block-${idx}`} className="list-disc pl-5 text-gray-300 my-1">
            <li key={`li-${idx}`}>{parseInlineMarkdown(trimmed.slice(2), idx)}</li>
          </ul>
        );
        continue;
      }

      // Numbered list items (1.)
      const matchOrder = trimmed.match(/^(\d+)\.\s(.*)/);
      if (matchOrder) {
        const [, numberText, content] = matchOrder;
        elements.push(
          <ol key={`block-${idx}`} className="list-decimal pl-5 text-gray-300 my-1" start={parseInt(numberText, 10)}>
            <li key={`li-${idx}`}>{parseInlineMarkdown(content, idx)}</li>
          </ol>
        );
        continue;
      }

      // Blank lines
      if (trimmed === "") {
        elements.push(<div key={`block-${idx}`} className="h-2" />);
        continue;
      }

      // General Text Paragraphs
      elements.push(
        <p key={`block-${idx}`} className="text-gray-300 leading-relaxed text-[13px] my-1">
          {parseInlineMarkdown(line, idx)}
        </p>
      );
    }

    return <div className="space-y-1 mt-2 font-sans pb-4">{elements}</div>;
  };

  const isShowingExplanation = explanation || isLoading;

  return (
    <div className={`relative w-full max-w-full overflow-visible ${isReceiver ? "my-6" : "my-3"}`}>
      
      {/* Split Screen Grid Layout */}
      <div className={`grid gap-4 transition-all duration-500 w-full max-w-full overflow-visible min-h-0 ${isShowingExplanation ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* Code Panel Column wrapper - Fixed with constraints */}
        <div className="relative group/code w-full max-w-full overflow-visible min-h-0">
          
          {/* Explain Button: Pinned to top-left corner */}
          <div className="absolute top-0 left-0 flex z-20 border-b border-r border-gray-700 shadow-md rounded-br-lg overflow-visible bg-[#1e1e1e]">
            <ExplainDropdown onSelect={handleExplain} isLoading={isLoading} />
          </div>

          {/* Run & Copy Buttons: Pinned to top-right corner */}
          <div className="absolute top-0 right-0 flex z-20 border-b border-l border-gray-700 shadow-md rounded-bl-lg overflow-visible bg-[#1e1e1e]">
            <button 
              onClick={() => onOpenCompiler(code, lang)} 
              className="bg-blue-600 hover:bg-blue-500 text-[10px] px-3 py-1.5 text-white font-bold uppercase transition-colors border-r border-gray-600 cursor-pointer"
            >
              ▶ Run
            </button>
            <button 
              onClick={() => onCopyCode(code)} 
              className="bg-gray-700 hover:bg-gray-600 text-[10px] px-3 py-1.5 text-white font-bold uppercase transition-colors cursor-pointer"
            >
              Copy
            </button>
            {lang && (
              <div className="bg-gray-800 text-[10px] px-3 py-1.5 text-gray-400 font-bold uppercase select-none rounded-tr-lg border-l border-gray-700">
                {lang}
              </div>
            )}
          </div>

          {/* Code Pre container with auto scrollbars and touch momentum */}
          <pre 
            ref={codePreRef}
            style={isShowingExplanation ? { height: calculatedHeight } : undefined}
            className={`p-4 pt-10 rounded-lg overflow-x-auto overflow-y-auto scrolling-touch border border-gray-700 m-0 bg-[#1e1e1e] text-left transition-all duration-300 w-full max-w-full ${
              isShowingExplanation ? "" : "max-h-[350px]"
            } ${isReceiver ? "shadow-2xl shadow-black/50 p-5" : "shadow-inner"}`}
          >
            <code 
              className={`text-xs font-mono hljs language-${lang} whitespace-pre-wrap break-words block`} 
              dangerouslySetInnerHTML={{ __html: highlightedCode }} 
            />
          </pre>
        </div>

        {/* AI Explanation Panel Column with touch momentum scrolling */}
        {isShowingExplanation && (
          <div 
            style={{ height: calculatedHeight }}
            className="relative p-5 pt-12 rounded-lg border border-purple-500/30 bg-gray-900/50 shadow-inner overflow-y-auto scrolling-touch min-h-0 transition-all duration-300 text-left w-full max-w-full"
          >
            
            {/* Left corner: Active Mode Badge */}
            <div className="absolute top-0 left-0 bg-purple-600 text-[10px] px-3 py-1.5 text-white font-bold uppercase rounded-br-lg shadow-md select-none">
              {activeMode} MODE
            </div>
            
            {/* Right corner: Clean Close Button */}
            <button 
              onClick={() => {
                setExplanation(null);
                setActiveMode(null);
              }} 
              className="absolute top-2.5 right-3 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm"
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