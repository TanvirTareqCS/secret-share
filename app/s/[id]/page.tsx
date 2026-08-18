"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ViewSecret() {
  const params = useParams();
  const id = params.id;

  const [secretText, setSecretText] = useState("");
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isExploding, setIsExploding] = useState(false);

  // A deep, bass-heavy explosion sound effect for the bomb
  const playExplosionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create white noise for the explosion hiss/blast
      const bufferSize = audioCtx.sampleRate * 1.5;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      // Filter the noise to make it a deep rumble
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 1.5);

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noise.start();
    } catch {
      // Audio context might be restricted before user interaction, ignore safely
    }
  };

  const fetchSecret = async (inputPasscode = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/get?id=${id}&passcode=${inputPasscode}`);
      const data = await res.json();

      if (res.ok) {
        setSecretText(data.text);
        setPasscodeRequired(false);
      } else {
        if (data.requiresPasscode) {
          setPasscodeRequired(true);
        } else {
          setError(data.error || "Secret not found or has expired.");
        }
      }
    } catch {
      setError("Failed to fetch the secret.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSecret();
  }, [id]);

  const handleDestroy = async () => {
    setIsExploding(true);
    playExplosionSound(); // Trigger the bomb boom sound!

    try {
      await fetch(`/api/destroy?id=${id}`, { method: "DELETE" });
      
      setTimeout(() => {
        setSecretText("");
        setError("💥 BOOM! This secret has been completely obliterated and wiped from the database.");
        setIsExploding(false);
      }, 1200);

    } catch {
      alert("Failed to destroy.");
      setIsExploding(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(secretText);
    alert("Code copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center font-mono">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          Decrypting secure transmission...
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Bomb Explosion Flash Overlay */}
      <AnimatePresence>
        {isExploding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0.9, 0], scale: [0.5, 4, 10] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 z-50 bg-red-600 flex items-center justify-center pointer-events-none"
          >
            <span className="text-9xl">💣💥🔥</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-3xl bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800 z-10">
        
        <h1 className="text-3xl font-bold mb-2 text-red-500">
          Secure <span className="text-white">View</span>
        </h1>

        {error ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-950/50 border border-red-500/30 text-red-400 p-6 rounded-lg text-center font-mono mt-4"
          >
            {error}
          </motion.div>
        ) : passcodeRequired ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4"
          >
            <p className="text-gray-400">🔒 This secret is locked with a custom passcode.</p>
            <input
              type="password"
              placeholder="Enter passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-red-500"
            />
            <button
              onClick={() => fetchSecret(passcode)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
            >
              Unlock Secret
            </button>
          </motion.div>
        ) : (
          <motion.div 
            animate={isExploding ? { x: [-25, 25, -25, 25, 0], y: [0, 0, 60, 250], rotate: [0, -8, 15, 35], opacity: [1, 1, 0.4, 0] } : {}}
            transition={{ duration: 1.1 }}
            className="space-y-4"
          >
            <p className="text-gray-400 text-sm">Review your shared text or code below:</p>
            <textarea
              readOnly
              value={secretText}
              className="w-full h-80 bg-gray-950 border border-gray-700 rounded-lg p-4 text-green-400 font-mono resize-none focus:outline-none"
            ></textarea>
            
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={copyCode}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                📋 Copy Code
              </button>

              <button
                onClick={handleDestroy}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center space-x-2 shadow-lg hover:shadow-red-600/50 scale-105"
              >
                <span>💥 Destroy Now</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}