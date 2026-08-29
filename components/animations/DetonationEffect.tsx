"use client";
import { motion } from "framer-motion";

export default function DetonationEffect() {
  return (
    <motion.div initial={{ backgroundColor: "#ffffff" }} animate={{ backgroundColor: "#030712" }} transition={{ duration: 1 }} className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <motion.div initial={{ scale: 1, opacity: 1 }} animate={{ scale: [1, 20, 50], opacity: [1, 1, 0] }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute z-0 text-9xl pointer-events-none">💥</motion.div>
      <motion.div animate={{ x: [-20, 20, -20, 20, -10, 10, 0], y: [-20, 20, -20, 20, -10, 10, 0] }} transition={{ duration: 0.5 }} className="z-10 max-w-md w-full bg-red-950/20 border border-red-600 p-8 rounded-lg text-center shadow-[0_0_50px_rgba(220,38,38,0.3)] mt-8">
        <h1 className="text-4xl font-black text-red-500 mb-4 tracking-widest">OBLITERATED</h1>
        <p className="text-red-400 font-mono text-sm">This data has been permanently wiped from the server. It cannot be recovered by anyone.</p>
      </motion.div>
    </motion.div>
  );
}