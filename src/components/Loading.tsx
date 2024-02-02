export default function Loading() {
    // Just a spinner
    return <div className={"w-full left-0 top-0 h-full absolute flex items-center justify-center"}>
        <div className={"absolute w-full h-full z-10 bg-zinc-800 bg-opacity-50"}>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-t-[2.3px] border-b-[2.3px] border-gray-200 z-20"></div>
    </div>
}