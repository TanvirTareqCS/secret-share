"use client";
import "highlight.js/styles/vs2015.css";
import CodeBlock from "./CodeBlock";

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
        const lang = parts[i].trim(); 
        const code = parts[i + 1].trim();
        
        elements.push(
          <CodeBlock 
            key={`code-${i}`} 
            code={code} 
            lang={lang} 
            isReceiver={isReceiver} 
            onOpenCompiler={onOpenCompiler} 
            onCopyCode={handleCopyCode} 
          />
        );
        i += 2; 
      } else elements.push(<span key={`error-${i}`} className={isReceiver ? "whitespace-pre-wrap font-mono text-green-300" : "whitespace-pre-wrap"}>'''{parts[i]}</span>);
    }
  }
  return <>{elements}</>;
}