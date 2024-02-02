import clsx from "clsx";
import {useState} from "react";

export default function Toggle({setValue, toggleColor}: {setValue: (value: boolean) => void, toggleColor?: string}) {
    // Rounded toggle button with animation using framer motion (https://www.framer.com/motion/)
    const [toggle, setToggle] = useState(false);

    const toggleClass = toggle ? (toggleColor ?? "primary") + " " : "";
    return (
        <div className="relative inline-block w-20 mb-5 align-middle select-none transition duration-200 ease-in" onClick={(event) => {
            setValue(!toggle);
            setToggle(!toggle);
        }}>
            <input type="checkbox" name="toggle" id="toggle" className={clsx("absolute block w-6 h-6 right-0 rounded-full border-4 appearance-none cursor-pointer transition " + toggleClass, {
                "secondary": !toggle,
            })}/>
        </div>
    )
}