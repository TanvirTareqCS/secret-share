"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ViewSecret() {
  const params = useParams();
  const id = params.id;

  const [secretText, setSecretText] = useState("");
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    try {
      await fetch(`/api/destroy?id=${id}`, { method: "DELETE" });
      setSecretText("");
      setError("💥 This secret has been destroyed and permanently wiped from the database.");
    } catch {
      alert("Failed to destroy.");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(secretText);
    alert("Code copied to clipboard!");
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center font-mono">Loading secure message...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
        
        <h1 className="text-3xl font-bold mb-2 text-red-500">
          Secure <span className="text-white">View</span>
        </h1>

        {error ? (
          <div className="bg-red-950/50 border border-red-500/30 text-red-400 p-6 rounded-lg text-center font-mono">
            {error}
          </div>
        ) : passcodeRequired ? (
          <div className="space-y-4 pt-4">
            <p className="text-gray-400">This secret is protected by a passcode.</p>
            <input
              type="password"
              placeholder="Enter passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-red-500"
            />
            <button
              onClick={() => fetchSecret(passcode)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Unlock Secret
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center space-x-2"
              >
                <span>💥 Destroy Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}