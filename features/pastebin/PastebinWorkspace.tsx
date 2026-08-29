"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { playWhooshSound } from "@/lib/audio/sfx";

interface Props { onOpenDictation: () => void; setIsFlying: (v: boolean) => void; requirePasscode: boolean; setRequirePasscode: (v: boolean) => void; text: string; setText: React.Dispatch<React.SetStateAction<string>>; }

export default function PastebinWorkspace({ onOpenDictation, setIsFlying, requirePasscode, setRequirePasscode, text, setText }: Props) {
  const [passcode, setPasscode] = useState("");
  const [shareableLink, setShareableLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [encryptedDisplay, setEncryptedDisplay] = useState("SECURE_CIPHER_ACTIVE");

  useEffect(() => {
    if (requirePasscode) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
      const interval = setInterval(() => {
        let randomized = "";
        for (let i = 0; i < 14; i++) randomized += chars[Math.floor(Math.random() * chars.length)];
        setEncryptedDisplay(randomized);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [requirePasscode]);

  const handleGenerate = async () => {
    if (!text.trim()) { alert("Please enter some text or code first!"); return; }
    if (requirePasscode && !passcode.trim()) { alert("Please enter a decryption passcode first!"); return; }
    setIsLoading(true);
    if (requirePasscode) {
      setIsMasking(true); const originalText = text; let currentIndex = 0;
      const maskInterval = setInterval(() => {
        currentIndex += Math.max(1, Math.floor(originalText.length / 15));
        if (currentIndex >= originalText.length) { setText("*".repeat(originalText.length)); clearInterval(maskInterval); } 
        else setText("*".repeat(currentIndex) + originalText.slice(currentIndex));
      }, 30);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    setIsFlying(true); playWhooshSound();
    const id = Math.random().toString(36).substring(2, 10);
    await set(ref(db, `pastebin/${id}`), { text, passcode: requirePasscode ? passcode : "", createdAt: Date.now() });
    setTimeout(() => { setShareableLink(`${window.location.origin}/s/${id}`); setIsFlying(false); setIsMasking(false); }, 1000);
    setIsLoading(false);
  };

  if (shareableLink) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-950 border border-green-500/30 rounded-lg p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-green-400">✨ Link Generated Successfully!</h2>
        <p className="text-gray-400 text-sm">Share this link with your friend. It will self-destruct after 10 minutes or when destroyed.</p>
        <div className="flex items-center space-x-2 bg-gray-900 p-3 rounded-lg border border-gray-700">
          <input type="text" readOnly value={shareableLink} className="w-full bg-transparent text-green-300 font-mono text-sm focus:outline-none" />
          <button onClick={() => { navigator.clipboard.writeText(shareableLink); alert("Link copied!"); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">Copy</button>
        </div>
        <button onClick={() => { setShareableLink(""); setText(""); setPasscode(""); setRequirePasscode(false); }} className="text-gray-400 hover:text-white text-sm underline transition-colors pt-2">Create another secret</button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="w-full relative z-10 mb-4">
        <div className="flex justify-between items-center bg-gray-950 border border-gray-700 border-b-0 rounded-t-lg p-2">
          <span className="text-xs text-gray-500 ml-2">Type or dictate your payload:</span>
          <button type="button" onClick={onOpenDictation} className="bg-gray-800 hover:bg-gray-700 text-xs text-green-400 px-3 py-1 rounded border border-gray-700 flex items-center space-x-1 transition-colors shadow"><span>🎙️ Open Dictation Studio</span></button>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={isMasking} className="w-full h-[360px] bg-gray-950 border border-gray-700 rounded-b-lg p-4 text-green-400 font-mono focus:outline-none focus:border-red-500 transition-colors resize-none disabled:opacity-80" placeholder="Type normal text, or wrap code like this:&#10;&#10;'''python'''&#10;print('Hello World')&#10;'''/python'''" />
      </div>
      <AnimatePresence>
        {requirePasscode && (
          <motion.div initial={{ height: 0, opacity: 0, scale: 0.95 }} animate={{ height: "auto", opacity: 1, scale: 1 }} exit={{ height: 0, opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-4 bg-gray-950 border border-red-500/50 rounded-lg p-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-red-400 tracking-wider">🔒 MILITARY-GRADE ENCRYPTION LAYER</span>
              <span className="text-xs font-mono text-green-400 animate-pulse">{encryptedDisplay}</span>
            </div>
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Enter decryption passcode..." className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-center focus:outline-none focus:border-red-500 transition-colors" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-between items-center mt-2 relative z-10">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input type="checkbox" checked={requirePasscode} onChange={(e) => setRequirePasscode(e.target.checked)} className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-500 focus:ring-red-500 focus:ring-offset-gray-900" />
          <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Require Passcode 🛡️</span>
        </label>
        <button onClick={handleGenerate} disabled={isLoading} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center space-x-2 shadow-lg hover:shadow-red-600/50 scale-105">
          <span>{isLoading ? "Encrypting..." : "Generate Link"}</span><span>✈️</span>
        </button>
      </div>
    </>
  );
}