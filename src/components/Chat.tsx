export default function Chat() {
  return (
    <nav className="h-[100vh] max-h-[calc(100%-1rem)] w-[12.5vw] secondary rounded-r-xl p-4 fixed hidden 3xl:inline-block">
      <footer className="bottom-10 fixed">
        <form className="flex flex-row w-full">
          <input type="text" className="w-[10vw] bg-zinc-800 p-3"></input>
        </form>
      </footer>
    </nav>
  );
}
