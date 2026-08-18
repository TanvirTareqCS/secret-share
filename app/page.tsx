"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [text, setText] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [shareableLink, setShareableLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) {
      alert("Please enter some text or code first!");
      return;
    }

    setIsLoading(true);

    try {
      // Send the text and passcode to our backend API route
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, passcode: requirePasscode ? passcode : "" }),
      });

      const data = await response.json();

      if (response.ok) {
        // Create the full URL based on where the app is currently running
        const link = `${window.location.origin}/s/${data.id}`;
        setShareableLink(link);
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error generating link:", error);
      alert("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink);
    alert("Link copied to clipboard!");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
        
        <h1 className="text-3xl font-bold mb-2 text-red-500">
          Secure <span className="text-white">Share</span>
        </h1>
        <p className="text-gray-400 mb-6">
          Self-destructing text and code snippets. Survives until destroyed or 10 minutes pass.
        </p>

        {shareableLink ? (
          // If the link is generated, show the success view
          <div className="bg-gray-950 border border-green-500/30 rounded-lg p-6 text-center space-y-4">
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
              onClick={() => { setShareableLink(""); setText(""); setPasscode(""); }}
              className="text-gray-400 hover:text-white text-sm underline transition-colors pt-2"
            >
              Create another secret
            </button>
          </div>
        ) : (
          // Otherwise, show the creation form
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-80 bg-gray-950 border border-gray-700 rounded-lg p-4 text-green-400 font-mono mb-4 focus:outline-none focus:border-red-500 transition-colors resize-none"
              placeholder="Paste your code or secret text here..."
            ></textarea>

            <AnimatePresence>
              {requirePasscode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter a secret passcode..."
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
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
                  Require Passcode
                </span>
              </label>

              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>{isLoading ? "Generating..." : "Generate Link"}</span>
                <span>✈️</span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}