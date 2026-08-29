"use client";
import { useState, useEffect, use } from "react";
import { ref, get, remove } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { playExplosionSound } from "@/lib/audio/sfx";
import { speakText } from "@/lib/speech/tts";
import MatrixRain from "@/components/animations/MatrixRain";
import DetonationEffect from "@/components/animations/DetonationEffect";
import CompilerStudio from "@/components/popups/CompilerStudio";
import RenderContent from "@/components/ui/RenderContent";
import { SecretData } from "@/types";

export default function SharedSecret({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params); const { id } = unwrappedParams;
  const [secretData, setSecretData] = useState<SecretData | null>(null);
  const [error, setError] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [isDetonating, setIsDetonating] = useState(false);
  const [encryptedDisplay, setEncryptedDisplay] = useState("AWAITING_DECRYPTION_KEY...");
  
  const [isCompilerOpen, setIsCompilerOpen] = useState(false);
  const [compilerPayload, setCompilerPayload] = useState({ code: "", lang: "" });

  useEffect(() => {
    get(ref(db, `pastebin/${id}`)).then(snapshot => {
      if (snapshot.exists()) { setSecretData(snapshot.val()); if (!snapshot.val().passcode) setIsUnlocked(true); } 
      else setError("Secret not found. It may have been destroyed or expired.");
    }).catch(() => setError("Error connecting to database.")).finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (secretData?.passcode && !isUnlocked) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
      const interval = setInterval(() => { let rand = ""; for (let i = 0; i < 24; i++) rand += chars[Math.floor(Math.random() * chars.length)]; setEncryptedDisplay(rand); }, 50);
      return () => clearInterval(interval);
    }
  }, [secretData, isUnlocked]);

  const triggerDestruction = async () => {
    setIsDetonating(true); await remove(ref(db, `pastebin/${id}`));
    const timer = setInterval(() => { setCountdown((prev) => { if (prev <= 1) { clearInterval(timer); playExplosionSound(); setIsDestroyed(true); return 0; } return prev - 1; }); }, 1000);
  };

  if (isLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-green-500 font-mono"><p className="animate-pulse">DECRYPTING SECURE CHANNEL...</p></div>;
  if (error || !secretData) return <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4"><div className="max-w-md w-full bg-gray-900 border border-red-500/50 p-8 rounded-lg shadow-2xl text-center"><div className="text-6xl mb-4">💥</div><h1 className="text-2xl font-bold text-red-500 mb-2">ACCESS DENIED</h1><p className="text-gray-400 font-mono text-sm">{error}</p></div></div>;
  if (isDestroyed) return <DetonationEffect />;

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <CompilerStudio isOpen={isCompilerOpen} onClose={() => setIsCompilerOpen(false)} initialCode={compilerPayload.code} initialLang={compilerPayload.lang} />
      <MatrixRain isVisible={!isUnlocked} />

      <div className={`w-full max-w-4xl bg-gray-900/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border z-10 transition-all duration-500 ${!isUnlocked ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-gray-800'}`}>
        {!isUnlocked ? (
          <form onSubmit={(e) => { e.preventDefault(); if (passcode === secretData.passcode) setIsUnlocked(true); else { alert("Incorrect passcode!"); setPasscode(""); } }} className="space-y-6 text-center relative z-20">
            <h1 className="text-2xl font-bold text-red-500 mb-2">CLASSIFIED INTEL</h1>
            <p className="text-gray-400 text-sm mb-6">Enter decryption key to view payload.</p>
            <div className="bg-gray-950 border border-red-500/50 p-4 rounded-lg overflow-hidden"><span className="text-green-500 font-mono text-lg tracking-widest break-all">{encryptedDisplay}</span></div>
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Enter Passcode..." className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white font-mono text-center focus:outline-none focus:border-red-500" />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors">DECRYPT</button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold text-green-400">Payload Decrypted</h2>
                <button onClick={() => speakText(secretData.text)} className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1 rounded text-gray-300 transition-colors flex items-center border border-gray-700">🔊 Read</button>
              </div>
              {isDetonating && <span className="text-red-500 font-black text-xl animate-ping">00:0{countdown}</span>}
            </div>
            <div className="w-full bg-gray-950 border border-gray-700 rounded-lg p-6 relative overflow-hidden text-sm">
              <div className="relative z-10 max-w-none"><RenderContent content={secretData.text} onOpenCompiler={(code, lang) => { setCompilerPayload({ code, lang }); setIsCompilerOpen(true); }} isReceiver /></div>
              {isDetonating && <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay pointer-events-none animate-pulse"></div>}
            </div>
            <button onClick={triggerDestruction} disabled={isDetonating} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold py-4 rounded-lg mt-6 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all flex justify-center items-center space-x-2">
              <span>{isDetonating ? "INCINERATING..." : "BURN AFTER READING"}</span>{!isDetonating && <span>🔥</span>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}