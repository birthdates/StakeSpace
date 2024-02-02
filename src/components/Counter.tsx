import {animate, motion} from "framer-motion";
import {useEffect, useRef} from "react";
import {formatNumber} from "@/utils/helpers/items";

export default function Counter({from, to, className}: {from: number, to: number, className: string}) {
    const nodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        const controls = animate(from, to, {
            duration: 5,
            onUpdate(value) {
                node.textContent = formatNumber(value);
            }
        });

        return () => controls.stop();
    }, [from, to]);

    return (
        <span ref={nodeRef} className={className}></span>)
}