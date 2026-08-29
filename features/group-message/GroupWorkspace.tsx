"use client";
import { useState, useEffect, useRef } from "react";
import { ref, set, push, onValue, get, remove } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { speakText } from "@/lib/speech/tts";
import RenderContent from "@/components/ui/RenderContent";
import { Message } from "@/types";

interface Props { username: string; currentGroup: string; setCurrentGroup: (g: string) => void; onOpenDictation: () => void; onOpenCompiler: (c: string, l: string) => void; newMessageText: string; setNewMessageText: React.Dispatch<React.SetStateAction<string>>; }

export default function GroupWorkspace({ username, currentGroup, setCurrentGroup, onOpenDictation, onOpenCompiler, newMessageText, setNewMessageText }: Props) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState("");
  const [joinGroupName, setJoinGroupName] = useState("");
  const [groupMembersList, setGroupMembersList] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  
  // Auto-scroll reference
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentGroup || !username) return;
    const metaRef = ref(db, `groups/${currentGroup}/meta`);
    const unsubMeta = onValue(metaRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.creator !== username && !data.members?.includes(username)) { alert("Removed from group."); handleLeaveLocal(); }
        else setGroupMembersList([data.creator, ...(data.members || [])]);
      } else { alert("Group was deleted."); handleLeaveLocal(); }
    });
    const msgRef = ref(db, `groups/${currentGroup}/messages`);
    const unsubMsg = onValue(msgRef, (snapshot) => {
      if (snapshot.exists()) { const msgs: Message[] = []; snapshot.forEach((child) => { msgs.push({ id: child.key as string, ...child.val() }); }); setMessages(msgs); }
      else setMessages([]);
    });
    return () => { unsubMeta(); unsubMsg(); };
  }, [currentGroup, username]);

  const handleLeaveLocal = () => { setCurrentGroup(""); localStorage.removeItem("secureshare_group"); setMessages([]); setGroupMembersList([]); };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newGroupName.trim()) return; setIsCreatingGroup(true);
    const grp = newGroupName.trim();
    if ((await get(ref(db, `groups/${grp}`))).exists()) { alert("Group name taken!"); setIsCreatingGroup(false); return; }
    const memberArray = newGroupMembers ? newGroupMembers.split(',').map(m => m.trim().replace(/^@/, '')).filter(Boolean) : [];
    for (const member of memberArray) { if (!(await get(ref(db, `users/${member}`))).exists()) { alert(`User @${member} not registered!`); setIsCreatingGroup(false); return; } }
    await set(ref(db, `groups/${grp}/meta`), { creator: username, members: memberArray.filter(m => m !== username), createdAt: Date.now() });
    setCurrentGroup(grp); localStorage.setItem("secureshare_group", grp); setNewGroupName(""); setNewGroupMembers(""); setIsCreatingGroup(false);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault(); if (!joinGroupName.trim()) return; setIsJoiningGroup(true);
    const grp = joinGroupName.trim(); const metaSnap = await get(ref(db, `groups/${grp}/meta`));
    if (metaSnap.exists()) {
      const meta = metaSnap.val();
      if (meta.creator === username || meta.members?.includes(username)) { setCurrentGroup(grp); localStorage.setItem("secureshare_group", grp); setJoinGroupName(""); } 
      else alert("Not authorized.");
    } else alert("Group does not exist.");
    setIsJoiningGroup(false);
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this channel?")) return;
    const metaSnap = await get(ref(db, `groups/${currentGroup}/meta`));
    if (metaSnap.exists()) {
      const meta = metaSnap.val();
      if (meta.creator === username) {
        if (meta.members?.length > 0) await set(ref(db, `groups/${currentGroup}/meta`), { ...meta, creator: meta.members[0], members: meta.members.slice(1) });
        else await remove(ref(db, `groups/${currentGroup}`));
      } else await set(ref(db, `groups/${currentGroup}/meta/members`), meta.members.filter((m: string) => m !== username));
    }
    handleLeaveLocal();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); if (!newMessageText.trim() || !currentGroup) return; setIsSending(true);
    await push(ref(db, `groups/${currentGroup}/messages`), { sender: username, text: newMessageText.trim(), timestamp: Date.now() });
    setNewMessageText(""); setIsSending(false);
  };

  if (!username) return <div className="bg-gray-950 border border-red-500/30 rounded-lg p-6 text-center font-mono text-red-400">Please register a username first!</div>;

  if (!currentGroup) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
      <form onSubmit={handleCreateGroup} className="bg-gray-950 border border-gray-800 rounded-lg p-5 space-y-4">
        <h2 className="text-lg font-bold text-green-400">Create New Group</h2>
        <div><label className="text-xs text-gray-400 block mb-1">Group Name</label><input type="text" placeholder="e.g. project-alpha" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-red-500" /></div>
        <div><label className="text-xs text-gray-400 block mb-1">Add Registered Friends</label><input type="text" placeholder="e.g. alice, bob" value={newGroupMembers} onChange={(e) => setNewGroupMembers(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-red-500" /></div>
        <button type="submit" disabled={isCreatingGroup} className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-bold transition-colors text-sm">{isCreatingGroup ? "Creating..." : "Create & Enter Group"}</button>
      </form>
      <form onSubmit={handleJoinGroup} className="bg-gray-950 border border-gray-800 rounded-lg p-5 space-y-4">
        <h2 className="text-lg font-bold text-green-400">Enter Existing Group</h2>
        <div><label className="text-xs text-gray-400 block mb-1">Group Name</label><input type="text" placeholder="e.g. project-alpha" value={joinGroupName} onChange={(e) => setJoinGroupName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-red-500" /></div>
        <p className="text-xs text-gray-500 pt-6">Note: If the group doesn't exist or you are not a member, entry will be blocked.</p>
        <button type="submit" disabled={isJoiningGroup} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded font-bold transition-colors text-sm">{isJoiningGroup ? "Checking..." : "Enter Channel"}</button>
      </form>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800 text-xs font-mono">
        <div><span className="text-green-400 font-bold">Channel: #{currentGroup}</span><span className="text-gray-400 ml-3">Members: {groupMembersList.join(", ")}</span></div>
        <button onClick={handleLeaveGroup} className="text-red-400 hover:text-red-300 underline font-bold">Leave Channel</button>
      </div>
      <div className="w-full h-500px bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-y-auto space-y-3 font-mono">
        {messages.length === 0 ? <div className="text-center text-gray-500 pt-24 text-sm">No messages in this workspace yet. Send the first update!</div> : messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === username ? "items-end" : "items-start"}`}>
            <div className="text-xs text-gray-500 mb-1 flex items-center">@{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<button onClick={() => speakText(msg.text)} className="ml-2 hover:text-green-400 transition-colors">🔊</button></div>
            <div className={`p-4 rounded-lg max-w-full lg:max-w-[85%] text-sm relative group ${msg.sender === username ? "bg-red-950/40 border border-red-500/30 text-white" : "bg-gray-900 border border-gray-700 text-gray-200"}`}>
              <div className="max-w-none"><RenderContent content={msg.text} onOpenCompiler={onOpenCompiler} /></div>
              {msg.sender === username && <button onClick={() => remove(ref(db, `groups/${currentGroup}/messages/${msg.id}`))} className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">✕</button>}
            </div>
          </div>
        ))}
        {/* Invisible div to anchor auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex space-x-2 items-end">
        <textarea value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Type update (Shift+Enter for new line)" className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-red-500 text-sm resize-none min-h-50px max-h-150px" rows={2} />
        <button type="button" onClick={onOpenDictation} className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-4 py-3 rounded-lg transition-colors h-50px flex items-center justify-center">🎙️</button>
        <button type="submit" disabled={isSending} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm h-50px">{isSending ? "..." : "Send"}</button>
      </form>
    </div>
  );
}