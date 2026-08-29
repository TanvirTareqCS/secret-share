"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props { isOpen: boolean; onClose: () => void; onInsert: (text: string) => void; }

export default function DictationStudio({ isOpen, onClose, onInsert }: Props) {
  const [dictatedText, setDictatedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);

  useEffect(() => {
    if (isOpen) { setDictatedText(""); setInterimText(""); setTimeout(startRecording, 100); }
    else stopRecording();
  }, [isOpen]);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition is not supported."); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US";
    manualStopRef.current = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      let finalStr = ""; let interimStr = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalStr += event.results[i][0].transcript;
        else interimStr += event.results[i][0].transcript;
      }
      if (finalStr) setDictatedText(prev => prev + (prev && !prev.endsWith(" ") ? " " : "") + finalStr);
      setInterimText(interimStr);
    };
    recognition.onerror = (e: any) => {
      if (['not-allowed', 'service-not-allowed', 'network'].includes(e.error)) {
        manualStopRef.current = true; setIsRecording(false);
      }
    };
    recognition.onend = () => {
      if (!manualStopRef.current) { try { recognition.start(); } catch (e) { setIsRecording(false); } } 
      else setIsRecording(false);
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { console.error(e); }
  };

  const stopRecording = () => { manualStopRef.current = true; if (recognitionRef.current) recognitionRef.current.stop(); setIsRecording(false); setInterimText(""); };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl p-6 flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-green-400 flex items-center">{isRecording ? <span className="animate-pulse mr-2 text-red-500 text-sm">🔴</span> : <span className="mr-2">🎙️</span>} Dictation Studio</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-xl transition-colors">✕</button>
            </div>
            <p className="text-xs text-gray-400 mb-2">Speak continuously. Pause anytime, the mic will stay on until you hit Stop.</p>
            <textarea value={dictatedText} onChange={(e) => setDictatedText(e.target.value)} className="w-full h-40 bg-gray-950 border border-gray-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-green-500 resize-none shadow-inner" placeholder="Waiting for speech..." />
            <div className="h-6 mt-2 text-sm text-green-500 italic truncate font-mono">{interimText && `Listening: ${interimText}...`}</div>
            <div className="flex justify-between mt-4">
              <button onClick={isRecording ? stopRecording : startRecording} className={`px-4 py-2 rounded-lg font-bold transition-colors text-sm ${isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>{isRecording ? "⏸️ Stop Mic" : "▶️ Resume Mic"}</button>
              <button onClick={() => { onInsert(dictatedText); onClose(); }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors text-sm flex items-center space-x-2 shadow-lg"><span>Insert Text</span><span>✅</span></button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}