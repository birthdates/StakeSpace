import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { hidden } from "chalk";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

export type DropDownItem = {
  image?: JSX.Element;
  text: string;
  value: any;
  style?: string;
};

export default function DropDown({
  items,
  onSelect,
  active,
  className,
  bgColor,
  clickOnly,
  noScale,
}: {
  items: DropDownItem[];
  onSelect: (value: DropDownItem) => void;
  active: number;
  className?: string;
  bgColor?: string;
  clickOnly?: boolean;
  noScale?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (click: boolean, e: MouseEvent) => {
      if (elementRef.current?.parentElement?.contains(e.target as Node)) {
        setShown((prev) => {
          return click ? !prev : true;
        });
      } else if (!elementRef.current?.contains(e.target as Node)) {
        setShown(false);
      }
    };

    const clickListener = listener.bind(null, true);
    const mouseoverListener = listener.bind(null, false);
    document.addEventListener("click", clickListener);
    if (!clickOnly) document.addEventListener("mouseover", mouseoverListener);
    return () => {
      document.removeEventListener("click", clickListener);
      if (!clickOnly)
        document.removeEventListener("mouseover", mouseoverListener);
    };
  }, []);

  return (
    <AnimatePresence>
      {!shown ? (
        <span ref={elementRef}></span>
      ) : (
        <div
          ref={elementRef}
          className={clsx(
            className +
              " flex flex-col absolute select-none" +
              (!className || !className.includes("w-") ? " w-full" : ""),
          )}
          style={{ top: "100%", zIndex: 9999 }}
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            style={{ zIndex: 9999 }}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className={clsx(
                  "flex w-full flex-row items-center justify-center " +
                    (bgColor ?? "secondary"),
                  {
                    primary: active === index,
                    "hover-scale": !noScale,
                  },
                )}
                onClick={() => onSelect(item)}
              >
                <div
                  className={
                    "flex flex-row items-center w-full px-2 py-2 cursor-pointer " +
                    (item.style ?? "")
                  }
                >
                  {item.image && item.image}
                  <span className={"font-bold"}>{item.text}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
