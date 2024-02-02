"use client";

import {useState} from "react";
import {useSite} from "@/utils/SiteContext";
import Image from "next/image";
import {getMinesMultiplier, MIN_MINES_BET, MINE_GRID_SIZE, roundToSecondDecimal} from "@/utils/helpers/games";
import clsx from "clsx";

export default function MinesPage() {
    const [revealed, setRevealed] = useState<number[]>([]);
    const [betAmount, setBetAmount] = useState(MIN_MINES_BET);
    const [mines, setMines] = useState(1);
    const [win, setWin] = useState(false);
    const [serverSeed, setServerSeed] = useState<string|undefined>();
    const [roundID, setRoundID] = useState<string|undefined>();
    const site = useSite();

    const updateBet = (bet: number) => setBetAmount(roundToSecondDecimal(Math.min(Math.max(bet, MIN_MINES_BET), site.loggedInAs?.balance ?? 0)));
    const updateMines = (mines: number) => isNaN(mines) ? 1 : setMines(Math.max(Math.min(mines, (MINE_GRID_SIZE**2)-1), 1));

    const revealMine = (index: number) => {
        const x = index % MINE_GRID_SIZE;
        const y = Math.floor(index / MINE_GRID_SIZE);
        site.socketCallback("reveal_mine", (data: any) => {

        }, {x,y});
    }

    return (
        <div className={"flex flex-row w-full h-full secondary"}>
            <div className={"flex flex-col w-1/5 h-full p-4"}>
                <div className={"flex flex-row bg-zinc-800 p-2 rounded-lg"}>
                    <Image alt={"Currency"} src={"/images/currency.webp"} height={20} width={20} />
                    <input type="number" onChange={(event) => updateBet(parseFloat(event.target.value))} className={"bg-transparent text-white ml-2"} defaultValue={0.1} value={betAmount} placeholder={"Bet amount"}/>
                </div>
                <div className={"flex flex-row w-full justify-between font-bold p-2 text-xl rounded-lg mt-2"}>
                    <button className={"bg-zinc-800 rounded-md p-2 hover-scale"} onClick={() => updateBet(betAmount/2)}>1/2</button>
                    <button className={"bg-zinc-800 rounded-md p-2 hover-scale"} onClick={() => updateBet(betAmount*2)}>x2</button>
                    <button className={"bg-zinc-800 rounded-md p-2 hover-scale"} onClick={() => updateBet(MIN_MINES_BET)}>Min</button>
                    <button className={"bg-zinc-800 rounded-md p-2 hover-scale"}  onClick={() => updateBet(site.loggedInAs?.balance ?? 0)}>Max</button>
                </div>
                <div className={"mt-3 flex flex-col"}>
                    <span>Amount</span>
                    <div className={"flex flex-row w-full justify-between text-xl"}>
                        <button className={clsx("bg-zinc-800 rounded-md p-2 w-1/6 hover-scale", {
                            "bg-gradient": mines === 1
                        })} onClick={() => updateMines(1)}>1</button>
                        <button className={clsx("bg-zinc-800 rounded-md p-2 w-1/6 hover-scale", {
                            "bg-gradient": mines === 3
                        })} onClick={() => updateMines(3)}>3</button>
                        <button className={clsx("bg-zinc-800 rounded-md p-2 w-1/6 hover-scale", {
                            "bg-gradient": mines === 5
                        })} onClick={() => updateMines(5)}>5</button>
                        <button className={clsx("bg-zinc-800 rounded-md p-2 w-1/6 hover-scale", {
                            "bg-gradient": mines === 10
                        })} onClick={() => updateMines(10)} >10</button>
                        <input onChange={(event) => updateMines(parseInt(event.target.value))} type={"number"} min={1} max={MINE_GRID_SIZE**2-1} placeholder={"?"} className={clsx("bg-zinc-800 text-center rounded-md p-2 w-1/6", {
                            "bg-gradient": mines !== 1 && mines !== 3 && mines !== 5 && mines !== 10,
                            "cursor-not-allowed": serverSeed,
                            "hover-scale": !serverSeed,
                        })} />
                    </div>
                    <button className={"mt-5 bg-gradient hover-scale p-3 rounded-md uppercase font-bold"}>
                        Start
                    </button>
                </div>
            </div>
            <div className={"w-full bg-zinc-800 py-[2rem] px-[20rem]"}>
                <div className={"grid grid-cols-5 gap-4"}>
                    {Array.from(Array(MINE_GRID_SIZE**2).keys()).map((num) => (
                        <div className={clsx("p-4 rounded-md flex flex-col items-center justify-center", {
                            "secondary cursor-not-allowed": !serverSeed,
                            "bg-gradient hover-scale": serverSeed
                        })} key={num}>
                            {revealed.includes(num) && (
                                <span className={"mb-3 font-bold text-lg"}>{getMinesMultiplier(mines, revealed.indexOf(num)+1).toFixed(2)}x</span>
                            )}
                            <Image src={"/images/currency.webp"} alt={"Mine"} width={75} height={75} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}