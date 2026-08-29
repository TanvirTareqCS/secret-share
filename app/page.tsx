"use client";
import { useState, useEffect } from "react";
import LoginBar from "@/features/auth/LoginBar";
import PastebinWorkspace from "@/features/pastebin/PastebinWorkspace";
import GroupWorkspace from "@/features/group-message/GroupWorkspace";
import MatrixRain from "@/components/animations/MatrixRain";
import FlyingPlane from "@/components/animations/FlyingPlane";
import DictationStudio from "@/components/popups/DictationStudio";
import CompilerStudio from "@/components/popups/CompilerStudio";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [currentGroup, setCurrentGroup] = useState("");
  const [activeTab, setActiveTab] = useState<"pastebin" | "groups">("pastebin");

  // Shared Modal States
  const [isDictationOpen, setIsDictationOpen] = useState(false);
  const [dictateTarget, setDictateTarget] = useState<"pastebin" | "chat" | null>(null);
  const [isCompilerOpen, setIsCompilerOpen] = useState(false);
  const [compilerPayload, setCompilerPayload] = useState({ code: "", lang: "" });

  // Pastebin & Group Text States
  const [pastebinText, setPastebinText] = useState("");
  const [chatText, setChatText] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem("secureshare_username"); if (savedUser) setUsername(savedUser);
    const savedGroup = localStorage.getItem("secureshare_group"); if (savedGroup) { setCurrentGroup(savedGroup); setActiveTab("groups"); }
  }, []);

  const handleDictationInsert = (text: string) => {
    if (dictateTarget === "pastebin") setPastebinText(prev => prev + (prev && !prev.endsWith(" ") && text ? " " : "") + text);
    else if (dictateTarget === "chat") setChatText(prev => prev + (prev && !prev.endsWith(" ") && text ? " " : "") + text);
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <CompilerStudio isOpen={isCompilerOpen} onClose={() => setIsCompilerOpen(false)} initialCode={compilerPayload.code} initialLang={compilerPayload.lang} />
      <DictationStudio isOpen={isDictationOpen} onClose={() => setIsDictationOpen(false)} onInsert={handleDictationInsert} />
      <MatrixRain isVisible={requirePasscode} />
      <LoginBar username={username} setUsername={setUsername} onLogout={() => { setCurrentGroup(""); setActiveTab("pastebin"); }} />
      <FlyingPlane isVisible={isFlying} />

      <div className={`w-full max-w-4xl bg-gray-900/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border z-10 mt-12 transition-all duration-500 ${requirePasscode ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-gray-800'}`}>
        {username && (
          <div className="flex space-x-4 mb-6 border-b border-gray-800 pb-4">
            <button onClick={() => setActiveTab("pastebin")} className={`pb-2 font-bold text-sm transition-colors border-b-2 ${activeTab === "pastebin" ? "border-red-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>⚡ Ephemeral Pastebin</button>
            <button onClick={() => setActiveTab("groups")} className={`pb-2 font-bold text-sm transition-colors border-b-2 ${activeTab === "groups" ? "border-red-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>💬 Group Workspaces</button>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-2 text-red-500">Secure <span className="text-white">Share</span></h1>
        <p className="text-gray-400 mb-6">{activeTab === "pastebin" ? "Self-destructing text and code snippets." : currentGroup ? `Active Channel: #${currentGroup}` : "Create a group workspace and add only registered friends."}</p>

        {activeTab === "pastebin" ? (
          <PastebinWorkspace onOpenDictation={() => { setDictateTarget("pastebin"); setIsDictationOpen(true); }} setIsFlying={setIsFlying} requirePasscode={requirePasscode} setRequirePasscode={setRequirePasscode} text={pastebinText} setText={setPastebinText} />
        ) : (
          <GroupWorkspace username={username} currentGroup={currentGroup} setCurrentGroup={setCurrentGroup} newMessageText={chatText} setNewMessageText={setChatText} onOpenDictation={() => { setDictateTarget("chat"); setIsDictationOpen(true); }} onOpenCompiler={(code, lang) => { setCompilerPayload({ code, lang }); setIsCompilerOpen(true); }} />
        )}
      </div>
    </main>
  );
}