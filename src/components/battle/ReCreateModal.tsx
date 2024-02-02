import {CrateBattle} from "@/utils/games";
import {useState} from "react";
import Image from "next/image";
import {formatNumber} from "@/utils/helpers/items";
import Sword from "@/components/svg/Sword";
import Skull from "@/components/svg/Skull";
import Toggle from "@/components/Toggle";
import Lock from "@/components/svg/Lock";
import {useSite} from "@/utils/SiteContext";
import {useRouter} from "next/navigation";
import Loading from "@/components/Loading";
import clsx from "clsx";
import Modal from "@/components/Modal";
import Terminal from "@/components/svg/Terminal";
import Rainbow from "@/components/svg/Rainbow";

export default function ReCreateModal({battle, onExit}: {battle: CrateBattle, onExit: Function}) {
    const [cursed, setCursed] = useState<boolean>(false);
    const [terminal, setTerminal] = useState<boolean>(false);
    const [rainbow, setRainbow] = useState<boolean>(false);
    const [privateBattle, setPrivateBattle] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const site = useSite();
    const router = useRouter();

    const createBattle = () => {
        if (loading) return;
        setLoading(true);
        site.socketCallback("create_case_battle", (data: any) => {
            if (data) router.push(`/cases/battle/${data}`);
        }, {crates: battle.caseIDs, cursed, privateBattle, mode: battle.mode, terminal, partialFunding: 0, rainbow});
    };

    return (
        <Modal onExit={onExit}>
            <div className="flex flex-col justify-center items-center secondary p-10 rounded-md w-[25rem]">
                <span className={"text-3xl"}><Sword /></span>
                <span className={"text-3xl mt-5 uppercase text-red-400"}>Re-create Battle</span>

                {battle.mode.includes("v") && (
                    <>
                    <div className={"bg-zinc-800 p-3 flex flex-row w-full mt-3"}>
                        <div className={"text-lg"}>
                            <span className={"text-red-400 mr-4"}><Skull /></span>
                            <span className={"ml-2"}>Cursed mode</span>
                        </div>

                        <div className={"flex-[40%] w-full"}>
                            <div className={"float-right"}>
                                <Toggle setValue={setCursed} toggleColor={"bg-red-400"} />
                            </div>
                        </div>
                    </div>
                    {battle.caseIDs.length > 1 && (
                        <div className="bg-zinc-800 p-3 flex flex-row w-full mt-2">
                            <div className={"text-lg"}>
                                <span className={"mr-4"}><Terminal /></span>
                                <span className={"ml-2"}>Terminal mode</span>
                            </div>
                            <div className={"flex-[40%] w-full"}>
                                <div className={"float-right"}>
                                    <Toggle setValue={setTerminal} toggleColor={"bg-yellow-400"} />
                                </div>
                            </div>
                        </div>
                    )}
                    {(battle.caseIDs.length > 1 || !battle.mode.includes("1")) && (
                        <div className="bg-zinc-800 p-3 flex flex-row w-full mt-2">
                            <div className={"text-lg"}>
                                <span className={"mr-4"}><Rainbow /></span>
                                <span className={"ml-2"}>Rainbow mode</span>
                            </div>
                            <div className={"flex-[40%] w-full"}>
                                <div className={"float-right"}>
                                    <Toggle setValue={setRainbow} toggleColor={"bg-rainbow"} />
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                )}
                <div className={"bg-zinc-800 mt-2 p-3 flex flex-row w-full items-center"}>
                    <div className={"text-lg"}>
                        <span className={"text-blue-400"}><Lock /></span>
                        <span className={"ml-2"}>Private game</span>
                    </div>

                    <div className={"flex-[40%] w-full"}>
                        <div className={"float-right"}>
                            <Toggle setValue={setPrivateBattle} toggleColor={"bg-blue-400"} />
                        </div>
                    </div>
                </div>

                <div className={"mt-4 w-full"}>
                    <button className={clsx("accent flex flex-row hover-scale p-3 w-full rounded-md", {"cursor-not-allowed": loading})} onClick={createBattle}>
                        {loading && <Loading />}
                        <div className={clsx("w-full flex flex-row justify-center", {"opacity-0": loading})}>
                            <span className={"font-bold mr-2"}>Create Battle</span>
                            <span>for</span>
                            <Image src={"/images/currency.webp"} alt={"Currency"} width={20} height={20} className={"mx-2"} />
                            <span className={"font-bold"}>{formatNumber(battle.cost)}</span>
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    )
}