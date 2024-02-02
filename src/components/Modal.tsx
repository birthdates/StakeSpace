import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Modal({
  children,
  onExit,
}: {
  children: React.ReactNode;
  onExit: Function;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // On click outside of element ref, close
    const listener = (e: MouseEvent) => {
      const bgs = document.querySelectorAll("#modal-bg");
      const notInBg =
        bgs.length > 0 &&
        !Array.from(bgs).some((bg) => bg.contains(e.target as Node));
      if (
        (notInBg && elementRef.current?.contains(e.target as Node)) ||
        !document.contains(e.target as Node)
      )
        return;
      e.stopImmediatePropagation();
      if (onExit) {
        onExit();
      }
    };

    document.addEventListener("click", listener);
    return () => {
      document.removeEventListener("click", listener);
    };
  }, [elementRef, onExit]);

  return (
    <div
      className="fixed z-[100] top-0 left-0 select-none w-full h-full flex items-center justify-center"
      ref={elementRef}
    >
      <div
        className="absolute bg opacity-30 z-[50] h-full w-full blur-3xl"
        id="modal-bg"
      />
      <AnimatePresence>
        <motion.div
          initial={{ transform: "scale(0%)" }}
          animate={{ transform: "scale(100%)" }}
          className={"z-[100]"}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
