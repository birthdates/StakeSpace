import React from "react";

export default function ProgressBar({ progress, className }: {
    progress: number;
    className?: string;
}) {
    return (React.createElement("div", { className: "relative h-4 rounded-md bg-zinc-800 " + className },
        React.createElement("div", { className: "absolute h-full rounded-md bg-gradient", style: {
                width: progress + "%",
            } })));
}