import {MarketItem} from "@/utils/items";
import Modal from "@/components/Modal";
import Image from "next/image";
import {useState} from "react";

export default function ItemListModal({items, onExit, onSelect}: {items: MarketItem[], onExit: Function, onSelect: Function}) {
    const [search, setSearch] = useState("");

    return <Modal onExit={onExit}>
        <div className="secondary p-10 rounded-md w-[60rem] h-[60rem] overflow-y-scroll">
            <span className={"text-3xl font-bold"}>Add Item</span>
            <input type={"text"} placeholder={"Search"} className={"w-full p-2 bg-zinc-800 mt-2"} onChange={e => setSearch(e.target.value)} />
            <div className={"grid grid-cols-6 gap-3 mt-10 overflow-y-scroll items-center"}>
                {items
                    .filter(item => item.name!.toLowerCase().includes(search.toLowerCase()))
                    .sort((a, b) => b.price! - a.price!).map(item => (
                    <div key={item.id} className={"flex flex-col items-center hover-scale bg-zinc-800 p-3"} onClick={() => onSelect(item)}>
                        <Image src={item.imageURL ?? ""} alt={item.name!} height={80} width={80}/>
                        <label htmlFor={"name"} className={"mt-3"}>{item.name}</label>
                        <label htmlFor={"name"}>Price: ${item.price}</label>
                    </div>
                ))}
            </div>
        </div>
    </Modal>

}