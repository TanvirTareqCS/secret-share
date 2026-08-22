"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, get, remove } from "firebase/database";
import { db } from "../../../lib/firebase"; 

export default function SharedSecret({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [secretData, setSecretData] = useState<{ text: string; passcode?: string } | null>(null);
  const [error, setError] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [isDetonating, setIsDetonating] = useState(false);
  
  const [encryptedDisplay, setEncryptedDisplay] = useState("AWAITING_DECRYPTION_KEY...");

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        const snapshot = await get(ref(db, `pastebin/${id}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setSecretData(data);
          if (!data.passcode) {
            setIsUnlocked(true);
          }
        } else {
          setError("Secret not found. It may have been destroyed or expired.");
        }
      } catch (err) {
        setError("Error connecting to database.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecret();
  }, [id]);

  useEffect(() => {
    if (secretData?.passcode && !isUnlocked) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
      const interval = setInterval(() => {
        let randomized = "";
        for (let i = 0; i < 24; i++) {
          randomized += chars[Math.floor(Math.random() * chars.length)];
        }
        setEncryptedDisplay(randomized);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [secretData, isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretData && passcode === secretData.passcode) {
      setIsUnlocked(true);
    } else {
      alert("Incorrect passcode! The system has logged this attempt.");
      setPasscode("");
    }
  };

  const playExplosionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.5);
    } catch {}
  };

  const triggerDestruction = async () => {
    setIsDetonating(true);
    await remove(ref(db, `pastebin/${id}`));

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          playExplosionSound();
          setIsDestroyed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-green-500 font-mono">
        <p className="animate-pulse">DECRYPTING SECURE CHANNEL...</p>
      </div>
    );
  }

  if (error || !secretData) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-red-500/50 p-8 rounded-lg shadow-2xl text-center">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">ACCESS DENIED</h1>
          <p className="text-gray-400 font-mono text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isDestroyed) {
    return (
      <motion.div 
        initial={{ backgroundColor: "#ffffff" }}
        animate={{ backgroundColor: "#030712" }}
        transition={{ duration: 1 }}
        className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative"
      >
        <motion.div 
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: [1, 20, 50], opacity: [1, 1, 0] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute z-0 text-9xl pointer-events-none"
        >
          💥
        </motion.div>

        <motion.div 
          animate={{ x: [-20, 20, -20, 20, -10, 10, 0], y: [-20, 20, -20, 20, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
          className="z-10 max-w-md w-full bg-red-950/20 border border-red-600 p-8 rounded-lg text-center shadow-[0_0_50px_rgba(220,38,38,0.3)] mt-8"
        >
          <h1 className="text-4xl font-black text-red-500 mb-4 tracking-widest">OBLITERATED</h1>
          <p className="text-red-400 font-mono text-sm">
            This data has been permanently wiped from the server. It cannot be recovered by anyone.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* RECEIVER SIDE MATRIX RAIN (Shows only while awaiting passcode) */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gray-950"
          >
            <div className="absolute inset-0 bg-black/60 z-10" />
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "-100%" }}
                animate={{ y: "100vh" }}
                transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                className="absolute flex flex-col font-mono text-xl z-0"
                style={{ left: `${i * 2.5}%` }}
              >
                {Array.from({ length: 25 }).map((_, j) => (
                  <div key={j} className={j === 0 ? "text-white opacity-100 shadow-[0_0_8px_#fff]" : "text-green-500 opacity-60"}>
                    {String.fromCharCode(33 + Math.floor(Math.random() * 93))}
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`w-full max-w-3xl bg-gray-900/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border z-10 transition-all duration-500 ${!isUnlocked ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-gray-800'}`}>
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="space-y-6 text-center relative z-20">
            <h1 className="text-2xl font-bold text-red-500 mb-2">CLASSIFIED INTEL</h1>
            <p className="text-gray-400 text-sm mb-6">Enter decryption key to view payload.</p>
            
            <div className="bg-gray-950 border border-red-500/50 p-4 rounded-lg overflow-hidden">
              <span className="text-green-500 font-mono text-lg tracking-widest break-all">
                {encryptedDisplay}
              </span>
            </div>

            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Passcode..."
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white font-mono text-center focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              DECRYPT
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-400">Payload Decrypted</h2>
              {isDetonating && (
                <span className="text-red-500 font-black text-xl animate-ping">
                  00:0{countdown}
                </span>
              )}
            </div>

            <div className="w-full bg-gray-950 border border-gray-700 rounded-lg p-6 font-mono text-green-300 whitespace-pre-wrap break-words relative overflow-hidden text-sm">
              <p className="relative z-10">{secretData.text}</p>
              
              {isDetonating && (
                <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay pointer-events-none animate-pulse"></div>
              )}
            </div>

            <button
              onClick={triggerDestruction}
              disabled={isDetonating}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold py-4 rounded-lg mt-6 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all flex justify-center items-center space-x-2"
            >
              <span>{isDetonating ? "INCINERATING..." : "BURN AFTER READING"}</span>
              {!isDetonating && <span>🔥</span>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}