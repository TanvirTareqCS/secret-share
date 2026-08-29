"use client";
import { useState } from "react";
import { ref, set, remove, get } from "firebase/database";
import { db } from "@/lib/firebase/config";

export default function LoginBar({ username, setUsername, onLogout }: { username: string, setUsername: (u: string) => void, onLogout: () => void }) {
  const [tempUsername, setTempUsername] = useState(username);

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
            groupSnap.child('messages').forEach((msgSnap) => { if (msgSnap.val().sender === username) remove(ref(db, `groups/${groupName}/messages/${msgSnap.key}`)); });
            if (meta.creator === username) {
              if (meta.members && meta.members.length > 0) {
                const newCreator = meta.members[0]; const newMembers = meta.members.slice(1);
                set(ref(db, `groups/${groupName}/meta`), { ...meta, creator: newCreator, members: newMembers });
              } else remove(ref(db, `groups/${groupName}`));
            } else if (meta.members?.includes(username)) {
              set(ref(db, `groups/${groupName}/meta/members`), meta.members.filter((m: string) => m !== username));
            }
          }
        });
      }
    }
    localStorage.removeItem("secureshare_username"); localStorage.removeItem("secureshare_group");
    setUsername(""); setTempUsername(""); onLogout();
  };

  return (
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
  );
}