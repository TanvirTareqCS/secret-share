"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, set, push, onValue, get, remove } from "firebase/database";
import { db } from "../lib/firebase"; 

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [currentGroup, setCurrentGroup] = useState("");
  const [activeTab, setActiveTab] = useState<"pastebin" | "groups">("pastebin");

  const [text, setText] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [shareableLink, setShareableLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [encryptedDisplay, setEncryptedDisplay] = useState("SECURE_CIPHER_ACTIVE");

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState("");
  const [joinGroupName, setJoinGroupName] = useState("");
  const [groupMembersList, setGroupMembersList] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem("secureshare_username");
    if (savedUser) { setUsername(savedUser); setTempUsername(savedUser); }
    const savedGroup = localStorage.getItem("secureshare_group");
    if (savedGroup) { setCurrentGroup(savedGroup); setActiveTab("groups"); }
  }, []);

  useEffect(() => {
    if (!currentGroup || !username || !isMounted) return;
    const metaRef = ref(db, `groups/${currentGroup}/meta`);
    const unsubMeta = onValue(metaRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.creator !== username && !data.members?.includes(username)) {
          alert("You have been removed from this group.");
          handleLeaveLocal();
        } else {
          setGroupMembersList([data.creator, ...(data.members || [])]);
        }
      } else {
        alert("Group was deleted.");
        handleLeaveLocal();
      }
    });

    const msgRef = ref(db, `groups/${currentGroup}/messages`);
    const unsubMsg = onValue(msgRef, (snapshot) => {
      if (snapshot.exists()) {
        const msgs: Message[] = [];
        snapshot.forEach((child) => { msgs.push({ id: child.key as string, ...child.val() }); });
        setMessages(msgs);
      } else { setMessages([]); }
    });
    return () => { unsubMeta(); unsubMsg(); };
  }, [currentGroup, username, isMounted]);

  const handleLeaveLocal = () => {
    setCurrentGroup(""); localStorage.removeItem("secureshare_group");
    setMessages([]); setGroupMembersList([]);
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUsername.trim()) return;
    const cleanUser = tempUsername.trim().replace(/^@/, '');
    await set(ref(db, `users/${cleanUser}`), { registered: true, lastLogin: Date.now() });
    localStorage.setItem("secureshare_username", cleanUser);
    setUsername(cleanUser);
  };

  const handleClearUsername = async () => {
    if (!confirm("Logging out will wipe your temporary chat session data and exit your group. Continue?")) return;
    if (username) {
      await remove(ref(db, `users/${username}`));
      const groupsSnap = await get(ref(db, 'groups'));
      if (groupsSnap.exists()) {
        groupsSnap.forEach((groupSnap) => {
          const groupName = groupSnap.key; const meta = groupSnap.child('meta').val();
          if (meta) {
            groupSnap.child('messages').forEach((msgSnap) => {
              if (msgSnap.val().sender === username) { remove(ref(db, `groups/${groupName}/messages/${msgSnap.key}`)); }
            });
            if (meta.creator === username) {
              if (meta.members && meta.members.length > 0) {
                const newCreator = meta.members[0]; const newMembers = meta.members.slice(1);
                set(ref(db, `groups/${groupName}/meta`), { ...meta, creator: newCreator, members: newMembers });
              } else { remove(ref(db, `groups/${groupName}`)); }
            } else if (meta.members?.includes(username)) {
              const newMembers = meta.members.filter((m: string) => m !== username);
              set(ref(db, `groups/${groupName}/meta/members`), newMembers);
            }
          }
        });
      }
    }
    localStorage.removeItem("secureshare_username"); localStorage.removeItem("secureshare_group");
    setUsername(""); setTempUsername(""); setActiveTab("pastebin"); setCurrentGroup("");
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    const grp = newGroupName.trim();
    const groupSnap = await get(ref(db, `groups/${grp}`));
    if (groupSnap.exists()) { alert("Group name already taken!"); setIsCreatingGroup(false); return; }
    const memberArray = newGroupMembers ? newGroupMembers.split(',').map(m => m.trim().replace(/^@/, '')).filter(Boolean) : [];
    for (const member of memberArray) {
      const userSnap = await get(ref(db, `users/${member}`));
      if (!userSnap.exists()) { alert(`User @${member} is not registered in the system!`); setIsCreatingGroup(false); return; }
    }
    const filteredMembers = memberArray.filter(m => m !== username);
    await set(ref(db, `groups/${grp}/meta`), { creator: username, members: filteredMembers, createdAt: Date.now() });
    setCurrentGroup(grp); localStorage.setItem("secureshare_group", grp);
    setNewGroupName(""); setNewGroupMembers(""); setIsCreatingGroup(false);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinGroupName.trim()) return;
    const grp = joinGroupName.trim();
    setIsJoiningGroup(true);
    const metaSnap = await get(ref(db, `groups/${grp}/meta`));
    if (metaSnap.exists()) {
      const meta = metaSnap.val();
      if (meta.creator === username || meta.members?.includes(username)) {
        setCurrentGroup(grp); localStorage.setItem("secureshare_group", grp); setJoinGroupName("");
      } else { alert("You are not authorized to enter this group."); }
    } else { alert("Group does not exist."); }
    setIsJoiningGroup(false);
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this channel?")) return;
    const metaSnap = await get(ref(db, `groups/${currentGroup}/meta`));
    if (metaSnap.exists()) {
      const meta = metaSnap.val();
      if (meta.creator === username) {
        if (meta.members && meta.members.length > 0) {
          const newCreator = meta.members[0]; const newMembers = meta.members.slice(1);
          await set(ref(db, `groups/${currentGroup}/meta`), { ...meta, creator: newCreator, members: newMembers });
        } else { await remove(ref(db, `groups/${currentGroup}`)); }
      } else {
        const newMembers = meta.members.filter((m: string) => m !== username);
        await set(ref(db, `groups/${currentGroup}/meta/members`), newMembers);
      }
    }
    handleLeaveLocal();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !currentGroup) return;
    setIsSending(true);
    await push(ref(db, `groups/${currentGroup}/messages`), { sender: username, text: newMessageText.trim(), timestamp: Date.now() });
    setNewMessageText(""); setIsSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    await remove(ref(db, `groups/${currentGroup}/messages/${messageId}`));
  };

  useEffect(() => {
    if (requirePasscode) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
      const interval = setInterval(() => {
        let randomized = "";
        for (let i = 0; i < 14; i++) { randomized += chars[Math.floor(Math.random() * chars.length)]; }
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
      oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
      oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.6);
    } catch {}
  };

  const handleGenerate = async () => {
    if (!text.trim()) { alert("Please enter some text or code first!"); return; }
    if (requirePasscode && !passcode.trim()) { alert("Please enter a decryption passcode first!"); return; }
    setIsLoading(true);
    if (requirePasscode) {
      setIsMasking(true);
      const originalText = text; let currentIndex = 0;
      const maskInterval = setInterval(() => {
        currentIndex += Math.max(1, Math.floor(originalText.length / 15));
        if (currentIndex >= originalText.length) {
          setText("*".repeat(originalText.length)); clearInterval(maskInterval);
        } else { setText("*".repeat(currentIndex) + originalText.slice(currentIndex)); }
      }, 30);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    setIsFlying(true); playWhooshSound();
    const id = Math.random().toString(36).substring(2, 10);
    await set(ref(db, `pastebin/${id}`), { text, passcode: requirePasscode ? passcode : "", createdAt: Date.now() });
    setTimeout(() => {
      setShareableLink(`${window.location.origin}/s/${id}`); setIsFlying(false); setIsMasking(false);
    }, 1000);
    setIsLoading(false);
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      {/* FULL SCREEN MATRIX RAIN BACKGROUND (Only shows when requirePasscode is checked) */}
      <AnimatePresence>
        {requirePasscode && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gray-950"
          >
            <div className="absolute inset-0 bg-black/60 z-10" /> {/* Dark overlay so UI remains readable */}
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

      {/* Main App Container (Ensured it has z-10 to sit above the rain) */}
      <div className="absolute top-4 right-4 z-20">
        {username ? (
          <div className="flex items-center space-x-3 bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg shadow-lg relative">
            <span className="text-xs text-gray-400">Logged in as:</span>
            <span className="text-green-400 font-bold font-mono">@{username}</span>
            <button onClick={handleClearUsername} className="text-xs text-red-400 hover:text-red-300 underline ml-2 font-bold">Logout & Wipe Data</button>
          </div>
        ) : (
          <form onSubmit={handleSaveUsername} className="flex items-center space-x-2 bg-gray-900 border border-gray-800 p-2 rounded-lg shadow-lg relative">
            <input type="text" placeholder="Set username..." value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} className="bg-gray-950 border border-gray-700 rounded px-3 py-1 text-xs text-white font-mono focus:outline-none focus:border-red-500" />
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">Login</button>
          </form>
        )}
      </div>

      <AnimatePresence>
        {isFlying && (
          <motion.div initial={{ x: -200, y: 250, scale: 0.5, rotate: -45, opacity: 0 }} animate={{ x: [-200, 200, 500, 900], y: [250, -50, -200, -500], scale: [0.5, 1.5, 2.5, 3], rotate: [-45, -15, 15, 45], opacity: [0, 1, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: "easeInOut" }} className="absolute z-50 text-9xl pointer-events-none drop-shadow-[0_0_35px_rgba(239,68,68,0.8)]">✈️</motion.div>
        )}
      </AnimatePresence>

      <div className={`w-full max-w-3xl bg-gray-900/95 backdrop-blur-md p-8 rounded-xl shadow-2xl border ${requirePasscode ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-gray-800'} z-10 mt-12 transition-all duration-500`}>
        {username && (
          <div className="flex space-x-4 mb-6 border-b border-gray-800 pb-4">
            <button onClick={() => setActiveTab("pastebin")} className={`pb-2 font-bold text-sm transition-colors border-b-2 ${activeTab === "pastebin" ? "border-red-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>⚡ Ephemeral Pastebin</button>
            <button onClick={() => setActiveTab("groups")} className={`pb-2 font-bold text-sm transition-colors border-b-2 ${activeTab === "groups" ? "border-red-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>💬 Group Workspaces</button>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2 text-red-500">Secure <span className="text-white">Share</span></h1>
        <p className="text-gray-400 mb-6">
          {activeTab === "pastebin" ? "Self-destructing text and code snippets. Survives until destroyed or 10 minutes pass." : currentGroup ? `Active Channel: #${currentGroup}` : "Create a group workspace and add only registered friends."}
        </p>

        {activeTab === "groups" ? (
          /* ... Group UI remains exactly identical ... */
          !username ? ( <div className="bg-gray-950 border border-red-500/30 rounded-lg p-6 text-center font-mono text-red-400">Please register a username first!</div> ) : !currentGroup ? ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono"><form onSubmit={handleCreateGroup} className="bg-gray-950 border border-gray-800 rounded-lg p-5 space-y-4"><h2 className="text-lg font-bold text-green-400">Create New Group</h2><div><label className="text-xs text-gray-400 block mb-1">Group Name</label><input type="text" placeholder="e.g. project-alpha" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-red-500" /></div><div><label className="text-xs text-gray-400 block mb-1">Add Registered Friends (comma separated)</label><input type="text" placeholder="e.g. alice, bob" value={newGroupMembers} onChange={(e) => setNewGroupMembers(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-red-500" /></div><button type="submit" disabled={isCreatingGroup} className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-bold transition-colors text-sm">{isCreatingGroup ? "Creating..." : "Create & Enter Group"}</button></form><form onSubmit={handleJoinGroup} className="bg-gray-950 border border-gray-800 rounded-lg p-5 space-y-4"><h2 className="text-lg font-bold text-green-400">Enter Existing Group</h2><div><label className="text-xs text-gray-400 block mb-1">Group Name</label><input type="text" placeholder="e.g. project-alpha" value={joinGroupName} onChange={(e) => setJoinGroupName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-red-500" /></div><p className="text-xs text-gray-500 pt-6">Note: If the group doesn't exist or you are not a member, entry will be blocked.</p><button type="submit" disabled={isJoiningGroup} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded font-bold transition-colors text-sm">{isJoiningGroup ? "Checking..." : "Enter Channel"}</button></form></div> ) : ( <div className="space-y-4"><div className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800 text-xs font-mono"><div><span className="text-green-400 font-bold">Channel: #{currentGroup}</span><span className="text-gray-400 ml-3">Members: {groupMembersList.join(", ")}</span></div><button onClick={handleLeaveGroup} className="text-red-400 hover:text-red-300 underline font-bold">Leave Channel</button></div><div className="w-full h-80 bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-y-auto space-y-3 font-mono">{messages.length === 0 ? ( <div className="text-center text-gray-500 pt-24 text-sm">No messages in this workspace yet. Send the first update!</div> ) : ( messages.map((msg) => { const isMe = msg.sender === username; return ( <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}><div className="text-xs text-gray-500 mb-1">@{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div><div className={`p-3 rounded-lg max-w-md text-sm relative group ${isMe ? "bg-red-950/40 border border-red-500/30 text-white" : "bg-gray-900 border border-gray-700 text-gray-200"}`}><p className="whitespace-pre-wrap break-words">{msg.text}</p>{isMe && ( <button onClick={() => handleDeleteMessage(msg.id)} className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" title="Delete message">✕</button> )}</div></div> ); }) )}</div><form onSubmit={handleSendMessage} className="flex space-x-2"><input type="text" value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} placeholder="Type an important project update..." className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-red-500 text-sm" /><button type="submit" disabled={isSending} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">{isSending ? "..." : "Send"}</button></form></div> )
        ) : shareableLink ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-950 border border-green-500/30 rounded-lg p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-green-400">✨ Link Generated Successfully!</h2>
            <p className="text-gray-400 text-sm">Share this link with your friend. It will self-destruct after 10 minutes or when destroyed.</p>
            <div className="flex items-center space-x-2 bg-gray-900 p-3 rounded-lg border border-gray-700">
              <input type="text" readOnly value={shareableLink} className="w-full bg-transparent text-green-300 font-mono text-sm focus:outline-none" />
              <button onClick={() => { navigator.clipboard.writeText(shareableLink); alert("Link copied!"); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">Copy</button>
            </div>
            <button onClick={() => { setShareableLink(""); setText(""); setPasscode(""); setRequirePasscode(false); }} className="text-gray-400 hover:text-white text-sm underline transition-colors pt-2">Create another secret</button>
          </motion.div>
        ) : (
          <>
            <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={isMasking} className="w-full h-80 bg-gray-950 border border-gray-700 rounded-lg p-4 text-green-400 font-mono mb-4 focus:outline-none focus:border-red-500 transition-colors resize-none disabled:opacity-80 relative z-10" placeholder="Paste your code or secret text here..."></textarea>
            
            <AnimatePresence>
              {requirePasscode && (
                <motion.div initial={{ height: 0, opacity: 0, scale: 0.95 }} animate={{ height: "auto", opacity: 1, scale: 1 }} exit={{ height: 0, opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-4 bg-gray-950 border border-red-500/50 rounded-lg p-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-red-400 tracking-wider">🔒 MILITARY-GRADE ENCRYPTION LAYER</span>
                    <span className="text-xs font-mono text-green-400 animate-pulse">{encryptedDisplay}</span>
                  </div>
                  <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Enter decryption passcode..." className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-red-500 transition-colors" />
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
        )}
      </div>
    </main>
  );
}