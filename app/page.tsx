"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [text, setText] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [shareableLink, setShareableLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [isMasking, setIsMasking] = useState(false); // Controls the asterisk conversion animation
  
  const [encryptedDisplay, setEncryptedDisplay] = useState("SECURE_CIPHER_ACTIVE");

  useEffect(() => {
    if (requirePasscode) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
      const interval = setInterval(() => {
        let randomized = "";
        for (let i = 0; i < 14; i++) {
          randomized += chars[Math.floor(Math.random() * chars.length)];
        }
        setEncryptedDisplay(randomized);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [requirePasscode]);

  const playWhooshSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.6);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.6);
    } catch {
      // Audio context safety catch
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      alert("Please enter some text or code first!");
      return;
    }

    if (requirePasscode && !passcode.trim()) {
      alert("Please enter a decryption passcode first!");
      return;
    }

    setIsLoading(true);

    // If passcode is required, trigger the cool character-by-character asterisk conversion animation
    if (requirePasscode) {
      setIsMasking(true);
      const originalText = text;
      let currentIndex = 0;

      const maskInterval = setInterval(() => {
        currentIndex += Math.max(1, Math.floor(originalText.length / 15));
        if (currentIndex >= originalText.length) {
          setText("*".repeat(originalText.length));
          clearInterval(maskInterval);
        } else {
          setText("*".repeat(currentIndex) + originalText.slice(currentIndex));
        }
      }, 30);

      // Wait a moment for the masking effect to finish before launching the plane
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setIsFlying(true);
    playWhooshSound();

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: text.includes("*") ? text : text, // Sends the content securely
          passcode: requirePasscode ? passcode : "" 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const link = `${window.location.origin}/s/${data.id}`;
        setTimeout(() => {
          setShareableLink(link);
          setIsFlying(false);
          setIsMasking(false);
        }, 1000);
      } else {
        alert(data.error || "Something went wrong.");
        setIsFlying(false);
        setIsMasking(false);
      }
    } catch (error) {
      console.error("Error generating link:", error);
      alert("Failed to connect to the server.");
      setIsFlying(false);
      setIsMasking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink);
    alert("Link copied to clipboard!");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      {/* TURBO PAPER PLANE ANIMATION */}
      <AnimatePresence>
        {isFlying && (
          <motion.div
            initial={{ x: -200, y: 250, scale: 0.5, rotate: -45, opacity: 0 }}
            animate={{ 
              x: [-200, 200, 500, 900], 
              y: [250, -50, -200, -500], 
              scale: [0.5, 1.5, 2.5, 3], 
              rotate: [-45, -15, 15, 45],
              opacity: [0, 1, 1, 0] 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute z-50 text-9xl pointer-events-none drop-shadow-[0_0_35px_rgba(239,68,68,0.8)]"
          >
            ✈️
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-3xl bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800 z-10">
        
        <h1 className="text-3xl font-bold mb-2 text-red-500">
          Secure <span className="text-white">Share</span>
        </h1>
        <p className="text-gray-400 mb-6">
          Self-destructing text and code snippets. Survives until destroyed or 10 minutes pass.
        </p>

        {shareableLink ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-950 border border-green-500/30 rounded-lg p-6 text-center space-y-4"
          >
            <h2 className="text-xl font-bold text-green-400">✨ Link Generated Successfully!</h2>
            <p className="text-gray-400 text-sm">
              Share this link with your friend. It will self-destruct after 10 minutes or when destroyed.
            </p>
            <div className="flex items-center space-x-2 bg-gray-900 p-3 rounded-lg border border-gray-700">
              <input 
                type="text" 
                readOnly 
                value={shareableLink} 
                className="w-full bg-transparent text-green-300 font-mono text-sm focus:outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
              >
                Copy
              </button>
            </div>
            <button 
              onClick={() => { setShareableLink(""); setText(""); setPasscode(""); setRequirePasscode(false); }}
              className="text-gray-400 hover:text-white text-sm underline transition-colors pt-2"
            >
              Create another secret
            </button>
          </motion.div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isMasking}
              className="w-full h-80 bg-gray-950 border border-gray-700 rounded-lg p-4 text-green-400 font-mono mb-4 focus:outline-none focus:border-red-500 transition-colors resize-none disabled:opacity-80"
              placeholder="Paste your code or secret text here..."
            ></textarea>

            <AnimatePresence>
              {requirePasscode && (
                <motion.div
                  initial={{ height: 0, opacity: 0, scale: 0.95 }}
                  animate={{ height: "auto", opacity: 1, scale: 1 }}
                  exit={{ height: 0, opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mb-4 bg-gray-950 border border-red-500/50 rounded-lg p-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-red-400 tracking-wider">🔒 MILITARY-GRADE ENCRYPTION LAYER</span>
                    <span className="text-xs font-mono text-green-400 animate-pulse">{encryptedDisplay}</span>
                  </div>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter decryption passcode..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center mt-2">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={requirePasscode}
                  onChange={(e) => setRequirePasscode(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-red-500 focus:ring-red-500 focus:ring-offset-gray-900" 
                />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                  Require Passcode 🛡️
                </span>
              </label>

              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center space-x-2 shadow-lg hover:shadow-red-600/50 scale-105"
              >
                <span>{isLoading ? "Encrypting..." : "Generate Link"}</span>
                <span>✈️</span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}