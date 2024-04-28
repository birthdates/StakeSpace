"use client";
import { useSite } from "@/utils/SiteContext";
import { Case, CaseItem } from "@/utils/cases";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import CrateOpen from "./CrateOpen";
import { CasePreview } from "./CasePreview";
import { MAX_CASES } from "@/utils/helpers/cases";
import clsx from "clsx";
import { formatNumber, isBigWin } from "@/utils/helpers/items";
import Header from "../Header";

export default function CasePage({ crate }: { crate: Case }) {
  const [crateItems, setCrateItems] = useState<CaseItem[]>([]);
  const [serverSeed, setServerSeed] = useState("");
  const [wonItems, setWonItems] = useState<CaseItem[]>([]);
  const [roundIDs, setRoundIDs] = useState<string[]>([]);
  const [amount, setAmount] = useState(1);
  const startTime = useRef<number>(-1);
  const site = useSite();

  const start = (
    serverSeed: string,
    roundIDs: string[],
    wonItems: CaseItem[],
    start?: number
  ) => {
    if (!serverSeed || !roundIDs || !wonItems || !wonItems.length || !roundIDs.length)
      return;
    startTime.current = start ?? Date.now();
    setServerSeed(serverSeed);
    setRoundIDs(roundIDs);
    setWonItems(wonItems);
  };

  const open = (demo: boolean) => {
    site.socketCallback(
      "open_case",
      (data: any) => {
        const { serverSeed, roundIDs, wonItems } = data;
        start(serverSeed, roundIDs, wonItems);
      },
      { crate: crate.id, amount, demo }
    );
  };

  const setCases = (amount: number) => {
    if (startTime.current != -1) return;
    setRoundIDs([]);
    setWonItems([]);
    setAmount(amount);
  };

  const onFinish = () => {
    site.socketMessage("finish_case", { crate: crate.id });
    const sound = isBigWin(wonItems, crate.price) ? "jackpot" : "land";
    site.playAudio(`${sound}.webm`);
    startTime.current = -1;
  };

  const checkForRunning = () => {
    site.socketCallback(
      "running_case",
      (data: any) => {
        if (!data) {
          return;
        }
        const { serverSeed, roundIDs, wonItems, startTime } = data;
        if (!startTime) {
          return;
        }
        setAmount(wonItems.length);
        start(serverSeed, roundIDs, wonItems, startTime);
      },
      { crate: crate.id }
    );
  };

  useEffect(() => {
    site.setLoading(true);
    site.socketCallback(
      "map_items",
      (data: any) => {
        setCrateItems(data);
        checkForRunning();
      },
      {
        items: crate.items,
        targetPrice: crate.price,
      }
    );
  }, []);

  return (
    <>
      <div className="flex w-[50rem] flex-row mt-10 select-none justify-center grow-0 overflow-hidden h-full">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="flex flex-row w-full justify-center mb-10 h-full">
            <Image src={crate.image} alt={crate.name} width={150} height={150} />
            <div className="flex flex-col ml-10">
              <span className="text-2xl">{crate.name}</span>
              <div className="flex flex-row">
                <button
                  className="accent hover-scale flex flex-row items-center justify-center text-white font-bold py-2 px-4 rounded"
                  onClick={() => open(false)}
                >
                  <span>OPEN {amount} for </span>
                  <Image
                    src={"/images/currency.webp"}
                    width={30}
                    height={20}
                    className="mx-2"
                    alt={"Currency"}
                  />
                  {formatNumber(crate.price * amount)}
                </button>
                <button
                  className="secondary hover-scale ml-5 flex flex-row h-full items-center justify-center text-white font-bold py-2 px-4 rounded"
                  onClick={() => open(true)}
                >
                  <span>
                    DEMO {amount} CASE{amount > 1 ? "S" : ""}
                  </span>
                </button>
              </div>
              <div className="grid grid-flow-col gap-3 w-full items-center mt-3">
                {Array.from(Array(MAX_CASES).keys()).map((num) => (
                  <button
                    key={num}
                    onClick={() => setCases(num + 1)}
                    className={clsx(
                      "p-4 hover-scale h-fit rounded-md",
                      amount === num + 1 && "primary",
                      amount !== num + 1 && "secondary"
                    )}
                  >
                    {num + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-row relative h-full w-full">
            {Array.from(Array(amount).keys()).map((index) => (
              <CrateOpen
                crate={crate}
                key={index}
                crateItems={crateItems}
                roundID={roundIDs[index]}
                animationStart={startTime}
                wonItem={wonItems[index]}
                multi={amount > 1}
                host={index === amount - 1}
                onFinished={onFinish}
              />
            ))}
          </div>
          <CasePreview crate={crate} crateItems={crateItems} />

          <div className="flex flex-col mt-5 text-md secondary rounded-md p-3 text-center items-center w-[1/3] justify-center">
            {serverSeed && (
              <>
                <span className="font-bold">Server Seed</span>
                <span>{serverSeed}</span>
              </>
            )}
            {!!roundIDs.length && (
              <>
                <span className="font-bold">Round IDs</span>
                <span>{roundIDs.join(", ")}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
