"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function MatrixRain({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gray-950">
          <div className="absolute inset-0 bg-black/60 z-10" />
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div key={i} initial={{ y: "-100%" }} animate={{ y: "100vh" }} transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }} className="absolute flex flex-col font-mono text-xl z-0" style={{ left: `${i * 2.5}%` }}>
              {Array.from({ length: 25 }).map((_, j) => (
                <div key={j} className={j === 0 ? "text-white opacity-100 shadow-[0_0_8px_#fff]" : "text-green-500 opacity-60"}>{String.fromCharCode(33 + Math.floor(Math.random() * 93))}</div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}