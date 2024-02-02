"use client";

import "../app/globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
import { Bai_Jamjuree } from "next/font/google";
import Navbar from "@/components/Navbar";
import { useEffect, useMemo, useRef, useState } from "react";
import SiteContext, { SiteContextType } from "@/utils/SiteContext";
import { AccountData } from "@/utils/account";
import Chat from "@/components/Chat";
import { Socket, io as ClientIO } from "socket.io-client";
import clsx from "clsx";
import Notifications from "@/components/Notifications";
import Header from "@/components/Header";
let socket: Socket;
const inter = Bai_Jamjuree({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loggedInAs, setLoggedInAs] = useState<AccountData | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const audioContext = useRef<AudioContext | null>();
  const gainNode = useRef<GainNode>();
  const [volume, setVolume] = useState(0.05);
  const cachedAudio = useRef<any>({});

  const audioUnlocked = async () => {
    await audioContext.current?.resume();
    document.removeEventListener("touchend", audioUnlocked);
    document.removeEventListener("click", audioUnlocked);
  };

  const addNotification = (notification: any) => {
    if (notification.save) {
      setLoggedInAs(
        (prev) =>
          ({
            ...prev,
            notifications: [...(prev?.notifications ?? []), notification],
          }) as any,
      );
    }
    playAudio(`notif_${notification.type}.webm`);
    setNotifications((prev) => [
      ...prev,
      { ...notification, expiry: Date.now() + 5000 },
    ]);
  };

  const unlockAudio = () => {
    return new Promise((res: any) => {
      if (!audioContext.current?.suspend) {
        res();
        return;
      }
      try {
        audioContext.current?.resume().then(res);
        return;
      } catch (err) {}
      document.addEventListener("touchend", () => {
        if (audioContext.current?.state !== "running") {
          audioUnlocked().then(res);
        }
      });
      document.addEventListener("click", () => {
        if (audioContext.current?.state !== "running") {
          audioUnlocked().then(res);
        }
      });
    });
  };

  const playAudioData = (buffer: AudioBuffer) => {
    if (audioContext.current?.state !== "running") return;
    const source = audioContext.current?.createBufferSource();
    source?.connect(gainNode.current! as AudioNode);
    source!.buffer = buffer;

    source?.start(0);
  };

  const playAudio = async (src: string) => {
    src = `/sounds/${src}`;
    if (audioContext.current?.state !== "running") {
      unlockAudio();
      return;
    }
    const cached = cachedAudio.current[src];
    if (cached) {
      playAudioData(cached);
      return;
    }
    await audioContext.current?.decodeAudioData(
      await (await fetch(src)).arrayBuffer(),
      (buffer: AudioBuffer) => {
        cachedAudio.current[src] = buffer;
        playAudioData(buffer);
      },
    );
  };

  const socketInitializer = async () => {
    socket = new (ClientIO as any)(process.env.NEXT_PUBLIC_WEBSOCKET_HOST, {
      transports: ["websocket"],
      secure: true,
    });

    socket.on("connect", () => setInitialLoading(false));

    socket.on("message", (msg: any) => {
      switch (msg.type) {
        case "transactions":
          setLoggedInAs((prev) => ({ ...prev, transactions: msg.data }) as any);
          break;
        case "newLevel":
          setLoggedInAs(
            (prev) =>
              ({
                ...prev,
                level: msg.data.level,
                levelCases: msg.data.levelCases,
                levelCaseCooldown: msg.data.levelCaseCooldown,
              }) as any,
          );
          break;
        case "balanceUpdate":
          setLoggedInAs(
            (prev) => ({ ...prev, balance: msg.data as number }) as any,
          );
          break;
        case "notification":
          addNotification(msg.data);
          break;
      }
    });
  };

  useEffect(() => {
    if (!gainNode.current) {
      return;
    }
    gainNode.current!.gain.value = volume;
  }, [volume]);

  const attachGainNode = () => {
    const node = audioContext.current?.createGain()!;
    gainNode.current = node;
    node.gain.value = parseFloat(
      window.localStorage.getItem("volume") ?? "0.05",
    );
    setVolume(node.gain.value);
    node.connect(audioContext.current!.destination);
    return gainNode;
  };

  const copyToClipboard = (text: string) => {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    playAudio("notif_success.webm");
  };

  useEffect(() => {
    audioContext.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    attachGainNode();
    fetch("/api/account/data")
      .then((res) => res.json())
      .then((data) => setLoggedInAs(data as AccountData))
      .then(() => socketInitializer())
      .catch(() => socketInitializer());

    const notificationTimeout = setInterval(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.expiry > Date.now()),
      );
    }, 1000);

    return () => {
      socket?.disconnect();
      clearInterval(notificationTimeout);
    };
  }, []);

  const context = useMemo(() => {
    return new SiteContextType(
      loggedInAs,
      setLoggedInAs,
      socket,
      setLoading,
      playAudio,
      volume,
      setVolume,
      addNotification,
      copyToClipboard,
    );
  }, [loggedInAs, socket, volume]);

  return (
    <html lang="en">
      <body className={inter.className + " min-h-screen"}>
        <div
          className={clsx(
            "h-screen w-screen flex flex-row justify-center items-center",
            {
              hidden: !loading && !initialLoading,
            },
          )}
        >
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
        </div>
        <div className="fixed bg-image h-full w-full"></div>
        <div className="fixed bg-radial h-full w-full"></div>
        {!initialLoading && (
          <SiteContext.Provider value={context}>
            <div className={clsx({ hidden: loading })}>
              <Navbar />

              <Notifications notifications={notifications} />
              <div className="py-[4.5rem] relative">
                <Chat />
                <div className={"3xl:ml-[10vw]"}>
                  <main className="3xl:max-w-[75vw] max-w-[100vw] mr-auto ml-auto isolate min-h-full mt-5 flex flex-col flex-grow items-center justify-center">
                    {children}
                  </main>
                </div>
              </div>
            </div>
          </SiteContext.Provider>
        )}
      </body>
    </html>
  );
}
