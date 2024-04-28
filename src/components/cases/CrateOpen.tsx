"use client";
import { useSite } from "@/utils/SiteContext";
import { Case, CaseItem } from "@/utils/cases";
import Image from "next/image";
import {MutableRefObject, useEffect, useMemo, useRef, useState} from "react";
import clsx from "clsx";
import { randomWithSeed } from "@/utils/random";
import { formatNumber, getItemColor } from "@/utils/helpers/items";
import { getWeight } from "@/utils/helpers/cases";
import { motion } from "framer-motion";

const SHOWN_ITEMS = 9;
const ITEMS_IN_CASE = 50;
const CASE_START_PERC = 0;
const ORIG_CASE_START = 51;

export default function CrateOpen({
  crate,
  crateItems,
  wonItem,
  onFinished,
  animationStart,
  host,
  multi,
  end,
  roundID,
}: {
  crate: Case;
  crateItems: CaseItem[];
  animationStart: MutableRefObject<number>;
  wonItem: CaseItem | undefined;
  onFinished?: Function;
  end?: number;
  host?: boolean;
  multi?: boolean;
  roundID: string;
}) {
  const [shownItems, setShownItems] = useState<CaseItem[]>([]);
  const [last, setLast] = useState<number>();
  const elementRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>();
  const lastPassed = useRef<number>(-1);
  const lastTranslate = useRef<number>(0);

  const randomDiff = useMemo(() => Math.max(Math.min(randomWithSeed(roundID ?? ""), 0.75), 0.05), [roundID]);
  const site = useSite();
  const CASE_END_FINAL = useMemo(() => 91 + (multi ? 0.2 : 0), [multi]);
  const CASE_END_PERC = useMemo(() => CASE_END_FINAL +
      randomDiff * (randomWithSeed((roundID ?? "") + "1") < 0.5 ? -1 : 1), [CASE_END_FINAL, randomDiff, roundID]);
  const WON_ITEM_INDEX = useMemo(() => Math.ceil(ITEMS_IN_CASE * (CASE_END_PERC / 100)) - 1, [CASE_END_PERC]);
  const getTranslate = useMemo(() => (num: any) => {
    return multi ? `translateY(-${num}%)` : `translateX(-${num}%)`;
  }, [multi]);
  
  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      element.style.transition = "";
      element.style.transform = getTranslate(ORIG_CASE_START);
    }
  }, [getTranslate]);

  const tickAnimation = () => {
    // use cosine to make it go slower at the end
    if (!elementRef.current) {
      return;
    }
    let progress = Math.min(Math.sin((Date.now() - animationStart.current) / 3000), 1);
    if (end && Date.now() >= (end-1000)) progress = 1;

    const translate = CASE_END_PERC - (1 - progress) * CASE_END_PERC + CASE_START_PERC;
    const element = elementRef.current!;
    const finished = lastTranslate.current > 0 && progress < lastTranslate.current;
    lastTranslate.current = progress;
    if (lastPassed.current === 0 || !finished) {
      if (!element.children[0]) {
        return;
      }
      const firstChildLen =
          element.children[0][multi ? "clientHeight" : "clientWidth"] + (multi ? 0 : 3);
      const totalLen = element[multi ? "clientHeight" : "clientWidth"];

      // Check how many children we have passed using firstChildWidth
      const passed = Math.floor(
          ((Math.min(translate, CASE_END_FINAL) / 100) * totalLen) / firstChildLen
      );
      if (passed != lastPassed.current) {
        lastPassed.current = passed;
        if (host) {
          const index = (Math.max(passed, 0) % 4) + 1;
          site.playAudio(`tick${index}.webm`);
        }
      }

      // SEt the opacity of the item we are on to 1
      if (element.children[passed]) {
        (element.children[passed] as HTMLDivElement).style.opacity = "1";
        const last = element.children[passed - 1];
        if (last) (last as HTMLDivElement).style.opacity = "0.6";
      }
      element!.style.transform = getTranslate(translate);
    }
    if (finished) {
      lastPassed.current = WON_ITEM_INDEX;
      clearInterval(animationRef.current!);
      animationRef.current = undefined;
      lastTranslate.current = -1;
      // Add transition to transform to make it smooth
      setTimeout(() => {
        element.style.transition = "transform 0.75s";
        element.style.transform = getTranslate(CASE_END_FINAL);
        for (const child of element.children) {
          (child as HTMLDivElement).style.opacity = "1";
        }
        if (onFinished && host) {
          onFinished();
        }
        setLast(lastPassed.current);
      }, 300);
    }
  };

  useEffect(() => {
    if (!crateItems.length) return;
    const items = [...crateItems];
    lastTranslate.current = -1;
    const shown = [];
    for (let i = 0; i < SHOWN_ITEMS; i++) {
      const totalWeight = items.reduce((a, b) => a + getWeight(crate, b.id), 0);
      const random = Math.random() * totalWeight;
      let current = 0;
      for (const item of items) {
        current += getWeight(crate, item.id);
        if (current > random) {
          shown.push(item);
          break;
        }
      }
    }

    setShownItems(shown);
    site.setLoading(false);
    return () => {
      clearInterval(animationRef.current);
    };
  }, [crateItems, crate]);

  useEffect(() => {
    if (!wonItem) return;
    // Fill shownItems with 50 items and put wonItem 4 items behind
    const items = [...crateItems];
    const shown: any[] = [];
    const hashNumber = parseInt(roundID, 16);
    let i = 0;
    while (shown.length < ITEMS_IN_CASE) {
      // Use server seed for random turn server seed from hex to number
      const randomNum = randomWithSeed(roundID + String(hashNumber) + i++) * 10000;
      let currentWeight = 0;
      for (const item of items) {
        currentWeight += item.weight;
        if (randomNum < currentWeight) {
          shown.push(item);
          break;
        }
      }
    }
    shown[WON_ITEM_INDEX] = wonItem;

    const element = elementRef.current;
    if (element) {
      element.style.transition = "";
      element.style.transform = getTranslate(CASE_START_PERC);
    }
    for (const child of element?.children!) {
      (child as HTMLDivElement).style.opacity = "0.6";
    }
    lastPassed.current = 0;
    setLast(-1);
    setShownItems(shown);
    animationRef.current = setInterval(tickAnimation, 10);

    return () => {
      clearInterval(animationRef.current);
    };
  }, [crateItems, wonItem]);

  return (
    <div className="flex flex-row relative w-full h-full items-center justify-center">
      {!multi && (
        <>
          <div className="absolute left-1/2 transform -translate-x-1/2 top-[-0.5rem] -translate-y-full">
            <svg
              fill="#7b42f5"
              height="25px"
              width="25px"
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 386.257 386.257"
              xmlSpace="preserve"
            >
              <polygon points="0,96.879 193.129,289.379 386.257,96.879 " />
            </svg>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-0.5rem] translate-y-full rotate-180">
            <svg
              fill="#7b42f5"
              height="25px"
              width="25px"
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 386.257 386.257"
              xmlSpace="preserve"
            >
              <polygon points="0,96.879 193.129,289.379 386.257,96.879 " />
            </svg>
          </div>
        </>
      )}
      {/* Original height of 8 rem */}
      <div
        className={clsx("w-full overflow-hidden h-full relative", { vignette: !multi })}
      >
        {multi && <div className="ticker" />}
        <div
          ref={elementRef}
          className={clsx("absolute", {
            "top-1/2 translate-y-[-51%] flex flex-col items-center w-full":
              multi,
            "left-1/2 translate-x-[-51%] inline-flex items-center h-full": !multi,
          })}
        >
          {shownItems.map((item, num) => (
            <div
              className={clsx(
                "flex flex-col flex-grow flex-shrink-0 basis-0 items-center justify-center relative w-[8rem]",
                {
                  "opacity-60": num !== 4,
                  "border-l-[3px] border-l-black radial-color h-full": !multi,
                  "min-h-[10rem] pt-[2rem]": multi,
                }
              )}
              style={
                {
                  "--color": `rgb(${getItemColor(
                    item.price! / crate.price,
                    item.price!
                  )})`,
                } as any
              }
              key={num}
            >
              {multi && (
                <div className="backdrop-radial absolute w-full h-[85%] opacity-[0.25] z-[1]" />
              )}
              <Image
                src={item.imageURL!}
                width={100}
                height={100}
                alt={item.name!}
                className={clsx("z-10", {
                  "bounce z-20 mb-3": last === num,
                })}
              />
              {last === num && (
                <motion.div
                  className="flex flex-row w-full font-bold h-full justify-center items-center text-[#b9e897] z-20 absolute"
                  style={{
                    textShadow: "0 2px 16px #79c93e"
                  }}
                  animate={{ scale: "100%" }}
                  // Make it start fast and end slow and bounce

                  transition={{ duration: 0.35, ease: "circOut", bounce: 0.75 }}
                  initial={{ scale: "0%" }}
                >
                  <span className="text-3xl" style={{
                    "-webkit-text-stroke": "0.75px #449409",
                  } as any}>${formatNumber(item.price!)}</span>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
