import {Case} from "@/utils/cases";
import Image from "next/image";
import {CaseItemPreview} from "@/components/cases/CasePreview";
import Modal from "@/components/Modal";
import {formatNumber} from "@/utils/helpers/items";
import clsx from "clsx";

export default function CaseInfoModal({crate, onExit}: {crate: Case, onExit: Function}) {
    return (
        <Modal onExit={onExit}>
            <div className={"flex text-base flex-col justify-center z-[100] secondary rounded-md p-3"}>
                <div className={"flex flex-row"}>
                    {crate.image && <Image src={crate.image} width={100} height={100} alt={crate.name} />}
                    <div className={clsx("flex flex-col justify-center", {
                        "ml-6": crate.image
                    })}>
                        <span className={"text-xl"}>{crate.name}</span>
                        {!crate.level && (
                            <span className={"text-lg flex flex-row"}>
                                <Image src={"/images/currency.webp"} alt={"Currency"} width={30} height={20} className={"mr-2"} />
                                {formatNumber(crate.price)}
                            </span>
                        )}
                    </div>
                </div>

                <span className={"text-red-400 font-bold text-xl mt-5 uppercase"}>Items in this case</span>
                <div className={"grid grid-cols-4 gap-3 mt-2"}>
                    {crate.items.sort((a, b) => b.price! - a.price!)
                        .map((item, num) => (
                        <div className={"w-[10rem] h-[10rem]"} key={num}>
                            <CaseItemPreview item={item} crate={crate} />
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    )
}