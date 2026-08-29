"use client";
import hljs from "highlight.js";
import "highlight.js/styles/vs2015.css";

interface Props { content: string; onOpenCompiler: (code: string, lang: string) => void; isReceiver?: boolean; }

export default function RenderContent({ content, onOpenCompiler, isReceiver = false }: Props) {
  const handleCopyCode = (code: string) => { navigator.clipboard.writeText(code); alert("Code copied to clipboard!"); };
  const parts = content.split("'''");
  const elements = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 4 === 0 && parts[i]) {
      elements.push(<span key={`text-${i}`} className={isReceiver ? "whitespace-pre-wrap font-mono text-green-300" : "whitespace-pre-wrap"}>{parts[i]}</span>);
    } else if (i % 4 === 1) {
      if (i + 2 < parts.length) {
        const lang = parts[i].trim(); const code = parts[i + 1].trim();
        let highlightedCode = code;
        try { highlightedCode = hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value; } catch (e) {}
        
        elements.push(
          <div key={`code-${i}`} className={`relative group ${isReceiver ? "my-6" : "my-3"}`}>
            <div className="absolute top-0 right-0 flex z-10 border-b border-l border-gray-700 shadow-md rounded-bl-lg overflow-hidden">
              <button onClick={() => onOpenCompiler(code, lang)} className="bg-blue-600 hover:bg-blue-500 text-[10px] px-3 py-1 text-white font-bold uppercase transition-colors border-r border-gray-600 flex items-center space-x-1" title="Run code in compiler"><span>▶</span> <span>Run</span></button>
              <button onClick={() => handleCopyCode(code)} className="bg-gray-700 hover:bg-gray-600 text-[10px] px-3 py-1 text-white font-bold uppercase transition-colors border-r border-gray-600">Copy</button>
              {lang && <div className="bg-gray-800 text-[10px] px-3 py-1 text-gray-400 font-bold uppercase select-none">{lang}</div>}
            </div>
            {/* Added max-h-[400px] and overflow-y-auto to stop long code stretching screen */}
            <pre className={`p-4 pt-10 rounded-lg overflow-x-auto overflow-y-auto max-h-400px border border-gray-700 m-0 bg-[#1e1e1e] text-left ${isReceiver ? "shadow-2xl shadow-black/50 p-5" : "shadow-inner"}`}>
              <code className={`text-xs font-mono hljs language-${lang} whitespace-pre`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </pre>
          </div>
        );
        i += 2; 
      } else elements.push(<span key={`error-${i}`} className={isReceiver ? "whitespace-pre-wrap font-mono text-green-300" : "whitespace-pre-wrap"}>'''{parts[i]}</span>);
    }
  }
  return <>{elements}</>;
}