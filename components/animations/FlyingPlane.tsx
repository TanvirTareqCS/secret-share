"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function FlyingPlane({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ x: -200, y: 250, scale: 0.5, rotate: -45, opacity: 0 }} animate={{ x: [-200, 200, 500, 900], y: [250, -50, -200, -500], scale: [0.5, 1.5, 2.5, 3], rotate: [-45, -15, 15, 45], opacity: [0, 1, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: "easeInOut" }} className="absolute z-50 text-9xl pointer-events-none drop-shadow-[0_0_35px_rgba(239,68,68,0.8)]">✈️</motion.div>
      )}
    </AnimatePresence>
  );
}