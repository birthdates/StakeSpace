import {Case} from "@/utils/cases";
import Image from "next/image";
import {useState} from "react";
import {formatNumber} from "@/utils/helpers/items";
import DropDown, {DropDownItem} from "@/components/Dropdown";
import DropArrow from "@/components/DropArrow";
import Modal from "@/components/Modal";

const SORT_DROPDOWN_ITEMS: DropDownItem[] = [
    {text: "Price descending", value: "p_desc"},
    {text: "Price ascending", value: "p_asc"},
];

export default function CratePickModal({crates, selected, getNumberSelected, removeCrate, addCrate, onExit, totalPrice}:
{crates: Case[], selected: Case[], getNumberSelected: (caseId: string) => number, removeCrate: (caseId: string) => void, addCrate: (caseId: string
    ) => void, onExit: () => void, totalPrice: number}) {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState(SORT_DROPDOWN_ITEMS[0]);

    return (
        <Modal onExit={onExit}>
            <div className="flex flex-col justify-center z-[100] items-center secondary p-10 rounded-md w-[50rem]">
                <div className={"flex flex-row w-full"}>
                    <div className={"flex flex-row bg-zinc-900 p-5 rounded-md"}>
                        <span>Rounds</span>
                        <span className={"text-zinc-300 ml-2"}>{selected.length}</span>
                    </div>
                    <div className={"flex flex-row bg-zinc-900 p-5 rounded-md ml-2"}>
                        <span>Total</span>
                        <Image src={"/images/currency.webp"} alt={"Currency"} width={20} height={20} className={"ml-2"} />
                        <span className={"text-zinc-300 ml-1"}>{
                            formatNumber(totalPrice)
                        }</span>
                    </div>
                    <div className={"flex-[30%] items-center justify-center"}>
                        <div className={"float-right h-full hover-scale p-3"} onClick={onExit}>
                            X
                        </div>
                    </div>
                </div>

                <div className={"flex flex-col p-3 mt-5 bg-zinc-900 w-full"}>
                    <div className={"flex flex-row"}>
                        <input type={"text"} placeholder={"Search crates"} className={"bg-zinc-800 p-2 rounded-md text-zinc-300"} value={search} onChange={(event) => setSearch(event.target.value)} />
                        <div className={"bg-zinc-800 p-3 rounded-md ml-5 relative"}>
                            <span className={"mr-3"}>{sortBy.text}</span>
                            <DropArrow />
                            <DropDown className={"right-1 top-12"} items={SORT_DROPDOWN_ITEMS} onSelect={setSortBy} active={0} />
                        </div>
                    </div>
                    <div className={"grid grid-cols-4 gap-4 mt-5 max-h-[40rem] overflow-y-scroll min-h-[20rem]"}>
                        {crates.filter(
                            (crate) => crate.name.toLowerCase().includes(search.toLowerCase())
                        ).sort(
                            (a, b) => {
                                if (sortBy.value === "p_desc") return b.price - a.price;
                                if (sortBy.value === "p_asc") return a.price - b.price;
                                return 0;
                            }
                        ).map((crate, num) => (
                            <div key={num} className={"flex flex-col p-3 secondary hover-scale rounded-md justify-center text-center"} onClick={(event) => {
                                if ((event.target as any).id === "minus") return;
                                addCrate(crate.id);
                            }}>
                                <Image src={crate.image} alt={crate.name} width={150} height={150} />
                                <span className="font-bold mt-2">{crate.name}</span>
                                <div className={"flex flex-row items-center w-full justify-center"}>
                                    <Image src={"/images/currency.webp"} alt={"currency"} width={20} height={10} />
                                    <span className="font-bold ml-2">{formatNumber(crate.price)}</span>
                                </div>
                                {getNumberSelected(crate.id) > 0 && (
                                    <div className={"flex flex-row items-center justify-center"}>
                                    <span id={"minus"} className={"font-bold mt-2 mr-3 bg-zinc-800 px-5 hover-scale"} onClick={
                                        () => removeCrate(crate.id)
                                    }>-</span>
                                        <span className="font-bold mt-2">{getNumberSelected(crate.id)}</span>
                                        <span className={"font-bold mt-2 ml-3 bg-zinc-800 px-5 hover-scale"}>+</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    )

}