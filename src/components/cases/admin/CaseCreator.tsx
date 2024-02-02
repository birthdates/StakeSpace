"use client";

import {Case} from "@/utils/cases";
import {FormEvent, useRef} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function CaseCreator({crates}: {crates: Case[]}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const createCase = (event: FormEvent) => {
        event.preventDefault();
        if (!inputRef.current?.value) return;
        fetch("/api/cases/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: inputRef.current?.value
            })
        }).then(res => res.text()).then((text) => router.push(`/cases/admin/edit/${text}`));
    };

    return <div className={"flex flex-col mt-5 secondary p-4"}>
        <div>
            Create a case

            <form onSubmit={createCase}>
                <input ref={inputRef} type={"text"} placeholder={"Name"} className={"w-full p-2 bg-zinc-800"} />
                <button type={"submit"} className={"w-full p-2 bg-zinc-800 mt-2 hover-scale"}>Create</button>
            </form>
        </div>
        <div className={"grid grid-cols-4 gap-4 w-full mt-5"}>
            {crates.map(crate => (
                <Link href={`/cases/admin/edit/${crate.id}`} key={crate.id} className={"hover-scale"} prefetch={false}>
                    <div className={"flex flex-col items-center justify-center secondary"}>
                        <p>{crate.name}</p>
                        <Image alt={crate.name} width={40} height={50} src={crate.image} className={"w-20 h-20"} />
                    </div>
                </Link>
            ))}
        </div>
    </div>
}